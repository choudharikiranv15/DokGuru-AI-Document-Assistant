import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { motion } from 'framer-motion'
import Layout from './components/layout/Layout'
import ChatContainer from './components/chat/ChatContainer'
import Sidebar from './components/layout/Sidebar'
import BrowserWarning from './components/common/BrowserWarning'
import OnboardingTutorial from './components/common/OnboardingTutorial'
import FeedbackButton from './components/feedback/FeedbackButton'
import ErrorBoundary from './components/common/ErrorBoundary'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AdminDashboard from './pages/AdminDashboard'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import About from './pages/About'
import Contact from './pages/Contact'
import ProtectedRoute from './components/auth/ProtectedRoute'
import useAuthStore from './stores/authStore'

function MainApp() {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const navigate = useNavigate()

    return (
        <Layout>
            {/* Onboarding Tutorial - Shows on first visit */}
            <OnboardingTutorial />

            <div className="flex h-screen overflow-hidden bg-[#0f172a]">
                {/* Sidebar */}
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <header className="bg-[#1e293b] border-b border-white/10 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 text-gray-400 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.48.41-2.86 1.12-4.06l10.94 10.94C14.86 19.59 13.48 20 12 20zm6.88-3.94L8.94 6.12C10.14 5.41 11.52 5 13 5c4.41 0 8 3.59 8 8 0 1.48-.41 2.86-1.12 4.06z"/>
                                    </svg>
                                </div>
                                <h1 className="text-xl font-bold text-white">
                                    Dok<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">Guru</span>
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/profile')}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-gray-300 hover:text-white"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-sm">Profile</span>
                            </motion.button>
                        </div>
                    </header>

                    {/* Browser Compatibility Warning */}
                    <div className="px-6 pt-4">
                        <BrowserWarning />
                    </div>

                    {/* Chat Area */}
                    <ChatContainer />
                </div>
            </div>

            {/* Floating Feedback Button - Available everywhere in the app */}
            <FeedbackButton />
        </Layout>
    )
}

function App() {
    const initializeAuth = useAuthStore(state => state.initializeAuth)

    // Initialize auth on app load
    useEffect(() => {
        initializeAuth()
    }, [initializeAuth])

    return (
        <ErrorBoundary>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#1e293b',
                        color: '#fff',
                        borderRadius: '12px',
                    },
                    success: {
                        iconTheme: {
                            primary: '#6366f1',
                            secondary: '#fff',
                        },
                    },
                }}
            />
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Legal & Info Pages */}
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />

                <Route
                    path="/app"
                    element={
                        <ProtectedRoute>
                            <MainApp />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </ErrorBoundary>
    )
}

export default App

