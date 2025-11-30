import { create } from 'zustand'

// Counter to ensure unique IDs even when Date.now() returns same value
let messageCounter = 0

export const useChatStore = create((set) => ({
    messages: [],

    addMessage: (message) => set((state) => {
        // Use message.id if provided, otherwise generate unique ID
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
