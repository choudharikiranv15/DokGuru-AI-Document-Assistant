import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useChatStore } from '../../stores/chatStore'
import { useDocumentStore } from '../../stores/documentStore'
import { askQuestion } from '../../services/api'
import LanguageSelector from './LanguageSelector'

export default function ChatInput({ setIsThinking }) {
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [selectedLanguage, setSelectedLanguage] = useState('auto') // Language for TTS
    const recognitionRef = useRef(null)
    const addMessage = useChatStore(state => state.addMessage)
    const currentDocument = useDocumentStore(state => state.currentDocument)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput('')
        setLoading(true)
        setIsThinking(true) // Show thinking animation

        // Add user message
        const userMessageId = Date.now()
        addMessage({
            id: userMessageId,
            role: 'user',
            text: userMessage,
            timestamp: new Date().toISOString()
        })

        try {
            // Pass the current document name and language to filter results
            const response = await askQuestion(userMessage, currentDocument?.name, selectedLanguage)

            // Add AI response with reference to the query
            addMessage({
                role: 'assistant',
                text: response.answer,
                query: userMessage, // Store the original query for feedback
                metadata: response.metadata,
                audioUrl: response.audio?.url || null, // Auto-generated audio URL from backend
                audioGenerating: response.audio?.generating || false, // Audio generation status
                language: selectedLanguage, // Store selected language
                timestamp: new Date().toISOString()
            })
        } catch (error) {
            toast.error(error.message || 'Failed to get response')
        } finally {
            setLoading(false)
            setIsThinking(false) // Hide thinking animation
        }
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
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                {/* Show transcript when listening */}
                {isListening && transcript && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl p-2 backdrop-blur-sm"
                    >
                        <p className="text-xs text-cyan-300">{transcript}</p>
                    </motion.div>
                )}

                <div className="flex items-center gap-2">
                    {/* Language Selector */}
                    <LanguageSelector
                        selectedLanguage={selectedLanguage}
                        onLanguageChange={setSelectedLanguage}
                    />

                    {/* Text Input with integrated Voice Button */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? "" : "Ask a question..."}
                            disabled={loading || isListening}
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

                    {/* Send Button */}
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
                </div>
            </form>
        </div>
    )
}
