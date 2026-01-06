import { create } from 'zustand'

let messageCounter = 0

export const useChatStore = create((set) => ({
    messages: [],

    addMessage: (message) => set((state) => {
        const id = message.id || `${Date.now()}-${++messageCounter}`
        return {
            messages: [...state.messages, { ...message, id }]
        }
    }),

    clearMessages: () => set({ messages: [] }),

    updateMessage: (id, updates) => set((state) => ({
        messages: state.messages.map(msg =>
            msg.id === id ? { ...msg, ...updates } : msg
        )
    }))
}))
