import { motion } from 'framer-motion'
import { useChatStore } from '../../stores/chatStore'
import toast from 'react-hot-toast'

export default function DownloadHistory() {
    const { messages } = useChatStore()

    const downloadAsText = () => {
        try {
            let text = `DokGuru Voice - Chat History\n`
            text += `Exported: ${new Date().toLocaleString()}\n`
            text += `${'='.repeat(70)}\n\n`

            // Group messages into Q&A pairs
            let questionCount = 0
            for (let i = 0; i < messages.length; i++) {
                const msg = messages[i]

                if (msg.role === 'user') {
                    questionCount++
                    text += `Q${questionCount}: ${msg.text || msg.content || ''}\n\n`

                    // Check if next message is assistant's response
                    if (i + 1 < messages.length && messages[i + 1].role === 'assistant') {
                        const answer = messages[i + 1]
                        text += `A${questionCount}: ${answer.text || answer.content || ''}\n`

                        // Add sources if available
                        if (answer.sources && answer.sources.length > 0) {
                            text += `\nSources: ${answer.sources.map(s => `Page ${s.page}`).join(', ')}\n`
                        }

                        text += `\n${'-'.repeat(70)}\n\n`
                        i++ // Skip the assistant message since we already processed it
                    } else {
                        text += `A${questionCount}: [No response yet]\n\n${'-'.repeat(70)}\n\n`
                    }
                }
            }

            const blob = new Blob([text], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `dokguru-chat-${new Date().toISOString().split('T')[0]}.txt`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success('Chat history downloaded successfully')
        } catch (error) {
            // Error logged server-side only
            toast.error('Failed to download chat history')
        }
    }

    const copyToClipboard = async () => {
        try {
            let text = ''

            // Group messages into Q&A pairs
            let questionCount = 0
            for (let i = 0; i < messages.length; i++) {
                const msg = messages[i]

                if (msg.role === 'user') {
                    questionCount++
                    text += `Q${questionCount}: ${msg.text || msg.content || ''}\n\n`

                    // Check if next message is assistant's response
                    if (i + 1 < messages.length && messages[i + 1].role === 'assistant') {
                        const answer = messages[i + 1]
                        text += `A${questionCount}: ${answer.text || answer.content || ''}\n\n`
                        text += `${'-'.repeat(50)}\n\n`
                        i++ // Skip the assistant message since we already processed it
                    }
                }
            }

            await navigator.clipboard.writeText(text)
            toast.success('Chat history copied to clipboard')
        } catch (error) {
            // Error logged server-side only
            toast.error('Failed to copy to clipboard')
        }
    }

    if (messages.length === 0) {
        return (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
                <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-400">No chat history to download</p>
                <p className="text-sm text-gray-500 mt-1">Start a conversation to export your chat</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Export Chat History</h2>
                    <p className="text-sm text-gray-400">{messages.length} messages available</p>
                </div>
            </div>

            {/* Download Options */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Download as Text File */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={downloadAsText}
                        className="flex items-center justify-center gap-3 p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20 rounded-xl transition-all group"
                    >
                        <svg className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="text-left">
                            <p className="text-base font-semibold text-white">Download Chat</p>
                            <p className="text-sm text-gray-400">Save as Q&A text file</p>
                        </div>
                    </motion.button>

                    {/* Copy to Clipboard */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={copyToClipboard}
                        className="flex items-center justify-center gap-3 p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border border-green-500/20 rounded-xl transition-all group"
                    >
                        <svg className="w-10 h-10 text-green-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <div className="text-left">
                            <p className="text-base font-semibold text-white">Copy to Clipboard</p>
                            <p className="text-sm text-gray-400">Quick paste anywhere</p>
                        </div>
                    </motion.button>
                </div>

                {/* Format Example */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-300 mb-2">Export Format:</p>
                    <div className="text-xs text-gray-400 font-mono space-y-1">
                        <p>Q1: Your question here</p>
                        <p>A1: AI's response here</p>
                        <p className="text-gray-600">--------------------------------------</p>
                        <p>Q2: Next question...</p>
                    </div>
                </div>

                {/* Info */}
                <div className="flex items-start gap-2 text-sm text-gray-400 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p>
                        Chat history is exported as readable question-answer pairs in plain text format.
                        Perfect for sharing, reviewing, or backing up your conversations.
                    </p>
                </div>
            </div>
        </div>
    )
}
