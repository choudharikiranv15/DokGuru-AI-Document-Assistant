import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
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
            <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 md:py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Title */}
                    <div className="mb-8 sm:mb-10 md:mb-12">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                            Privacy Policy
                        </h1>
                        <p className="text-gray-400 text-sm sm:text-base md:text-lg">
                            Last updated: November 21, 2025
                        </p>
                        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-blue-300 text-xs sm:text-sm">
                                <strong>Note:</strong> DokGuru is currently in beta. This privacy policy explains how we handle your data truthfully and transparently.
                            </p>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-6 sm:space-y-8 text-gray-300">
                        {/* Introduction */}
                        <section>
                            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3 sm:mb-4">Introduction</h2>
                            <p className="leading-relaxed text-sm sm:text-base">
                                DokGuru ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our AI-powered document intelligence platform with voice interaction.
                            </p>
                        </section>

                        {/* Information We Collect */}
                        <section>
                            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3 sm:mb-4">1. Information We Collect</h2>

                            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-cyan-400 mb-2 sm:mb-3 mt-4 sm:mt-6">1.1 Account Information</h3>
                            <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 ml-2 sm:ml-4 text-sm sm:text-base">
                                <li>Email address (required for authentication)</li>
                                <li>Password (hashed using bcrypt - we never store plain text passwords)</li>
                                <li>Role and institution (optional, provided during signup)</li>
                                <li>Account creation and last login timestamps</li>
                            </ul>

                            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-cyan-400 mb-2 sm:mb-3 mt-4 sm:mt-6">1.2 Document Data</h3>
                            <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 ml-2 sm:ml-4 text-sm sm:text-base">
                                <li>PDF documents you upload to the platform</li>
                                <li>Document metadata (filename, upload time, size)</li>
                                <li>Document categories and tags (if you add them)</li>
                                <li>Vector embeddings of your documents (for AI search)</li>
                            </ul>

                            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-cyan-400 mb-2 sm:mb-3 mt-4 sm:mt-6">1.3 Usage Data</h3>
                            <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 ml-2 sm:ml-4 text-sm sm:text-base">
                                <li>Questions you ask and AI responses generated</li>
                                <li>Voice recordings (temporarily, for transcription only - not stored permanently)</li>
                                <li>Conversation history (stored in Redis cache, auto-expires)</li>
                                <li>Feature usage patterns and analytics</li>
                                <li>Feedback and ratings you provide</li>
                            </ul>

                            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-cyan-400 mb-2 sm:mb-3 mt-4 sm:mt-6">1.4 Technical Data</h3>
                            <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 ml-2 sm:ml-4 text-sm sm:text-base">
                                <li>IP address and browser information</li>
                                <li>Device type and screen resolution</li>
                                <li>Error logs and performance data (via Sentry)</li>
                                <li>Page views and interaction events (via PostHog)</li>
                            </ul>
                        </section>

                        {/* How We Use Your Information */}
                        <section>
                            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3 sm:mb-4">2. How We Use Your Information</h2>
                            <p className="mb-3 sm:mb-4 text-sm sm:text-base">We use your data for the following purposes:</p>
                            <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 ml-2 sm:ml-4 text-sm sm:text-base">
                                <li><strong>Service Delivery:</strong> To provide AI-powered document Q&A and voice features</li>
                                <li><strong>Authentication:</strong> To manage your account and secure access</li>
                                <li><strong>Improvement:</strong> To analyze usage patterns and improve our service</li>
                                <li><strong>Support:</strong> To respond to your questions and troubleshoot issues</li>
                                <li><strong>Communication:</strong> To send service updates (we don't send marketing emails)</li>
                                <li><strong>Security:</strong> To detect and prevent fraud, abuse, and security issues</li>
                            </ul>
                        </section>

                        {/* Third-Party Services */}
                        <section>
                            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3 sm:mb-4">3. Third-Party Services We Use</h2>
                            <p className="mb-3 sm:mb-4 text-sm sm:text-base">We use the following trusted third-party services. Each has their own privacy policy:</p>

                            <div className="space-y-3 sm:space-y-4 ml-0 sm:ml-4">
                                <div className="p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10">
                                    <h4 className="font-semibold text-white text-sm sm:text-base mb-1 sm:mb-2">🗄️ Supabase (Database & Auth)</h4>
                                    <p className="text-xs sm:text-sm">Stores your account info, documents metadata, and usage data</p>
                                    <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-sm">View Privacy Policy →</a>
                                </div>

                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <h4 className="font-semibold text-white mb-2">🤖 Groq AI (LLM Processing)</h4>
                                    <p className="text-sm">Processes your questions to generate AI responses (does not store data)</p>
                                    <a href="https://groq.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-sm">View Privacy Policy →</a>
                                </div>

                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <h4 className="font-semibold text-white mb-2">🎙️ OpenAI Whisper (Voice Transcription)</h4>
                                    <p className="text-sm">Transcribes voice recordings to text (audio not permanently stored)</p>
                                    <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-sm">View Privacy Policy →</a>
                                </div>

                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <h4 className="font-semibold text-white mb-2">📊 PostHog (Analytics)</h4>
                                    <p className="text-sm">Anonymous usage analytics to improve the product</p>
                                    <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-sm">View Privacy Policy →</a>
                                </div>

                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <h4 className="font-semibold text-white mb-2">🐛 Sentry (Error Tracking)</h4>
                                    <p className="text-sm">Captures error logs to fix bugs and improve stability</p>
                                    <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-sm">View Privacy Policy →</a>
                                </div>

                                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <h4 className="font-semibold text-white mb-2">⚡ Redis Cloud (Caching)</h4>
                                    <p className="text-sm">Temporarily caches conversations for better performance (auto-expires)</p>
                                    <a href="https://redis.io/legal/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-sm">View Privacy Policy →</a>
                                </div>
                            </div>
                        </section>

                        {/* Data Security */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">4. How We Protect Your Data</h2>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong>Encryption:</strong> All data transmitted over HTTPS/TLS encryption</li>
                                <li><strong>Password Security:</strong> Passwords hashed with bcrypt (never stored in plain text)</li>
                                <li><strong>Access Control:</strong> Multi-tenancy ensures you only see your own documents</li>
                                <li><strong>Rate Limiting:</strong> Protection against brute force and abuse</li>
                                <li><strong>Regular Security Updates:</strong> Dependencies and infrastructure kept up to date</li>
                            </ul>
                        </section>

                        {/* Your Rights (GDPR) */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">5. Your Rights (GDPR Compliance)</h2>
                            <p className="mb-4">You have the following rights regarding your personal data:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong>Right to Access:</strong> Request a copy of your data</li>
                                <li><strong>Right to Rectification:</strong> Correct inaccurate data</li>
                                <li><strong>Right to Erasure:</strong> Delete your account and all associated data</li>
                                <li><strong>Right to Data Portability:</strong> Export your data in a readable format</li>
                                <li><strong>Right to Object:</strong> Opt out of certain data processing</li>
                                <li><strong>Right to Withdraw Consent:</strong> Stop using the service at any time</li>
                            </ul>
                            <p className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-sm">
                                <strong>To exercise your rights:</strong> Use the "Delete Account" feature in your profile settings, or contact us at the email below.
                            </p>
                        </section>

                        {/* Data Retention */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">6. Data Retention</h2>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong>Account Data:</strong> Retained until you delete your account</li>
                                <li><strong>Documents:</strong> Stored until you delete them or your account</li>
                                <li><strong>Conversation Cache:</strong> Auto-expires after 24 hours (Redis TTL)</li>
                                <li><strong>Audio Files:</strong> Deleted after 24 hours automatically</li>
                                <li><strong>Analytics Data:</strong> Anonymized and retained for service improvement</li>
                                <li><strong>Deleted Data:</strong> Permanently removed within 30 days of deletion request</li>
                            </ul>
                        </section>

                        {/* Cookies */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">7. Cookies and Tracking</h2>
                            <p className="mb-4">We use minimal cookies for essential functionality:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong>Authentication Token:</strong> Keeps you logged in (stored in localStorage)</li>
                                <li><strong>Analytics Cookies:</strong> PostHog for anonymous usage tracking</li>
                            </ul>
                            <p className="mt-4 text-sm text-gray-400">
                                We do NOT use advertising or marketing cookies. You can clear cookies via your browser settings.
                            </p>
                        </section>

                        {/* Children's Privacy */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">8. Children's Privacy</h2>
                            <p>
                                DokGuru is not intended for children under 13. We do not knowingly collect data from children. If you believe a child has provided us with personal information, please contact us immediately.
                            </p>
                        </section>

                        {/* Changes to Policy */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to This Policy</h2>
                            <p>
                                We may update this Privacy Policy periodically. We will notify you of significant changes via email or a notice on the platform. Continued use of DokGuru after changes means you accept the updated policy.
                            </p>
                        </section>

                        {/* Contact */}
                        <section className="p-4 sm:p-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl">
                            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3 sm:mb-4">10. Contact Us</h2>
                            <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                                If you have questions about this Privacy Policy or want to exercise your rights, contact us:
                            </p>
                            {/* <ul className="space-y-1.5 sm:space-y-2 text-sm sm:text-base">
                                <li>📧 Email: <a href="mailto:contact@dokguru.com" className="text-cyan-400 hover:text-cyan-300">contact@dokguru.com</a></li>
                                <li>🐛 GitHub Issues: <a href="https://github.com/choudharikiranv15/DocuMind-Voice-QA-System/issues" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">Report on GitHub</a></li>
                                <li>👤 Developer: <a href="https://www.linkedin.com/in/kiranchoudhari-1510m" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">Kiran Choudhari on LinkedIn</a></li>
                            </ul> */}
                        </section>

                        {/* Summary */}
                        <section className="p-4 sm:p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
                            <h3 className="text-lg sm:text-xl font-semibold text-green-400 mb-2 sm:mb-3">🌟 Privacy Promise</h3>
                            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                <li>✅ We only collect data necessary to provide the service</li>
                                <li>✅ We never sell your data to third parties</li>
                                <li>✅ You can delete your account and data anytime</li>
                                <li>✅ We use industry-standard security practices</li>
                                <li>✅ We're transparent about how we use your data</li>
                            </ul>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
