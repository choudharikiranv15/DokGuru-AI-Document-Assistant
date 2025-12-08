import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useChatStore } from '../../stores/chatStore'
import { useDocumentStore } from '../../stores/documentStore'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import DocumentUpload from '../documents/DocumentUpload'

import useAuthStore from '../../stores/authStore'

export default function ChatContainer() {
    const messages = useChatStore(state => state.messages)
    const documents = useDocumentStore(state => state.documents)
    const currentDocument = useDocumentStore(state => state.currentDocument)
    const user = useAuthStore(state => state.user)
    const messagesEndRef = useRef(null)
    const [greeting, setGreeting] = useState('')
    const [userName, setUserName] = useState('')
    const [isThinking, setIsThinking] = useState(false)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isThinking])

    // Set greeting based on time of day and user profile
    useEffect(() => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting('Good Morning')
        else if (hour < 18) setGreeting('Good Afternoon')
        else setGreeting('Good Evening')

        if (user) {
            if (user.display_name) {
                setUserName(user.display_name)
            }
        } else if (user.email) {
            const name = user.email.split('@')[0]
            setUserName(name.charAt(0).toUpperCase() + name.slice(1))
        }
    }, [user])

    return (
        <div className="flex-1 flex flex-col w-full max-w-full overflow-hidden bg-[#0f172a]">
            {/* Active Document Header - Only shown when there are messages and a document is selected */}
            {messages.length > 0 && currentDocument && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-shrink-0 border-b border-white/10 bg-[#1e293b]/80 backdrop-blur-sm sticky top-0 z-10"
                >
                    <div className="px-3 sm:px-6 py-2 sm:py-3 flex flex-wrap items-center justify-between gap-2">
                        {/* Document Info */}
                        <div className="flex items-center gap-2 min-w-0">
                            <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {currentDocument.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {currentDocument.pages ? `${currentDocument.pages} pages` : ''}
                                    {currentDocument.pages && currentDocument.chunks ? ' • ' : ''}
                                    {currentDocument.chunks ? `${currentDocument.chunks} chunks` : ''}
                                </p>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-full">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-green-400 font-medium hidden sm:inline">Active</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full px-2 sm:px-4 py-4 sm:py-6">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center relative overflow-hidden py-2 sm:py-4">
                        {/* Animated Background Orbs - Responsive sizes */}
                        {messages.length === 0 && (
                            <div className="absolute inset-0 pointer-events-none">
                                <motion.div
                                    className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-cyan-500/10 rounded-full blur-3xl"
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        x: [0, 30, 0],
                                    }}
                                    transition={{
                                        duration: 15,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                />
                                <motion.div
                                    className="absolute top-1/3 right-1/4 w-40 h-40 sm:w-60 sm:h-60 md:w-80 md:h-80 bg-purple-600/10 rounded-full blur-3xl"
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        x: [0, -30, 0],
                                    }}
                                    transition={{
                                        duration: 18,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                />
                                {/* Extra orb for more visual appeal on mobile */}
                                <motion.div
                                    className="absolute bottom-1/4 left-1/3 w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 bg-pink-500/10 rounded-full blur-3xl"
                                    animate={{
                                        scale: [1, 1.4, 1],
                                        y: [0, -20, 0],
                                    }}
                                    transition={{
                                        duration: 12,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                />
                            </div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center max-w-2xl relative z-10 px-2"
                        >
                            {/* Logo */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="mb-2 sm:mb-4"
                            >
                                <div className="inline-flex items-center justify-center gap-3">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                                        <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.48.41-2.86 1.12-4.06l10.94 10.94C14.86 19.59 13.48 20 12 20zm6.88-3.94L8.94 6.12C10.14 5.41 11.52 5 13 5c4.41 0 8 3.59 8 8 0 1.48-.41 2.86-1.12 4.06z" />
                                        </svg>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Greeting */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                                className="mb-4 sm:mb-6 px-2 sm:px-4"
                            >
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
                                    {greeting}{userName && `, ${userName}`}! 👋
                                </h2>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6, duration: 0.5 }}
                                    className="text-base sm:text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-1"
                                >
                                    Your AI Document Teacher
                                </motion.p>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8, duration: 0.5 }}
                                    className="text-gray-400 text-xs sm:text-sm"
                                >
                                    Upload documents and ask questions using voice or text
                                </motion.p>
                            </motion.div>

                            {/* Large Upload Component - Prominent CTA */}
                            {documents.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.0, duration: 0.5 }}
                                    className="w-full max-w-xl mb-4"
                                >
                                    <DocumentUpload variant="large" />
                                </motion.div>
                            )}


                        </motion.div>
                    </div>
                ) : (
                    <>
                        <MessageList isLoading={isThinking} />
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area - Sticky at bottom */}
            <div className="flex-shrink-0 border-t border-gray-800 bg-[#1e293b] w-full max-w-full overflow-x-hidden">
                <ChatInput setIsThinking={setIsThinking} />
            </div>
        </div>
    )
}
