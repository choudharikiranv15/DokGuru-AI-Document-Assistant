import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAvailableEngines, getVoicePreferences, updateVoicePreferences } from '../../services/api'
import toast from 'react-hot-toast'

// Default engines for fallback
const DEFAULT_ENGINES = {
    'auto': {
        name: 'Auto (Smart Selection)',
        description: 'Automatically selects the best engine based on language and text',
        available: true,
        quality: 'mixed',
        free: true
    },
    'gtts': {
        name: 'Google TTS (Standard)',
        description: 'Free, reliable, supports 100+ languages',
        available: true,
        quality: 'good',
        free: true
    }
}

export default function VoicePreferences() {
    const [engines, setEngines] = useState(DEFAULT_ENGINES)
    const [userPlan, setUserPlan] = useState('free')
    const [azureConfigured, setAzureConfigured] = useState(false)
    const [preferences, setPreferences] = useState({
        engine_preference: 'auto',
        language_preference: 'auto'
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [loadError, setLoadError] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            setLoadError(false)

            // Fetch engines first (required)
            const enginesData = await getAvailableEngines()
            setEngines(enginesData.engines || DEFAULT_ENGINES)
            setUserPlan(enginesData.user_plan || 'free')
            setAzureConfigured(enginesData.azure_configured || false)

            // Try to fetch preferences, but use defaults if it fails
            try {
                const prefsData = await getVoicePreferences()
                setPreferences(prefsData || { engine_preference: 'auto', language_preference: 'auto' })
            } catch {
                // Voice preferences failed, use defaults - non-critical
                setPreferences({ engine_preference: 'auto', language_preference: 'auto' })
            }
        } catch (error) {
            // Engine fetch failed - show default engines
            setLoadError(true)
            setEngines(DEFAULT_ENGINES)
            toast.error('Voice settings unavailable - using defaults')
        } finally {
            setLoading(false)
        }
    }

    const handleEngineChange = async (engineId) => {
        // Check if user has access
        const engine = engines[engineId]
        if (engine && engine.accessible === false) {
            toast.error(engine.reason || 'This feature requires a premium plan')
            return
        }

        try {
            setSaving(true)
            await updateVoicePreferences({
                engine_preference: engineId,
                language_preference: preferences.language_preference
            })
            setPreferences(prev => ({ ...prev, engine_preference: engineId }))
            toast.success('Voice preference updated!')
        } catch (error) {
            // Error logged server-side only
            if (error.message.includes('premium')) {
                toast.error('This feature requires a premium plan')
            } else {
                toast.error('Failed to update preference')
            }
        } finally {
            setSaving(false)
        }
    }

    const getQualityColor = (quality) => {
        switch (quality) {
            case 'excellent': return 'text-green-400'
            case 'very_good': return 'text-cyan-400'
            case 'good': return 'text-blue-400'
            case 'mixed': return 'text-gray-400'
            default: return 'text-gray-400'
        }
    }

    const getQualityLabel = (quality) => {
        switch (quality) {
            case 'excellent': return '⭐ Excellent'
            case 'very_good': return '✨ Very Good'
            case 'good': return '👍 Good'
            case 'mixed': return '🔀 Mixed'
            default: return quality
        }
    }

    if (loading) {
        return (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Voice Preferences</h3>
                        <p className="text-gray-400 text-sm">Loading voice settings...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m0 0a5 5 0 007.072 0m-7.072 0l-1.414 1.414M4 12v.01" />
                        </svg>
                    </div>
                    <div className="text-left">
                        <h3 className="text-xl font-bold text-white">Voice Preferences</h3>
                        <p className="text-gray-400 text-sm">
                            Current: {engines[preferences.engine_preference]?.name || 'Auto (Smart Selection)'}
                        </p>
                    </div>
                </div>
                <svg
                    className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Expandable Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-white/10"
                    >
                        <div className="p-6 space-y-4">
                            {/* Error Banner with Retry */}
                            {loadError && (
                                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                    <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="text-amber-300 text-sm font-medium">
                                            Couldn't load voice settings from server
                                        </p>
                                        <p className="text-amber-400/70 text-xs mt-1">
                                            Showing default options. Your saved preferences may not be reflected.
                                        </p>
                                        <button
                                            onClick={fetchData}
                                            className="mt-2 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs rounded-lg transition-colors"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Info Banner */}
                            <div className="flex items-start gap-3 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                                <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-cyan-300 text-sm font-medium">
                                        Choose your preferred voice engine for text-to-speech responses
                                    </p>
                                    <p className="text-cyan-400/70 text-xs mt-1">
                                        {userPlan === 'free'
                                            ? 'Free plan: Auto mode only (includes premium voices automatically for best quality)'
                                            : 'Premium plan: Full access to all voice engines including Azure Neural TTS'}
                                    </p>
                                </div>
                            </div>

                            {/* Engine Options */}
                            <div className="space-y-3">
                                {Object.entries(engines).map(([id, engine]) => {
                                    const isSelected = preferences.engine_preference === id
                                    const isAccessible = engine.accessible !== false
                                    const isPremium = engine.premium_only === true

                                    return (
                                        <motion.button
                                            key={id}
                                            whileHover={isAccessible ? { scale: 1.02 } : {}}
                                            whileTap={isAccessible ? { scale: 0.98 } : {}}
                                            onClick={() => isAccessible && handleEngineChange(id)}
                                            disabled={!isAccessible || saving}
                                            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                                                isSelected
                                                    ? 'border-cyan-500 bg-cyan-500/10'
                                                    : isAccessible
                                                    ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                                    : 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h4 className="text-white font-semibold">{engine.name}</h4>
                                                        {isPremium && (
                                                            <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs rounded-full font-medium">
                                                                Premium
                                                            </span>
                                                        )}
                                                        {!engine.available && (
                                                            <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-full">
                                                                Not Configured
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-400 text-sm mb-2">{engine.description}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-medium ${getQualityColor(engine.quality)}`}>
                                                            {getQualityLabel(engine.quality)}
                                                        </span>
                                                        {engine.free && (
                                                            <span className="text-xs text-green-400">• Free</span>
                                                        )}
                                                    </div>
                                                    {!isAccessible && engine.reason && (
                                                        <p className="text-amber-400 text-xs mt-2">
                                                            🔒 {engine.reason}
                                                        </p>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <svg className="w-6 h-6 text-cyan-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                        </motion.button>
                                    )
                                })}
                            </div>

                            {/* Azure Setup Notice */}
                            {!azureConfigured && (
                                <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                    <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-purple-300 text-sm font-medium">
                                            Azure Neural TTS Not Configured
                                        </p>
                                        <p className="text-purple-400/70 text-xs mt-1">
                                            To enable premium quality Kannada & Hindi voices, add your Azure Speech API key to the backend .env file. Get 5M characters/month free!
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Upgrade CTA for Free Users */}
                            {userPlan === 'free' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="p-4 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/30 rounded-lg"
                                >
                                    <h4 className="text-white font-semibold mb-2">🚀 Upgrade for More Control</h4>
                                    <p className="text-gray-300 text-sm mb-3">
                                        Premium users can manually select preferred voice engines for consistent audio quality.
                                    </p>
                                    <button
                                        onClick={() => toast.info('Premium plans coming soon!')}
                                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white text-sm rounded-lg transition-all"
                                    >
                                        Learn More
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
