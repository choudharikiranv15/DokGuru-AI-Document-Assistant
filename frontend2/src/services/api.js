import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const { state } = JSON.parse(authStorage);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  return config;
});

// Auth Functions
export const login = (credentials) => api.post('/auth/login', credentials);
export const signup = (userData) => api.post('/auth/signup', userData);

// Document Functions
export const getDocuments = () => api.get('/documents');
export const uploadDocument = (formData) => api.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteDocument = (filename) => api.delete(`/documents/${filename}`);

// Chat Functions
export const askQuestion = async (question, documentNames, language = 'auto', history = []) => {
  try {
    const response = await api.post('/ask', {
      question,
      document_names: documentNames,
      language,
      history
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default api;
