import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getUserLimits } from '../../services/api'
import toast from 'react-hot-toast'

export default function UsageDashboard() {
    const [usage, setUsage] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadUsageStats()
    }, [])

    const loadUsageStats = async () => {
        try {
            const stats = await getUserLimits()
            // Transform backend response to expected format
            const transformed = {
                documents_used: stats.documents?.current || 0,
                max_documents: stats.documents?.limit || 5,
                documents_remaining: stats.documents?.remaining || 0,
                queries_today: (stats.queries?.limit_per_day || 100) - (stats.queries?.remaining_today || 0),
                max_queries_per_day: stats.queries?.limit_per_day || 100,
                queries_remaining: stats.queries?.remaining_today || 0,
                plan_type: 'beta',
                reset_at: stats.queries?.reset_at
            }
            setUsage(transformed)
        } catch (error) {
            // Error logged server-side only
            toast.error('Failed to load usage statistics')
        } finally {
            setLoading(false)
        }
    }

    const getProgressColor = (percentage) => {
        if (percentage >= 90) return 'from-red-500 to-red-600'
        if (percentage >= 70) return 'from-yellow-500 to-orange-500'
        return 'from-cyan-500 to-blue-600'
    }

    const getProgressBg = (percentage) => {
        if (percentage >= 90) return 'bg-red-500/20'
        if (percentage >= 70) return 'bg-yellow-500/20'
        return 'bg-cyan-500/20'
    }

    if (loading) {
        return (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-white/10 rounded w-1/3"></div>
                    <div className="h-2 bg-white/10 rounded"></div>
                    <div className="h-2 bg-white/10 rounded"></div>
                </div>
            </div>
        )
    }

    if (!usage) {
        return null
    }

    const docPercentage = (usage.documents_used / usage.max_documents) * 100
    const queryPercentage = (usage.queries_today / usage.max_queries_per_day) * 100

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Usage Dashboard</h2>
                    <p className="text-sm text-gray-400">Daily limits reset at midnight</p>
                </div>
            </div>

            {/* Usage Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Documents Usage */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-400">Documents</h3>
                                <p className="text-2xl font-bold text-white">
                                    {usage.documents_used} / {usage.max_documents}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-400">Remaining</p>
                            <p className="text-lg font-semibold text-cyan-400">
                                {usage.documents_remaining}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Usage</span>
                            <span className="text-white font-medium">{Math.round(docPercentage)}%</span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden ${getProgressBg(docPercentage)}`}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${docPercentage}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={`h-full bg-gradient-to-r ${getProgressColor(docPercentage)}`}
                            />
                        </div>
                    </div>

                    {docPercentage >= 90 && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-red-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>Approaching limit! Consider deleting unused documents.</span>
                        </div>
                    )}
                </motion.div>

                {/* Queries Usage */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-400">Queries Today</h3>
                                <p className="text-2xl font-bold text-white">
                                    {usage.queries_today} / {usage.max_queries_per_day}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-400">Remaining</p>
                            <p className="text-lg font-semibold text-purple-400">
                                {usage.queries_remaining}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Usage</span>
                            <span className="text-white font-medium">{Math.round(queryPercentage)}%</span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden ${getProgressBg(queryPercentage)}`}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${queryPercentage}%` }}
                                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                                className={`h-full bg-gradient-to-r ${getProgressColor(queryPercentage)}`}
                            />
                        </div>
                    </div>

                    {queryPercentage >= 90 && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-red-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>Daily limit approaching! Resets at midnight.</span>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Plan Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/20"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white capitalize">{usage.plan_type || 'Free'} Plan</p>
                            <p className="text-xs text-gray-400">Beta access with generous limits</p>
                        </div>
                    </div>
                    <button
                        onClick={() => toast.info('Upgrade options coming soon!')}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all"
                    >
                        Upgrade
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
