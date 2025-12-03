import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import StarRating from './StarRating'
import useAuthStore from '../../stores/authStore'

export default function FeedbackModal({ isOpen, onClose }) {
    const token = useAuthStore(state => state.token)
    const [step, setStep] = useState(1) // 1: Ratings, 2: Details, 3: Success
    const [loading, setLoading] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        overall_rating: 0,
        ease_of_use_rating: 0,
        features_rating: 0,
        performance_rating: 0,
        feedback_type: '',
        feedback_title: '',
        feedback_message: '',
        likes: '',
        improvements: '',
        would_recommend: null,
        nps_score: null,
        can_contact: false,
        contact_email: ''
    })

    const feedbackTypes = [
        { value: 'bug', label: '🐛 Report a Bug', color: 'red' },
        { value: 'feature_request', label: '💡 Feature Request', color: 'purple' },
        { value: 'improvement', label: '📈 Suggest Improvement', color: 'blue' },
        { value: 'praise', label: '❤️ I Love It!', color: 'green' },
        { value: 'other', label: '💬 Other Feedback', color: 'gray' }
    ]

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validation
        if (formData.overall_rating === 0) {
            toast.error('Please provide an overall rating')
            return
        }

        if (!formData.feedback_type) {
            toast.error('Please select a feedback type')
            return
        }

        if (!formData.feedback_message.trim()) {
            toast.error('Please write your feedback')
            return
        }

        setLoading(true)

        try {
            // Get browser info
            const browserInfo = {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                screenResolution: `${window.screen.width}x${window.screen.height}`
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/site-feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    browser_info: browserInfo,
                    screen_resolution: browserInfo.screenResolution,
                    page_url: window.location.href
                })
            })

            const data = await response.json()

            if (data.success) {
                setStep(3) // Show success message
                setTimeout(() => {
                    onClose()
                    // Reset form
                    setFormData({
                        overall_rating: 0,
                        ease_of_use_rating: 0,
                        features_rating: 0,
                        performance_rating: 0,
                        feedback_type: '',
                        feedback_title: '',
                        feedback_message: '',
                        likes: '',
                        improvements: '',
                        would_recommend: null,
                        nps_score: null,
                        can_contact: false,
                        contact_email: ''
                    })
                    setStep(1)
                }, 2000)
            } else {
                toast.error(data.message || 'Failed to submit feedback')
            }
        } catch (error) {
            // Error logged server-side only
            toast.error('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const canProceedToStep2 = formData.overall_rating > 0 && formData.feedback_type

    return (
        <AnimatePresence>
            {isOpen && (
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
                        onClick={(e) => e.target === e.currentTarget && onClose()}
                    >
                        <div className="bg-[#1e293b] rounded-3xl shadow-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/10 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">Share Your Feedback</h2>
                                            <p className="text-sm text-gray-400">Help us improve DokGuru Voice</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Progress Steps */}
                            <div className="px-6 py-3 bg-black/20 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    {[1, 2].map((s) => (
                                        <div key={s} className="flex items-center flex-1">
                                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${step >= s
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                                : 'bg-gray-700 text-gray-400'
                                                }`}>
                                                {s}
                                            </div>
                                            {s < 2 && (
                                                <div className={`flex-1 h-1 mx-2 rounded ${step > s ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-700'
                                                    }`} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
                                <div className="p-6 space-y-6">
                                    {step === 1 && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="space-y-6"
                                        >
                                            {/* Overall Rating */}
                                            <div>
                                                <StarRating
                                                    rating={formData.overall_rating}
                                                    setRating={(value) => handleChange('overall_rating', value)}
                                                    size="lg"
                                                    label="Overall Experience"
                                                    required
                                                />
                                            </div>

                                            {/* Category Ratings */}
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <StarRating
                                                    rating={formData.ease_of_use_rating}
                                                    setRating={(value) => handleChange('ease_of_use_rating', value)}
                                                    size="sm"
                                                    label="Ease of Use"
                                                />
                                                <StarRating
                                                    rating={formData.features_rating}
                                                    setRating={(value) => handleChange('features_rating', value)}
                                                    size="sm"
                                                    label="Features"
                                                />
                                                <StarRating
                                                    rating={formData.performance_rating}
                                                    setRating={(value) => handleChange('performance_rating', value)}
                                                    size="sm"
                                                    label="Performance"
                                                />
                                            </div>

                                            {/* Feedback Type */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                                    What type of feedback? <span className="text-red-400">*</span>
                                                </label>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {feedbackTypes.map((type) => (
                                                        <motion.button
                                                            key={type.value}
                                                            type="button"
                                                            onClick={() => handleChange('feedback_type', type.value)}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${formData.feedback_type === type.value
                                                                ? 'border-purple-500 bg-purple-500/20 text-white'
                                                                : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                                                                }`}
                                                        >
                                                            {type.label}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* NPS Score */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                                    How likely are you to recommend DokGuru to others? (0-10)
                                                </label>
                                                <div className="flex gap-2">
                                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                                                        <button
                                                            key={score}
                                                            type="button"
                                                            onClick={() => handleChange('nps_score', score)}
                                                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${formData.nps_score === score
                                                                ? score <= 6
                                                                    ? 'bg-red-500 text-white'
                                                                    : score <= 8
                                                                        ? 'bg-yellow-500 text-white'
                                                                        : 'bg-green-500 text-white'
                                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                                }`}
                                                        >
                                                            {score}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between mt-2 text-xs text-gray-500">
                                                    <span>Not likely</span>
                                                    <span>Very likely</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 2 && (
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="space-y-4"
                                        >
                                            {/* Feedback Title */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Title (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.feedback_title}
                                                    onChange={(e) => handleChange('feedback_title', e.target.value)}
                                                    placeholder="Brief summary of your feedback"
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    maxLength={200}
                                                />
                                            </div>

                                            {/* Feedback Message */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Your Feedback <span className="text-red-400">*</span>
                                                </label>
                                                <textarea
                                                    value={formData.feedback_message}
                                                    onChange={(e) => handleChange('feedback_message', e.target.value)}
                                                    placeholder="Share your thoughts, ideas, or issues..."
                                                    rows={4}
                                                    required
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                                />
                                            </div>

                                            {/* What you like */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    What do you like most?
                                                </label>
                                                <textarea
                                                    value={formData.likes}
                                                    onChange={(e) => handleChange('likes', e.target.value)}
                                                    placeholder="Tell us what's working well..."
                                                    rows={3}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                                />
                                            </div>

                                            {/* Improvements */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    What can we improve?
                                                </label>
                                                <textarea
                                                    value={formData.improvements}
                                                    onChange={(e) => handleChange('improvements', e.target.value)}
                                                    placeholder="Suggestions for improvement..."
                                                    rows={3}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                                />
                                            </div>

                                            {/* Contact Permission */}
                                            <div className="space-y-3">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.can_contact}
                                                        onChange={(e) => handleChange('can_contact', e.target.checked)}
                                                        className="w-5 h-5 rounded border-white/10 bg-white/5 text-purple-500 focus:ring-purple-500"
                                                    />
                                                    <span className="text-sm text-gray-300">
                                                        You may contact me about this feedback
                                                    </span>
                                                </label>

                                                {formData.can_contact && (
                                                    <motion.input
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        type="email"
                                                        value={formData.contact_email}
                                                        onChange={(e) => handleChange('contact_email', e.target.value)}
                                                        placeholder="your.email@example.com"
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                )}
                                            </div>

                                            {/* Use as testimonial */}
                                            {formData.overall_rating >= 4 && (
                                                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                                                    <label className="flex items-start gap-3 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.would_recommend}
                                                            onChange={(e) => handleChange('would_recommend', e.target.checked)}
                                                            className="w-5 h-5 mt-0.5 rounded border-white/10 bg-white/5 text-green-500 focus:ring-green-500"
                                                        />
                                                        <div>
                                                            <span className="text-sm font-medium text-green-400 block">
                                                                Can we use your feedback as a testimonial?
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                Your name/email will remain private
                                                            </span>
                                                        </div>
                                                    </label>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {step === 3 && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center py-8"
                                        >
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", delay: 0.2 }}
                                                className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
                                            >
                                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </motion.div>
                                            <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                                            <p className="text-gray-400">
                                                Your feedback helps us improve DokGuru Voice
                                            </p>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Footer */}
                                {step < 3 && (
                                    <div className="px-6 py-4 bg-black/20 border-t border-white/10 flex justify-between">
                                        {step === 2 && (
                                            <button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                                            >
                                                ← Back
                                            </button>
                                        )}
                                        {step === 1 && <div />}
                                        {step === 1 ? (
                                            <button
                                                type="button"
                                                onClick={() => setStep(2)}
                                                disabled={!canProceedToStep2}
                                                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all"
                                            >
                                                Next →
                                            </button>
                                        ) : (
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center gap-2"
                                            >
                                                {loading ? (
                                                    <>
                                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    'Submit Feedback'
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
