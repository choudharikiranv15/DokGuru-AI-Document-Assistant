import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDocumentStore } from '../../stores/documentStore'
import { toast } from 'react-hot-toast'
import DocumentCard from './DocumentCard'

export default function DocumentList() {
    const documents = useDocumentStore(state => state.documents)
    const activeDocuments = useDocumentStore(state => state.activeDocuments)
    const fetchDocuments = useDocumentStore(state => state.fetchDocuments)
    const clearDocuments = useDocumentStore(state => state.clearDocuments)
    const selectAllDocuments = useDocumentStore(state => state.selectAllDocuments)
    const deselectAllDocuments = useDocumentStore(state => state.deselectAllDocuments)
    const loading = useDocumentStore(state => state.loading)

    useEffect(() => {
        fetchDocuments()
    }, []) // Empty dependency - only fetch on mount to prevent infinite re-render

    const handleClearAll = async () => {
        if (confirm('Clear all documents from the vector store?')) {
            try {
                await clearDocuments()
                toast.success('All documents cleared')
            } catch (error) {
                toast.error('Failed to clear documents')
            }
        }
    }

    if (loading && documents.length === 0) {
        return (
            <div className="text-center py-6">
                <div className="animate-spin h-6 w-6 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-xs text-gray-500">Loading...</p>
            </div>
        )
    }

    if (documents.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6"
            >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-2">
                    <svg
                        className="h-6 w-6 text-cyan-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
                <p className="text-xs text-gray-400">No documents yet</p>
            </motion.div>
        )
    }

    const allSelected = documents.length > 0 && activeDocuments.length === documents.length

    return (
        <div className="space-y-2 sm:space-y-3">
            {/* Header with active count */}
            <div className="flex items-center justify-between px-1">
                <h3 className="text-xs sm:text-sm font-medium text-gray-300">
                    <span className="text-gray-400">Documents</span>
                    {activeDocuments.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-[10px] sm:text-xs">
                            {activeDocuments.length} active
                        </span>
                    )}
                </h3>
            </div>

            {/* Selection controls */}
            {documents.length > 0 && (
                <div className="flex items-center gap-2 px-1">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={allSelected ? deselectAllDocuments : selectAllDocuments}
                        className="flex-1 text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 hover:text-white transition-all"
                    >
                        {allSelected ? '✓ Deselect All' : 'Select All'}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleClearAll}
                        className="text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete all documents"
                    >
                        Clear All
                    </motion.button>
                </div>
            )}

            {/* Document list */}
            <div className="space-y-1.5 sm:space-y-2">
                {documents.map((doc, index) => (
                    <DocumentCard key={doc.name || index} document={doc} />
                ))}
            </div>
        </div>
    )
}
