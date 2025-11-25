import { Component } from 'react'
import { motion } from 'framer-motion'

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error Boundary caught an error:', error, errorInfo)
        this.setState({
            error,
            errorInfo
        })

        // Send to error tracking if available
        if (window.Sentry) {
            window.Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
        window.location.href = '/'
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-2xl"
                    >
                        <div className="text-center">
                            {/* Error Icon */}
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h2>
                            <p className="text-gray-300 mb-6">
                                We encountered an unexpected error. Don't worry, your data is safe.
                            </p>

                            {/* Error Details (only in development) */}
                            {import.meta.env.DEV && this.state.error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left">
                                    <p className="text-sm text-red-300 font-mono break-words">
                                        {this.state.error.toString()}
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={this.handleReset}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-700 transition-all"
                                >
                                    Go to Home
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => window.location.reload()}
                                    className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all"
                                >
                                    Reload Page
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
