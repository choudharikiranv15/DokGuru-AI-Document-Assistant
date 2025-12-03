import { useState, useRef, useEffect } from 'react'
import { useAudioStore } from '../../stores/audioStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? 'https://dokguru-backend-739437500880.asia-south1.run.app' : 'http://localhost:8080')

export default function SpotifyAudioPlayer({ audioUrl, audioUrls }) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [waveformData, setWaveformData] = useState([])
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
    const [totalDuration, setTotalDuration] = useState(0)
    const [trackDurations, setTrackDurations] = useState([])
    const [accumulatedTime, setAccumulatedTime] = useState(0)
    const audioRef = useRef(null)
    const audioContextRef = useRef(null)
    const stopBackgroundAudio = useAudioStore(state => state.stopBackgroundAudio)

    // Determine if we have a playlist or single audio
    const playlist = audioUrls && audioUrls.length > 0 ? audioUrls : (audioUrl ? [audioUrl] : [])
    const isPlaylist = playlist.length > 1
    const currentAudioUrl = playlist[currentTrackIndex]

    // Load all track durations for accurate total time
    useEffect(() => {
        if (!isPlaylist) return

        const loadDurations = async () => {
            const durations = []
            for (const url of playlist) {
                try {
                    const audio = new Audio(`${API_BASE_URL}${url}`)
                    await new Promise((resolve) => {
                        let retries = 0
                        const maxRetries = 5

                        const attemptLoad = () => {
                            audio.addEventListener('loadedmetadata', () => {
                                if (audio.duration && audio.duration > 0) {
                                    durations.push(audio.duration)
                                    resolve()
                                } else if (retries < maxRetries) {
                                    retries++
                                    console.log(`Playlist track duration invalid, retrying... (${retries}/${maxRetries})`)
                                    setTimeout(() => {
                                        audio.load()
                                    }, 1000)
                                } else {
                                    durations.push(0)
                                    resolve()
                                }
                            }, { once: true })

                            audio.addEventListener('error', () => {
                                if (retries < maxRetries) {
                                    retries++
                                    setTimeout(() => {
                                        audio.load()
                                    }, 1000)
                                } else {
                                    durations.push(0)
                                    resolve()
                                }
                            }, { once: true })

                            audio.load()
                        }

                        attemptLoad()
                    })
                } catch {
                    durations.push(0)
                }
            }
            setTrackDurations(durations)
            setTotalDuration(durations.reduce((a, b) => a + b, 0))
        }

        loadDurations()
    }, [playlist.length])

    // Calculate accumulated time before current track
    useEffect(() => {
        if (trackDurations.length > 0) {
            const accumulated = trackDurations.slice(0, currentTrackIndex).reduce((a, b) => a + b, 0)
            setAccumulatedTime(accumulated)
        }
    }, [currentTrackIndex, trackDurations])

    // Generate waveform visualization (non-blocking)
    useEffect(() => {
        if (!currentAudioUrl) return
        let isCancelled = false

        const generateWaveform = async () => {
            // Start with fallback waveform immediately so player is usable
            const fallback = Array.from({ length: 70 }, (_, i) =>
                0.3 + 0.4 * Math.sin(i * 0.2) + Math.random() * 0.2
            )
            setWaveformData(fallback)
            setIsLoading(false)

            try {
                // Fetch audio for real waveform (in background)
                const response = await fetch(`${API_BASE_URL}${currentAudioUrl}`)
                if (!response.ok || isCancelled) return

                const arrayBuffer = await response.arrayBuffer()
                if (isCancelled) return

                const audioContext = new (window.AudioContext || window.webkitAudioContext)()
                audioContextRef.current = audioContext

                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
                if (isCancelled) return

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
                const maxVal = Math.max(...filteredData)
                if (maxVal > 0) {
                    const normalized = filteredData.map(n => n / maxVal)
                    if (!isCancelled) {
                        setWaveformData(normalized)
                    }
                }
            } catch (error) {
                console.warn('Waveform generation failed, using fallback:', error.message)
            }
        }

        generateWaveform()

        return () => {
            isCancelled = true
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
        }
    }, [currentAudioUrl])

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        let retryCount = 0
        const maxRetries = 10
        let retryTimeout = null

        const updateTime = () => setCurrentTime(audio.currentTime)
        const updateDuration = () => {
            if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
                setDuration(audio.duration)
                setIsLoading(false)
                // Update total duration if not playlist
                if (!isPlaylist) {
                    setTotalDuration(audio.duration)
                }
            } else {
                // Duration is invalid, retry loading
                if (retryCount < maxRetries) {
                    retryCount++
                    console.log(`Audio duration invalid, retrying... (${retryCount}/${maxRetries})`)
                    retryTimeout = setTimeout(() => {
                        if (audio) {
                            audio.load()
                        }
                    }, 1000) // Wait 1 second before retry
                } else {
                    console.warn('Max retries reached for audio loading')
                    setIsLoading(false)
                }
            }
        }
        const handleEnded = () => {
            // If playlist, move to next track
            if (isPlaylist && currentTrackIndex < playlist.length - 1) {
                setCurrentTrackIndex(prev => prev + 1)
                // Will auto-play due to isPlaying still being true
            } else {
                setIsPlaying(false)
                if (isPlaylist) {
                    setCurrentTrackIndex(0) // Reset to beginning
                }
            }
        }
        const handleCanPlayThrough = () => {
            updateDuration()
            // Auto-play if we're in playing state (for playlist continuation)
            if (isPlaying && duration > 0) {
                audio.play().catch(() => {})
            }
        }
        const handleError = (e) => {
            console.error('Audio error:', e)
            // Retry on error too
            if (retryCount < maxRetries) {
                retryCount++
                console.log(`Audio error, retrying... (${retryCount}/${maxRetries})`)
                retryTimeout = setTimeout(() => {
                    if (audio) {
                        audio.load()
                    }
                }, 1000)
            } else {
                setIsLoading(false)
            }
        }

        audio.addEventListener('timeupdate', updateTime)
        audio.addEventListener('loadedmetadata', updateDuration)
        audio.addEventListener('durationchange', updateDuration)
        audio.addEventListener('canplaythrough', handleCanPlayThrough)
        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('error', handleError)

        // Force load the audio to get metadata
        audio.load()

        return () => {
            if (retryTimeout) clearTimeout(retryTimeout)
            audio.removeEventListener('timeupdate', updateTime)
            audio.removeEventListener('loadedmetadata', updateDuration)
            audio.removeEventListener('durationchange', updateDuration)
            audio.removeEventListener('canplaythrough', handleCanPlayThrough)
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('error', handleError)
        }
    }, [currentAudioUrl, isPlaylist, currentTrackIndex, playlist.length])

    // Auto-play when track changes (if already playing)
    useEffect(() => {
        if (isPlaying && audioRef.current) {
            audioRef.current.play().catch(() => {})
        }
    }, [currentTrackIndex])

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return

        // Prevent playing if duration is still 0 (audio not ready yet)
        if (!isPlaying && (!audio.duration || audio.duration === 0)) {
            console.log('Audio not ready yet, please wait...')
            return
        }

        if (isPlaying) {
            audio.pause()
        } else {
            // Stop background streaming audio before playing from player
            stopBackgroundAudio()
            audio.play().catch(err => {
                console.error('Play failed:', err)
                setIsPlaying(false)
            })
        }
        setIsPlaying(!isPlaying)
    }

    const handleSeek = (e) => {
        const audio = audioRef.current
        if (!audio) return

        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = x / rect.width

        if (isPlaylist && totalDuration > 0) {
            // Seek within total duration
            const targetTime = percentage * totalDuration
            let accumulated = 0
            for (let i = 0; i < trackDurations.length; i++) {
                if (accumulated + trackDurations[i] > targetTime) {
                    setCurrentTrackIndex(i)
                    setTimeout(() => {
                        if (audioRef.current) {
                            audioRef.current.currentTime = targetTime - accumulated
                        }
                    }, 100)
                    break
                }
                accumulated += trackDurations[i]
            }
        } else {
            audio.currentTime = percentage * duration
        }
    }

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00'
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    // Calculate progress based on playlist or single audio
    const effectiveCurrentTime = isPlaylist ? accumulatedTime + currentTime : currentTime
    const effectiveDuration = isPlaylist ? totalDuration : duration
    const progress = effectiveDuration > 0 ? (effectiveCurrentTime / effectiveDuration) * 100 : 0

    // Playback speed options
    const [playbackSpeed, setPlaybackSpeed] = useState(1)
    const speedOptions = [0.75, 1, 1.25, 1.5, 2]

    const cycleSpeed = () => {
        const currentIndex = speedOptions.indexOf(playbackSpeed)
        const nextIndex = (currentIndex + 1) % speedOptions.length
        const newSpeed = speedOptions[nextIndex]
        setPlaybackSpeed(newSpeed)
        if (audioRef.current) {
            audioRef.current.playbackRate = newSpeed
        }
    }

    // Skip forward/backward
    const skip = (seconds) => {
        if (audioRef.current) {
            const newTime = audioRef.current.currentTime + seconds

            if (isPlaylist) {
                // Handle cross-track skipping
                if (newTime < 0 && currentTrackIndex > 0) {
                    // Skip to previous track
                    setCurrentTrackIndex(prev => prev - 1)
                    setTimeout(() => {
                        if (audioRef.current && trackDurations[currentTrackIndex - 1]) {
                            audioRef.current.currentTime = trackDurations[currentTrackIndex - 1] + newTime
                        }
                    }, 100)
                } else if (newTime > duration && currentTrackIndex < playlist.length - 1) {
                    // Skip to next track
                    setCurrentTrackIndex(prev => prev + 1)
                    setTimeout(() => {
                        if (audioRef.current) {
                            audioRef.current.currentTime = newTime - duration
                        }
                    }, 100)
                } else {
                    audioRef.current.currentTime = Math.max(0, Math.min(duration, newTime))
                }
            } else {
                audioRef.current.currentTime = Math.max(0, Math.min(duration, newTime))
            }
        }
    }

    if (!currentAudioUrl) return null

    return (
        <div className="p-2 sm:p-3 bg-gradient-to-r from-[#1e293b] to-[#0f172a] rounded-lg sm:rounded-xl border border-gray-800/50 shadow-lg">
            <audio
                ref={audioRef}
                src={`${API_BASE_URL}${currentAudioUrl}`}
                preload="auto"
            />

            {/* Playlist indicator */}
            {isPlaylist && (
                <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[10px] text-cyan-400 font-medium">
                        Part {currentTrackIndex + 1} of {playlist.length}
                    </span>
                    <span className="text-[10px] text-gray-500">
                        {formatTime(effectiveCurrentTime)} / {formatTime(effectiveDuration)}
                    </span>
                </div>
            )}

            {/* Main Controls Row */}
            <div className="flex items-center gap-2 sm:gap-3">
                {/* Skip Back */}
                <button
                    onClick={() => skip(-10)}
                    className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    title="Back 10s"
                >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.5 3C17.15 3 21.08 6.03 22.47 10.22L20.1 11C19.05 7.81 16.04 5.5 12.5 5.5C10.54 5.5 8.77 6.22 7.38 7.38L10 10H3V3L5.6 5.6C7.45 4 9.85 3 12.5 3M10 12V22H8V14H6V12H10M18 14V20C18 21.11 17.11 22 16 22H14C12.9 22 12 21.1 12 20V14C12 12.9 12.9 12 14 12H16C17.11 12 18 12.9 18 14M14 14V20H16V14H14Z" />
                    </svg>
                </button>

                {/* Previous Track (playlist only) */}
                {isPlaylist && (
                    <button
                        onClick={() => setCurrentTrackIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentTrackIndex === 0}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-30"
                        title="Previous part"
                    >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
                        </svg>
                    </button>
                )}

                {/* Play/Pause Button */}
                <button
                    onClick={togglePlay}
                    disabled={isLoading || duration === 0}
                    className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-gradient-to-br from-cyan-500 to-purple-600 text-white rounded-full hover:scale-105 transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={duration === 0 ? 'Audio loading, please wait...' : isPlaying ? 'Pause' : 'Play'}
                >
                    {(isLoading || duration === 0) ? (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : isPlaying ? (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </button>

                {/* Stop Button - Stops and resets audio */}
                {isPlaying && (
                    <button
                        onClick={() => {
                            if (audioRef.current) {
                                audioRef.current.pause()
                                audioRef.current.currentTime = 0
                            }
                            setIsPlaying(false)
                            setCurrentTime(0)
                            if (isPlaylist) {
                                setCurrentTrackIndex(0)
                            }
                        }}
                        className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 rounded-full transition-all"
                        title="Stop"
                    >
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 6h12v12H6z" />
                        </svg>
                    </button>
                )}

                {/* Next Track (playlist only) */}
                {isPlaylist && (
                    <button
                        onClick={() => setCurrentTrackIndex(prev => Math.min(playlist.length - 1, prev + 1))}
                        disabled={currentTrackIndex === playlist.length - 1}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-30"
                        title="Next part"
                    >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 18l8.5-6L6 6v12zm2 0V6l6.5 6L8 18zm8-12h2v12h-2V6z" />
                        </svg>
                    </button>
                )}

                {/* Skip Forward */}
                <button
                    onClick={() => skip(10)}
                    className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    title="Forward 10s"
                >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.5 3C6.85 3 2.92 6.03 1.53 10.22L3.9 11C4.95 7.81 7.96 5.5 11.5 5.5C13.46 5.5 15.23 6.22 16.62 7.38L14 10H21V3L18.4 5.6C16.55 4 14.15 3 11.5 3M10 12V22H8V14H6V12H10M18 14V20C18 21.11 17.11 22 16 22H14C12.9 22 12 21.1 12 20V14C12 12.9 12.9 12 14 12H16C17.11 12 18 12.9 18 14M14 14V20H16V14H14Z" />
                    </svg>
                </button>

                {/* Waveform & Progress */}
                <div className="flex-1 min-w-0">
                    {/* Waveform */}
                    <div
                        onClick={handleSeek}
                        className="relative h-6 sm:h-8 flex items-center gap-0.5 cursor-pointer group"
                    >
                        {isLoading ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="w-1 h-4 bg-gray-600 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            waveformData.map((amplitude, index) => {
                                const barProgress = (index / waveformData.length) * 100
                                const isPassed = barProgress < progress
                                const height = amplitude * 100

                                return (
                                    <div
                                        key={index}
                                        className="flex-1 flex items-center justify-center"
                                        style={{ minWidth: '2px', maxWidth: '6px' }}
                                    >
                                        <div
                                            className={`w-full rounded-full transition-all duration-150 ${
                                                isPassed
                                                    ? 'bg-gradient-to-t from-cyan-500 to-purple-500'
                                                    : 'bg-gray-700/80'
                                            }`}
                                            style={{
                                                height: `${Math.max(height, 15)}%`,
                                                transform: isPlaying && isPassed ? 'scaleY(1.15)' : 'scaleY(1)'
                                            }}
                                        />
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* Progress Bar - Shows played portion clearly */}
                    <div
                        onClick={handleSeek}
                        className="relative h-1.5 mt-1 bg-gray-700/50 rounded-full cursor-pointer overflow-hidden group"
                    >
                        {/* Played portion */}
                        <div
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-100"
                            style={{ width: `${progress}%` }}
                        />
                        {/* Playhead indicator */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ left: `calc(${progress}% - 6px)` }}
                        />
                    </div>
                </div>

                {/* Speed Control */}
                <button
                    onClick={cycleSpeed}
                    className="flex-shrink-0 px-2 py-1 text-xs font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-md transition-colors"
                    title="Playback speed"
                >
                    {playbackSpeed}x
                </button>
            </div>

            {/* Time Display */}
            <div className="flex justify-between mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-500 font-medium px-1">
                <span className="text-cyan-400">{formatTime(effectiveCurrentTime)}</span>
                <span>{formatTime(effectiveDuration)}</span>
            </div>
        </div>
    )
}
