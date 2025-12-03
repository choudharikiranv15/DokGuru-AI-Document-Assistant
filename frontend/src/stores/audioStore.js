import { create } from 'zustand'

/**
 * Global audio playback store to manage background streaming audio
 * Prevents overlap between background TTS and audio player
 */
export const useAudioStore = create((set, get) => ({
    // Background streaming audio reference
    backgroundAudioRef: null,
    isBackgroundPlaying: false,

    // Register the background audio element from ChatInput
    registerBackgroundAudio: (audioElement) => {
        set({ backgroundAudioRef: audioElement })
    },

    // Set background playing state
    setBackgroundPlaying: (isPlaying) => {
        set({ isBackgroundPlaying: isPlaying })
    },

    // Stop background audio (called from SpotifyAudioPlayer when it starts)
    stopBackgroundAudio: () => {
        const { backgroundAudioRef } = get()
        if (backgroundAudioRef) {
            backgroundAudioRef.pause()
            backgroundAudioRef.currentTime = 0
            set({ isBackgroundPlaying: false })
        }
    },

    // Clean up
    cleanup: () => {
        set({ backgroundAudioRef: null, isBackgroundPlaying: false })
    }
}))
