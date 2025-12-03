import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

export default function ChatHistoryCard({ chatHistory, onLoad, onDelete, isActive }) {
    const {
        id,
        firstMessage,
        documentName,
        messageCount,
        createdAt,
        updatedAt
    } = chatHistory

    // Format timestamp as relative time (e.g., "2 hours ago")
    const getTimeAgo = () => {
        const dateStr = updatedAt || createdAt
        if (!dateStr) return 'Unknown time'

        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return 'Unknown time'

        return formatDistanceToNow(date, { addSuffix: true })
    }
    const timeAgo = getTimeAgo()

    // Truncate first message if too long
    const truncatedMessage = firstMessage?.length > 60
        ? firstMessage.substring(0, 60) + '...'
        : firstMessage || 'New conversation'

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isActive
                    ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                    : 'border-white/10 bg-white/5 hover:border-cyan-500/50 hover:bg-white/10'
            }`}
        >
            {/* Preview of first message */}
            <div className="mb-2">
                <p className="text-sm text-white font-medium line-clamp-2">
                    "{truncatedMessage}"
                </p>
            </div>

            {/* Document Badge */}
            <div className="flex items-center gap-2 mb-2">
                <svg className="w-3 h-3 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs text-gray-400 truncate">{documentName || 'Unknown document'}</span>
            </div>

            {/* Metadata - Message count & timestamp */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{messageCount || 0} messages</span>
                </div>
                <span>{timeAgo}</span>
            </div>

            {/* Active indicator */}
            {isActive && (
                <div className="flex items-center gap-1 mb-2 text-xs text-cyan-400">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    <span>Current chat</span>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                        e.stopPropagation()
                        onLoad(id)
                    }}
                    disabled={isActive}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                        isActive
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                    }`}
                >
                    {isActive ? 'Loaded' : 'Load'}
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete(id)
                    }}
                    className="py-1.5 px-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-medium transition-all"
                >
                    Delete
                </motion.button>
            </div>
        </motion.div>
    )
}
