import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Contact() {
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
            <div className="max-w-4xl mx-auto px-4 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Title */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            Get In{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
                                Touch
                            </span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Have questions, feedback, or need help? We're here for you!
                        </p>
                    </div>

                    {/* Contact Methods */}
                    <div className="grid md:grid-cols-2 gap-6 mb-12">
                        {/* Email */}
                        <motion.a
                            href="mailto:contact@dokguru.com"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="group p-8 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 hover:border-cyan-500/40 rounded-2xl transition-all hover:scale-105"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-cyan-500/20 rounded-xl group-hover:bg-cyan-500/30 transition-colors">
                                    <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Email Us</h3>
                                    <p className="text-gray-400 text-sm mb-3">
                                        General inquiries, support, or feedback
                                    </p>
                                    <p className="text-cyan-400 group-hover:text-cyan-300 font-medium">
                                        contact@dokguru.com
                                    </p>
                                </div>
                            </div>
                        </motion.a>

                        {/* GitHub Issues */}
                        <motion.a
                            href="https://github.com/choudharikiranv15/DocuMind-Voice-QA-System/issues"
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="group p-8 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 rounded-2xl transition-all hover:scale-105"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                                    <svg className="w-7 h-7 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Report a Bug</h3>
                                    <p className="text-gray-400 text-sm mb-3">
                                        Found a bug or have a feature request?
                                    </p>
                                    <p className="text-purple-400 group-hover:text-purple-300 font-medium">
                                        Open GitHub Issue →
                                    </p>
                                </div>
                            </div>
                        </motion.a>
                    </div>

                    {/* Social Links */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold mb-6 text-center">Connect With Us</h2>
                        <div className="flex justify-center gap-4">
                            <a
                                href="https://github.com/choudharikiranv15/DocuMind-Voice-QA-System"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all"
                                aria-label="GitHub"
                            >
                                <svg className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                            </a>
                            <a
                                href="https://www.linkedin.com/in/kiranchoudhari-1510m"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all"
                                aria-label="LinkedIn"
                            >
                                <svg className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold mb-6">Quick Questions?</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-lg">
                                <h3 className="font-semibold text-white mb-2">How long does it take to get a response?</h3>
                                <p className="text-gray-400 text-sm">
                                    We typically respond to emails within 24-48 hours. For urgent bugs, please use GitHub Issues for faster response.
                                </p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-lg">
                                <h3 className="font-semibold text-white mb-2">Can I contribute to DokGuru?</h3>
                                <p className="text-gray-400 text-sm">
                                    Yes! DokGuru is open source. Check out our{' '}
                                    <a href="https://github.com/choudharikiranv15/DocuMind-Voice-QA-System" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">
                                        GitHub repository
                                    </a>
                                    {' '}to get started.
                                </p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-lg">
                                <h3 className="font-semibold text-white mb-2">Need technical support?</h3>
                                <p className="text-gray-400 text-sm">
                                    For technical issues, please create a detailed{' '}
                                    <a href="https://github.com/choudharikiranv15/DocuMind-Voice-QA-System/issues" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">
                                        GitHub Issue
                                    </a>
                                    {' '}with steps to reproduce the problem.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="mt-12 text-center">
                        <a
                            href="https://dokguru-backend-739437500880.asia-south1.run.app/health"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/20 hover:border-green-500/40 rounded-lg transition-all"
                        >
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-400 font-medium">Check System Status</span>
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
