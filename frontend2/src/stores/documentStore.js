import { create } from 'zustand';
import api from '../services/api';

export const useDocumentStore = create((set, get) => ({
  documents: [],
  activeDocuments: [],
  loading: false,
  error: null,

  fetchDocuments: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/documents');
      if (response.data.success) {
        const formattedDocs = response.data.documents.map((doc, index) => ({
          id: index,
          name: doc.name,
          total_chunks: doc.total_chunks,
        }));
        set({ documents: formattedDocs, loading: false });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  addDocument: (document) => set((state) => ({
    documents: [...state.documents, { ...document, id: Date.now() }],
    activeDocuments: [...state.activeDocuments, { ...document, id: Date.now() }]
  })),

  toggleDocumentActive: (document) => set((state) => {
    const isActive = state.activeDocuments.some(doc => doc.name === document.name);
    return {
      activeDocuments: isActive
        ? state.activeDocuments.filter(doc => doc.name !== document.name)
        : [...state.activeDocuments, document]
    };
  }),

  removeDocument: async (documentName) => {
    try {
      await api.delete(`/documents/${encodeURIComponent(documentName)}`);
      set((state) => ({
        documents: state.documents.filter(doc => doc.name !== documentName),
        activeDocuments: state.activeDocuments.filter(doc => doc.name !== documentName),
      }));
    } catch (error) {
      console.error('Failed to delete document', error);
    }
  },
}));
