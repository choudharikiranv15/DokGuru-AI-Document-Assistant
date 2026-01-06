import { create } from 'zustand'
import { toast } from 'react-hot-toast'
import * as api from '../services/api'

export const useChatHistoryStore = create((set, get) => ({
    // State
    chatHistories: [],
    currentChatId: null, // Currently active chat ID
    loading: false,
    error: null,
    planLimits: null, // Store plan limits
    autoSaveEnabled: true, // Auto-save current chat

    // Fetch all chat histories for the current user
    fetchChatHistories: async (autoLoadLast = false) => {
        set({ loading: true, error: null })
        try {
            const data = await api.getChatHistories()
            set({
                chatHistories: data.chats,
                planLimits: { limit: data.limit, plan: data.plan },
                loading: false
            })

            // Auto-load the most recent chat if requested
            if (autoLoadLast && data.chats && data.chats.length > 0) {
                const lastChat = data.chats[0] // Assuming sorted by most recent
                await get().loadChatHistory(lastChat.id, true) // true = silent load
            }
        } catch (error) {
            set({ error: error.message, loading: false })
            toast.error(error.message || 'Failed to load chat history')
        }
    },

    // Check if user can create new chat (based on plan limits)
    canCreateNewChat: () => {
        const { chatHistories, planLimits } = get()
        if (!planLimits) return true // No limits loaded yet
        if (planLimits.plan === 'pro' || planLimits.plan === 'premium') return true // Unlimited
        return chatHistories.length < planLimits.limit
    },

    // Get remaining chat slots
    getRemainingChats: () => {
        const { chatHistories, planLimits } = get()
        if (!planLimits) return 0
        if (planLimits.plan === 'pro' || planLimits.plan === 'premium') return 999 // Unlimited
        return Math.max(0, planLimits.limit - chatHistories.length)
    },

    // Load a specific chat history into the main chat area
    loadChatHistory: async (chatId, silent = false) => {
        try {
            // Fetch full chat details from backend
            const chat = await api.getChatHistoryById(chatId)

            // Import chatStore to load messages
            const { useChatStore } = await import('./chatStore')
            const clearMessages = useChatStore.getState().clearMessages
            const addMessage = useChatStore.getState().addMessage

            // Clear current messages
            clearMessages()

            // Load messages from chat history
            chat.messages?.forEach(message => {
                addMessage(message)
            })

            // Set as current chat
            set({ currentChatId: chatId })

            // Also set the document as active
            const { useDocumentStore } = await import('./documentStore')
            const documents = useDocumentStore.getState().documents
            const setCurrentDocument = useDocumentStore.getState().setCurrentDocument
            const doc = documents.find(d => d.name === chat.document_name || d.name === chat.documentName)
            if (doc) {
                setCurrentDocument(doc)
            }

            if (!silent) {
                toast.success('Chat loaded successfully!')
            }
        } catch (error) {
            if (!silent) {
                toast.error(error.message || 'Failed to load chat')
            }
        }
    },

    // Start a new chat (with limit check)
    startNewChat: async () => {
        const { canCreateNewChat, getRemainingChats } = get()

        if (!canCreateNewChat()) {
            const remaining = getRemainingChats()
            toast.error(`Chat limit reached! You have ${remaining} chats remaining. Upgrade to Pro for unlimited chats.`, {
                duration: 5000
            })
            return false
        }

        // Import chatStore to clear messages
        const { useChatStore } = await import('./chatStore')
        const clearMessages = useChatStore.getState().clearMessages

        // Clear current messages
        clearMessages()

        // Clear current chat ID
        set({ currentChatId: null })

        toast.success('New chat started!')
        return true
    },

    // Save current chat history (auto-save or manual)
    saveChatHistory: async (messages, documentName, documentId) => {
        if (!messages || messages.length === 0) {
            return // Nothing to save
        }

        try {
            const { currentChatId } = get()

            if (currentChatId) {
                // Update existing chat
                await api.updateChatHistory(currentChatId, messages)
                return { id: currentChatId }
            } else {
                // Create new chat history
                const firstUserMessage = messages.find(m => m.role === 'user')?.text || 'New conversation'
                const result = await api.createChatHistory(documentName, documentId, firstUserMessage)

                // Update chat with messages
                await api.updateChatHistory(result.chat.id, messages)

                // Refresh list
                await get().fetchChatHistories()

                set({ currentChatId: result.chat.id })

                return result.chat
            }
        } catch (error) {
            toast.error(error.message || 'Failed to save chat history')
            throw error
        }
    },

    // Delete a specific chat history
    deleteChatHistory: async (chatId) => {
        try {
            await api.deleteChatHistory(chatId)

            set(state => ({
                chatHistories: state.chatHistories.filter(c => c.id !== chatId),
                currentChatId: state.currentChatId === chatId ? null : state.currentChatId
            }))

            toast.success('Chat deleted')
        } catch (error) {
            toast.error(error.message || 'Failed to delete chat')
        }
    },

    // Clear all chat histories
    clearAllHistory: async () => {
        try {
            await api.clearAllChatHistories()

            set({ chatHistories: [], currentChatId: null })
            toast.success('All chat history cleared')
        } catch (error) {
            toast.error(error.message || 'Failed to clear chat history')
        }
    },

    // Search chat histories
    searchChatHistories: async (query) => {
        if (!query) {
            return get().chatHistories
        }

        try {
            const result = await api.searchChatHistories(query)
            return result.chats
        } catch (error) {
            toast.error(error.message || 'Failed to search chat histories')
            return []
        }
    },

    // Filter by date range
    filterByDateRange: (range) => {
        const { chatHistories } = get()
        const now = Date.now()

        switch (range) {
            case 'today':
                return chatHistories.filter(chat =>
                    now - new Date(chat.updatedAt).getTime() < 24 * 60 * 60 * 1000
                )
            case 'week':
                return chatHistories.filter(chat =>
                    now - new Date(chat.updatedAt).getTime() < 7 * 24 * 60 * 60 * 1000
                )
            case 'month':
                return chatHistories.filter(chat =>
                    now - new Date(chat.updatedAt).getTime() < 30 * 24 * 60 * 60 * 1000
                )
            case 'all':
            default:
                return chatHistories
        }
    },

    // Set current chat ID
    setCurrentChatId: (chatId) => set({ currentChatId: chatId }),

    // Clear current chat ID
    clearCurrentChatId: () => set({ currentChatId: null })
}))
