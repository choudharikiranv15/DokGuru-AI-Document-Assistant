import { create } from 'zustand'
import { listDocuments, deleteDocument, clearAllDocuments } from '../services/api'

export const useDocumentStore = create((set, get) => ({
    documents: [],
    activeDocuments: [], // Changed from currentDocument (single) to activeDocuments (array)
    loading: false,
    error: null,

    // Fetch documents from backend
    fetchDocuments: async () => {
        set({ loading: true, error: null })
        try {
            const docs = await listDocuments()
            // Backend returns array of document objects with {name, total_chunks, text_chunks, etc.}
            const formattedDocs = docs.map((doc, index) => ({
                id: index,
                name: doc.name,
                total_chunks: doc.total_chunks,
                text_chunks: doc.text_chunks,
                table_chunks: doc.table_chunks,
                image_chunks: doc.image_chunks
            }))
            set({ documents: formattedDocs, loading: false })
        } catch (error) {
            set({ error: error.message, loading: false })
        }
    },

    addDocument: (document) => set((state) => {
        const newDoc = { ...document, id: Date.now() }
        return {
            documents: [...state.documents, newDoc],
            // Auto-activate newly uploaded document
            activeDocuments: [...state.activeDocuments, newDoc]
        }
    }),

    // Toggle document active/inactive
    toggleDocumentActive: (document) => set((state) => {
        const isActive = state.activeDocuments.some(doc => doc.name === document.name)
        return {
            activeDocuments: isActive
                ? state.activeDocuments.filter(doc => doc.name !== document.name)
                : [...state.activeDocuments, document]
        }
    }),

    // Set multiple active documents
    setActiveDocuments: (documents) => set({ activeDocuments: documents }),

    // Select all documents
    selectAllDocuments: () => set((state) => ({
        activeDocuments: [...state.documents]
    })),

    // Deselect all documents
    deselectAllDocuments: () => set({ activeDocuments: [] }),

    // Backward compatibility: setCurrentDocument now adds to active list
    setCurrentDocument: (document) => set((state) => {
        const isAlreadyActive = state.activeDocuments.some(doc => doc.name === document?.name)
        if (!document) {
            return { activeDocuments: [] }
        }
        if (isAlreadyActive) {
            return {} // No change
        }
        return {
            activeDocuments: [...state.activeDocuments, document]
        }
    }),

    // Backward compatibility: get first active document as current
    getCurrentDocument: () => {
        const state = get()
        return state.activeDocuments[0] || null
    },

    removeDocument: async (documentName) => {
        set({ loading: true, error: null })
        try {
            await deleteDocument(documentName)
            set((state) => ({
                documents: state.documents.filter(doc => doc.name !== documentName),
                activeDocuments: state.activeDocuments.filter(doc => doc.name !== documentName),
                loading: false
            }))
        } catch (error) {
            set({ error: error.message, loading: false })
        }
    },

    clearDocuments: async () => {
        set({ loading: true, error: null })
        try {
            await clearAllDocuments()
            set({ documents: [], activeDocuments: [], loading: false })
        } catch (error) {
            set({ error: error.message, loading: false })
        }
    }
}))
