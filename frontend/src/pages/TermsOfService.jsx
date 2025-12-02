import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
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
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                            Terms of Service
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Last updated: November 21, 2025
                        </p>
                        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-yellow-300 text-sm">
                                <strong>Beta Status:</strong> DokGuru is currently in beta. The service is provided "as-is" while we continue to improve and add features.
                            </p>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-8 text-gray-300">
                        {/* Acceptance */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                            <p className="leading-relaxed">
                                By accessing and using DokGuru ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.
                            </p>
                            <p className="leading-relaxed mt-3">
                                These Terms apply to all users of the Service, including visitors, registered users, and any other users.
                            </p>
                        </section>

                        {/* Service Description */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">2. Service Description</h2>
                            <p className="mb-4">DokGuru provides:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>AI-powered document intelligence and question-answering</li>
                                <li>Voice-based interaction with your documents</li>
                                <li>Document upload, management, and organization</li>
                                <li>Multilingual text-to-speech and speech-to-text capabilities</li>
                            </ul>
                            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-blue-300 text-sm">
                                    <strong>Beta Limitations:</strong> As a beta service, features may change, and occasional downtime may occur. We're working hard to make DokGuru stable and reliable.
                                </p>
                            </div>
                        </section>

                        {/* Account Registration */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">3. Account Registration</h2>
                            <p className="mb-4">To use DokGuru, you must:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Provide a valid email address</li>
                                <li>Create a secure password</li>
                                <li>Be at least 13 years of age</li>
                                <li>Provide accurate information</li>
                            </ul>
                            <p className="mt-4">
                                <strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
                            </p>
                        </section>

                        {/* Acceptable Use */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">4. Acceptable Use Policy</h2>
                            <p className="mb-4">When using DokGuru, you agree NOT to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Upload illegal, harmful, or copyrighted content you don't have rights to</li>
                                <li>Use the service to harass, abuse, or harm others</li>
                                <li>Attempt to gain unauthorized access to the service or other user accounts</li>
                                <li>Use automated tools to scrape or abuse the service</li>
                                <li>Upload malicious files (malware, viruses, etc.)</li>
                                <li>Impersonate others or provide false information</li>
                                <li>Violate any applicable laws or regulations</li>
                                <li>Share your account with others</li>
                            </ul>
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-300 text-sm">
                                    <strong>Consequence:</strong> Violation of these terms may result in immediate account suspension or termination without refund.
                                </p>
                            </div>
                        </section>

                        {/* Usage Limits */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">5. Usage Limits (Beta)</h2>
                            <p className="mb-4">During beta, the following limits apply to free accounts:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Maximum 5 documents per user</li>
                                <li>Maximum 50 queries per day</li>
                                <li>Maximum 10MB per PDF file</li>
                                <li>24-hour retention for audio files and conversation cache</li>
                            </ul>
                            <p className="mt-4 text-sm text-gray-400">
                                These limits help us manage resources during beta. They may change as we scale the service.
                            </p>
                        </section>

                        {/* Intellectual Property */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property</h2>

                            <h3 className="text-xl font-semibold text-cyan-400 mb-3 mt-6">6.1 Your Content</h3>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>You retain all rights to documents and content you upload</li>
                                <li>You grant us a limited license to process your content to provide the service</li>
                                <li>We will never sell or share your content with third parties for marketing</li>
                                <li>You are responsible for ensuring you have rights to upload content</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-cyan-400 mb-3 mt-6">6.2 Our Platform</h3>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>DokGuru's code, design, and features are protected by intellectual property laws</li>
                                <li>You may not copy, modify, or redistribute our platform</li>
                                <li>The DokGuru name and logo are our trademarks</li>
                            </ul>
                        </section>

                        {/* AI-Generated Content */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">7. AI-Generated Responses</h2>
                            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                <p className="mb-3">
                                    <strong>Important:</strong> AI responses are generated automatically and may not always be accurate.
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                                    <li>Verify important information from original sources</li>
                                    <li>AI may occasionally generate incorrect or incomplete answers</li>
                                    <li>Do not rely solely on AI for critical decisions (medical, legal, financial)</li>
                                    <li>Use DokGuru as a study/research assistant, not a replacement for professional advice</li>
                                </ul>
                            </div>
                        </section>

                        {/* Disclaimer of Warranties */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">8. Disclaimer of Warranties</h2>
                            <p className="mb-4">
                                DokGuru is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied, including but not limited to:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Accuracy, reliability, or completeness of AI responses</li>
                                <li>Uninterrupted or error-free operation</li>
                                <li>Security of data transmission or storage</li>
                                <li>Fitness for a particular purpose</li>
                            </ul>
                            <p className="mt-4 text-sm text-gray-400">
                                We strive to provide a high-quality service but cannot guarantee perfection, especially during beta.
                            </p>
                        </section>

                        {/* Limitation of Liability */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
                            <p className="leading-relaxed">
                                To the maximum extent permitted by law, DokGuru and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                                <li>Your use or inability to use the service</li>
                                <li>Any unauthorized access to your data</li>
                                <li>Any errors or omissions in content or AI responses</li>
                                <li>Any interruption or cessation of service</li>
                            </ul>
                        </section>

                        {/* Data and Privacy */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">10. Data and Privacy</h2>
                            <p className="mb-3">
                                Your privacy is important to us. Please review our{' '}
                                <Link to="/privacy-policy" className="text-cyan-400 hover:text-cyan-300 underline">
                                    Privacy Policy
                                </Link>
                                {' '}to understand how we collect, use, and protect your data.
                            </p>
                            <p className="text-sm text-gray-400">
                                By using DokGuru, you consent to our data practices as described in the Privacy Policy.
                            </p>
                        </section>

                        {/* Account Termination */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">11. Account Termination</h2>

                            <h3 className="text-xl font-semibold text-cyan-400 mb-3 mt-6">11.1 By You</h3>
                            <p className="mb-3">
                                You may delete your account at any time through your profile settings. Upon deletion:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Your account data will be permanently deleted within 30 days</li>
                                <li>Uploaded documents will be removed from our systems</li>
                                <li>This action is irreversible</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-cyan-400 mb-3 mt-6">11.2 By Us</h3>
                            <p className="mb-3">
                                We reserve the right to suspend or terminate your account if:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>You violate these Terms of Service</li>
                                <li>You engage in fraudulent or illegal activity</li>
                                <li>Your account poses a security risk</li>
                                <li>We discontinue the service (with reasonable notice)</li>
                            </ul>
                        </section>

                        {/* Service Availability */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">12. Service Availability</h2>
                            <p className="mb-4">
                                <strong>Beta Service:</strong> As a beta product, DokGuru may experience:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Scheduled maintenance windows</li>
                                <li>Unexpected downtime or service interruptions</li>
                                <li>Feature changes or removal</li>
                                <li>Data migration or format changes</li>
                            </ul>
                            <p className="mt-4">
                                We will make reasonable efforts to notify users of significant changes or extended downtime.
                            </p>
                        </section>

                        {/* Changes to Terms */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to Terms</h2>
                            <p className="leading-relaxed">
                                We may update these Terms from time to time. When we make significant changes, we will notify you via email or a prominent notice on the platform. Continued use of DokGuru after changes constitutes acceptance of the new Terms.
                            </p>
                        </section>

                        {/* Governing Law */}
                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">14. Governing Law</h2>
                            <p className="leading-relaxed">
                                These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms or your use of DokGuru shall be resolved through good faith negotiation or, if necessary, through appropriate legal channels.
                            </p>
                        </section>

                        {/* Contact */}
                        <section className="p-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl">
                            <h2 className="text-2xl font-semibold text-white mb-4">15. Contact Information</h2>
                            <p className="mb-4">
                                Questions about these Terms? Contact us:
                            </p>
                            {/* <ul className="space-y-2">
                                <li>📧 Email: <a href="mailto:contact@dokguru.com" className="text-cyan-400 hover:text-cyan-300">contact@dokguru.com</a></li>
                                <li>🐛 GitHub: <a href="https://github.com/choudharikiranv15/DocuMind-Voice-QA-System/issues" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">Report Issues</a></li>
                                <li>👤 Developer: <a href="https://www.linkedin.com/in/kiranchoudhari-1510m" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">Kiran Choudhari</a></li>
                            </ul> */}
                        </section>

                        {/* Summary */}
                        <section className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
                            <h3 className="text-xl font-semibold text-green-400 mb-3">📝 In Simple Terms</h3>
                            <ul className="space-y-2 text-sm">
                                <li>✅ Use DokGuru responsibly and legally</li>
                                <li>✅ Don't upload content you don't have rights to</li>
                                <li>✅ AI responses may not always be perfect - verify important info</li>
                                <li>✅ We're in beta - expect occasional issues as we improve</li>
                                <li>✅ You can delete your account and data anytime</li>
                                <li>✅ We're here to help - contact us with questions</li>
                            </ul>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
