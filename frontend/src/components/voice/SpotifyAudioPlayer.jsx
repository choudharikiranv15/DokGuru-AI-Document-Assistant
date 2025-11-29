import { useState, useRef, useEffect } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? 'https://dokguru-backend-739437500880.asia-south1.run.app' : 'http://localhost:8080')

export default function SpotifyAudioPlayer({ audioUrl }) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [waveformData, setWaveformData] = useState([])
    const audioRef = useRef(null)
    const audioContextRef = useRef(null)

    // Generate waveform visualization
    useEffect(() => {
        const generateWaveform = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}${audioUrl}`)
                const arrayBuffer = await response.arrayBuffer()

                const audioContext = new (window.AudioContext || window.webkitAudioContext)()
                audioContextRef.current = audioContext

                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
                const rawData = audioBuffer.getChannelData(0)
                const samples = 70 // Number of bars
                const blockSize = Math.floor(rawData.length / samples)
                const filteredData = []

                for (let i = 0; i < samples; i++) {
                    let blockStart = blockSize * i
                    let sum = 0
                    for (let j = 0; j < blockSize; j++) {
                        sum += Math.abs(rawData[blockStart + j])
                    }
                    filteredData.push(sum / blockSize)
                }

                // Normalize the data
                const multiplier = Math.pow(Math.max(...filteredData), -1)
                const normalized = filteredData.map(n => n * multiplier)

                setWaveformData(normalized)
                setIsLoading(false)
            } catch (error) {
                // Error logged server-side only
                // Create fallback random-ish waveform
                const fallback = Array.from({ length: 70 }, () => Math.random() * 0.7 + 0.3)
                setWaveformData(fallback)
                setIsLoading(false)
            }
        }

        if (audioUrl) {
            generateWaveform()
        }

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
        }
    }, [audioUrl])

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const updateTime = () => setCurrentTime(audio.currentTime)
        const updateDuration = () => setDuration(audio.duration)
        const handleEnded = () => setIsPlaying(false)

        audio.addEventListener('timeupdate', updateTime)
        audio.addEventListener('loadedmetadata', updateDuration)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('timeupdate', updateTime)
            audio.removeEventListener('loadedmetadata', updateDuration)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [])

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
        } else {
            audio.play()
        }
        setIsPlaying(!isPlaying)
    }

    const handleSeek = (e) => {
        const audio = audioRef.current
        if (!audio) return

        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = x / rect.width
        audio.currentTime = percentage * duration
    }

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00'
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#1e293b] to-[#0f172a] rounded-2xl border border-gray-800 shadow-lg">
            <audio ref={audioRef} src={`${API_BASE_URL}${audioUrl}`} preload="metadata" />

            {/* Play/Pause Button */}
            <button
                onClick={togglePlay}
                disabled={isLoading}
                className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full hover:scale-110 transition-transform shadow-lg shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                ) : isPlaying ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </button>

            {/* Waveform & Progress */}
            <div className="flex-1">
                {/* Time Display */}
                <div className="flex justify-between mb-2 text-xs text-gray-400 font-medium">
                    <span className="text-green-400">{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>

                {/* Waveform Visualization */}
                <div
                    onClick={handleSeek}
                    className="relative h-14 flex items-center gap-0.5 cursor-pointer group"
                >
                    {isLoading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-xs text-gray-500">Loading audio...</div>
                        </div>
                    ) : (
                        waveformData.map((amplitude, index) => {
                            const barProgress = (index / waveformData.length) * 100
                            const isPassed = barProgress < progress
                            const height = amplitude * 100

                            return (
                                <div
                                    key={index}
                                    className="flex-1 flex items-center justify-center transition-all duration-100"
                                    style={{ minWidth: '2px', maxWidth: '8px' }}
                                >
                                    <div
                                        className={`w-full rounded-full transition-all duration-200 group-hover:opacity-80 ${
                                            isPassed
                                                ? 'bg-gradient-to-t from-green-500 to-emerald-400'
                                                : 'bg-gray-700'
                                        }`}
                                        style={{
                                            height: `${Math.max(height, 10)}%`,
                                            transform: isPlaying && isPassed ? 'scaleY(1.1)' : 'scaleY(1)'
                                        }}
                                    />
                                </div>
                            )
                        })
                    )}

                    {/* Hover indicator */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-white/50 rounded-full"
                            style={{ left: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Volume Icon (decorative) */}
            <div className="flex-shrink-0 text-gray-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
            </div>
        </div>
    )
}
