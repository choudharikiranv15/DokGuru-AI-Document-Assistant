import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { uploadDocumentWithProgress } from '../../services/api'
import { useDocumentStore } from '../../stores/documentStore'

export default function DocumentUpload({ variant = 'small' }) {
    // variant: 'small' (sidebar) or 'large' (main chat area)
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [progress, setProgress] = useState(0)
    const [statusMessage, setStatusMessage] = useState('')
    const fileInputRef = useRef(null)
    const addDocument = useDocumentStore(state => state.addDocument)
    const documents = useDocumentStore(state => state.documents)

    // Check document limit (5 max)
    const MAX_DOCUMENTS = 5
    const canUpload = documents.length < MAX_DOCUMENTS

    const isLarge = variant === 'large'

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const handleChange = (e) => {
        e.preventDefault()
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0])
        }
    }

    const handleFile = async (file) => {
        if (!file.name.endsWith('.pdf')) {
            toast.error('Please upload a PDF file')
            return
        }

        // Check limit before uploading
        if (!canUpload) {
            toast.error(`Document limit reached (${MAX_DOCUMENTS} max). Delete a document to upload more.`)
            return
        }

        // Check file size (10MB max)
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
            toast.error('File too large. Maximum size is 10MB.')
            return
        }

        setUploading(true)
        setProgress(5)
        setStatusMessage('Uploading file...')

        try {
            // Use async upload with progress tracking
            const result = await uploadDocumentWithProgress(file, (status) => {
                // Update progress from backend
                setProgress(status.progress)
                setStatusMessage(status.message)
            })

            addDocument(result)

            // Refresh the document list from backend
            const fetchDocuments = useDocumentStore.getState().fetchDocuments
            await fetchDocuments()

            toast.success(`Document processed in ${result.processingTime || '?'}s!`)
        } catch (error) {
            toast.error(error.message || 'Failed to upload document')
        } finally {
            setUploading(false)
            setProgress(0)
            setStatusMessage('')
        }
    }

    return (
        <div>
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleChange}
                className="hidden"
            />

            <motion.div
                whileHover={{ scale: uploading || !canUpload ? 1 : (isLarge ? 1.01 : 1.02) }}
                whileTap={{ scale: uploading || !canUpload ? 1 : 0.98 }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !uploading && canUpload && fileInputRef.current?.click()}
                className={`
          border-2 border-dashed rounded-xl text-center cursor-pointer
          transition-all duration-200 backdrop-blur-sm relative overflow-hidden
          ${isLarge ? 'p-8 sm:p-12' : 'p-4'}
          ${dragActive
                        ? 'border-cyan-500 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 shadow-lg shadow-cyan-500/20'
                        : !canUpload
                            ? 'border-red-500/30 bg-red-500/5 cursor-not-allowed'
                            : 'border-white/10 hover:border-cyan-500/50 bg-white/5'
                    }
          ${uploading ? 'cursor-wait' : ''}
        `}
            >
                {/* Progress bar overlay */}
                {uploading && (
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20"
                        transition={{ duration: 0.3 }}
                    />
                )}

                {isLarge ? (
                    // Large variant - for empty state in main chat area
                    <div className="relative z-10">
                        <div className="flex flex-col items-center gap-4">
                            <div className={`${isLarge ? 'w-16 h-16' : 'w-10 h-10'} rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center`}>
                                {uploading ? (
                                    <svg className={`${isLarge ? 'w-8 h-8' : 'w-5 h-5'} text-cyan-400 animate-spin`} fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : !canUpload ? (
                                    <svg className={`${isLarge ? 'w-8 h-8' : 'w-5 h-5'} text-red-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                ) : (
                                    <svg className={`${isLarge ? 'w-8 h-8' : 'w-5 h-5'} text-cyan-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                )}
                            </div>
                            <div className="text-center">
                                <p className={`${isLarge ? 'text-lg sm:text-xl' : 'text-sm'} text-gray-300 font-semibold mb-2`}>
                                    {uploading
                                        ? `Processing... ${progress}%`
                                        : !canUpload
                                            ? 'Document Limit Reached'
                                            : '1️⃣ Upload Your PDF to Get Started'}
                                </p>
                                <p className={`${isLarge ? 'text-sm sm:text-base' : 'text-xs'} text-gray-500`}>
                                    {uploading
                                        ? statusMessage || 'Please wait...'
                                        : !canUpload
                                            ? `Delete a document to upload more (${documents.length}/${MAX_DOCUMENTS})`
                                            : 'Drag & drop your PDF here or click to browse'}
                                </p>
                                {!uploading && canUpload && isLarge && (
                                    <>
                                        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-600">
                                            <span>📄 Research Papers</span>
                                            <span>•</span>
                                            <span>📚 Study Notes</span>
                                            <span>•</span>
                                            <span>📋 Reports</span>
                                        </div>
                                        <div className="mt-3 text-xs text-gray-600">
                                            PDF only • Max 10MB • Up to {MAX_DOCUMENTS} documents
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Small variant - for sidebar
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                            {uploading ? (
                                <svg className="w-5 h-5 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : !canUpload ? (
                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            ) : (
                                <svg
                                    className="w-5 h-5 text-cyan-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm text-gray-300 font-medium">
                                {uploading
                                    ? `Processing... ${progress}%`
                                    : !canUpload
                                        ? 'Limit Reached'
                                        : 'Upload PDF'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {uploading
                                    ? statusMessage || 'Please wait...'
                                    : !canUpload
                                        ? `Delete a document to upload more (${documents.length}/${MAX_DOCUMENTS})`
                                        : `Click or drop here (${documents.length}/${MAX_DOCUMENTS})`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Progress percentage badge */}
                {uploading && progress > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-2 right-2 bg-cyan-500/20 text-cyan-400 text-xs font-bold px-2 py-1 rounded-full"
                    >
                        {progress}%
                    </motion.div>
                )}
            </motion.div>
        </div>
    )
}
