import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDocumentStore } from '../../stores/documentStore'
import { toast } from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import MermaidRenderer from './MermaidRenderer'

export default function DocumentCard({ document }) {
    const activeDocuments = useDocumentStore(state => state.activeDocuments)
    const toggleDocumentActive = useDocumentStore(state => state.toggleDocumentActive)
    const removeDocument = useDocumentStore(state => state.removeDocument)
    
    const [isSummarizing, setIsSummarizing] = useState(false)
    const [showSummary, setShowSummary] = useState(false)
    const [summaryText, setSummaryText] = useState('')

    // Flashcard State
    const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false)
    const [showFlashcards, setShowFlashcards] = useState(false)
    const [flashcards, setFlashcards] = useState([])
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)

    // Roadmap State
    const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false)
    const [showRoadmap, setShowRoadmap] = useState(false)
    const [roadmapCode, setRoadmapCode] = useState('')

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

    const handleSummarize = async (e) => {
        e.stopPropagation()
        if (summaryText) {
            setShowSummary(true)
            return
        }
        
        setIsSummarizing(true)
        const toastId = toast.loading('Generating summary...')
        
        try {
            let token = null
            try {
                const authStorage = localStorage.getItem('auth-storage')
                if (authStorage) {
                    token = JSON.parse(authStorage).state.token
                }
            } catch (e) { console.error(e) }
            
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
            const response = await fetch(`${baseUrl}/documents/${encodeURIComponent(docName)}/summary`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            
            const data = await response.json()
            if (data.success) {
                setSummaryText(data.summary)
                setShowSummary(true)
                toast.success('Summary generated!', { id: toastId })
            } else {
                toast.error(data.message || "Failed to summarize", { id: toastId })
            }
        } catch (err) {
             toast.error("Summary failed", { id: toastId })
        } finally {
            setIsSummarizing(false)
        }
    }

    const handleFlashcards = async (e) => {
        e.stopPropagation()
        if (flashcards.length > 0) {
            setShowFlashcards(true)
            return
        }

        setIsGeneratingFlashcards(true)
        const toastId = toast.loading('Generating flashcards...')

        try {
            let token = null
            try {
                const authStorage = localStorage.getItem('auth-storage')
                if (authStorage) {
                    token = JSON.parse(authStorage).state.token
                }
            } catch (e) { console.error(e) }

            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
            const response = await fetch(`${baseUrl}/documents/${encodeURIComponent(docName)}/flashcards`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            const data = await response.json()
            if (data.success && data.flashcards && data.flashcards.length > 0) {
                setFlashcards(data.flashcards)
                setShowFlashcards(true)
                toast.success('Flashcards ready!', { id: toastId })
            } else {
                toast.error(data.message || "Failed to generate flashcards", { id: toastId })
            }
        } catch (err) {
            toast.error("Flashcard generation failed", { id: toastId })
        } finally {
            setIsGeneratingFlashcards(false)
        }
    }

    const handleRoadmap = async (e) => {
        e.stopPropagation()
        if (roadmapCode) {
            setShowRoadmap(true)
            return
        }

        setIsGeneratingRoadmap(true)
        const toastId = toast.loading('Generating roadmap...')

        try {
            let token = null
            try {
                const authStorage = localStorage.getItem('auth-storage')
                if (authStorage) {
                    token = JSON.parse(authStorage).state.token
                }
            } catch (e) { console.error(e) }

            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
            const response = await fetch(`${baseUrl}/documents/${encodeURIComponent(docName)}/roadmap`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            const data = await response.json()
            if (data.success) {
                setRoadmapCode(data.roadmap)
                setShowRoadmap(true)
                toast.success('Roadmap generated!', { id: toastId })
            } else {
                toast.error(data.message || "Failed to generate roadmap", { id: toastId })
            }
        } catch (err) {
            toast.error("Roadmap generation failed", { id: toastId })
        } finally {
            setIsGeneratingRoadmap(false)
        }
    }

    const nextCard = (e) => {
        e?.stopPropagation()
        if (currentCardIndex < flashcards.length - 1) {
            setIsFlipped(false)
            setCurrentCardIndex(prev => prev + 1)
        }
    }

    const prevCard = (e) => {
        e?.stopPropagation()
        if (currentCardIndex > 0) {
            setIsFlipped(false)
            setCurrentCardIndex(prev => prev - 1)
        }
    }

    return (
        <>
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
                
                {/* Flashcards button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleFlashcards}
                    disabled={isGeneratingFlashcards}
                    className={`
            opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity
            p-1 sm:p-1.5 rounded-lg hover:bg-purple-500/20 flex-shrink-0
            ${isActive ? 'text-white hover:text-purple-300' : 'text-gray-400 hover:text-purple-400'}
          `}
                    title="Study Flashcards"
                >
                    {isGeneratingFlashcards ? (
                        <svg className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24">
                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    )}
                </motion.button>

                {/* Roadmap button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleRoadmap}
                    disabled={isGeneratingRoadmap}
                    className={`
            opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity
            p-1 sm:p-1.5 rounded-lg hover:bg-blue-500/20 flex-shrink-0
            ${isActive ? 'text-white hover:text-blue-300' : 'text-gray-400 hover:text-blue-400'}
          `}
                    title="Generate Roadmap"
                >
                    {isGeneratingRoadmap ? (
                        <svg className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24">
                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                    )}
                </motion.button>

                {/* Summarize button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                    className={`
            opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity
            p-1 sm:p-1.5 rounded-lg hover:bg-yellow-500/20 flex-shrink-0
            ${isActive ? 'text-white hover:text-yellow-300' : 'text-gray-400 hover:text-yellow-400'}
          `}
                    title="Summarize document"
                >
                    {isSummarizing ? (
                        <svg className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24">
                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    )}
                </motion.button>

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

        {/* Summary Modal */}
        <AnimatePresence>
            {showSummary && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowSummary(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                            <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Summary: {truncatedName}
                            </h3>
                            <button 
                                onClick={() => setShowSummary(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryText}</ReactMarkdown>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Roadmap Modal */}
        <AnimatePresence>
            {showRoadmap && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowRoadmap(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                            <h3 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                Roadmap: {truncatedName}
                            </h3>
                            <button 
                                onClick={() => setShowRoadmap(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="w-full">
                             <MermaidRenderer chart={roadmapCode} />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Flashcards Modal */}
        <AnimatePresence>
            {showFlashcards && flashcards.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={() => setShowFlashcards(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-xl aspect-[3/2] relative"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Progress Indicator */}
                        <div className="absolute -top-10 left-0 right-0 flex justify-between items-center text-white">
                            <span className="text-lg font-medium text-purple-400">Flashcard {currentCardIndex + 1} of {flashcards.length}</span>
                            <button 
                                onClick={() => setShowFlashcards(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Card Container - The Flip Effect */}
                        <div 
                            className="w-full h-full relative cursor-pointer perspective-1000"
                            onClick={() => setIsFlipped(!isFlipped)}
                        >
                            <motion.div
                                className="w-full h-full relative preserve-3d transition-transform duration-500"
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* Front (Question) */}
                                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center justify-center p-8 text-center">
                                    <h4 className="text-sm uppercase tracking-wider text-purple-400 mb-4 font-semibold">Question</h4>
                                    <p className="text-xl sm:text-2xl text-white font-medium leading-relaxed">
                                        {flashcards[currentCardIndex].front}
                                    </p>
                                    <div className="absolute bottom-4 text-xs text-gray-500">Click to flip</div>
                                </div>

                                {/* Back (Answer) */}
                                <div 
                                    className="absolute inset-0 backface-hidden bg-gradient-to-br from-purple-900/80 to-indigo-900/80 rounded-2xl border border-purple-500/30 shadow-2xl flex flex-col items-center justify-center p-8 text-center"
                                    style={{ transform: 'rotateY(180deg)' }}
                                >
                                    {flashcards[currentCardIndex].image_url && (
                                        <div className="mb-4 w-full max-h-40 flex justify-center">
                                            <img 
                                                src={flashcards[currentCardIndex].image_url} 
                                                alt="Visual aid" 
                                                className="h-full object-contain rounded-lg border border-white/20 bg-black/20"
                                            />
                                        </div>
                                    )}
                                    <h4 className="text-sm uppercase tracking-wider text-cyan-300 mb-4 font-semibold">Answer</h4>
                                    <p className="text-lg sm:text-xl text-white leading-relaxed">
                                        {flashcards[currentCardIndex].back}
                                    </p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Controls */}
                        <div className="absolute -bottom-16 left-0 right-0 flex justify-center items-center gap-4">
                            <button
                                onClick={prevCard}
                                disabled={currentCardIndex === 0}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            
                            <div className="flex gap-1.5">
                                {flashcards.map((_, idx) => (
                                    <div 
                                        key={idx}
                                        className={`w-2 h-2 rounded-full transition-all ${idx === currentCardIndex ? 'bg-purple-500 w-4' : 'bg-gray-600'}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={nextCard}
                                disabled={currentCardIndex === flashcards.length - 1}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
        </>
    )
}
