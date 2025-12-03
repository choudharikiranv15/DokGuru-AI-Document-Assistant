import { motion } from 'framer-motion'

export default function TabToggle({
    activeTab,
    onTabChange,
    documentCount = 0,
    chatCount = 0
}) {
    return (
        <div className="flex gap-2 p-2 bg-[#0f172a]/50 rounded-lg">
            {/* Documents Tab */}
            <button
                onClick={() => onTabChange('documents')}
                className={`flex-1 relative py-2.5 px-3 rounded-lg transition-all duration-200 overflow-visible ${activeTab === 'documents'
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                    }`}
            >
                {/* Active background gradient */}
                {activeTab === 'documents' && (
                    <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                )}

                <div className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium">Docs</span>
                    <span className="text-xs opacity-75">({documentCount}/5)</span>
                </div>
            </button>

            {/* Chat History Tab */}
            <button
                onClick={() => onTabChange('history')}
                className={`flex-1 relative py-2.5 px-3 rounded-lg transition-all duration-200 overflow-visible ${activeTab === 'history'
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                    }`}
            >
                {/* Active background gradient */}
                {activeTab === 'history' && (
                    <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                )}

                <div className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-sm font-medium">Chats</span>
                    <span className="text-xs opacity-75">({chatCount})</span>
                </div>
            </button>
        </div>
    )
}
