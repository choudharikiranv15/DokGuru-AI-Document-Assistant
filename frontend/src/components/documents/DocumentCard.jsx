import { motion } from 'framer-motion'
import { useDocumentStore } from '../../stores/documentStore'
import { toast } from 'react-hot-toast'

export default function DocumentCard({ document }) {
    const activeDocuments = useDocumentStore(state => state.activeDocuments)
    const toggleDocumentActive = useDocumentStore(state => state.toggleDocumentActive)
    const removeDocument = useDocumentStore(state => state.removeDocument)

    // Defensive check - ensure document is valid
    if (!document || typeof document !== 'object') {
        // Error logged server-side only
        return null
    }

    // Extract values safely
    const docName = String(document.name || 'Unknown')
    const totalChunks = Number(document.total_chunks || 0)
    const textChunks = Number(document.text_chunks || 0)
    const tableChunks = Number(document.table_chunks || 0)
    const imageChunks = Number(document.image_chunks || 0)

    const isActive = activeDocuments.some(doc => doc.name === docName)

    // Truncate long document names
    const truncatedName = docName.length > 40 ? docName.substring(0, 37) + '...' : docName

    const handleDelete = async (e) => {
        e.stopPropagation()
        if (confirm(`Delete "${docName}"?`)) {
            try {
                await removeDocument(docName)
                toast.success('Document deleted')
            } catch (error) {
                toast.error('Failed to delete document')
            }
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className={`
        p-3 rounded-lg transition-all duration-200 group backdrop-blur-sm
        ${isActive
                    ? 'bg-gradient-to-r from-cyan-600/90 to-purple-600/90 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                }
      `}
        >
            <div className="flex items-center gap-2 sm:gap-3">
                {/* Checkbox for multi-select */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                        e.stopPropagation()
                        toggleDocumentActive(document)
                    }}
                    className="flex-shrink-0 focus:outline-none"
                    title={isActive ? 'Remove from active documents' : 'Add to active documents'}
                >
                    <div className={`
                        w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center transition-all
                        ${isActive
                            ? 'bg-white border-white'
                            : 'border-gray-400 hover:border-cyan-400'
                        }
                    `}>
                        {isActive && (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                </motion.button>

                {/* Document icon */}
                <div className={`
          w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0
          ${isActive ? 'bg-white/20' : 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20'}
        `}>
                    <svg
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-cyan-400'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                    </svg>
                </div>

                {/* Document info */}
                <div className="flex-1 min-w-0">
                    <p
                        className={`text-xs sm:text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-200'}`}
                        title={docName}
                    >
                        {truncatedName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] sm:text-xs ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                            {totalChunks} chunks
                        </span>
                    </div>
                </div>

                {/* Delete button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleDelete}
                    className={`
            opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity
            p-1 sm:p-1.5 rounded-lg hover:bg-red-500/20 flex-shrink-0
            ${isActive ? 'text-white hover:text-red-300' : 'text-gray-400 hover:text-red-400'}
          `}
                    title="Delete document"
                >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </motion.button>
            </div>
        </motion.div>
    )
}
