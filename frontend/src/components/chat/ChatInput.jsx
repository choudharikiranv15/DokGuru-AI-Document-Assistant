import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useChatStore } from '../../stores/chatStore'
import { useDocumentStore } from '../../stores/documentStore'
import { useAudioStore } from '../../stores/audioStore'
import { useChatHistoryStore } from '../../stores/chatHistoryStore'
import { askQuestion } from '../../services/api'
import api from '../../services/api'

export default function ChatInput({ setIsThinking }) {
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [streamingMode, setStreamingMode] = useState(false) // Classic mode by default (more stable)
    const [isStreaming, setIsStreaming] = useState(false)
    const [currentStreamMessage, setCurrentStreamMessage] = useState('')
    const [audioQueue, setAudioQueue] = useState([])
    const [currentAudioIndex, setCurrentAudioIndex] = useState(0)
    const [isPlayingAudio, setIsPlayingAudio] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [streamingComplete, setStreamingComplete] = useState(false) // Track when all audio received
    const [totalExpectedAudio, setTotalExpectedAudio] = useState(0) // Total sentences to play

    const recognitionRef = useRef(null)
    const audioRef = useRef(null)
    const abortControllerRef = useRef(null)
    const streamMessageIdRef = useRef(null)

    const addMessage = useChatStore(state => state.addMessage)
    const updateMessage = useChatStore(state => state.updateMessage)
    const messages = useChatStore(state => state.messages)  // Get chat history for context
    const activeDocuments = useDocumentStore(state => state.activeDocuments)
    const documents = useDocumentStore(state => state.documents)
    const registerBackgroundAudio = useAudioStore(state => state.registerBackgroundAudio)
    const setBackgroundPlaying = useAudioStore(state => state.setBackgroundPlaying)

    // Chat history functions
    const saveChatHistory = useChatHistoryStore(state => state.saveChatHistory)
    const currentChatId = useChatHistoryStore(state => state.currentChatId)
    const canCreateNewChat = useChatHistoryStore(state => state.canCreateNewChat)
    const getRemainingChats = useChatHistoryStore(state => state.getRemainingChats)
    const planLimits = useChatHistoryStore(state => state.planLimits)

    // Check if we can send messages (must have an active chat OR ability to create one)
    const chatLimitReached = !currentChatId && !canCreateNewChat()

    // Check if current chat has reached query limit
    const userMessageCount = messages.filter(m => m.role === 'user').length
    const isPro = planLimits?.plan === 'pro' || planLimits?.plan === 'premium' || planLimits?.plan === 'enterprise'
    // Use fetched limit from backend, fallback to defaults if not available
    const maxQueriesPerChat = planLimits?.max_queries_per_chat !== undefined
        ? planLimits.max_queries_per_chat
        : (isPro ? -1 : (planLimits?.plan === 'basic' ? 200 : 50))
    const queryLimitReached = currentChatId && maxQueriesPerChat !== -1 && userMessageCount >= maxQueriesPerChat

    // Overall: blocked if loading, streaming, playing audio, OR (chat limit reached AND no active chat), OR query limit reached in current chat
    const isInputBlocked = loading || isStreaming || isPlayingAudio || chatLimitReached || queryLimitReached

    // Auto-save chat history
    const autoSaveChatHistory = async () => {
        if (messages.length >= 2 && activeDocuments.length > 0 && !currentChatId) {
            // Check if we can create a new chat before auto-saving
            if (!canCreateNewChat()) {
                console.warn('Cannot auto-save: chat limit reached')
                toast.error('Chat limit reached! Your conversation was not saved. Please upgrade to Pro for unlimited chats.', {
                    duration: 6000,
                    icon: '⚠️'
                })
                return
            }

            // Only auto-save if we have at least one Q&A pair and no existing chat ID
            // Save with first active document's name
            const firstDoc = activeDocuments[0]
            try {
                await saveChatHistory(messages, firstDoc.name, firstDoc.id)
            } catch (error) {
                console.error('Failed to auto-save chat:', error)
                // If the error is about limits, show a clearer message
                if (error.message && error.message.includes('limit')) {
                    toast.error('Chat limit reached! Please upgrade to continue.', {
                        duration: 5000,
                        icon: '🔒'
                    })
                }
            }
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!input.trim() || isInputBlocked) return

        // Check if any documents are uploaded
        if (!documents || documents.length === 0) {
            toast.error('Please upload a document first before asking questions', {
                duration: 4000,
                icon: '📄'
            })
            return
        }

        // Check if any documents are active
        if (!activeDocuments || activeDocuments.length === 0) {
            toast.error('Please select at least one document to query', {
                duration: 4000,
                icon: '☑️'
            })
            return
        }

        // Check if chat limit is reached and no active chat
        if (chatLimitReached) {
            const remaining = getRemainingChats()
            const planType = planLimits?.plan || 'free'
            toast.error(`Chat limit reached! You have ${remaining} chats remaining. Please load an existing chat or upgrade to Pro for unlimited chats.`, {
                duration: 6000,
                icon: '🔒'
            })
            return
        }

        // Check if current chat has reached query limit
        if (queryLimitReached) {
            const planType = planLimits?.plan || 'free'
            toast.error(`Query limit reached! This chat has reached the maximum of ${maxQueriesPerChat} queries for ${planType} plan. Please start a new chat or upgrade to Pro for unlimited queries.`, {
                duration: 6000,
                icon: '🔒'
            })
            return
        }

        const userMessage = input.trim()
        setInput('')

        // Add user message with unique ID prefix
        const userMessageId = `user-${Date.now()}`
        addMessage({
            id: userMessageId,
            role: 'user',
            text: userMessage,
            timestamp: new Date().toISOString()
        })

        // Route to streaming or non-streaming mode
        if (streamingMode) {
            await handleStreamingSubmit(userMessage)
        } else {
            await handleRegularSubmit(userMessage)
        }
    }

    const handleRegularSubmit = async (userMessage) => {
        setLoading(true)
        setIsThinking(true)

        try {
            // Pass chat history and array of active document names for context-aware follow-up questions
            const documentNames = activeDocuments.map(doc => doc.name)
            const response = await askQuestion(userMessage, documentNames, 'auto', messages)

            addMessage({
                role: 'assistant',
                text: response.answer,
                query: userMessage,
                metadata: response.metadata,
                audioUrl: response.audio?.url || null,
                audioGenerating: response.audio?.generating || false,
                language: 'auto',
                timestamp: new Date().toISOString()
            })

            // Auto-save chat history after getting response
            await autoSaveChatHistory()
        } catch (error) {
            toast.error(error.message || 'Failed to get response')
        } finally {
            setLoading(false)
            setIsThinking(false)
        }
    }

    const handleStreamingSubmit = async (userMessage) => {
        setIsStreaming(true)
        setStreamingComplete(false) // Reset streaming complete flag
        setTotalExpectedAudio(0)
        // Don't set isThinking in streaming mode - the streaming message placeholder shows progress
        setCurrentStreamMessage('')
        setAudioQueue([])
        setCurrentAudioIndex(0)

        // Create streaming message placeholder with unique ID
        // Use different ID format to avoid collision with user message ID
        const streamMessageId = `stream-${Date.now()}`
        streamMessageIdRef.current = streamMessageId
        addMessage({
            id: streamMessageId,
            role: 'assistant',
            text: '',
            streaming: true,
            timestamp: new Date().toISOString()
        })

        try {
            abortControllerRef.current = new AbortController()
            await streamChatResponse(userMessage, streamMessageId)
        } catch (error) {
            if (error.name !== 'AbortError') {
                toast.error(error.message || 'Streaming failed')
            }
        } finally {
            setIsStreaming(false)
        }
    }

    const streamChatResponse = async (question, messageId) => {
        // Get token from auth-storage (same as api.js interceptor)
        let token = null
        const authStorage = localStorage.getItem('auth-storage')
        if (authStorage) {
            try {
                const authData = JSON.parse(authStorage)
                if (authData.state && authData.state.token) {
                    token = authData.state.token
                }
            } catch (error) {
                console.error('Failed to parse auth storage:', error)
            }
        }

        if (!token) {
            throw new Error('Authentication required for streaming')
        }

        const documentNames = activeDocuments.map(doc => doc.name)

        const response = await fetch(`${api.defaults.baseURL}/ask-stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                question,
                document_names: documentNames, // Changed from document_name to document_names (array)
                language: 'auto'
            }),
            signal: abortControllerRef.current.signal
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let fullText = ''
        let collectedAudioUrls = [] // Track audio URLs locally for closure access

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6))

                        switch (data.type) {
                            case 'text':
                                fullText += data.content + ' '
                                setCurrentStreamMessage(fullText)
                                updateMessage(messageId, {
                                    text: fullText,
                                    streaming: true
                                })
                                break

                            case 'audio':
                                // Track audio URL locally and in state
                                collectedAudioUrls.push(data.audio_url)
                                setAudioQueue(prev => [...prev, {
                                    sentence_id: data.sentence_id,
                                    url: data.audio_url,
                                    duration: data.duration
                                }])
                                break

                            case 'done':
                                // Mark streaming as complete - audio will stop after last sentence
                                setStreamingComplete(true)
                                setTotalExpectedAudio(collectedAudioUrls.length)

                                updateMessage(messageId, {
                                    text: data.full_response,
                                    streaming: false,
                                    streamingGenerated: true, // Mark as generated via streaming (hides "Generate Audio" button)
                                    metadata: { sources: data.sources, sources_used: data.sources_used },
                                    // Pass ALL audio URLs for the playlist player
                                    audioUrl: collectedAudioUrls.length > 0 ? collectedAudioUrls[0] : null,
                                    audioUrls: collectedAudioUrls, // Full playlist of all audio segments
                                    audioReady: collectedAudioUrls.length > 0,
                                    audioGenerating: false
                                })
                                break

                            case 'error':
                                toast.error(data.message)
                                break
                        }
                    } catch (e) {
                        console.error('Parse error:', e)
                    }
                }
            }
        }
    }

    // Auto-play audio queue during streaming
    // Stops automatically when streaming is complete and all audio has played
    useEffect(() => {
        // Only auto-play if:
        // 1. There's audio in the queue to play
        // 2. Not currently playing
        // 3. Not muted
        // 4. In streaming mode
        // 5. Either still streaming OR haven't played all audio yet
        const hasMoreAudio = audioQueue.length > currentAudioIndex
        const shouldAutoPlay = hasMoreAudio && !isPlayingAudio && !isMuted && streamingMode

        if (shouldAutoPlay) {
            // If streaming is complete and we've played all audio, don't auto-play more
            if (streamingComplete && currentAudioIndex >= totalExpectedAudio) {
                return // Stop auto-play - user can use audio player to replay
            }
            playNextAudio()
        }
    }, [audioQueue, currentAudioIndex, isMuted, streamingMode, streamingComplete, totalExpectedAudio, isPlayingAudio])

    const playNextAudio = () => {
        if (currentAudioIndex >= audioQueue.length || isMuted || !audioRef.current) return

        const audioItem = audioQueue[currentAudioIndex]
        setIsPlayingAudio(true)
        setBackgroundPlaying(true) // Update global state

        // Construct full URL with API base
        const baseUrl = api.defaults.baseURL
        const fullUrl = audioItem.url.startsWith('http') ? audioItem.url : `${baseUrl}${audioItem.url}`

        audioRef.current.src = fullUrl
        audioRef.current.play()
            .catch(err => {
                console.error('Audio play error:', err)
                setIsPlayingAudio(false)
                setBackgroundPlaying(false)
                setCurrentAudioIndex(prev => prev + 1)
            })
    }

    const handleAudioEnded = () => {
        setIsPlayingAudio(false)
        setBackgroundPlaying(false)
        setCurrentAudioIndex(prev => prev + 1)
    }

    const stopStreaming = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            setIsStreaming(false)
            toast.success('Stopped streaming')
        }
    }

    const toggleMute = () => {
        setIsMuted(!isMuted)
        if (audioRef.current && isPlayingAudio) {
            audioRef.current.pause()
            setIsPlayingAudio(false)
            setBackgroundPlaying(false)
        }
    }

    const skipAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause()
        }
        setIsPlayingAudio(false)
        setCurrentAudioIndex(prev => prev + 1)
    }

    // Initialize speech recognition
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            return
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()

        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onstart = () => {
            setIsListening(true)
            setTranscript('')
        }

        recognition.onresult = (event) => {
            let interimTranscript = ''
            let finalTranscript = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' '
                } else {
                    interimTranscript += transcript
                }
            }

            setTranscript(finalTranscript || interimTranscript)

            // If we have a final result, submit it
            if (finalTranscript) {
                setInput(finalTranscript.trim())
                setTimeout(() => {
                    const form = document.querySelector('form')
                    if (form) {
                        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
                    }
                }, 100)
            }
        }

        recognition.onerror = (event) => {
            setIsListening(false)
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                toast.error(`Voice recognition error: ${event.error}`)
            }
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognitionRef.current = recognition

        return () => {
            if (recognitionRef.current) {
                // Cleanup: remove event listeners to prevent memory leaks
                recognitionRef.current.onstart = null
                recognitionRef.current.onresult = null
                recognitionRef.current.onerror = null
                recognitionRef.current.onend = null
                recognitionRef.current.stop()
                recognitionRef.current = null
            }
        }
    }, [])

    const toggleVoiceRecording = () => {
        if (!recognitionRef.current) {
            toast.error('Speech recognition not supported in this browser')
            return
        }

        if (isListening) {
            recognitionRef.current.stop()
        } else {
            try {
                recognitionRef.current.start()
                toast.success('Listening... Speak now!')
            } catch (error) {
                // Error logged server-side only
                toast.error('Failed to start listening')
            }
        }
    }

    return (
        <div className="p-2 sm:p-4">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-2 sm:space-y-3">
                {/* Limit Reached Warning */}
                {(chatLimitReached || queryLimitReached) && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/30 rounded-lg p-4 backdrop-blur-sm"
                    >
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex-1">
                                {queryLimitReached ? (
                                    <>
                                        <h3 className="text-amber-400 font-semibold mb-1">Query Limit Reached</h3>
                                        <p className="text-sm text-gray-300 mb-3">
                                            This chat has reached the maximum of {maxQueriesPerChat} queries for {planLimits?.plan || 'free'} plan.
                                            {canCreateNewChat() ? (
                                                <> Please click "New Chat" above to start a fresh conversation, or upgrade to Pro for unlimited queries per chat.</>
                                            ) : (
                                                <> You've also reached your chat limit ({planLimits?.limit || 5} chats). Please upgrade to Pro to continue.</>
                                            )}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-amber-400 font-semibold mb-1">Chat Limit Reached</h3>
                                        <p className="text-sm text-gray-300 mb-3">
                                            You've reached your chat limit ({planLimits?.limit || 5} chats for {planLimits?.plan || 'free'} plan).
                                            Please load an existing chat from the sidebar to continue, or upgrade to Pro for unlimited chats.
                                        </p>
                                    </>
                                )}
                                <div className="flex gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onClick={() => {
                                            // Navigate to profile/upgrade page
                                            window.location.href = '/profile'
                                        }}
                                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-cyan-500/30"
                                    >
                                        Upgrade to Pro
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Streaming Status Bar */}
                {(isStreaming || isPlayingAudio) && audioQueue.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-3"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                                <span className="text-sm text-gray-300">
                                    {isPlayingAudio ? 'Playing audio...' : 'Generating...'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={toggleMute}
                                    className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                                    title={isMuted ? "Unmute background audio" : "Mute background audio"}
                                >
                                    {isMuted ? (
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        </svg>
                                    )}
                                </button>
                                {isPlayingAudio && (
                                    <button
                                        type="button"
                                        onClick={skipAudio}
                                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors text-gray-300"
                                        title="Skip this audio segment"
                                    >
                                        Skip
                                    </button>
                                )}
                                {/* Stop All Button - Always visible during streaming */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Stop background audio completely
                                        if (audioRef.current) {
                                            audioRef.current.pause()
                                            audioRef.current.currentTime = 0
                                        }
                                        setIsPlayingAudio(false)
                                        setBackgroundPlaying(false)
                                        setIsMuted(true)
                                        toast.success('Background audio stopped - use player below to replay')
                                    }}
                                    className="px-2 sm:px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded transition-colors font-medium border border-red-500/30"
                                    title="Stop background audio playback"
                                >
                                    <div className="flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M6 6h12v12H6z" />
                                        </svg>
                                        <span className="hidden sm:inline">Stop</span>
                                    </div>
                                </button>
                                <span className="text-xs text-gray-400">
                                    {currentAudioIndex + 1}/{audioQueue.length}
                                </span>
                            </div>
                        </div>
                        <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-cyan-500 to-purple-600"
                                initial={{ width: '0%' }}
                                animate={{
                                    width: `${((currentAudioIndex + (isPlayingAudio ? 0.5 : 0)) / Math.max(audioQueue.length, 1)) * 100}%`
                                }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </motion.div>
                )}

                {/* Show transcript when listening */}
                {isListening && transcript && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl p-2 backdrop-blur-sm"
                    >
                        <p className="text-xs text-cyan-300">{transcript}</p>
                    </motion.div>
                )}

                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Streaming Mode Toggle with Tooltip */}
                    <div className="relative group">
                        <button
                            type="button"
                            onClick={() => setStreamingMode(!streamingMode)}
                            className={`p-2 sm:p-3 rounded-full transition-all duration-200 flex-shrink-0 ${streamingMode
                                ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {streamingMode ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                )}
                            </svg>
                        </button>
                        {/* Tooltip - positioned above with high z-index to avoid overlap */}
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[9999] w-52 hidden sm:block shadow-2xl">
                            <div className="text-xs font-medium text-white mb-1">
                                {streamingMode ? 'Streaming Mode' : 'Classic Mode'}
                            </div>
                            <div className="text-xs text-gray-400 leading-relaxed">
                                {streamingMode
                                    ? 'See responses word-by-word as they generate. Faster feel.'
                                    : 'Wait for complete response. More stable.'}
                            </div>
                            <div className="absolute top-full left-6 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    </div>

                    {/* Text Input with integrated Voice Button */}
                    <div className="flex-1 relative min-w-0">
                        {/* Lock Icon - shown when no documents, chat limit reached, or query limit reached */}
                        {((!documents || documents.length === 0) || chatLimitReached || queryLimitReached) && (
                            <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        )}

                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={
                                isListening ? "" :
                                    (!documents || documents.length === 0) ? "🔒 Upload a PDF document first to unlock chat..." :
                                        queryLimitReached ? "🔒 Query limit reached! Start a new chat or upgrade to Pro..." :
                                        chatLimitReached ? "🔒 Chat limit reached! Load an existing chat or upgrade to Pro..." :
                                        (isStreaming ? "Streaming..." :
                                            (isPlayingAudio ? "Audio playing..." :
                                                "Ask a question..."))
                            }
                            disabled={isInputBlocked || isListening || !documents || documents.length === 0}
                            className={`w-full py-2.5 sm:py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200 text-sm ${(!documents || documents.length === 0 || chatLimitReached || queryLimitReached)
                                ? 'pl-10 sm:pl-12 pr-10 sm:pr-12 opacity-60 cursor-not-allowed'
                                : 'pl-3 sm:pl-4 pr-10 sm:pr-12 disabled:opacity-50'
                                }`}
                            title={(!documents || documents.length === 0) ? "Please upload a document first" : queryLimitReached ? "Query limit reached - start a new chat or upgrade" : chatLimitReached ? "Chat limit reached - load an existing chat or upgrade" : ""}
                        />

                        {/* Recording Indicator */}
                        {isListening && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none"
                            >
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse-delay-75"></span>
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse-delay-150"></span>
                                </div>
                                <span className="text-red-400 text-sm font-medium">
                                    Recording...
                                </span>
                            </motion.div>
                        )}

                        {/* Voice Button - Inside Input */}
                        <button
                            type="button"
                            onClick={toggleVoiceRecording}
                            disabled={loading || !documents || documents.length === 0 || chatLimitReached || queryLimitReached}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${isListening
                                ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white'
                                : 'bg-white/10 hover:bg-white/20 text-cyan-400'
                                }`}
                            title={
                                (!documents || documents.length === 0) ? "Upload a document first" :
                                    queryLimitReached ? "Query limit reached - start a new chat or upgrade" :
                                    chatLimitReached ? "Chat limit reached - load an existing chat or upgrade" :
                                    (isListening ? "Stop listening" : "Start voice input")
                            }
                        >
                            {isListening ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Send/Stop Button */}
                    {isStreaming ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={stopStreaming}
                            className="p-2.5 sm:p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 shadow-lg shadow-red-500/30 flex-shrink-0"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: (!input.trim() || isInputBlocked || isListening || !documents || documents.length === 0) ? 1 : 1.05 }}
                            whileTap={{ scale: (!input.trim() || isInputBlocked || isListening || !documents || documents.length === 0) ? 1 : 0.95 }}
                            type="submit"
                            disabled={!input.trim() || isInputBlocked || isListening || !documents || documents.length === 0}
                            className="p-2.5 sm:p-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-cyan-500/30 flex-shrink-0"
                            title={(!documents || documents.length === 0) ? "Upload a document first" : queryLimitReached ? "Query limit reached - start a new chat or upgrade" : chatLimitReached ? "Chat limit reached - load an existing chat or upgrade" : "Send message"}
                        >
                            {loading ? (
                                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (!documents || documents.length === 0) ? (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </motion.button>
                    )}
                </div>
            </form>

            {/* Hidden Audio Element for streaming playback */}
            <audio
                ref={(el) => {
                    audioRef.current = el
                    if (el) registerBackgroundAudio(el)
                }}
                onEnded={handleAudioEnded}
                className="hidden"
            />
        </div>
    )
}
