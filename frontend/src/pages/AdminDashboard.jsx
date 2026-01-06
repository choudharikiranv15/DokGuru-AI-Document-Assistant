import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import useAuthStore from '../stores/authStore'
import { useNavigate } from 'react-router-dom'
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview')
    const [loading, setLoading] = useState(true)
    const [dashboardData, setDashboardData] = useState(null)
    const [users, setUsers] = useState([])
    const [feedback, setFeedback] = useState([])
    const [aiFeedback, setAiFeedback] = useState([])
    const [aiFeedbackAnalytics, setAiFeedbackAnalytics] = useState(null)
    const [timeseriesData, setTimeseriesData] = useState(null)
    const [timeRange, setTimeRange] = useState(30)
    const navigate = useNavigate()
    const user = useAuthStore(state => state.user)
    const token = useAuthStore(state => state.token)

    // Check if user is admin
    useEffect(() => {
        if (!user?.is_admin) {
            toast.error('Admin access required')
            navigate('/app')
        }
    }, [user, navigate])

    // Fetch dashboard data
    useEffect(() => {
        fetchDashboardData()
        fetchAIFeedback() // Always fetch for overview charts
        fetchTimeseriesData(timeRange) // Always fetch for overview charts
        if (activeTab === 'users') fetchUsers()
        if (activeTab === 'feedback') fetchFeedback()
    }, [activeTab, timeRange])

    const fetchDashboardData = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await response.json()
            if (data.success) {
                setDashboardData(data)
            }
            setLoading(false)
        } catch (error) {
            // Error logged server-side only
            toast.error('Failed to load dashboard')
            setLoading(false)
        }
    }

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await response.json()
            if (data.success) {
                setUsers(data.users)
            }
        } catch (error) {
            // Error logged server-side only
        }
    }

    const fetchFeedback = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/feedback`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await response.json()
            if (data.success) {
                setFeedback(data.feedback)
            }
        } catch (error) {
            // Error logged server-side only
        }
    }

    const fetchAIFeedback = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/ai-feedback`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await response.json()
            if (data.success) {
                setAiFeedback(data.feedback)
                setAiFeedbackAnalytics(data.analytics)
            }
        } catch (error) {
            // Error logged server-side only
        }
    }

    const fetchTimeseriesData = async (days) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/analytics/timeseries?days=${days}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await response.json()
            if (data.success) {
                setTimeseriesData(data.data)
            }
        } catch (error) {
            // Error logged server-side only
        }
    }

    const tabs = [
        { id: 'overview', label: '📊 Overview', icon: '📊' },
        { id: 'users', label: '👥 Users', icon: '👥' },
        { id: 'system-health', label: '🏥 System Health', icon: '🏥' },
        { id: 'ai-responses', label: '🤖 AI Responses', icon: '🤖' },
        { id: 'feedback', label: '💬 Site Feedback', icon: '💬' }
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading admin dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0a0f1e] text-white">
            {/* Header */}
            <header className="bg-[#1e293b] border-b border-white/10 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/app')}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                            <p className="text-sm text-gray-400">DokGuru Voice Analytics</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                            <span className="text-sm font-semibold text-purple-400">Admin</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-[#1e293b] border-b border-white/10 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-3 font-medium transition-all relative ${activeTab === tab.id
                                    ? 'text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
                {activeTab === 'overview' && (
                    <OverviewTab
                        data={dashboardData}
                        aiAnalytics={aiFeedbackAnalytics}
                        timeseriesData={timeseriesData}
                        timeRange={timeRange}
                        setTimeRange={setTimeRange}
                    />
                )}
                {activeTab === 'users' && (
                    <UsersTab users={users} />
                )}
                {activeTab === 'system-health' && (
                    <SystemHealthTab token={token} />
                )}
                {activeTab === 'ai-responses' && (
                    <AIResponsesTab feedback={aiFeedback} analytics={aiFeedbackAnalytics} />
                )}
                {activeTab === 'feedback' && (
                    <FeedbackTab feedback={feedback} />
                )}
            </div>
        </div>
    )
}

// Overview Tab Component with 3D Charts
function OverviewTab({ data, aiAnalytics, timeseriesData, timeRange, setTimeRange }) {
    const system = data?.system || {}
    const feedback = data?.feedback || {}

    const timeRangeOptions = [
        { label: '7 Days', value: 7 },
        { label: '30 Days', value: 30 },
        { label: '90 Days', value: 90 }
    ]

    const stats = [
        { label: 'Total Users', value: system.total_users || 0, icon: '👥', color: 'from-blue-500 to-cyan-500' },
        { label: 'Total Documents', value: system.total_documents || 0, icon: '📄', color: 'from-purple-500 to-pink-500' },
        { label: 'Total Feedback', value: system.total_feedback || 0, icon: '💬', color: 'from-green-500 to-emerald-500' },
        { label: 'Avg Rating', value: system.average_rating || 0, icon: '⭐', color: 'from-yellow-500 to-orange-500' },
        { label: 'New Users (7d)', value: system.recent_users_week || 0, icon: '📈', color: 'from-indigo-500 to-purple-500' },
        { label: 'NPS Score', value: feedback.nps_score || 0, icon: '📊', color: 'from-pink-500 to-rose-500' }
    ]

    // Prepare chart data
    const feedbackTypeData = Object.entries(feedback.by_type || {}).map(([type, count]) => ({
        name: type.replace('_', ' ').split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
        value: count
    }))

    const feedbackRatingData = Object.entries(feedback.by_rating || {})
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        .map(([rating, count]) => ({
            name: `${rating} Star${rating > 1 ? 's' : ''}`,
            count: count,
            rating: parseInt(rating)
        }))

    const aiSatisfactionData = aiAnalytics ? [
        { name: 'Likes', value: aiAnalytics.likes || 0, color: '#10b981' },
        { name: 'Dislikes', value: aiAnalytics.dislikes || 0, color: '#ef4444' }
    ] : []

    const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900 border border-purple-500/50 rounded-lg p-3 shadow-xl">
                    <p className="text-white font-semibold">{payload[0].name}</p>
                    <p className="text-purple-400 text-sm">{payload[0].value}</p>
                </div>
            )
        }
        return null
    }

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Time Range Selector */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">Analytics Overview</h2>
                    <p className="text-sm text-gray-400">System performance and trends</p>
                </div>
                <div className="flex gap-2">
                    {timeRangeOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setTimeRange(option.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                timeRange === option.value
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-white/20 transition-all"
                    >
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                            <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${stat.color} rounded-lg md:rounded-xl flex items-center justify-center text-xl md:text-2xl`}>
                                {stat.icon}
                            </div>
                            <div className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                                {stat.value}
                            </div>
                        </div>
                        <p className="text-gray-400 text-xs md:text-sm font-medium">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Time-Based Analytics Charts */}
            {timeseriesData && timeseriesData.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white">Trends Over Time</h3>

                    {/* User Growth Chart */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6">
                        <h4 className="text-base md:text-lg font-bold mb-4 text-white">User Registrations</h4>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={timeseriesData}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9ca3af"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="users"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fill="url(#colorUsers)"
                                    dot={{ fill: '#3b82f6', r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Documents & Queries Chart */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6">
                        <h4 className="text-base md:text-lg font-bold mb-4 text-white">Documents & Queries Activity</h4>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={timeseriesData}>
                                <defs>
                                    <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9ca3af"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="documents"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    fill="url(#colorDocs)"
                                    dot={{ fill: '#8b5cf6', r: 3 }}
                                    name="Documents"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="queries"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fill="url(#colorQueries)"
                                    dot={{ fill: '#10b981', r: 3 }}
                                    name="Queries"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Overall Activity Chart */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6">
                        <h4 className="text-base md:text-lg font-bold mb-4 text-white">Overall Platform Activity</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={timeseriesData}>
                                <defs>
                                    <linearGradient id="colorUsersArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                    </linearGradient>
                                    <linearGradient id="colorDocsArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                    </linearGradient>
                                    <linearGradient id="colorQueriesArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                                    </linearGradient>
                                    <linearGradient id="colorFeedbackArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9ca3af"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="users"
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#colorUsersArea)"
                                    name="Users"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="documents"
                                    stroke="#8b5cf6"
                                    fillOpacity={1}
                                    fill="url(#colorDocsArea)"
                                    name="Documents"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="queries"
                                    stroke="#10b981"
                                    fillOpacity={1}
                                    fill="url(#colorQueriesArea)"
                                    name="Queries"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="feedback"
                                    stroke="#f59e0b"
                                    fillOpacity={1}
                                    fill="url(#colorFeedbackArea)"
                                    name="Feedback"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* 3D Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Feedback by Type - 3D Pie Chart */}
                {feedbackTypeData.length > 0 && (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6">
                        <h3 className="text-base md:text-lg font-bold mb-4">Feedback Distribution by Type</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={feedbackTypeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {feedbackTypeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Feedback by Rating - 3D Bar Chart */}
                {feedbackRatingData.length > 0 && (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6">
                        <h3 className="text-base md:text-lg font-bold mb-4">Rating Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={feedbackRatingData}>
                                <defs>
                                    <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#eab308" stopOpacity={0.3} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" fill="url(#colorRating)" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* AI Response Satisfaction - 3D Donut Chart */}
                {aiSatisfactionData.length > 0 && (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6">
                        <h3 className="text-base md:text-lg font-bold mb-4">AI Response Satisfaction</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={aiSatisfactionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                >
                                    {aiSatisfactionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        {aiAnalytics && (
                            <div className="mt-4 text-center">
                                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                                    {aiAnalytics.satisfaction_rate}%
                                </div>
                                <p className="text-xs md:text-sm text-gray-400">Satisfaction Rate</p>
                            </div>
                        )}
                    </div>
                )}

                {/* System Metrics - 3D Area Chart */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6">
                    <h3 className="text-base md:text-lg font-bold mb-4">System Metrics Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={[
                            { name: 'Users', value: system.total_users || 0 },
                            { name: 'Documents', value: system.total_documents || 0 },
                            { name: 'Feedback', value: system.total_feedback || 0 },
                            { name: 'AI Responses', value: aiAnalytics?.total || 0 }
                        ].filter(item => item.value !== undefined)}>
                            <defs>
                                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMetric)" connectNulls />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

// Users Tab Component
function UsersTab({ users }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedUser, setSelectedUser] = useState(null)
    const [userDetails, setUserDetails] = useState(null)
    const [loadingDetails, setLoadingDetails] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showBanModal, setShowBanModal] = useState(false)
    const [showPromoteModal, setShowPromoteModal] = useState(false)
    const [actionUser, setActionUser] = useState(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const token = useAuthStore(state => state.token)

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const fetchUserDetails = async (userId) => {
        setLoadingDetails(true)
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await response.json()
            console.log('User details response:', data)
            if (data.success) {
                setUserDetails(data)
            } else {
                toast.error(data.message || 'Failed to load user details')
            }
        } catch (error) {
            console.error('Error fetching user details:', error)
            toast.error('Failed to load user details')
        } finally {
            setLoadingDetails(false)
        }
    }

    const handleViewDetails = (user) => {
        setSelectedUser(user)
        fetchUserDetails(user.id)
    }

    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search users by email or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 pl-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <div className="text-gray-400">
                    {filteredUsers.length} users
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Role</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Institution</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Joined</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Admin</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold">
                                                {user.email?.[0]?.toUpperCase()}
                                            </div>
                                            <span className="text-white">{user.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                                            {user.role || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">{user.institution || 'N/A'}</td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.is_admin ? (
                                            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-semibold">
                                                Admin
                                            </span>
                                        ) : (
                                            <span className="text-gray-500 text-sm">User</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleViewDetails(user)}
                                                className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white rounded-lg text-xs font-medium transition-all"
                                                title="View Details"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActionUser(user)
                                                    setShowEditModal(true)
                                                }}
                                                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 rounded-lg text-xs font-medium transition-all"
                                                title="Edit User"
                                            >
                                                Edit
                                            </button>
                                            {!user.is_admin && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setActionUser(user)
                                                            setShowPromoteModal(true)
                                                        }}
                                                        className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50 rounded-lg text-xs font-medium transition-all"
                                                        title="Promote to Admin"
                                                    >
                                                        Promote
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setActionUser(user)
                                                            setShowBanModal(true)
                                                        }}
                                                        className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/50 rounded-lg text-xs font-medium transition-all"
                                                        title="Ban User"
                                                    >
                                                        {user.is_active === false ? 'Unban' : 'Ban'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setActionUser(user)
                                                            setShowDeleteModal(true)
                                                        }}
                                                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg text-xs font-medium transition-all"
                                                        title="Delete User"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Details Modal */}
            {selectedUser && (
                <UserDetailsModal
                    user={selectedUser}
                    details={userDetails}
                    loading={loadingDetails}
                    onClose={() => {
                        setSelectedUser(null)
                        setUserDetails(null)
                    }}
                />
            )}

            {/* Edit User Modal */}
            {showEditModal && actionUser && (
                <EditUserModal
                    user={actionUser}
                    token={token}
                    onClose={() => {
                        setShowEditModal(false)
                        setActionUser(null)
                    }}
                    onSuccess={() => {
                        setShowEditModal(false)
                        setActionUser(null)
                        setRefreshTrigger(prev => prev + 1)
                        window.location.reload()
                    }}
                />
            )}

            {/* Delete User Modal */}
            {showDeleteModal && actionUser && (
                <ConfirmActionModal
                    title="Delete User"
                    message={`Are you sure you want to delete ${actionUser.email}? This action cannot be undone.`}
                    confirmText="Delete"
                    confirmClass="bg-red-500 hover:bg-red-600"
                    onConfirm={async () => {
                        try {
                            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/users/${actionUser.id}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            })
                            const data = await response.json()
                            if (data.success) {
                                toast.success(data.message)
                                setShowDeleteModal(false)
                                setActionUser(null)
                                window.location.reload()
                            } else {
                                toast.error(data.message)
                            }
                        } catch (error) {
                            toast.error('Failed to delete user')
                        }
                    }}
                    onClose={() => {
                        setShowDeleteModal(false)
                        setActionUser(null)
                    }}
                />
            )}

            {/* Ban/Unban User Modal */}
            {showBanModal && actionUser && (
                <BanUserModal
                    user={actionUser}
                    token={token}
                    onClose={() => {
                        setShowBanModal(false)
                        setActionUser(null)
                    }}
                    onSuccess={() => {
                        setShowBanModal(false)
                        setActionUser(null)
                        window.location.reload()
                    }}
                />
            )}

            {/* Promote User Modal */}
            {showPromoteModal && actionUser && (
                <ConfirmActionModal
                    title="Promote to Admin"
                    message={`Are you sure you want to promote ${actionUser.email} to admin? They will have full access to the admin dashboard.`}
                    confirmText="Promote"
                    confirmClass="bg-purple-500 hover:bg-purple-600"
                    onConfirm={async () => {
                        try {
                            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/promote`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ email: actionUser.email })
                            })
                            const data = await response.json()
                            if (data.success) {
                                toast.success(data.message)
                                setShowPromoteModal(false)
                                setActionUser(null)
                                window.location.reload()
                            } else {
                                toast.error(data.message)
                            }
                        } catch (error) {
                            toast.error('Failed to promote user')
                        }
                    }}
                    onClose={() => {
                        setShowPromoteModal(false)
                        setActionUser(null)
                    }}
                />
            )}
        </div>
    )
}

// User Details Modal Component
function UserDetailsModal({ user, details, loading, onClose }) {
    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                <div className="bg-[#1e293b] rounded-3xl shadow-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/10 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-white">
                                    {user.email?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{user.email}</h2>
                                    <p className="text-sm text-gray-400">User Details & Activity</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                            </div>
                        ) : details ? (
                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div className="text-sm text-gray-400 mb-1">Role</div>
                                        <div className="text-white font-semibold">{details.user?.role || 'N/A'}</div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div className="text-sm text-gray-400 mb-1">Institution</div>
                                        <div className="text-white font-semibold">{details.user?.institution || 'N/A'}</div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div className="text-sm text-gray-400 mb-1">Occupation</div>
                                        <div className="text-white font-semibold">{details.user?.occupation || 'N/A'}</div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div className="text-sm text-gray-400 mb-1">Joined</div>
                                        <div className="text-white font-semibold">
                                            {details.user?.created_at ?
                                                new Date(details.user.created_at).toLocaleDateString('en-US', {
                                                    month: 'long', day: 'numeric', year: 'numeric'
                                                }) : 'N/A'
                                            }
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-4">
                                        <div className="text-3xl mb-2">📄</div>
                                        <div className="text-2xl font-bold text-white">{details.stats?.document_count || 0}</div>
                                        <div className="text-sm text-gray-400">Documents</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
                                        <div className="text-3xl mb-2">💬</div>
                                        <div className="text-2xl font-bold text-white">{details.stats?.query_count || 0}</div>
                                        <div className="text-sm text-gray-400">Queries</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
                                        <div className="text-3xl mb-2">⭐</div>
                                        <div className="text-2xl font-bold text-white">{details.stats?.feedback_count || 0}</div>
                                        <div className="text-sm text-gray-400">Feedback</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-4">
                                        <div className="text-3xl mb-2">🔥</div>
                                        <div className="text-lg font-bold text-white leading-tight">
                                            {details.stats?.last_active || 'Never'}
                                        </div>
                                        <div className="text-sm text-gray-400">Last Active</div>
                                    </div>
                                </div>

                                {/* Documents */}
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                        <span>📚</span> Documents ({details.documents?.length || 0})
                                    </h3>
                                    {details.documents && details.documents.length > 0 ? (
                                        <div className="space-y-2">
                                            {details.documents.slice(0, 5).map((doc) => (
                                                <div key={doc.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                                            <span className="text-xl">📄</span>
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-medium">{doc.filename}</div>
                                                            <div className="text-xs text-gray-400">
                                                                {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-400">{doc.file_size || 'N/A'}</div>
                                                </div>
                                            ))}
                                            {details.documents.length > 5 && (
                                                <div className="text-center text-sm text-gray-400 py-2">
                                                    +{details.documents.length - 5} more documents
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
                                            <div className="text-4xl mb-2">📭</div>
                                            <p className="text-gray-400 text-sm">No documents uploaded yet</p>
                                        </div>
                                    )}
                                </div>

                                {/* Recent Activity - Last 5 Sessions */}
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                        <span>🕐</span> Recent Activity (Last 5 Sessions)
                                    </h3>
                                    {details.recent_queries && details.recent_queries.length > 0 ? (
                                        <div className="space-y-3">
                                            {details.recent_queries.map((session, idx) => (
                                                <div key={session.id || idx} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                                                <span className="text-lg">💬</span>
                                                            </div>
                                                            <div>
                                                                <div className="text-white font-medium text-sm">
                                                                    {session.document_name || 'Unknown Document'}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {session.message_count || 0} messages
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {new Date(session.created_at).toLocaleDateString()} {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                    <div className="text-gray-300 text-sm pl-10 line-clamp-2">
                                                        {session.query || 'No query'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
                                            <div className="text-4xl mb-2">💤</div>
                                            <p className="text-gray-400 text-sm">No recent activity</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                Failed to load user details
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    )
}

// AI Responses Tab Component
function AIResponsesTab({ feedback, analytics }) {
    const [filterRating, setFilterRating] = useState('all') // 'all', 'likes', 'dislikes'

    const filteredFeedback = filterRating === 'all'
        ? feedback
        : feedback.filter(f => {
            if (filterRating === 'likes') return f.rating === 1
            if (filterRating === 'dislikes') return f.rating === -1
            return true
        })

    return (
        <div className="space-y-6">
            {/* Analytics Summary */}
            {analytics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-xl">
                                💬
                            </div>
                            <div className="text-2xl font-bold text-white">{analytics.total || 0}</div>
                        </div>
                        <p className="text-gray-400 text-sm">Total Responses</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-xl">
                                👍
                            </div>
                            <div className="text-2xl font-bold text-green-400">{analytics.likes || 0}</div>
                        </div>
                        <p className="text-gray-400 text-sm">Likes</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center text-xl">
                                👎
                            </div>
                            <div className="text-2xl font-bold text-red-400">{analytics.dislikes || 0}</div>
                        </div>
                        <p className="text-gray-400 text-sm">Dislikes</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-xl">
                                📈
                            </div>
                            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                {analytics.satisfaction_rate || 0}%
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm">Satisfaction</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-3 overflow-x-auto pb-2">
                {['all', 'likes', 'dislikes'].map(rating => (
                    <button
                        key={rating}
                        onClick={() => setFilterRating(rating)}
                        className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${filterRating === rating
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        {rating === 'all' ? 'All Responses' :
                            rating === 'likes' ? `👍 Liked (${analytics?.likes || 0})` :
                                `👎 Disliked (${analytics?.dislikes || 0})`}
                    </button>
                ))}
            </div>

            {/* AI Responses List */}
            <div className="space-y-4">
                {filteredFeedback.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
                    >
                        {/* Rating Badge */}
                        <div className="flex items-start justify-between mb-4">
                            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${item.rating === 1
                                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                : 'bg-red-500/20 text-red-400 border border-red-500/50'
                                }`}>
                                {item.rating === 1 ? '👍 Helpful' : '👎 Not Helpful'}
                            </span>
                            <span className="text-gray-400 text-sm">
                                {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
                            </span>
                        </div>

                        {/* Question */}
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                    Q
                                </div>
                                <h4 className="text-cyan-400 font-semibold">User Question</h4>
                            </div>
                            <p className="text-gray-200 pl-8 bg-cyan-500/5 border-l-2 border-cyan-500 py-2 px-4 rounded-r-lg">
                                {item.query || 'No query provided'}
                            </p>
                        </div>

                        {/* Response */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                    AI
                                </div>
                                <h4 className="text-purple-400 font-semibold">AI Response</h4>
                            </div>
                            <div className="text-gray-300 pl-8 bg-purple-500/5 border-l-2 border-purple-500 py-2 px-4 rounded-r-lg max-h-96 overflow-y-auto">
                                <p className="whitespace-pre-wrap">{item.response}</p>
                            </div>
                        </div>

                        {/* Comment if exists */}
                        {item.comment && (
                            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <p className="text-sm text-yellow-400">
                                    <span className="font-semibold">Comment:</span> {item.comment}
                                </p>
                            </div>
                        )}

                        {/* User ID */}
                        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
                            User ID: {item.user_id} • Message ID: {item.message_id}
                        </div>
                    </motion.div>
                ))}

                {filteredFeedback.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <div className="text-6xl mb-4">🤖</div>
                        <p className="text-lg">No AI responses found for this filter</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// Feedback Tab Component
function FeedbackTab({ feedback }) {
    const [filterType, setFilterType] = useState('all')
    const [expandedId, setExpandedId] = useState(null)

    const filteredFeedback = filterType === 'all'
        ? feedback
        : feedback.filter(f => f.feedback_type === filterType)

    const types = ['all', 'bug', 'feature_request', 'improvement', 'praise', 'other']

    const formatDateTime = (dateString) => {
        const date = new Date(dateString)
        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-3 overflow-x-auto pb-2">
                {types.map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${filterType === type
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        {type === 'all' ? 'All' : type.replace('_', ' ').split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
                    </button>
                ))}
            </div>

            {/* Feedback List */}
            <div className="space-y-4">
                {filteredFeedback.map((item) => {
                    const dateTime = formatDateTime(item.created_at)
                    const isExpanded = expandedId === item.id

                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all"
                        >
                            {/* Header */}
                            <div className="p-6 pb-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {/* Overall Rating */}
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={i < item.overall_rating ? 'text-yellow-400' : 'text-gray-600'}>
                                                    ⭐
                                                </span>
                                            ))}
                                        </div>
                                        {/* Type Badge */}
                                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${item.feedback_type === 'bug' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                                            item.feedback_type === 'feature_request' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' :
                                                item.feedback_type === 'improvement' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' :
                                                    item.feedback_type === 'praise' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                                                        'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                                            }`}>
                                            {item.feedback_type === 'bug' ? '🐛 Bug' :
                                                item.feedback_type === 'feature_request' ? '💡 Feature Request' :
                                                    item.feedback_type === 'improvement' ? '📈 Improvement' :
                                                        item.feedback_type === 'praise' ? '❤️ Praise' : '💬 Other'}
                                        </span>
                                        {/* NPS Score */}
                                        {item.nps_score !== null && (
                                            <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${item.nps_score >= 9 ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                                                item.nps_score >= 7 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                                                    'bg-red-500/20 text-red-400 border border-red-500/50'
                                                }`}>
                                                NPS: {item.nps_score}/10
                                            </span>
                                        )}
                                    </div>
                                    {/* Date/Time */}
                                    <div className="text-right">
                                        <div className="text-gray-300 text-sm font-medium">{dateTime.date}</div>
                                        <div className="text-gray-500 text-xs">{dateTime.time}</div>
                                    </div>
                                </div>

                                {/* User Info */}
                                <div className="flex items-center gap-2 mb-4 text-sm">
                                    <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                        {item.user_email?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <span className="text-gray-400">
                                        {item.user_email || `User ID: ${item.user_id?.slice(0, 8)}...`}
                                    </span>
                                </div>

                                {/* Title */}
                                {item.feedback_title && (
                                    <h4 className="text-white font-semibold text-lg mb-3">{item.feedback_title}</h4>
                                )}

                                {/* Main Message */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                                    <p className="text-gray-300 whitespace-pre-wrap">{item.feedback_message}</p>
                                </div>

                                {/* Category Ratings */}
                                {(item.ease_of_use_rating || item.features_rating || item.performance_rating) && (
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {item.ease_of_use_rating && (
                                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                                <div className="text-xs text-blue-400 mb-1">Ease of Use</div>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} className={`text-xs ${i < item.ease_of_use_rating ? 'text-blue-400' : 'text-gray-600'}`}>
                                                            ⭐
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {item.features_rating && (
                                            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                                                <div className="text-xs text-purple-400 mb-1">Features</div>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} className={`text-xs ${i < item.features_rating ? 'text-purple-400' : 'text-gray-600'}`}>
                                                            ⭐
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {item.performance_rating && (
                                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                                <div className="text-xs text-green-400 mb-1">Performance</div>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} className={`text-xs ${i < item.performance_rating ? 'text-green-400' : 'text-gray-600'}`}>
                                                            ⭐
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Expandable Details */}
                                {(item.likes || item.improvements || item.browser_info || item.page_url) && (
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
                                    >
                                        {isExpanded ? '▼ Hide Details' : '▶ Show More Details'}
                                    </button>
                                )}
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-white/10 bg-black/20 p-6 space-y-4"
                                >
                                    {item.likes && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-green-400 text-lg">👍</span>
                                                <h5 className="text-sm font-semibold text-green-400">What they like:</h5>
                                            </div>
                                            <p className="text-gray-300 text-sm pl-7 bg-green-500/5 border-l-2 border-green-500 py-2 px-3 rounded-r-lg">
                                                {item.likes}
                                            </p>
                                        </div>
                                    )}

                                    {item.improvements && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-orange-400 text-lg">💡</span>
                                                <h5 className="text-sm font-semibold text-orange-400">Suggested improvements:</h5>
                                            </div>
                                            <p className="text-gray-300 text-sm pl-7 bg-orange-500/5 border-l-2 border-orange-500 py-2 px-3 rounded-r-lg">
                                                {item.improvements}
                                            </p>
                                        </div>
                                    )}

                                    {item.page_url && (
                                        <div>
                                            <h5 className="text-sm font-semibold text-gray-400 mb-1">Page URL:</h5>
                                            <a href={item.page_url} target="_blank" rel="noopener noreferrer"
                                                className="text-cyan-400 text-sm hover:underline break-all">
                                                {item.page_url}
                                            </a>
                                        </div>
                                    )}

                                    {item.browser_info && (
                                        <div>
                                            <h5 className="text-sm font-semibold text-gray-400 mb-1">Browser Info:</h5>
                                            <div className="text-xs text-gray-500 space-y-1">
                                                <div>Platform: {item.browser_info.platform || 'N/A'}</div>
                                                <div>Language: {item.browser_info.language || 'N/A'}</div>
                                                {item.screen_resolution && <div>Screen: {item.screen_resolution}</div>}
                                            </div>
                                        </div>
                                    )}

                                    {item.can_contact && item.contact_email && (
                                        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-cyan-400">📧</span>
                                                <span className="text-sm text-cyan-400">Contact: {item.contact_email}</span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    )
                })}

                {filteredFeedback.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <div className="text-4xl mb-4">📭</div>
                        <p>No feedback found for this filter</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// System Health Tab Component
function SystemHealthTab({ token }) {
    const [healthData, setHealthData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [autoRefresh, setAutoRefresh] = useState(true)

    const fetchHealthData = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/system/health`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await response.json()
            if (data.success) {
                setHealthData(data)
            }
            setLoading(false)
        } catch (error) {
            toast.error('Failed to load system health')
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchHealthData()

        // Auto-refresh every 30 seconds if enabled
        if (autoRefresh) {
            const interval = setInterval(fetchHealthData, 30000)
            return () => clearInterval(interval)
        }
    }, [autoRefresh])

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const getStatusColor = (percent) => {
        if (percent < 50) return 'from-green-500 to-emerald-500'
        if (percent < 75) return 'from-yellow-500 to-orange-500'
        return 'from-red-500 to-rose-500'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        )
    }

    if (!healthData) {
        return (
            <div className="text-center py-12 text-gray-400">
                <p>Failed to load system health data</p>
            </div>
        )
    }

    const { server, database, recent_activity, storage } = healthData

    return (
        <div className="space-y-6">
            {/* Header with Auto-Refresh Toggle */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">System Health Monitor</h2>
                    <p className="text-sm text-gray-400">Production database metrics and performance</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchHealthData}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 rounded-lg text-sm font-medium transition-all"
                    >
                        Refresh Now
                    </button>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="w-4 h-4 text-purple-500 bg-white/5 border-white/10 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-300">Auto-refresh (30s)</span>
                    </label>
                </div>
            </div>

            {/* Server Metrics (only show if available - local dev only) */}
            {server && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Server Metrics</h3>
                        <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">Local Dev Only</span>
                    </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* CPU Usage */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium">CPU Usage</span>
                            <span className="text-white font-bold">{server.cpu_percent}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${getStatusColor(server.cpu_percent)} transition-all duration-500`}
                                style={{ width: `${server.cpu_percent}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Memory Usage */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium">Memory Usage</span>
                            <span className="text-white font-bold">{server.memory.percent}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${getStatusColor(server.memory.percent)} transition-all duration-500`}
                                style={{ width: `${server.memory.percent}%` }}
                            ></div>
                        </div>
                        <div className="text-xs text-gray-400">
                            {formatBytes(server.memory.used)} / {formatBytes(server.memory.total)}
                        </div>
                    </div>

                    {/* Disk Usage */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium">Disk Usage</span>
                            <span className="text-white font-bold">{server.disk.percent}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${getStatusColor(server.disk.percent)} transition-all duration-500`}
                                style={{ width: `${server.disk.percent}%` }}
                            ></div>
                        </div>
                        <div className="text-xs text-gray-400">
                            {formatBytes(server.disk.used)} / {formatBytes(server.disk.total)}
                        </div>
                    </div>
                </div>
                </div>
            )}

            {/* Database Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Database Statistics</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <span className="text-gray-300">Total Users</span>
                            <span className="text-white font-bold">{database.total_users}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <span className="text-gray-300">Active Users</span>
                            <span className="text-green-400 font-bold">{database.active_users}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <span className="text-gray-300">Total Documents</span>
                            <span className="text-white font-bold">{database.total_documents}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <span className="text-gray-300">Total Queries</span>
                            <span className="text-white font-bold">{database.total_queries}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Activity (24h)</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">👥</span>
                                <span className="text-gray-300">New Users</span>
                            </div>
                            <span className="text-blue-400 font-bold text-xl">{recent_activity.new_users_24h}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">📄</span>
                                <span className="text-gray-300">New Documents</span>
                            </div>
                            <span className="text-purple-400 font-bold text-xl">{recent_activity.new_documents_24h}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">💬</span>
                                <span className="text-gray-300">Queries</span>
                            </div>
                            <span className="text-green-400 font-bold text-xl">{recent_activity.queries_24h}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Storage Usage */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Storage Usage</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl">
                        <div className="text-sm text-blue-400 mb-1">Total Storage</div>
                        <div className="text-2xl font-bold text-white">{storage.total_gb} GB</div>
                        <div className="text-xs text-gray-400 mt-1">{formatBytes(storage.total_bytes)}</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl">
                        <div className="text-sm text-purple-400 mb-1">Megabytes</div>
                        <div className="text-2xl font-bold text-white">{storage.total_mb} MB</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl">
                        <div className="text-sm text-green-400 mb-1">Documents</div>
                        <div className="text-2xl font-bold text-white">{database.total_documents}</div>
                        <div className="text-xs text-gray-400 mt-1">Avg: {database.total_documents > 0 ? (storage.total_mb / database.total_documents).toFixed(2) : 0} MB/doc</div>
                    </div>
                </div>
            </div>

            {/* Last Updated */}
            <div className="text-center text-sm text-gray-400">
                Last updated: {new Date(healthData.timestamp).toLocaleString()}
            </div>
        </div>
    )
}

// Edit User Modal Component
function EditUserModal({ user, token, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        role: user.role || '',
        institution: user.institution || '',
        occupation: user.occupation || '',
        admin_notes: user.admin_notes || ''
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            const data = await response.json()

            if (data.success) {
                toast.success(data.message)
                onSuccess()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Failed to update user')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                <div className="bg-[#1e293b] rounded-2xl shadow-2xl border border-white/10 w-full max-w-md">
                    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Edit User</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <input
                                type="text"
                                value={user.email}
                                disabled
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                            <input
                                type="text"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Student, Teacher, Researcher"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Institution</label>
                            <input
                                type="text"
                                value={formData.institution}
                                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., University name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Occupation</label>
                            <input
                                type="text"
                                value={formData.occupation}
                                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Software Engineer"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Admin Notes</label>
                            <textarea
                                value={formData.admin_notes}
                                onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Internal notes about this user"
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white font-medium transition-all disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </>
    )
}

// Ban User Modal Component
function BanUserModal({ user, token, onClose, onSuccess }) {
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)
    const isBanned = user.is_active === false

    const handleAction = async () => {
        setLoading(true)

        try {
            const endpoint = isBanned ? 'unban' : 'ban'
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/users/${user.id}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: isBanned ? null : JSON.stringify({ reason })
            })
            const data = await response.json()

            if (data.success) {
                toast.success(data.message)
                onSuccess()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(`Failed to ${isBanned ? 'unban' : 'ban'} user`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                <div className="bg-[#1e293b] rounded-2xl shadow-2xl border border-white/10 w-full max-w-md">
                    <div className={`bg-gradient-to-r ${isBanned ? 'from-green-600/20 to-emerald-600/20' : 'from-orange-600/20 to-red-600/20'} border-b border-white/10 px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">{isBanned ? 'Unban User' : 'Ban User'}</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <p className="text-gray-300">
                            {isBanned
                                ? `Are you sure you want to restore access for ${user.email}?`
                                : `Are you sure you want to ban ${user.email}? They will lose access to the platform.`
                            }
                        </p>

                        {!isBanned && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Reason for ban</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                    placeholder="Enter reason for banning this user..."
                                    rows={3}
                                    required
                                />
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAction}
                                disabled={loading || (!isBanned && !reason.trim())}
                                className={`flex-1 px-4 py-2 ${isBanned ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'} rounded-lg text-white font-medium transition-all disabled:opacity-50`}
                            >
                                {loading ? 'Processing...' : isBanned ? 'Unban User' : 'Ban User'}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    )
}

// Generic Confirm Action Modal Component
function ConfirmActionModal({ title, message, confirmText, confirmClass, onConfirm, onClose }) {
    const [loading, setLoading] = useState(false)

    const handleConfirm = async () => {
        setLoading(true)
        try {
            await onConfirm()
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                <div className="bg-[#1e293b] rounded-2xl shadow-2xl border border-white/10 w-full max-w-md">
                    <div className="border-b border-white/10 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">{title}</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <p className="text-gray-300">{message}</p>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={loading}
                                className={`flex-1 px-4 py-2 ${confirmClass} rounded-lg text-white font-medium transition-all disabled:opacity-50`}
                            >
                                {loading ? 'Processing...' : confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    )
}
