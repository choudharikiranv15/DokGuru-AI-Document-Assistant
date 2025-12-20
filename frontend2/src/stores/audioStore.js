import { create } from 'zustand';

export const useAudioStore = create((set) => ({
  isBackgroundPlaying: false,
  backgroundAudioElement: null,
  
  registerBackgroundAudio: (element) => set({ backgroundAudioElement: element }),
  setBackgroundPlaying: (playing) => set({ isBackgroundPlaying: playing }),
}));
