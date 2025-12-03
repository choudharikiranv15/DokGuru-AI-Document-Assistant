import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useChatHistoryStore } from '../../stores/chatHistoryStore'
import { useChatStore } from '../../stores/chatStore'
import ChatHistoryCard from './ChatHistoryCard'

export default function ChatHistoryList() {
    const [filter, setFilter] = useState('all') // all, today, week, month
    const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)

    const chatHistories = useChatHistoryStore(state => state.chatHistories)
    const currentChatId = useChatHistoryStore(state => state.currentChatId)
    const loadChatHistory = useChatHistoryStore(state => state.loadChatHistory)
    const deleteChatHistory = useChatHistoryStore(state => state.deleteChatHistory)
    const clearAllHistory = useChatHistoryStore(state => state.clearAllHistory)
    const filterByDateRange = useChatHistoryStore(state => state.filterByDateRange)
    const fetchChatHistories = useChatHistoryStore(state => state.fetchChatHistories)
    const planLimits = useChatHistoryStore(state => state.planLimits)
    const getRemainingChats = useChatHistoryStore(state => state.getRemainingChats)

    const messages = useChatStore(state => state.messages)

    // Fetch chat histories on mount
    useEffect(() => {
        fetchChatHistories()
    }, [fetchChatHistories])

    const remaining = getRemainingChats()
    const isPro = planLimits?.plan === 'pro' || planLimits?.plan === 'premium'

    // Filter chats based on date range
    const filteredChats = filterByDateRange(filter)

    // Check if current chat has unsaved changes
    const hasUnsavedChanges = () => {
        return messages.length > 0 && !currentChatId
    }

    const handleLoad = async (chatId) => {
        // Check for unsaved changes
        if (hasUnsavedChanges()) {
            const confirmed = window.confirm(
                'You have an unsaved conversation. Loading another chat will discard it. Continue?'
            )
            if (!confirmed) return
        }

        await loadChatHistory(chatId)
    }

    const handleDelete = async (chatId) => {
        const confirmed = window.confirm(
            'Delete this chat? This action cannot be undone.'
        )
        if (!confirmed) return

        await deleteChatHistory(chatId)
    }

    const handleClearAll = async () => {
        if (!showDeleteAllConfirm) {
            setShowDeleteAllConfirm(true)
            return
        }

        await clearAllHistory()
        setShowDeleteAllConfirm(false)
    }

    const filterButtons = [
        { id: 'all', label: 'All' },
        { id: 'today', label: 'Today' },
        { id: 'week', label: 'Week' },
        { id: 'month', label: 'Month' }
    ]

    return (
        <div className="space-y-4">
            {/* Plan Limit Indicator */}
            {!isPro && planLimits && (
                <div className={`p-3 rounded-xl border ${remaining <= 2
                        ? 'bg-red-500/10 border-red-500/30'
                        : remaining <= 5
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : 'bg-blue-500/10 border-blue-500/30'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">
                            {remaining} / {planLimits.limit} Chats
                        </span>
                        {remaining <= 2 && (
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                                Almost Full
                            </span>
                        )}
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                        <div
                            className={`h-2 rounded-full transition-all ${remaining <= 2 ? 'bg-red-500' : remaining <= 5 ? 'bg-yellow-500' : 'bg-blue-500'
                                }`}
                            style={{ width: `${(chatHistories.length / planLimits.limit) * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400">
                        {remaining === 0
                            ? 'Chat limit reached. Upgrade to Pro for unlimited chats!'
                            : `${remaining} chat${remaining === 1 ? '' : 's'} remaining`
                        }
                    </p>
                </div>
            )}

            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
                {filterButtons.map(btn => (
                    <button
                        key={btn.id}
                        onClick={() => setFilter(btn.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === btn.id
                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>

            {/* Chat List */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {filteredChats.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-12"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="text-gray-400 text-sm mb-2">No chat history found</p>
                            <p className="text-gray-600 text-xs">
                                {filter !== 'all'
                                    ? 'Try changing the filter or start a new conversation'
                                    : 'Start a conversation to see it here'}
                            </p>
                        </motion.div>
                    ) : (
                        filteredChats.map((chat, index) => (
                            <motion.div
                                key={chat.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <ChatHistoryCard
                                    chatHistory={chat}
                                    onLoad={handleLoad}
                                    onDelete={handleDelete}
                                    isActive={chat.id === currentChatId}
                                />
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Clear All Button */}
            {chatHistories.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                    <button
                        onClick={handleClearAll}
                        onMouseLeave={() => setShowDeleteAllConfirm(false)}
                        className={`w-full py-2 px-4 rounded-lg text-xs font-medium transition-all ${showDeleteAllConfirm
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                            }`}
                    >
                        {showDeleteAllConfirm ? 'Click again to confirm' : 'Clear All History'}
                    </button>
                </div>
            )}

            {/* Help Text */}
            <div className="pt-2 text-center">
                <p className="text-xs text-gray-600">
                    Chats are auto-saved after each conversation
                </p>
            </div>
        </div>
    )
}
