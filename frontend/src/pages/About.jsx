import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function About() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#1a1f3a] to-[#0a0f1e] text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.48.41-2.86 1.12-4.06l10.94 10.94C14.86 19.59 13.48 20 12 20zm6.88-3.94L8.94 6.12C10.14 5.41 11.52 5 13 5c4.41 0 8 3.59 8 8 0 1.48-.41 2.86-1.12 4.06z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold">
                            Dok<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">Guru</span>
                        </span>
                    </Link>
                    <Link
                        to="/"
                        className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 md:py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Hero Section */}
                    <div className="text-center mb-10 sm:mb-12 md:mb-16">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-block mb-4 sm:mb-6"
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                                <svg className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.48.41-2.86 1.12-4.06l10.94 10.94C14.86 19.59 13.48 20 12 20zm6.88-3.94L8.94 6.12C10.14 5.41 11.52 5 13 5c4.41 0 8 3.59 8 8 0 1.48-.41 2.86-1.12 4.06z" />
                                </svg>
                            </div>
                        </motion.div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
                            About{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
                                DokGuru
                            </span>
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed px-2">
                            Transforming how students and professionals interact with documents through
                            AI-powered voice technology.
                        </p>
                    </div>

                    {/* Mission Section */}
                    <section className="mb-10 sm:mb-12 md:mb-16">
                        <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-12">
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-white">Our Mission</h2>
                            <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed mb-4">
                                DokGuru was created to solve a simple problem: understanding complex documents shouldn't
                                require hours of reading and re-reading. We believe that AI and voice technology can make
                                learning more accessible, efficient, and enjoyable.
                            </p>
                            <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed">
                                Our goal is to empower students, researchers, and professionals to learn faster and retain
                                more by having natural conversations with their documents.
                            </p>
                        </div>
                    </section>

                    {/* What We Do */}
                    <section className="mb-10 sm:mb-12 md:mb-16">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 text-center">What We Do</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded-xl hover:border-cyan-500/30 transition-all"
                            >
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-white">Document Intelligence</h3>
                                <p className="text-gray-400 text-xs sm:text-sm">
                                    Upload PDFs and instantly get AI-powered answers to your questions about the content.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/30 transition-all"
                            >
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-white">Voice Interaction</h3>
                                <p className="text-gray-400 text-xs sm:text-sm">
                                    Ask questions using your voice and get spoken responses - perfect for hands-free learning.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded-xl hover:border-pink-500/30 transition-all sm:col-span-2 md:col-span-1"
                            >
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                    </svg>
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-white">Multilingual Support</h3>
                                <p className="text-gray-400 text-xs sm:text-sm">
                                    Supports multiple languages for both speech and text, making learning accessible globally.
                                </p>
                            </motion.div>
                        </div>
                    </section>

                    {/* Technology Stack */}
                    <section className="mb-10 sm:mb-12 md:mb-16">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 text-center">Built With Modern Technology</h2>
                        <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                <div>
                                    <h3 className="text-xl font-semibold text-cyan-400 mb-4">AI & ML</h3>
                                    <ul className="space-y-2 text-gray-300">
                                        <li className="flex items-center gap-2">
                                            <span className="text-cyan-400">→</span>
                                            Groq LLM for fast AI responses
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-cyan-400">→</span>
                                            OpenAI Whisper for voice transcription
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-cyan-400">→</span>
                                            ChromaDB for vector search
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-cyan-400">→</span>
                                            Sentence Transformers for embeddings
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-purple-400 mb-4">Infrastructure</h3>
                                    <ul className="space-y-2 text-gray-300">
                                        <li className="flex items-center gap-2">
                                            <span className="text-purple-400">→</span>
                                            React + Vite for frontend
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-purple-400">→</span>
                                            Python Flask for backend API
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-purple-400">→</span>
                                            Supabase for database & auth
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-purple-400">→</span>
                                            Redis for caching & performance
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Creator Section */}
                    <section className="mb-10 sm:mb-12 md:mb-16">
                        <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-12">
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-center">Created By</h2>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 shadow-xl">

                                </div>
                                {/* <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Kiran Choudhari</h3>
                                <p className="text-cyan-400 text-sm sm:text-base mb-3 sm:mb-4">Full Stack Developer & AI Enthusiast</p>
                                <p className="text-gray-300 text-sm sm:text-base max-w-2xl mb-4 sm:mb-6 leading-relaxed">
                                    DokGuru is a passion project aimed at making education more accessible through technology.
                                    As a developer fascinated by AI and voice interfaces, I wanted to create something that
                                    could genuinely help students and professionals learn more effectively.
                                </p> */}
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                                    <a
                                        // href="https://github.com/choudharikiranv15"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 sm:px-6 py-2 sm:py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                        GitHub
                                    </a>
                                    <a
                                        // href="https://www.linkedin.com/in/kiranchoudhari-1510m"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                        </svg>
                                        LinkedIn
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Open Source */}
                    <section className="mb-10 sm:mb-12 md:mb-16">
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl sm:rounded-2xl p-5 sm:p-8 text-center">
                            <div className="inline-block p-2 sm:p-3 bg-green-500/20 rounded-full mb-3 sm:mb-4">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-white">Open Source & Transparent</h3>
                            <p className="text-gray-300 text-sm sm:text-base mb-4 sm:mb-6 max-w-2xl mx-auto">
                                DokGuru is open source! Check out the code, report issues, or contribute on GitHub.
                            </p>
                            <a
                                // href="https://github.com/choudharikiranv15/DocuMind-Voice-QA-System"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-all"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                View on GitHub
                            </a>
                        </div>
                    </section>

                    {/* CTA */}
                    <div className="text-center">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">Ready to Transform Your Learning?</h2>
                        <Link
                            to="/signup"
                            className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg transition-all hover:scale-105 shadow-xl shadow-cyan-500/30"
                        >
                            Get Started Free →
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
