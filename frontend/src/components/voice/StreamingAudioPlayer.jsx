import { useState, useRef, useEffect } from 'react'
// Simple SVG icon replacements
const Play = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
)
const Pause = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
    </svg>
)
const Volume2 = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
)
const VolumeX = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
)
const RotateCcw = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
    </svg>
)
const Loader2 = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
)

export default function StreamingAudioPlayer({
    text,
    language = 'auto',
    token,
    autoPlay = true,
    className = ''
}) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [buffered, setBuffered] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [audioUrl, setAudioUrl] = useState(null)
    const [error, setError] = useState(null)

    const audioRef = useRef(null)
    const audioBlobRef = useRef(null)

    // Fetch streaming audio
    useEffect(() => {
        if (!text || !token) return

        const fetchStreamingAudio = async () => {
            setIsLoading(true)
            setError(null)

            try {
                // Use streaming endpoint with optimized chunk size
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
                const response = await fetch(`${apiUrl}/speak/stream`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        text,
                        language
                    })
                })

                if (!response.ok) {
                    throw new Error('Failed to fetch audio stream')
                }

                // Read streaming response
                const blob = await response.blob()
                audioBlobRef.current = blob

                // Create object URL for audio element
                const url = URL.createObjectURL(blob)
                setAudioUrl(url)
                setIsLoading(false)

                // Auto-play if enabled
                if (autoPlay && audioRef.current) {
                    setTimeout(() => {
                        audioRef.current?.play()
                            .then(() => setIsPlaying(true))
                            .catch(err => {
                                // Auto-play blocked by browser - user must interact first
                                console.log('Auto-play prevented:', err)
                            })
                    }, 100)
                }

            } catch (err) {
                console.error('Streaming audio error:', err)
                setError(err.message)
                setIsLoading(false)
            }
        }

        fetchStreamingAudio()

        // Cleanup
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl)
            }
        }
    }, [text, language, token, autoPlay])

    // Audio event listeners
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const updateTime = () => setCurrentTime(audio.currentTime)
        const updateDuration = () => setDuration(audio.duration)
        const updateBuffered = () => {
            if (audio.buffered.length > 0) {
                const bufferedEnd = audio.buffered.end(audio.buffered.length - 1)
                setBuffered((bufferedEnd / audio.duration) * 100)
            }
        }
        const handleEnded = () => setIsPlaying(false)
        const handlePlay = () => setIsPlaying(true)
        const handlePause = () => setIsPlaying(false)

        audio.addEventListener('timeupdate', updateTime)
        audio.addEventListener('loadedmetadata', updateDuration)
        audio.addEventListener('progress', updateBuffered)
        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('play', handlePlay)
        audio.addEventListener('pause', handlePause)

        return () => {
            audio.removeEventListener('timeupdate', updateTime)
            audio.removeEventListener('loadedmetadata', updateDuration)
            audio.removeEventListener('progress', updateBuffered)
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('play', handlePlay)
            audio.removeEventListener('pause', handlePause)
        }
    }, [audioUrl])

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio || isLoading) return

        if (isPlaying) {
            audio.pause()
        } else {
            audio.play()
        }
    }

    const handleSeek = (e) => {
        const audio = audioRef.current
        if (!audio || !duration) return

        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = x / rect.width
        audio.currentTime = percentage * duration
    }

    const toggleMute = () => {
        const audio = audioRef.current
        if (!audio) return

        audio.muted = !audio.muted
        setIsMuted(!isMuted)
    }

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value)
        const audio = audioRef.current
        if (!audio) return

        audio.volume = newVolume
        setVolume(newVolume)
        setIsMuted(newVolume === 0)
    }

    const handleRestart = () => {
        const audio = audioRef.current
        if (!audio) return

        audio.currentTime = 0
        audio.play()
    }

    const handleDownload = () => {
        if (!audioBlobRef.current) return

        const url = URL.createObjectURL(audioBlobRef.current)
        const a = document.createElement('a')
        a.href = url
        a.download = `tts_${language}_${Date.now()}.mp3`
        a.click()
        URL.revokeObjectURL(url)
    }

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00'
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    if (error) {
        return (
            <div className={`p-4 bg-red-900/20 border border-red-500/30 rounded-xl ${className}`}>
                <p className="text-red-400 text-sm">
                    <span className="font-semibold">Audio Error:</span> {error}
                </p>
            </div>
        )
    }

    return (
        <div className={`bg-gradient-to-r from-[#1e293b] to-[#0f172a] rounded-2xl border border-gray-800 shadow-xl ${className}`}>
            {audioUrl && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    preload="auto"
                />
            )}

            <div className="p-4 space-y-3">
                {/* Controls Row */}
                <div className="flex items-center gap-3">
                    {/* Play/Pause Button */}
                    <button
                        onClick={togglePlay}
                        disabled={isLoading || !audioUrl}
                        className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full hover:scale-110 active:scale-95 transition-transform shadow-lg shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {isLoading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : isPlaying ? (
                            <Pause className="w-6 h-6" fill="currentColor" />
                        ) : (
                            <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                        )}
                    </button>

                    {/* Restart Button */}
                    <button
                        onClick={handleRestart}
                        disabled={isLoading || !audioUrl}
                        className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Restart"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Progress Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                            <span className="text-indigo-400">{formatTime(currentTime)}</span>
                            <span className="text-gray-500">{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Volume Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleMute}
                            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? (
                                <VolumeX className="w-5 h-5" />
                            ) : (
                                <Volume2 className="w-5 h-5" />
                            )}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-20 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:bg-indigo-400 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                        />
                    </div>

                    {/* Download Button */}
                    <button
                        onClick={handleDownload}
                        disabled={!audioUrl}
                        className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Download"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>
                </div>

                {/* Progress Bar with Buffering */}
                <div className="relative">
                    <div
                        onClick={handleSeek}
                        className="relative h-2 bg-gray-800 rounded-full cursor-pointer overflow-hidden group"
                    >
                        {/* Buffered Progress */}
                        <div
                            className="absolute inset-y-0 left-0 bg-gray-700 transition-all duration-300"
                            style={{ width: `${buffered}%` }}
                        />

                        {/* Playback Progress */}
                        <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-100"
                            style={{ width: `${progress}%` }}
                        />

                        {/* Hover indicator */}
                        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute inset-y-0 w-0.5 bg-white/60 rounded-full shadow-lg" style={{ left: `${progress}%` }} />
                        </div>
                    </div>

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="px-3 py-1 bg-gray-900 rounded-full text-xs text-gray-400 border border-gray-700">
                                Streaming audio...
                            </div>
                        </div>
                    )}
                </div>

                {/* Buffering Status */}
                {buffered < 100 && !isLoading && audioUrl && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                        <span>Buffered: {Math.round(buffered)}%</span>
                    </div>
                )}
            </div>
        </div>
    )
}
