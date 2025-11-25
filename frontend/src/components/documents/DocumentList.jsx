import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDocumentStore } from '../../stores/documentStore'
import { toast } from 'react-hot-toast'
import DocumentCard from './DocumentCard'

export default function DocumentList() {
    const documents = useDocumentStore(state => state.documents)
    const fetchDocuments = useDocumentStore(state => state.fetchDocuments)
    const clearDocuments = useDocumentStore(state => state.clearDocuments)
    const loading = useDocumentStore(state => state.loading)
    const currentDocument = useDocumentStore(state => state.currentDocument)

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

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-medium text-gray-400">
                    Documents ({documents.length})
                </h3>
                {documents.length > 0 && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleClearAll}
                        className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                    >
                        Clear All
                    </motion.button>
                )}
            </div>

            <div className="space-y-1.5">
                {documents.map((doc, index) => (
                    <DocumentCard key={doc.name || index} document={doc} />
                ))}
            </div>
        </div>
    )
}
