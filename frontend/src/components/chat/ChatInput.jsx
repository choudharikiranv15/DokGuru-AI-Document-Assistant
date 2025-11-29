import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useChatStore } from '../../stores/chatStore'
import { useDocumentStore } from '../../stores/documentStore'
import { askQuestion } from '../../services/api'
import api from '../../services/api'

export default function ChatInput({ setIsThinking }) {
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [streamingMode, setStreamingMode] = useState(true) // Enable streaming by default
    const [isStreaming, setIsStreaming] = useState(false)
    const [currentStreamMessage, setCurrentStreamMessage] = useState('')
    const [audioQueue, setAudioQueue] = useState([])
    const [currentAudioIndex, setCurrentAudioIndex] = useState(0)
    const [isPlayingAudio, setIsPlayingAudio] = useState(false)
    const [isMuted, setIsMuted] = useState(false)

    const recognitionRef = useRef(null)
    const audioRef = useRef(null)
    const abortControllerRef = useRef(null)
    const streamMessageIdRef = useRef(null)

    const addMessage = useChatStore(state => state.addMessage)
    const updateMessage = useChatStore(state => state.updateMessage)
    const currentDocument = useDocumentStore(state => state.currentDocument)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!input.trim() || loading || isStreaming) return

        const userMessage = input.trim()
        setInput('')

        // Add user message
        const userMessageId = Date.now()
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
            const response = await askQuestion(userMessage, currentDocument?.name, 'auto')

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
        } catch (error) {
            toast.error(error.message || 'Failed to get response')
        } finally {
            setLoading(false)
            setIsThinking(false)
        }
    }

    const handleStreamingSubmit = async (userMessage) => {
        setIsStreaming(true)
        setIsThinking(true)
        setCurrentStreamMessage('')
        setAudioQueue([])
        setCurrentAudioIndex(0)

        // Create streaming message placeholder
        const streamMessageId = Date.now()
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
            setIsThinking(false)
        }
    }

    const streamChatResponse = async (question, messageId) => {
        const token = localStorage.getItem('token')

        const response = await fetch(`${api.defaults.baseURL}/ask-stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                question,
                document_name: currentDocument?.name,
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
                                setAudioQueue(prev => [...prev, {
                                    sentence_id: data.sentence_id,
                                    url: data.audio_url,
                                    duration: data.duration
                                }])
                                break

                            case 'done':
                                updateMessage(messageId, {
                                    text: data.full_response,
                                    streaming: false,
                                    metadata: { sources: data.sources }
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

    // Auto-play audio queue
    useEffect(() => {
        if (audioQueue.length > currentAudioIndex && !isPlayingAudio && !isMuted && streamingMode) {
            playNextAudio()
        }
    }, [audioQueue, currentAudioIndex, isMuted, streamingMode])

    const playNextAudio = () => {
        if (currentAudioIndex >= audioQueue.length || isMuted || !audioRef.current) return

        const audioItem = audioQueue[currentAudioIndex]
        setIsPlayingAudio(true)
        audioRef.current.src = audioItem.url
        audioRef.current.play()
            .catch(err => {
                console.error('Audio play error:', err)
                setIsPlayingAudio(false)
                setCurrentAudioIndex(prev => prev + 1)
            })
    }

    const handleAudioEnded = () => {
        setIsPlayingAudio(false)
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
        <div className="p-4">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-3">
                {/* Streaming Status Bar */}
                {isStreaming && audioQueue.length > 0 && (
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
                                    >
                                        Skip
                                    </button>
                                )}
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

                <div className="flex items-center gap-2">
                    {/* Streaming Mode Toggle */}
                    <button
                        type="button"
                        onClick={() => setStreamingMode(!streamingMode)}
                        className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 ${
                            streamingMode
                                ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                        title={streamingMode ? "Streaming Mode (Fast)" : "Classic Mode"}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {streamingMode ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                        </svg>
                    </button>

                    {/* Text Input with integrated Voice Button */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? "" : (isStreaming ? "Streaming..." : "Ask a question...")}
                            disabled={loading || isListening || isStreaming}
                            className="w-full pl-4 pr-12 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200 text-sm"
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
                            disabled={loading}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                                isListening
                                    ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white'
                                    : 'bg-white/10 hover:bg-white/20 text-cyan-400'
                            }`}
                            title={isListening ? "Stop listening" : "Start voice input"}
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
                            className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 shadow-lg shadow-red-500/30 flex-shrink-0"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            disabled={!input.trim() || loading || isListening}
                            className="p-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-cyan-500/30 flex-shrink-0"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </motion.button>
                    )}
                </div>
            </form>

            {/* Hidden Audio Element for streaming playback */}
            <audio
                ref={audioRef}
                onEnded={handleAudioEnded}
                className="hidden"
            />
        </div>
    )
}
