import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import { useDocumentStore } from '../stores/documentStore'
import { useChatStore } from '../stores/chatStore'
import VoicePreferences from '../components/settings/VoicePreferences'
import AccountManagement from '../components/settings/AccountManagement'
import UsageDashboard from '../components/dashboard/UsageDashboard'
import DownloadHistory from '../components/chat/DownloadHistory'
import toast from 'react-hot-toast'

export default function Profile() {
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()
    const documents = useDocumentStore(state => state.documents)
    const messages = useChatStore(state => state.messages)

    const [userStats, setUserStats] = useState({
        documentsUploaded: 0,
        queriesAsked: 0,
        memberSince: null
    })

    const [studentInfo, setStudentInfo] = useState({
        isStudent: localStorage.getItem('is_student') === 'true',
        collegeName: localStorage.getItem('college_name') || '',
        className: localStorage.getItem('class_name') || ''
    })

    const [isEditingStudent, setIsEditingStudent] = useState(false)
    const [editStudentInfo, setEditStudentInfo] = useState({ ...studentInfo })

    useEffect(() => {
        // Calculate stats
        const queryCount = messages.filter(m => m.role === 'user').length
        const memberSince = localStorage.getItem('user_created_at') || new Date().toISOString()

        setUserStats({
            documentsUploaded: documents.length,
            queriesAsked: queryCount,
            memberSince: new Date(memberSince).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
            })
        })
    }, [documents, messages])

    const handleLogout = () => {
        logout()
        toast.success('Logged out successfully')
        navigate('/login')
    }

    const userName = user?.email?.split('@')[0] || 'User'
    const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1)

    const handleSaveStudentInfo = () => {
        localStorage.setItem('is_student', editStudentInfo.isStudent)
        localStorage.setItem('college_name', editStudentInfo.collegeName)
        localStorage.setItem('class_name', editStudentInfo.className)
        setStudentInfo(editStudentInfo)
        setIsEditingStudent(false)
        toast.success('Student information updated!')
    }

    const handleCancelEdit = () => {
        setEditStudentInfo({ ...studentInfo })
        setIsEditingStudent(false)
    }

    return (
        <div className="min-h-screen bg-[#0a0f1e] relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, -30, 0],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute top-1/3 right-1/4 w-[30rem] h-[30rem] bg-purple-600/20 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.3, 1],
                        x: [0, -40, 0],
                        y: [0, 40, 0],
                    }}
                    transition={{
                        duration: 18,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>

            {/* Header */}
            <div className="relative z-10 border-b border-white/10 bg-[#1e293b]/50 backdrop-blur-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/app')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Back to Chat</span>
                    </motion.button>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.48.41-2.86 1.12-4.06l10.94 10.94C14.86 19.59 13.48 20 12 20zm6.88-3.94L8.94 6.12C10.14 5.41 11.52 5 13 5c4.41 0 8 3.59 8 8 0 1.48-.41 2.86-1.12 4.06z"/>
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-white">
                            Dok<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">Guru</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Profile Header */}
                    <div className="mb-8">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left"
                        >
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-xl shadow-cyan-500/50">
                                {capitalizedName.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">{capitalizedName}</h1>
                                <p className="text-gray-400 text-sm sm:text-base md:text-lg break-all">{user?.email}</p>
                                <p className="text-gray-500 text-xs sm:text-sm mt-1">Member since {userStats.memberSince}</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"
                    >
                        {/* Documents */}
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-2xl sm:text-3xl font-bold text-white">{userStats.documentsUploaded}</p>
                                    <p className="text-gray-400 text-xs sm:text-sm">Documents</p>
                                </div>
                            </div>
                        </div>

                        {/* Queries */}
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-2xl sm:text-3xl font-bold text-white">{userStats.queriesAsked}</p>
                                    <p className="text-gray-400 text-xs sm:text-sm">Questions Asked</p>
                                </div>
                            </div>
                        </div>

                        {/* Plan */}
                        <div className="bg-gradient-to-br from-cyan-600/20 to-purple-600/20 backdrop-blur-sm border border-cyan-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 sm:col-span-2 md:col-span-1">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-white">Beta</p>
                                    <p className="text-cyan-300 text-xs sm:text-sm">Free Access</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Student Information */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-white">Student Information</h2>
                            {!isEditingStudent ? (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsEditingStudent(true)}
                                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white text-sm rounded-lg transition-all"
                                >
                                    Edit
                                </motion.button>
                            ) : (
                                <div className="flex gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSaveStudentInfo}
                                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm rounded-lg"
                                    >
                                        Save
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleCancelEdit}
                                        className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg"
                                    >
                                        Cancel
                                    </motion.button>
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            {/* Student Status Toggle */}
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">I am a Student</p>
                                        <p className="text-gray-400 text-sm">Get student benefits</p>
                                    </div>
                                </div>
                                {isEditingStudent ? (
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editStudentInfo.isStudent}
                                            onChange={(e) => setEditStudentInfo({...editStudentInfo, isStudent: e.target.checked})}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-purple-600"></div>
                                    </label>
                                ) : (
                                    <span className={`px-3 py-1 rounded-full text-sm ${studentInfo.isStudent ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-700 text-gray-400'}`}>
                                        {studentInfo.isStudent ? 'Yes' : 'No'}
                                    </span>
                                )}
                            </div>

                            {/* College Name */}
                            {(isEditingStudent ? editStudentInfo.isStudent : studentInfo.isStudent) && (
                                <>
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-medium mb-1">College/Institution</p>
                                                {isEditingStudent ? (
                                                    <input
                                                        type="text"
                                                        value={editStudentInfo.collegeName}
                                                        onChange={(e) => setEditStudentInfo({...editStudentInfo, collegeName: e.target.value})}
                                                        placeholder="Enter your college name"
                                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                                                    />
                                                ) : (
                                                    <p className="text-gray-400 text-sm">{studentInfo.collegeName || 'Not specified'}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Class/Year */}
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-medium mb-1">Class/Year</p>
                                                {isEditingStudent ? (
                                                    <input
                                                        type="text"
                                                        value={editStudentInfo.className}
                                                        onChange={(e) => setEditStudentInfo({...editStudentInfo, className: e.target.value})}
                                                        placeholder="e.g., 3rd Year, B.Tech CSE"
                                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                                                    />
                                                ) : (
                                                    <p className="text-gray-400 text-sm">{studentInfo.className || 'Not specified'}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>

                    {/* Account Settings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.6 }}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6"
                    >
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Account Settings</h2>
                        <div className="space-y-4">
                            {/* Email */}
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Email Address</p>
                                        <p className="text-gray-400 text-sm">{user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Language */}
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Language Support</p>
                                        <p className="text-gray-400 text-sm">English, Kannada & Hindi</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Usage Dashboard (Phase 2) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="mb-6"
                    >
                        <UsageDashboard />
                    </motion.div>

                    {/* Voice Preferences */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.6 }}
                        className="mb-6"
                    >
                        <VoicePreferences />
                    </motion.div>

                    {/* Download Chat History (Phase 2) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0, duration: 0.6 }}
                        className="mb-6"
                    >
                        <DownloadHistory />
                    </motion.div>

                    {/* Account Management (Phase 1) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1, duration: 0.6 }}
                        className="mb-6"
                    >
                        <AccountManagement />
                    </motion.div>

                    {/* Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0, duration: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/app')}
                            className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/30"
                        >
                            Continue Learning
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleLogout}
                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all"
                        >
                            Logout
                        </motion.button>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}
