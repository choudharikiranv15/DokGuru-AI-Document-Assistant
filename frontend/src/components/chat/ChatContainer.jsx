import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useChatStore } from '../../stores/chatStore'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

export default function ChatContainer() {
    const messages = useChatStore(state => state.messages)
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

    // Set greeting based on time of day
    useEffect(() => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting('Good Morning')
        else if (hour < 18) setGreeting('Good Afternoon')
        else setGreeting('Good Evening')

        // Get user name from auth store if available
        const email = localStorage.getItem('user_email')
        if (email) {
            const name = email.split('@')[0]
            setUserName(name.charAt(0).toUpperCase() + name.slice(1))
        }
    }, [])

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0f172a]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-4 py-4 sm:py-6">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center relative overflow-hidden py-4 sm:py-0">
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
                                className="mb-3 sm:mb-6"
                            >
                                <div className="inline-flex items-center justify-center gap-3">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                                        <svg className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.48.41-2.86 1.12-4.06l10.94 10.94C14.86 19.59 13.48 20 12 20zm6.88-3.94L8.94 6.12C10.14 5.41 11.52 5 13 5c4.41 0 8 3.59 8 8 0 1.48-.41 2.86-1.12 4.06z"/>
                                        </svg>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Greeting */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                                className="mb-4 sm:mb-6 md:mb-8 px-2 sm:px-4"
                            >
                                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-1 sm:mb-3">
                                    {greeting}{userName && `, ${userName}`}! 👋
                                </h2>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6, duration: 0.5 }}
                                    className="text-lg sm:text-xl md:text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-1 sm:mb-2"
                                >
                                    Your AI Document Teacher
                                </motion.p>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8, duration: 0.5 }}
                                    className="text-gray-400 text-sm sm:text-base md:text-lg"
                                >
                                    Upload documents and ask questions using voice or text
                                </motion.p>
                            </motion.div>

                            {/* Quick Start Features */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.0, duration: 0.5 }}
                                className="grid grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto"
                            >
                                {[
                                    {
                                        icon: '🎤',
                                        title: 'Voice Input',
                                        desc: 'Ask naturally'
                                    },
                                    {
                                        icon: '🌐',
                                        title: 'Multilingual',
                                        desc: 'EN, KN & HI'
                                    },
                                    {
                                        icon: '⚡',
                                        title: 'Instant',
                                        desc: 'AI responses'
                                    }
                                ].map((feature, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.2 + i * 0.1, duration: 0.5 }}
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        className="p-2 sm:p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl hover:border-cyan-500/30 transition-all cursor-default"
                                    >
                                        <div className="text-xl sm:text-3xl mb-1 sm:mb-2">{feature.icon}</div>
                                        <h3 className="text-white font-semibold text-xs sm:text-base mb-0.5 sm:mb-1">{feature.title}</h3>
                                        <p className="text-gray-400 text-[10px] sm:text-sm">{feature.desc}</p>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Getting Started Hint */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.6, duration: 0.5 }}
                                className="mt-4 sm:mt-8 flex items-center justify-center gap-2 text-gray-500 text-xs sm:text-sm"
                            >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="hidden sm:inline">Upload a document or type a message below to get started</span>
                                <span className="sm:hidden">Upload or type below to start</span>
                            </motion.div>
                        </motion.div>
                    </div>
                ) : (
                    <>
                        <MessageList isLoading={isThinking} />
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-800 bg-[#1e293b]">
                <ChatInput setIsThinking={setIsThinking} />
            </div>
        </div>
    )
}
