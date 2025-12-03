import { useState } from 'react'
import { motion } from 'framer-motion'
import DocumentUpload from '../documents/DocumentUpload'
import DocumentList from '../documents/DocumentList'
import TabToggle from '../sidebar/TabToggle'
import ChatHistoryList from '../chatHistory/ChatHistoryList'
import { useDocumentStore } from '../../stores/documentStore'
import { useChatHistoryStore } from '../../stores/chatHistoryStore'

export default function Sidebar({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('documents') // 'documents' or 'history'
    const documents = useDocumentStore(state => state.documents)
    const chatHistories = useChatHistoryStore(state => state.chatHistories)

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 bg-[#1e293b] border-r border-white/10
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                <div className="h-full flex flex-col">
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-base font-semibold text-white">
                                    {activeTab === 'documents' ? 'My Documents' : 'Chat History'}
                                </h2>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 text-gray-400"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.button>
                        </div>

                        {/* Tab Toggle */}
                        <TabToggle
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            documentCount={documents.length}
                            chatCount={chatHistories.length}
                        />
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-3">
                        {activeTab === 'documents' ? (
                            <motion.div
                                key="documents"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                {/* Upload Component */}
                                <DocumentUpload />

                                {/* Document List */}
                                <DocumentList />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChatHistoryList />
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar Footer */}
                    <div className="p-3 border-t border-white/10">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-gray-400">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span>Connected</span>
                            </div>
                            <span className="text-gray-600">Beta v1.0</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}
