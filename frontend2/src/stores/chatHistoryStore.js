import { create } from 'zustand';
import api from '../services/api';

export const useChatHistoryStore = create((set) => ({
  currentChatId: null,
  saveChatHistory: async (messages, docName, docId) => {
    // Basic implementation to avoid errors
    console.log('Saving chat history...', { docName, docId });
    return true;
  },
}));
