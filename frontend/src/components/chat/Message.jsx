import { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SpotifyAudioPlayer from '../voice/SpotifyAudioPlayer'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { textToSpeech } from '../../services/api'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import MermaidRenderer from '../documents/MermaidRenderer'

function Message({ message }) {
    const isUser = message.role === 'user'
    const [audioUrl, setAudioUrl] = useState(message.audioUrl || null)
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(message.audioGenerating || false)
    const [audioReady, setAudioReady] = useState(message.audioReady || false)
    const [feedbackGiven, setFeedbackGiven] = useState(null) // 1, -1, or null
    const pollIntervalRef = useRef(null)
    const pollAttemptsRef = useRef(0)

    // Check if this is an empty streaming message (render null later, but hooks must run first)
    const isEmptyStreamingMessage = message.streaming && (!message.text || message.text.trim() === '')

    // Update state when message props change (e.g., streaming complete)
    useEffect(() => {
        if (message.audioUrl && message.audioUrl !== audioUrl) {
            setAudioUrl(message.audioUrl)
        }
        if (message.audioReady !== undefined && message.audioReady !== audioReady) {
            setAudioReady(message.audioReady)
        }
        if (message.audioGenerating !== undefined && message.audioGenerating !== isGeneratingAudio) {
            setIsGeneratingAudio(message.audioGenerating)
        }
    }, [message.audioUrl, message.audioReady, message.audioGenerating])

    // Poll for audio readiness when audio is generating
    useEffect(() => {
        if (isGeneratingAudio && audioUrl && !audioReady) {
            const checkAudioReady = async () => {
                try {
                    // Try to fetch audio file
                    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
                    const response = await fetch(`${baseUrl}${audioUrl}`, {
                        method: 'HEAD' // Just check if file exists
                    })

                    if (response.ok) {
                        // Audio is ready!
                        setAudioReady(true)
                        setIsGeneratingAudio(false)
                        clearInterval(pollIntervalRef.current)
                        if (import.meta.env.DEV) console.log('✅ Audio ready:', audioUrl)
                    } else {
                        pollAttemptsRef.current += 1
                        // Give up after 40 attempts (20 seconds)
                        if (pollAttemptsRef.current > 40) {
                            setIsGeneratingAudio(false)
                            clearInterval(pollIntervalRef.current)
                            console.warn('⚠️ Audio generation timeout')
                        }
                    }
                } catch (error) {
                    pollAttemptsRef.current += 1
                    if (pollAttemptsRef.current > 40) {
                        setIsGeneratingAudio(false)
                        clearInterval(pollIntervalRef.current)
                    }
                }
            }

            // Wait 1 second before starting to poll (give backend time to start generating)
            const initialDelay = setTimeout(() => {
                // Poll every 500ms
                pollIntervalRef.current = setInterval(checkAudioReady, 500)
            }, 1000)

            // Cleanup on unmount
            return () => {
                clearTimeout(initialDelay)
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current)
                }
            }
        }
    }, [isGeneratingAudio, audioUrl, audioReady])

    const handleGenerateSpeech = async () => {
        // Don't regenerate if audio already exists
        if (audioUrl && audioReady) {
            return
        }

        // Only generate audio manually if not already provided by backend
        setIsGeneratingAudio(true)
        try {
            const response = await textToSpeech(message.text)
            setAudioUrl(response.audio_url)
            setAudioReady(true)
            toast.success('Audio generated!')
        } catch (error) {
            toast.error(error.message || 'Failed to generate audio')
        } finally {
            setIsGeneratingAudio(false)
        }
    }

    const handleFeedback = async (rating) => {
        if (feedbackGiven === rating) {
            // User clicked same button again, remove feedback
            setFeedbackGiven(null)
            return
        }

        try {
            await api.post('/feedback', {
                message_id: message.id || `${Date.now()}-${Math.random()}`,
                query: message.query || 'No query provided',
                response: message.text,
                rating
            })
            setFeedbackGiven(rating)
            toast.success('Thank you for your feedback!')
        } catch (error) {
            // Error logged server-side only
            toast.error('Failed to submit feedback')
        }
    }

    // Don't render streaming messages that have no content yet
    // This check must come AFTER all hooks to comply with React's rules of hooks
    if (isEmptyStreamingMessage) {
        return null
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 sm:mb-6 px-1 sm:px-2 w-full max-w-full box-border overflow-hidden`}
        >
            <div className={`flex gap-2 sm:gap-3 max-w-[95%] sm:max-w-[85%] md:max-w-3xl min-w-0 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar - Hidden on mobile to save space, visible on md+ */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    className={`
          hidden md:flex flex-shrink-0 w-8 h-8 rounded-full items-center justify-center text-white text-xs font-semibold shadow-lg
          ${isUser
                        ? 'bg-gradient-to-br from-cyan-500 to-purple-600 shadow-cyan-500/50'
                        : 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/50'
                    }
        `}>
                    {isUser ? 'U' : 'AI'}
                </motion.div>

                {/* Message Content */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    className={`
          flex-1 min-w-0 rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 backdrop-blur-sm
          ${isUser
                        ? 'bg-gradient-to-br from-cyan-600/90 to-purple-600/90 text-white shadow-lg shadow-cyan-500/20'
                        : 'bg-white/5 border border-white/10 text-gray-100 shadow-lg shadow-purple-500/10'
                    }
        `}>
                    {/* Text */}
                    {isUser ? (
                        <div className="prose prose-sm max-w-full overflow-x-hidden overflow-y-auto">
                            <p className="text-sm sm:text-base leading-relaxed text-white break-words overflow-wrap-anywhere">
                                {message.text}
                            </p>
                        </div>
                    ) : (
                        <div className="markdown-content overflow-x-hidden overflow-y-auto break-words max-w-full">
                            {/* Streaming indicator */}
                            {message.streaming && (
                                <div className="flex items-center gap-2 mb-2 text-cyan-400">
                                    <motion.div
                                        className="flex gap-1"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        {[0, 1, 2].map((i) => (
                                            <motion.div
                                                key={i}
                                                className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
                                                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                            />
                                        ))}
                                    </motion.div>
                                    <span className="text-xs font-medium">Generating response...</span>
                                </div>
                            )}
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    // Headings - Smaller on mobile for compact view
                                    h1: ({ node, ...props }) => (
                                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-cyan-400 mb-2 sm:mb-3 mt-3 sm:mt-4 flex items-center gap-2" {...props} />
                                    ),
                                    h2: ({ node, ...props }) => (
                                        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-cyan-400 mb-2 mt-3 sm:mt-4 flex items-center gap-2" {...props} />
                                    ),
                                    h3: ({ node, ...props }) => (
                                        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-purple-400 mb-2 mt-2 sm:mt-3" {...props} />
                                    ),

                                    // Paragraphs - Smaller on mobile for compact view
                                    p: ({ node, ...props }) => (
                                        <p className="text-sm sm:text-base text-gray-100 leading-relaxed mb-2 sm:mb-3 break-words overflow-wrap-anywhere" {...props} />
                                    ),

                                    // Lists - Smaller on mobile for compact view
                                    ul: ({ node, ...props }) => (
                                        <ul className="text-sm sm:text-base list-disc list-inside space-y-1 mb-2 sm:mb-3 text-gray-100" {...props} />
                                    ),
                                    ol: ({ node, ...props }) => (
                                        <ol className="text-sm sm:text-base list-decimal list-inside space-y-1 mb-2 sm:mb-3 text-gray-100" {...props} />
                                    ),
                                    li: ({ node, ...props }) => (
                                        <li className="ml-3 sm:ml-4" {...props} />
                                    ),

                                    // Tables
                                    table: ({ node, ...props }) => (
                                        <div className="overflow-x-auto mb-4 rounded-lg max-w-full -mx-1 sm:mx-0 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
                                            <table className="min-w-full divide-y divide-gray-700 text-xs sm:text-sm" {...props} />
                                        </div>
                                    ),
                                    thead: ({ node, ...props }) => (
                                        <thead className="bg-cyan-600/20" {...props} />
                                    ),
                                    tbody: ({ node, ...props }) => (
                                        <tbody className="divide-y divide-gray-700" {...props} />
                                    ),
                                    tr: ({ node, ...props }) => (
                                        <tr className="hover:bg-gray-800/50 transition-colors" {...props} />
                                    ),
                                    th: ({ node, ...props }) => (
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-cyan-300" {...props} />
                                    ),
                                    td: ({ node, ...props }) => (
                                        <td className="px-4 py-2 text-sm text-gray-200" {...props} />
                                    ),

                                    // Code - ENHANCED with Mermaid Support
                                    code: ({ node, inline, className, children, ...props }) => {
                                        const match = /language-(\w+)/.exec(className || '')
                                        const language = match ? match[1] : ''
                                        
                                        if (!inline && language === 'mermaid') {
                                            return <MermaidRenderer chart={String(children).replace(/\n$/, '')} />
                                        }
                                        
                                        return inline ? (
                                            <code className="bg-gray-800 text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono break-all max-w-full" {...props}>
                                                {children}
                                            </code>
                                        ) : (
                                            <code className="block bg-gray-900 text-gray-100 p-2 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm font-mono mb-3 whitespace-pre max-w-full scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent" {...props}>
                                                {children}
                                            </code>
                                        )
                                    },
                                    pre: ({ node, ...props }) => (
                                        <pre className="bg-gray-900 rounded-lg overflow-x-auto mb-3 max-w-full scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent" {...props} />
                                    ),

                                    // Strong/Bold
                                    strong: ({ node, ...props }) => (
                                        <strong className="font-bold text-cyan-300" {...props} />
                                    ),

                                    // Emphasis/Italic
                                    em: ({ node, ...props }) => (
                                        <em className="italic text-purple-300" {...props} />
                                    ),

                                    // Blockquote
                                    blockquote: ({ node, ...props }) => (
                                        <blockquote className="border-l-4 border-cyan-500 pl-4 py-2 my-3 bg-cyan-500/10 rounded-r-lg" {...props} />
                                    ),

                                    // Horizontal Rule
                                    hr: ({ node, ...props }) => (
                                        <hr className="border-gray-700 my-4" {...props} />
                                    ),
                                }}
                            >
                                {message.text}
                            </ReactMarkdown>
                            {/* Blinking cursor for streaming */}
                            {message.streaming && (
                                <motion.span
                                    className="inline-block w-2 h-5 ml-1 bg-cyan-500 rounded-sm align-middle"
                                    animate={{ opacity: [1, 0, 1] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                />
                            )}
                        </div>
                    )}

                    {/* TTS Button for AI Messages - Only show in classic mode (not streaming) */}
                    {!isUser && !audioUrl && !audioReady && !isGeneratingAudio && !message.streaming && !message.streamingGenerated && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                            className="mt-3 flex items-center gap-2"
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleGenerateSpeech}
                                className="group relative flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 overflow-hidden bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50"
                                title="Generate audio"
                            >
                                {/* Background shimmer effect */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                                    animate={{
                                        x: ['-100%', '100%']
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatDelay: 1
                                    }}
                                />

                                <motion.svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    whileHover={{ scale: 1.1 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                >
                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                </motion.svg>
                                <span className="relative z-10">Generate Audio</span>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Synthesizing Voice Animation or Audio Player */}
                    {!isUser && (isGeneratingAudio || audioUrl) && (
                        <AnimatePresence mode="wait">
                            {isGeneratingAudio && (
                                <motion.div
                                    key="generating"
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="mt-3 relative overflow-hidden"
                                >
                                    {/* Gradient border container */}
                                    <div className="relative p-5 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl border border-cyan-500/20 backdrop-blur-sm">
                                        {/* Animated gradient background */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5"
                                            animate={{
                                                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                                            }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            style={{ backgroundSize: '200% 200%' }}
                                        />

                                        <div className="relative z-10 flex items-center gap-4">
                                            {/* Enhanced Animated Sound Waves */}
                                            <div className="flex items-center gap-1.5">
                                                {[0, 1, 2, 3, 4].map((i) => (
                                                    <motion.div
                                                        key={i}
                                                        className="w-1.5 rounded-full"
                                                        style={{
                                                            background: 'linear-gradient(to top, #06b6d4, #a855f7, #ec4899)'
                                                        }}
                                                        animate={{
                                                            height: [10, 28, 10],
                                                            opacity: [0.5, 1, 0.5]
                                                        }}
                                                        transition={{
                                                            duration: 0.8,
                                                            repeat: Infinity,
                                                            delay: i * 0.12,
                                                            ease: "easeInOut"
                                                        }}
                                                    />
                                                ))}
                                            </div>

                                            {/* Text Animation */}
                                            <div className="flex-1">
                                                <motion.div
                                                    className="flex items-center gap-2.5"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.1 }}
                                                >
                                                    <motion.svg
                                                        className="w-5 h-5 text-cyan-400"
                                                        fill="currentColor"
                                                        viewBox="0 0 24 24"
                                                        animate={{ scale: [1, 1.1, 1] }}
                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                    >
                                                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                                    </motion.svg>
                                                    <div>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-sm text-cyan-300 font-semibold">
                                                                Synthesizing voice
                                                            </span>
                                                            <motion.span
                                                                className="text-sm text-cyan-300 font-semibold"
                                                                animate={{ opacity: [0, 1, 0] }}
                                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                            >
                                                                ...
                                                            </motion.span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            Creating high-quality audio for you
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            </div>

                                            {/* Enhanced Spinning Circle Progress */}
                                            <div className="relative">
                                                <motion.div
                                                    className="w-10 h-10 rounded-full border-2 border-cyan-500/20"
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                />
                                                <motion.div
                                                    className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-t-cyan-400 border-r-purple-400"
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                />
                                                <motion.div
                                                    className="absolute inset-2 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20"
                                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            {!isGeneratingAudio && audioUrl && (
                                <motion.div
                                    key="player"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mt-3"
                                >
                                    <SpotifyAudioPlayer
                                        audioUrl={audioUrl}
                                        audioUrls={message.audioUrls}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}

                    {/* Citations / Sources */}
                    {!isUser && message.metadata?.sources && message.metadata.sources.length > 0 && (
                         <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-3 pt-3 border-t border-white/10"
                        >
                            <p className="text-xs font-semibold text-gray-400 mb-2">Sources:</p>
                            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                                {message.metadata.sources.map((source, idx) => (
                                    <div key={idx} className="bg-white/5 rounded p-2 text-xs border border-white/5 hover:border-cyan-500/30 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-cyan-400 font-medium truncate max-w-[70%]" title={source.document}>{source.document}</span>
                                            <span className="text-gray-500 bg-white/5 px-1.5 rounded">p. {source.page}</span>
                                        </div>
                                        <p className="text-gray-400 line-clamp-2 italic">"{source.text}"</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Feedback Buttons for AI Messages */}
                    {!isUser && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.3 }}
                            className="mt-3 flex flex-wrap items-center gap-2"
                        >
                            <span className="text-xs text-gray-500 mr-1 sm:mr-2 w-full sm:w-auto mb-1 sm:mb-0">Was this helpful?</span>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleFeedback(1)}
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg transition-all ${
                                    feedbackGiven === 1
                                        ? 'bg-green-500/30 text-green-400 border border-green-500/50'
                                        : 'bg-white/5 text-gray-400 hover:bg-green-500/10 hover:text-green-400 border border-white/10'
                                }`}
                            >
                                👍 <span className="hidden sm:inline">Helpful</span>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleFeedback(-1)}
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg transition-all ${
                                    feedbackGiven === -1
                                        ? 'bg-red-500/30 text-red-400 border border-red-500/50'
                                        : 'bg-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 border border-white/10'
                                }`}
                            >
                                👎 <span className="hidden sm:inline">Not Helpful</span>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Metadata - Hidden for cleaner UX */}
                    {/* Sources and confidence removed as they appear unprofessional */}

                    {/* Timestamp */}
                    <div className={`mt-2 text-xs ${isUser ? 'text-cyan-200' : 'text-gray-500'}`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}

// Memoize component to prevent unnecessary re-renders when message hasn't changed
export default memo(Message, (prevProps, nextProps) => {
    // Only re-render if message content hasn't changed
    return prevProps.message.id === nextProps.message.id &&
           prevProps.message.timestamp === nextProps.message.timestamp &&
           prevProps.message.text === nextProps.message.text &&
           prevProps.message.audioUrl === nextProps.message.audioUrl &&
           prevProps.message.audioReady === nextProps.message.audioReady &&
           prevProps.message.streaming === nextProps.message.streaming &&
           prevProps.message.streamingGenerated === nextProps.message.streamingGenerated &&
           JSON.stringify(prevProps.message.metadata) === JSON.stringify(nextProps.message.metadata)
})
