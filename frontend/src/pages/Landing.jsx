import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import WaveBackground from '../components/common/WaveBackground'

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2
        }
    }
}

// Typing Hook
function useTypingEffect(text, speed = 50, startDelay = 0) {
    const [displayedText, setDisplayedText] = useState('')
    const [isComplete, setIsComplete] = useState(false)

    useEffect(() => {
        setDisplayedText('')
        setIsComplete(false)

        const timeout = setTimeout(() => {
            let index = 0
            const interval = setInterval(() => {
                if (index < text.length) {
                    setDisplayedText(text.slice(0, index + 1))
                    index++
                } else {
                    setIsComplete(true)
                    clearInterval(interval)
                }
            }, speed)

            return () => clearInterval(interval)
        }, startDelay)

        return () => clearTimeout(timeout)
    }, [text, speed, startDelay])

    return { displayedText, isComplete }
}

// Chat Animation Component
function AnimatedChat({ resetTrigger }) {
    const [stage, setStage] = useState(0)
    const chatContainerRef = useRef(null)

    const q1 = useTypingEffect('What is photosynthesis?', 50, 1000)
    const a1 = useTypingEffect('Photosynthesis is the process by which plants convert light energy into chemical energy...', 30, 0)
    const q2 = useTypingEffect('Can you explain it in Kannada?', 50, 0)
    const a2 = useTypingEffect('ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ ಎಂದರೆ ಸಸ್ಯಗಳು, ಪಾಚಿಗಳು ಮತ್ತು ಕೆಲವು ಬ್ಯಾಕ್ಟೀರಿಯಾಗಳು ಸೂರ್ಯನ ಬೆಳಕು, ನೀರು ಮತ್ತು ಇಂಗಾಲದ ಡೈಆಕ್ಸೈಡ್ ಅನ್ನು ಬಳಸಿ ತಮ್ಮ ಆಹಾರವನ್ನು ತಯಾರಿಸಿಕೊಳ್ಳುವ ಪ್ರಕ್ರಿಯೆಯಾಗಿದೆ...', 30, 0)

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            })
        }
    }

    // Reset animation when resetTrigger changes
    useEffect(() => {
        setStage(0)
        // Reset scroll to top on animation reset
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = 0
        }
    }, [resetTrigger])

    useEffect(() => {
        if (stage === 0 && q1.isComplete) {
            setTimeout(() => setStage(1), 500)
        } else if (stage === 1 && a1.isComplete) {
            setTimeout(() => setStage(2), 800)
        } else if (stage === 2 && q2.isComplete) {
            setTimeout(() => setStage(3), 500)
            // Scroll down when second question appears
            setTimeout(() => scrollToBottom(), 600)
        } else if (stage === 3 && a2.isComplete) {
            setTimeout(() => setStage(4), 2000)
        }
        // Stage 4: Animation complete - no auto-loop
    }, [stage, q1.isComplete, a1.isComplete, q2.isComplete, a2.isComplete])

    // Auto-scroll during stage 3 (second answer typing)
    useEffect(() => {
        if (stage === 3 && !a2.isComplete) {
            scrollToBottom()
        }
    }, [stage, a2.displayedText, a2.isComplete])

    return (
        <div ref={chatContainerRef} className="p-2 sm:p-3 md:p-4 space-y-1.5 sm:space-y-2 md:space-y-2.5 h-[calc(100%-4rem)] sm:h-[calc(100%-5rem)] md:h-[calc(100%-6.5rem)] overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`
                .overflow-y-auto::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            {/* PDF Indicator - Responsive */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="inline-flex items-center gap-1 sm:gap-2 bg-green-500/10 border border-green-500/30 rounded-md sm:rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1.5 backdrop-blur-sm"
            >
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                </svg>
                <span className="text-green-500 text-[8px] sm:text-[10px] md:text-xs font-medium">biology.pdf</span>
            </motion.div>

            {/* Question 1 - Responsive */}
            {stage >= 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-end"
                >
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[8px] sm:text-[10px] md:text-xs rounded-lg sm:rounded-xl rounded-tr-sm px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 max-w-[75%] sm:max-w-[70%] shadow-lg">
                        {q1.displayedText}
                        {!q1.isComplete && <span className="animate-pulse">▋</span>}
                    </div>
                </motion.div>
            )}

            {/* Answer 1 - Responsive */}
            {stage >= 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-1 sm:gap-1.5 md:gap-2"
                >
                    <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg">
                        <span className="text-white text-[6px] sm:text-[8px] md:text-[9px] font-bold">AI</span>
                    </div>
                    <div className="bg-gray-800/50 text-gray-300 text-[8px] sm:text-[10px] md:text-xs rounded-lg sm:rounded-xl rounded-tl-sm px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 max-w-[80%] backdrop-blur-sm border border-gray-700/50 shadow-lg leading-relaxed">
                        {a1.displayedText}
                        {!a1.isComplete && <span className="animate-pulse ml-1">▋</span>}
                    </div>
                </motion.div>
            )}

            {/* Question 2 - Responsive */}
            {stage >= 2 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-end"
                >
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[8px] sm:text-[10px] md:text-xs rounded-lg sm:rounded-xl rounded-tr-sm px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 max-w-[75%] sm:max-w-[70%] shadow-lg">
                        {q2.displayedText}
                        {!q2.isComplete && <span className="animate-pulse">▋</span>}
                    </div>
                </motion.div>
            )}

            {/* Answer 2 - Responsive */}
            {stage >= 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-1 sm:gap-1.5 md:gap-2"
                >
                    <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg">
                        <span className="text-white text-[6px] sm:text-[8px] md:text-[9px] font-bold">AI</span>
                    </div>
                    <div className="bg-gray-800/50 text-gray-300 text-[8px] sm:text-[10px] md:text-xs rounded-lg sm:rounded-xl rounded-tl-sm px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 max-w-[80%] backdrop-blur-sm border border-gray-700/50 shadow-lg leading-relaxed">
                        {a2.displayedText}
                        {!a2.isComplete && <span className="animate-pulse ml-1">▋</span>}
                    </div>
                </motion.div>
            )}

            {/* Voice Indicator - Responsive */}
            {stage >= 3 && a2.isComplete && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-cyan-400 text-[8px] sm:text-[10px] md:text-xs ml-6 sm:ml-7 md:ml-9"
                >
                    <div className="flex gap-0.5">
                        <motion.div
                            animate={{ height: [4, 8, 4] }}
                            transition={{ duration: 0.6, repeat: Infinity }}
                            className="w-0.5 bg-cyan-500 rounded-full"
                        />
                        <motion.div
                            animate={{ height: [6, 10, 6] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                            className="w-0.5 bg-cyan-500 rounded-full"
                        />
                        <motion.div
                            animate={{ height: [4, 8, 4] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                            className="w-0.5 bg-cyan-500 rounded-full"
                        />
                    </div>
                    <span className="text-[7px] sm:text-[9px] md:text-[10px] font-medium">Playing in Kannada...</span>
                </motion.div>
            )}
        </div>
    )
}

export default function Landing() {
    const heroRef = useRef(null)
    const [resetTrigger, setResetTrigger] = useState(0)
    const [hasAnimated, setHasAnimated] = useState(false)

    // Intersection Observer to detect when hero section is visible
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && hasAnimated) {
                        // Hero section is visible again after scrolling away
                        setResetTrigger(prev => prev + 1)
                    }
                })
            },
            { threshold: 0.3 } // Trigger when 30% of hero is visible
        )

        if (heroRef.current) {
            observer.observe(heroRef.current)
        }

        // Mark as animated after initial load
        const timer = setTimeout(() => setHasAnimated(true), 5000)

        return () => {
            if (heroRef.current) {
                observer.unobserve(heroRef.current)
            }
            clearTimeout(timer)
        }
    }, [hasAnimated])

    // Page visibility API to detect refresh/revisit
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && hasAnimated) {
                setResetTrigger(prev => prev + 1)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [hasAnimated])

    return (
        <div className="min-h-screen bg-[#0a0f1e] relative overflow-hidden">
            {/* Content */}
            <div className="relative z-10">
                {/* Navigation */}
                <nav className="p-4 md:p-6 flex justify-between items-center backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 md:gap-3"
                    >
                        {/* DokGuru Logo with Wave Icon */}
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.48.41-2.86 1.12-4.06l10.94 10.94C14.86 19.59 13.48 20 12 20zm6.88-3.94L8.94 6.12C10.14 5.41 11.52 5 13 5c4.41 0 8 3.59 8 8 0 1.48-.41 2.86-1.12 4.06z" />
                            </svg>
                        </div>
                        <span className="text-xl md:text-2xl font-bold text-white">
                            Dok<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">Guru</span>
                        </span>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-3 md:gap-8 items-center"
                    >
                        <a href="#features" className="text-gray-300 hover:text-cyan-400 transition-colors hidden md:block">Features</a>
                        <a href="#pricing" className="text-gray-300 hover:text-cyan-400 transition-colors hidden md:block">Pricing</a>
                        <Link
                            to="/login"
                            className="text-gray-300 hover:text-white transition-colors text-sm md:text-base"
                        >
                            Login
                        </Link>
                        <Link
                            to="/signup"
                            className="px-3 py-1.5 md:px-6 md:py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm md:text-base rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-purple-500/50"
                        >
                            <span className="hidden sm:inline">Try Free Now</span>
                            <span className="sm:hidden">Sign Up</span>
                        </Link>
                    </motion.div>
                </nav>

                {/* Hero Section with Wave Background */}
                <section ref={heroRef} className="min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 md:py-20 relative">
                    {/* Wave Background */}
                    <WaveBackground />

                    <div className="max-w-7xl w-full relative z-10">
                        <div className="grid lg:grid-cols-2 gap-6 md:gap-12 items-center">
                            {/* Left: Text Content */}
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={staggerContainer}
                                className="space-y-8"
                            >
                                <motion.h1
                                    variants={fadeInUp}
                                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight"
                                >
                                    Talk to your documents.{' '}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
                                        Learn smarter
                                    </span>{' '}
                                    with DokGuru.
                                </motion.h1>

                                <motion.p
                                    variants={fadeInUp}
                                    className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed"
                                >
                                    Upload PDFs, ask questions, and get AI-powered voice answers — in English, Hindi, or Kannada.
                                </motion.p>

                                {/* Tagline */}
                                <motion.p
                                    variants={fadeInUp}
                                    className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                                    style={{
                                        textShadow: '0 0 30px rgba(6,182,212,0.8), 0 0 60px rgba(139,92,246,0.6)'
                                    }}
                                >
                                    Your AI Document Teacher
                                </motion.p>

                                <motion.div
                                    variants={fadeInUp}
                                    className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                                >
                                    <Link
                                        to="/signup"
                                        className="group px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 flex items-center justify-center gap-2"
                                    >
                                        Try for Free
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Link>
                                    <button className="px-6 py-3 sm:px-8 sm:py-4 bg-cyan-500/20 backdrop-blur-sm hover:bg-cyan-500/30 border-2 border-cyan-500/50 text-white text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                        Watch Demo
                                    </button>
                                </motion.div>
                            </motion.div>

                            {/* Right: Desktop Monitor - Now visible on all screens with responsive sizing */}
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="relative mt-6 lg:mt-0"
                            >
                                {/* Desktop Monitor */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.8, delay: 0.4 }}
                                    className="relative"
                                >
                                    {/* Monitor Screen */}
                                    <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-3 shadow-2xl">
                                        {/* Screen Bezel */}
                                        <div className="bg-black rounded-2xl p-3 relative overflow-hidden shadow-inner">
                                            {/* Webcam */}
                                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rounded-full border border-gray-600 z-10"></div>

                                            {/* Screen Content - DokGuru Chat Interface */}
                                            <div className="bg-[#0a0f1e] rounded-xl overflow-hidden aspect-video relative shadow-2xl">
                                                {/* Chat Header - Responsive */}
                                                <div className="bg-[#1e293b] border-b border-gray-800 px-2 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-2.5 flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                                                        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-md sm:rounded-lg flex items-center justify-center shadow-lg">
                                                            <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.48.41-2.86 1.12-4.06l10.94 10.94C14.86 19.59 13.48 20 12 20zm6.88-3.94L8.94 6.12C10.14 5.41 11.52 5 13 5c4.41 0 8 3.59 8 8 0 1.48-.41 2.86-1.12 4.06z" />
                                                            </svg>
                                                        </div>
                                                        <span className="text-white text-xs sm:text-sm md:text-base font-semibold">DokGuru</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 sm:gap-2">
                                                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                        <span className="text-green-400 text-[8px] sm:text-[10px] md:text-xs font-medium">Online</span>
                                                    </div>
                                                </div>

                                                {/* Animated Chat Messages */}
                                                <AnimatedChat resetTrigger={resetTrigger} />

                                                {/* Chat Input - Responsive */}
                                                <div className="absolute bottom-0 left-0 right-0 bg-[#1e293b] border-t border-gray-800 px-2 py-1 sm:px-4 sm:py-1.5 md:px-6 md:py-2">
                                                    <div className="flex items-center gap-1.5 sm:gap-2 bg-[#0f172a] rounded-md sm:rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 md:py-2 border border-gray-700">
                                                        <input
                                                            type="text"
                                                            placeholder="Ask anything..."
                                                            className="flex-1 bg-transparent text-gray-400 text-[10px] sm:text-xs outline-none"
                                                            disabled
                                                        />
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-md sm:rounded-lg flex items-center justify-center shadow-lg flex-shrink-0"
                                                        >
                                                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                                            </svg>
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Monitor Stand - Responsive sizes */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-10 sm:w-20 sm:h-12 md:w-24 md:h-16 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-lg"></div>
                                        <div className="w-20 h-2 sm:w-24 sm:h-2.5 md:w-32 md:h-3 bg-gradient-to-b from-gray-800 to-gray-900 rounded-full"></div>
                                    </div>

                                    {/* Shadow under monitor */}
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[80%] h-8 bg-cyan-500/20 blur-2xl rounded-full"></div>
                                </motion.div>

                                {/* Glow Effects */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-cyan-500/10 to-purple-500/10 blur-3xl -z-10 scale-150"></div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-10 sm:py-12 md:py-20 px-4 sm:px-6 bg-black/30 backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="text-center mb-16"
                        >
                            <motion.h2
                                variants={fadeInUp}
                                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
                            >
                                Why Choose DokGuru?
                            </motion.h2>
                            <motion.p
                                variants={fadeInUp}
                                className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto px-4"
                            >
                                Powerful features designed to make learning from documents effortless
                            </motion.p>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8"
                        >
                            {[
                                {
                                    icon: '🧠',
                                    title: 'Smart Document Understanding',
                                    description: 'AI that comprehends context, extracts meaning, and answers with precision'
                                },
                                {
                                    icon: '🎙️',
                                    title: 'Voice & Multilingual Output',
                                    description: 'Ask in English, get natural voice responses in English, Hindi, and Kannada'
                                },
                                {
                                    icon: '⚡',
                                    title: 'Instant Answers from PDFs',
                                    description: 'Lightning-fast semantic search across all your documents'
                                },
                                {
                                    icon: '🎓',
                                    title: 'Affordable Pricing',
                                    description: 'Quality education shouldn\'t break the bank. Free during beta, affordable after'
                                }
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    variants={fadeInUp}
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    className="group p-5 sm:p-6 md:p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl sm:rounded-3xl hover:bg-gradient-to-br hover:from-cyan-500/10 hover:to-purple-500/10 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer"
                                >
                                    <div className="text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4">{feature.icon}</div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">{feature.title}</h3>
                                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{feature.description}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* How It Works */}
                <section id="how-it-works" className="py-10 sm:py-12 md:py-20 px-4 sm:px-6">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="text-center mb-16"
                        >
                            <motion.h2
                                variants={fadeInUp}
                                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 px-4"
                            >
                                Learn Smarter in 3 Simple Steps
                            </motion.h2>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
                        >
                            {/* Step 1: Upload PDF */}
                            <motion.div
                                variants={fadeInUp}
                                className="relative"
                            >
                                <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white/5 absolute -top-4 sm:-top-6 md:-top-8 left-2 sm:left-4">01</div>
                                <div className="relative z-10 p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl hover:border-cyan-500/30 transition-all group">
                                    {/* Upload Animation */}
                                    <div className="h-48 flex items-center justify-center mb-6 relative">
                                        {/* Dashed Upload Box */}
                                        <motion.div
                                            className="w-40 h-40 border-3 border-dashed border-cyan-500/50 rounded-2xl flex items-center justify-center relative"
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            {/* Floating Document */}
                                            <motion.div
                                                animate={{
                                                    y: [0, -15, 0],
                                                }}
                                                transition={{
                                                    duration: 2.5,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                                className="absolute"
                                            >
                                                <svg className="w-16 h-16 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                                                    <path d="M14 2v6h6" />
                                                    <path d="M9 13h6M9 17h6" />
                                                </svg>
                                            </motion.div>

                                            {/* Upload Arrow */}
                                            <motion.div
                                                animate={{
                                                    y: [40, 0],
                                                    opacity: [0, 1, 0]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeOut"
                                                }}
                                                className="absolute bottom-4"
                                            >
                                                <svg className="w-8 h-8 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                </svg>
                                            </motion.div>

                                            {/* Progress Circle */}
                                            <motion.div
                                                className="absolute bottom-2 right-2"
                                                animate={{
                                                    rotate: 360
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "linear"
                                                }}
                                            >
                                                <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                            </motion.div>
                                        </motion.div>
                                    </div>
                                    <h3 className="text-2xl font-semibold text-white mb-3">Upload your PDF</h3>
                                    <p className="text-gray-400 leading-relaxed">Drag and drop any document. We handle the rest automatically.</p>
                                </div>
                                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-transparent z-20" />
                            </motion.div>

                            {/* Step 2: Ask Question */}
                            <motion.div
                                variants={fadeInUp}
                                className="relative"
                            >
                                <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white/5 absolute -top-4 sm:-top-6 md:-top-8 left-2 sm:left-4">02</div>
                                <div className="relative z-10 p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl hover:border-purple-500/30 transition-all">
                                    {/* Question Animation */}
                                    <div className="h-48 flex items-center justify-center mb-6 relative">
                                        <div className="relative w-full max-w-[200px]">
                                            {/* Chat Bubble */}
                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                whileInView={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                                className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl rounded-br-sm p-4 mb-3 relative"
                                            >
                                                <p className="text-white text-sm font-medium">Explain quantum computing in simple terms</p>
                                                {/* Typing Dots */}
                                                <div className="flex gap-1 mt-2">
                                                    {[0, 1, 2].map((i) => (
                                                        <motion.div
                                                            key={i}
                                                            className="w-2 h-2 bg-white/60 rounded-full"
                                                            animate={{
                                                                scale: [1, 1.3, 1],
                                                                opacity: [0.5, 1, 0.5]
                                                            }}
                                                            transition={{
                                                                duration: 1.2,
                                                                repeat: Infinity,
                                                                delay: i * 0.2
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </motion.div>

                                            {/* Voice Waveform */}
                                            <div className="flex items-center gap-1 justify-center">
                                                {[0, 1, 2, 3, 4].map((i) => (
                                                    <motion.div
                                                        key={i}
                                                        className="w-1 bg-purple-500 rounded-full"
                                                        animate={{
                                                            height: [12, 24, 12]
                                                        }}
                                                        transition={{
                                                            duration: 0.8,
                                                            repeat: Infinity,
                                                            delay: i * 0.1
                                                        }}
                                                    />
                                                ))}
                                                <motion.span
                                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                    className="text-purple-400 text-xs ml-2 font-medium"
                                                >
                                                    Listening...
                                                </motion.span>
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-semibold text-white mb-3">Ask your question</h3>
                                    <p className="text-gray-400 leading-relaxed">Type or speak naturally. Ask anything about your document.</p>
                                </div>
                                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-transparent z-20" />
                            </motion.div>

                            {/* Step 3: Get Answers */}
                            <motion.div
                                variants={fadeInUp}
                                className="relative"
                            >
                                <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white/5 absolute -top-4 sm:-top-6 md:-top-8 left-2 sm:left-4">03</div>
                                <div className="relative z-10 p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl hover:border-pink-500/30 transition-all">
                                    {/* Response Animation */}
                                    <div className="h-48 flex items-center justify-center mb-6 relative">
                                        <div className="relative w-full max-w-[200px]">
                                            {/* AI Response Bubble - English */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="bg-gray-800/80 backdrop-blur-sm border border-pink-500/30 rounded-xl rounded-tl-sm p-3 mb-2 relative"
                                            >
                                                {/* AI Badge */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-5 h-5 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-[10px] font-bold">AI</span>
                                                    </div>
                                                    <span className="text-pink-400 text-[10px] font-medium">English</span>
                                                </div>

                                                {/* Streaming Text Effect - English */}
                                                <div className="space-y-1">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: "100%" }}
                                                        transition={{ duration: 1.2, delay: 0.4 }}
                                                        className="h-1.5 bg-gradient-to-r from-pink-500/70 to-transparent rounded"
                                                    />
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: "90%" }}
                                                        transition={{ duration: 1.2, delay: 0.6 }}
                                                        className="h-1.5 bg-gradient-to-r from-pink-500/70 to-transparent rounded"
                                                    />
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: "70%" }}
                                                        transition={{ duration: 1.2, delay: 0.8 }}
                                                        className="h-1.5 bg-gradient-to-r from-pink-500/70 to-transparent rounded"
                                                    />
                                                </div>
                                            </motion.div>

                                            {/* AI Response Bubble - Kannada */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 1.2 }}
                                                className="bg-gray-800/80 backdrop-blur-sm border border-purple-500/30 rounded-xl rounded-tl-sm p-3 relative"
                                            >
                                                {/* AI Badge */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-[10px] font-bold">AI</span>
                                                    </div>
                                                    <span className="text-purple-400 text-[10px] font-medium">ಕನ್ನಡ</span>
                                                </div>

                                                {/* Streaming Text Effect - Kannada */}
                                                <div className="space-y-1">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: "95%" }}
                                                        transition={{ duration: 1.2, delay: 1.4 }}
                                                        className="h-1.5 bg-gradient-to-r from-purple-500/70 to-transparent rounded"
                                                    />
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: "85%" }}
                                                        transition={{ duration: 1.2, delay: 1.6 }}
                                                        className="h-1.5 bg-gradient-to-r from-purple-500/70 to-transparent rounded"
                                                    />
                                                </div>

                                                {/* Voice Output Indicator */}
                                                <div className="flex items-center gap-1 mt-2">
                                                    {[0, 1, 2].map((i) => (
                                                        <motion.div
                                                            key={i}
                                                            className="w-0.5 bg-purple-400 rounded-full"
                                                            animate={{
                                                                height: [8, 16, 8]
                                                            }}
                                                            transition={{
                                                                duration: 0.8,
                                                                repeat: Infinity,
                                                                delay: i * 0.15
                                                            }}
                                                        />
                                                    ))}
                                                    <motion.span
                                                        animate={{ opacity: [0.6, 1, 0.6] }}
                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                        className="text-purple-400 text-[10px] font-medium ml-1"
                                                    >
                                                        🔊 Playing...
                                                    </motion.span>
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-semibold text-white mb-3">Get instant answers in your language</h3>
                                    <p className="text-gray-400 leading-relaxed">Receive accurate AI answers with voice output in English, Hindi, or Kannada.</p>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* Testimonials - Commented out until we collect real feedback */}
                {/* <section className="py-20 px-6 bg-black/30 backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="text-center mb-16"
                        >
                            <motion.h2
                                variants={fadeInUp}
                                className="text-4xl md:text-5xl font-bold text-white mb-4"
                            >
                                Trusted by Students Across Karnataka
                            </motion.h2>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="grid md:grid-cols-3 gap-8"
                        >
                            {[
                                {
                                    name: 'Priya Sharma',
                                    role: 'Engineering Student, Bangalore',
                                    avatar: '👩‍🎓',
                                    text: 'DokGuru makes English PDFs simple to understand. It feels like an AI teacher guiding me through every concept!'
                                },
                                {
                                    name: 'Rakesh Kumar',
                                    role: 'Medical Student, Mysore',
                                    avatar: '👨‍⚕️',
                                    text: 'The bilingual feature is a game-changer. I can learn complex medical terms in both English and Kannada.'
                                },
                                {
                                    name: 'Anjali Rao',
                                    role: 'CA Student, Hubli',
                                    avatar: '👩‍💼',
                                    text: 'Saved me countless hours during exam prep. DokGuru explains financial concepts in simple language instantly.'
                                }
                            ].map((testimonial, i) => (
                                <motion.div
                                    key={i}
                                    variants={fadeInUp}
                                    whileHover={{ scale: 1.05 }}
                                    className="p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl hover:border-purple-500/30 transition-all"
                                >
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(5)].map((_, j) => (
                                            <svg key={j} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <p className="text-gray-300 italic mb-4">"{testimonial.text}"</p>
                                    <div className="flex items-center gap-4">
                                        <div className="text-4xl">{testimonial.avatar}</div>
                                        <div>
                                            <div className="font-semibold text-white">{testimonial.name}</div>
                                            <div className="text-sm text-gray-400">{testimonial.role}</div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section> */}

                {/* Pricing Section */}
                <section id="pricing" className="py-10 sm:py-12 md:py-20 px-4 sm:px-6">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="text-center mb-16"
                        >
                            <motion.h2
                                variants={fadeInUp}
                                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
                            >
                                Simple, Transparent Pricing
                            </motion.h2>
                            <motion.p
                                variants={fadeInUp}
                                className="text-base sm:text-lg md:text-xl text-gray-400"
                            >
                                Free during beta • Affordable plans for everyone
                            </motion.p>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto"
                        >
                            {[
                                {
                                    name: 'Beta',
                                    price: '₹0',
                                    period: 'during beta',
                                    features: [
                                        '5 documents',
                                        '50 queries/day',
                                        '10MB file size',
                                        'Voice input & output',
                                        'Bilingual support',
                                        'Community support'
                                    ],
                                    cta: 'Start Beta Now',
                                    popular: false,
                                    badge: 'Limited Time',
                                    link: '/signup'
                                },
                                {
                                    name: 'Pro',
                                    price: '₹1**',
                                    period: '/month',
                                    features: [
                                        '50 documents',
                                        '500 queries/day',
                                        '50MB file size',
                                        'Priority processing',
                                        'Advanced AI models',
                                        'Email support',
                                        'Export conversations'
                                    ],
                                    cta: 'Coming Soon',
                                    popular: true,
                                    badge: 'Most Popular',
                                    link: '#'
                                },
                                {
                                    name: 'Enterprise',
                                    price: '₹***',
                                    period: '/month',
                                    features: [
                                        'Unlimited documents',
                                        'Unlimited queries',
                                        '200MB file size',
                                        'Team collaboration (5 users)',
                                        'API access',
                                        'Custom AI training',
                                        'Dedicated support',
                                        'Analytics dashboard'
                                    ],
                                    cta: 'Coming Soon',
                                    popular: false,
                                    badge: 'For Teams',
                                    link: '#'
                                }
                            ].map((plan, i) => (
                                <motion.div
                                    key={i}
                                    variants={fadeInUp}
                                    whileHover={{ scale: 1.05, y: -10 }}
                                    className={`relative p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border transition-all duration-300 ${plan.popular
                                        ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/50 shadow-2xl shadow-purple-500/20'
                                        : 'bg-white/5 backdrop-blur-sm border-white/10 hover:border-cyan-500/30'
                                        }`}
                                >
                                    {plan.badge && (
                                        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 text-white text-sm font-semibold rounded-full ${plan.popular
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                                            : i === 0
                                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600'
                                                : 'bg-gradient-to-r from-orange-600 to-red-600'
                                            }`}>
                                            {plan.badge}
                                        </div>
                                    )}
                                    <div className="text-center mb-6 sm:mb-8">
                                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                        <div className="flex items-end justify-center gap-1">
                                            <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">{plan.price}</span>
                                            <span className="text-sm sm:text-base text-gray-400 mb-2">{plan.period}</span>
                                        </div>
                                    </div>
                                    <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                                        {plan.features.map((feature, j) => (
                                            <li key={j} className="flex items-center gap-3 text-gray-300">
                                                <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        to={plan.link}
                                        className={`block text-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${plan.popular
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/50'
                                            : i === 0
                                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-lg shadow-cyan-500/50'
                                                : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/50'
                                            }`}
                                    >
                                        {plan.cta}
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-10 sm:py-12 md:py-20 px-4 sm:px-6 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 backdrop-blur-sm">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8"
                    >
                        <motion.h2
                            variants={fadeInUp}
                            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white"
                        >
                            From Reading to Understanding.
                        </motion.h2>
                        <motion.p
                            variants={fadeInUp}
                            className="text-base sm:text-lg md:text-xl text-gray-300"
                        >
                            Start your AI learning journey today.
                        </motion.p>
                        <motion.div
                            variants={fadeInUp}
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <Link
                                to="/signup"
                                className="px-6 sm:px-10 py-3 sm:py-4 bg-white text-purple-600 hover:bg-gray-100 text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl transition-all duration-200 hover:scale-105 shadow-lg"
                            >
                                Start Free Today
                            </Link>
                        </motion.div>
                    </motion.div>
                </section>

                {/* Footer */}
                <footer className="bg-black/60 backdrop-blur-xl border-t border-white/10 py-10 sm:py-12 md:py-16 px-4 sm:px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 md:gap-12 mb-10 sm:mb-12">
                            {/* Brand Section */}
                            <div className="col-span-2 md:col-span-2 space-y-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                                            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.48.41-2.86 1.12-4.06l10.94 10.94C14.86 19.59 13.48 20 12 20zm6.88-3.94L8.94 6.12C10.14 5.41 11.52 5 13 5c4.41 0 8 3.59 8 8 0 1.48-.41 2.86-1.12 4.06z" />
                                            </svg>
                                        </div>
                                        <span className="text-2xl font-bold text-white">
                                            Dok<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">Guru</span>
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                        Transform how you interact with documents using AI-powered voice technology.
                                        Study smarter, work faster, learn better.
                                    </p>

                                    {/* Trust Badges */}
                                    <div className="flex flex-wrap gap-3 mb-6">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            <span className="text-green-400 text-xs font-medium">System Online</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                            <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-blue-400 text-xs font-medium">Secure & Private</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                            <span className="text-purple-400 text-xs font-medium">🎉 Free Beta</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Social Links */}
                                {/* <div>
                                    <h4 className="text-white text-sm font-semibold mb-3">Connect With Us</h4>
                                    <div className="flex gap-3">
                                        <a
                                            href="https://github.com/choudharikiranv15/DocuMind-Voice-QA-System"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/20"
                                            aria-label="GitHub"
                                        >
                                            <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                            </svg>
                                        </a>
                                        <a
                                            href="https://www.linkedin.com/in/kiranchoudhari-1510m"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20"
                                            aria-label="LinkedIn"
                                        >
                                            <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                            </svg>
                                        </a>
                                        <a
                                            href="mailto:contact@dokguru.com"
                                            className="group w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/20"
                                            aria-label="Email"
                                        >
                                            <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </a>
                                    </div>
                                </div> */}
                            </div>

                            {/* Product */}
                            <div>
                                <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
                                <ul className="space-y-3">
                                    <li>
                                        <a href="#features" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group">
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                            <span>Features</span>
                                        </a>
                                    </li>
                                    <li>
                                        <Link to="/signup" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group">
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                            <span>Get Started</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <a href="#testimonials" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group">
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                            <span>Testimonials</span>
                                        </a>
                                    </li>
                                    <li>
                                        <Link to="/about#use-cases" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group">
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                            <span>Use Cases</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/about#roadmap" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group">
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                            <span>Roadmap</span>
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            {/* Resources */}
                            <div>
                                <h4 className="text-white font-semibold mb-4 text-sm">Resources</h4>
                                <ul className="space-y-3">
                                    <li>
                                        <a href="https://github.com/choudharikiranv15/DocuMind-Voice-QA-System#readme" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group">
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                            <span>Documentation</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="https://dokguru-backend-739437500880.asia-south1.run.app/health" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group">
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                            <span>API Status</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="https://github.com/choudharikiranv15/DocuMind-Voice-QA-System/issues" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group">
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                            <span>Support</span>
                                        </a>
                                    </li>
                                    <li>
                                        <Link to="/contact#faq" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group">
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                            <span>FAQs</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/contact" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group">
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                            <span>Community</span>
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            {/* Legal */}
                            <div>
                                <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
                                <ul className="space-y-3">
                                    <li>
                                        <Link to="/privacy-policy" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group">
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                            <span>Privacy Policy</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/terms-of-service" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group">
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                            <span>Terms of Service</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/privacy-policy#security" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group">
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                            <span>Security</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/privacy-policy#gdpr" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group">
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                            <span>GDPR</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <a href="https://github.com/choudharikiranv15/DocuMind-Voice-QA-System/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group">
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                            <span>License</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Bottom Bar */}
                        <div className="pt-8 border-t border-white/10">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-6 text-sm text-gray-400">
                                    <p>© 2025 DokGuru. All rights reserved.</p>
                                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg">
                                        <span className="text-xs">v1.0.0-beta</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400">
                                    Crafted with{' '}
                                    <span className="text-red-500 animate-pulse">❤️</span>
                                    {/* {' '}by{' '} */}
                                    <a
                                        href=""
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 hover:from-cyan-300 hover:to-purple-500 font-semibold transition-all"
                                    >
                                        {/* Kiran Choudhari */}
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
}
