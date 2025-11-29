import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FeedbackModal from './FeedbackModal'

export default function FeedbackButton() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    return (
        <>
            {/* Floating Feedback Button - Positioned higher on mobile to avoid overlap with chat input */}
            <motion.button
                onClick={() => setIsModalOpen(true)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-40 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full shadow-2xl shadow-purple-500/50 flex items-center gap-2 sm:gap-3 transition-all group p-3 sm:p-4"
            >
                {/* Icon */}
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>

                {/* Text (shown on hover - hidden on mobile) */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.span
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 'auto', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="font-semibold text-sm whitespace-nowrap overflow-hidden hidden sm:inline"
                        >
                            Feedback
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* Pulse animation - less prominent on mobile */}
                <span className="absolute inset-0 rounded-full hidden sm:block">
                    <span className="animate-ping absolute inset-0 rounded-full bg-purple-400 opacity-75" style={{ animationDuration: '3s' }} />
                </span>
            </motion.button>

            {/* Feedback Modal */}
            <FeedbackModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    )
}
