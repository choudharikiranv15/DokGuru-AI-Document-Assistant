import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Mic, Send, Square, Volume2, VolumeX } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

/**
 * Streaming Chat Input Component
 *
 * Features:
 * - Real-time LLM response streaming
 * - Parallel TTS generation (sentence-by-sentence)
 * - Audio queue with auto-play
 * - User controls (pause, skip, volume)
 */
export default function StreamingChatInput({ documentId, onMessageUpdate }) {
    const [input, setInput] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [currentMessage, setCurrentMessage] = useState('')
    const [audioQueue, setAudioQueue] = useState([])
    const [currentAudioIndex, setCurrentAudioIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)

    const audioRef = useRef(null)
    const abortControllerRef = useRef(null)

    // Auto-play next audio in queue
    useEffect(() => {
        if (audioQueue.length > currentAudioIndex && !isPlaying && !isMuted) {
            playNextAudio()
        }
    }, [audioQueue, currentAudioIndex, isMuted])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!input.trim() || isStreaming) return

        const question = input.trim()
        setInput('')
        setCurrentMessage('')
        setAudioQueue([])
        setCurrentAudioIndex(0)
        setIsStreaming(true)

        try {
            // Create AbortController for cancellation
            abortControllerRef.current = new AbortController()

            // Start streaming
            await streamChatResponse(question)

        } catch (error) {
            console.error('Streaming error:', error)
            toast.error('Failed to get response')
        } finally {
            setIsStreaming(false)
        }
    }

    const streamChatResponse = async (question) => {
        const token = localStorage.getItem('token')

        const response = await fetch(`${api.defaults.baseURL}/chat/ask-stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                question,
                document_id: documentId,
                language: 'en' // TODO: Make dynamic
            }),
            signal: abortControllerRef.current.signal
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        let fullText = ''
        let buffer = ''

        while (true) {
            const { done, value } = await reader.read()

            if (done) {
                break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n\n')

            // Keep last incomplete line in buffer
            buffer = lines.pop() || ''

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6))

                        switch (data.type) {
                            case 'text':
                                // Append text to current message
                                fullText += data.content + ' '
                                setCurrentMessage(fullText)

                                // Update parent component
                                onMessageUpdate?.({
                                    role: 'assistant',
                                    content: fullText,
                                    streaming: true
                                })
                                break

                            case 'audio':
                                // Add audio to queue
                                setAudioQueue(prev => [
                                    ...prev,
                                    {
                                        sentence_id: data.sentence_id,
                                        url: data.audio_url,
                                        duration: data.duration
                                    }
                                ])
                                break

                            case 'done':
                                // Streaming complete
                                onMessageUpdate?.({
                                    role: 'assistant',
                                    content: data.full_response,
                                    streaming: false,
                                    audioAvailable: audioQueue.length > 0
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

    const playNextAudio = () => {
        if (currentAudioIndex >= audioQueue.length || isMuted) return

        const audioItem = audioQueue[currentAudioIndex]
        if (!audioRef.current) return

        setIsPlaying(true)
        audioRef.current.src = audioItem.url
        audioRef.current.play()
            .catch(err => {
                console.error('Audio play error:', err)
                setIsPlaying(false)
                setCurrentAudioIndex(prev => prev + 1)
            })
    }

    const handleAudioEnded = () => {
        setIsPlaying(false)
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
        if (audioRef.current && isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
        }
    }

    const skipAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause()
        }
        setIsPlaying(false)
        setCurrentAudioIndex(prev => prev + 1)
    }

    return (
        <div className="space-y-4">
            {/* Streaming Message Display */}
            {currentMessage && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gray-800 rounded-lg"
                >
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <p className="text-gray-200 whitespace-pre-wrap">
                                {currentMessage}
                                {isStreaming && (
                                    <span className="inline-block w-2 h-5 ml-1 bg-cyan-500 animate-pulse" />
                                )}
                            </p>
                        </div>

                        {/* Audio Controls */}
                        {audioQueue.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleMute}
                                    className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    {isMuted ? (
                                        <VolumeX className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <Volume2 className="w-5 h-5 text-cyan-500" />
                                    )}
                                </button>

                                {isPlaying && (
                                    <button
                                        onClick={skipAudio}
                                        className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                    >
                                        Skip
                                    </button>
                                )}

                                <div className="text-xs text-gray-400">
                                    {currentAudioIndex + 1} / {audioQueue.length}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Audio Progress Bar */}
                    {audioQueue.length > 0 && (
                        <div className="mt-3">
                            <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-cyan-500"
                                    initial={{ width: '0%' }}
                                    animate={{
                                        width: `${((currentAudioIndex + (isPlaying ? 0.5 : 0)) / audioQueue.length) * 100}%`
                                    }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isStreaming ? "Streaming..." : "Ask a question..."}
                    disabled={isStreaming}
                    className="w-full px-4 py-3 pr-24 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500 text-white placeholder-gray-400 disabled:opacity-50"
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isStreaming ? (
                        <button
                            type="button"
                            onClick={stopStreaming}
                            className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                        >
                            <Square className="w-5 h-5 text-white" />
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <Mic className="w-5 h-5 text-gray-400" />
                            </button>
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="p-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5 text-white" />
                            </button>
                        </>
                    )}
                </div>
            </form>

            {/* Hidden Audio Element */}
            <audio
                ref={audioRef}
                onEnded={handleAudioEnded}
                className="hidden"
            />
        </div>
    )
}
