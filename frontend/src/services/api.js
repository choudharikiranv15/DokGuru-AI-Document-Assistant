import axios from 'axios'

// Use environment variable for API URL, fallback to localhost for development
// Production URL hardcoded for Vercel deployment (Vercel env var bug workaround)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? 'https://dokguru-backend-739437500880.asia-south1.run.app' : 'http://localhost:8080')

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false, // Set to true if using cookies for auth
})

// Request interceptor to add auth token from localStorage
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const authStorage = localStorage.getItem('auth-storage')
        if (authStorage) {
            try {
                const authData = JSON.parse(authStorage)
                if (authData.state && authData.state.token) {
                    config.headers.Authorization = `Bearer ${authData.state.token}`
                }
            } catch (error) {
                // Error logged server-side only
            }
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Document APIs

// Async upload with background processing (FAST - recommended)
export const uploadDocumentAsync = async (file, onProgress = null) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/upload-async', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })

    if (!response.data.success) {
        throw new Error(response.data.message || 'Upload failed')
    }

    // Return job info for polling
    return {
        jobId: response.data.job_id,
        async: true,
        message: response.data.message
    }
}

// Poll upload status
export const getUploadStatus = async (jobId) => {
    const response = await api.get(`/upload-status/${jobId}`)

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get status')
    }

    return response.data.job
}

// Wait for upload to complete with smooth progress simulation
export const waitForUpload = async (jobId, onProgress = null, pollInterval = 400) => {
    return new Promise((resolve, reject) => {
        let simulatedProgress = 10
        let progressInterval = null

        // Get progress message based on current progress
        const getProgressMessage = (progress) => {
            if (progress < 20) return 'Uploading file...'
            if (progress < 35) return 'Extracting text content...'
            if (progress < 50) return 'Processing tables & images...'
            if (progress < 70) return 'Generating embeddings...'
            if (progress < 90) return 'Indexing document...'
            return 'Finalizing...'
        }

        // Simulate smooth progress between backend updates
        const startProgressSimulation = () => {
            progressInterval = setInterval(() => {
                if (simulatedProgress < 90) {
                    // Increment faster at start, slower as we progress
                    const increment = simulatedProgress < 40 ? 4 : simulatedProgress < 70 ? 2 : 1
                    simulatedProgress = Math.min(90, simulatedProgress + increment)

                    if (onProgress) {
                        onProgress({
                            progress: Math.round(simulatedProgress),
                            message: getProgressMessage(simulatedProgress),
                            status: 'processing'
                        })
                    }
                }
            }, 250)
        }

        const stopProgressSimulation = () => {
            if (progressInterval) {
                clearInterval(progressInterval)
                progressInterval = null
            }
        }

        // Start simulating progress
        startProgressSimulation()

        const poll = async () => {
            try {
                const status = await getUploadStatus(jobId)

                // Sync with backend progress if available and higher
                if (status.progress && status.progress > simulatedProgress) {
                    simulatedProgress = status.progress
                    if (onProgress) {
                        onProgress({
                            progress: Math.round(simulatedProgress),
                            message: status.message || getProgressMessage(simulatedProgress),
                            status: status.status
                        })
                    }
                }

                if (status.status === 'completed') {
                    stopProgressSimulation()
                    // Show 100% completion
                    if (onProgress) {
                        onProgress({
                            progress: 100,
                            message: 'Complete!',
                            status: 'completed'
                        })
                    }
                    setTimeout(() => resolve(status), 300)
                } else if (status.status === 'failed') {
                    stopProgressSimulation()
                    reject(new Error(status.error || 'Processing failed'))
                } else {
                    // Still processing, poll again
                    setTimeout(poll, pollInterval)
                }
            } catch (error) {
                stopProgressSimulation()
                reject(error)
            }
        }

        poll()
    })
}

// Combined async upload with progress tracking
export const uploadDocumentWithProgress = async (file, onProgress = null) => {
    // Step 1: Upload file (fast)
    const uploadResult = await uploadDocumentAsync(file)

    // Step 2: Wait for processing with progress updates
    const finalStatus = await waitForUpload(uploadResult.jobId, onProgress)

    // Return in same format as sync upload
    return {
        name: finalStatus.result?.document_name || file.name.replace('.pdf', ''),
        statistics: finalStatus.result?.statistics || {},
        processingTime: finalStatus.result?.statistics?.processing_time
    }
}

// Legacy sync upload (slower, but compatible)
export const uploadDocument = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })

    if (!response.data.success) {
        throw new Error(response.data.message || 'Upload failed')
    }

    return {
        name: response.data.message.replace('Successfully added ', ''),
        statistics: response.data.statistics,
    }
}

// Chat APIs
export const askQuestion = async (question, documentName = null, language = 'auto', chatHistory = []) => {
    // Format chat history for context (last 5 exchanges max)
    const formattedHistory = chatHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.text || msg.content
    }))

    const response = await api.post('/ask', {
        question,
        document_name: documentName,
        language: language,  // Support multilingual TTS
        chat_history: formattedHistory  // Include conversation context
    })

    if (!response.data.success) {
        throw new Error(response.data.message || 'Query failed')
    }

    return response.data
}

// TTS APIs
export const getSupportedLanguages = async () => {
    const response = await api.get('/tts/languages')

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get languages')
    }

    return response.data.languages
}

export const textToSpeech = async (text, language = 'auto') => {
    const response = await api.post('/speak', {
        text,
        language
    })

    if (!response.data.success) {
        throw new Error(response.data.message || 'TTS failed')
    }

    return response.data
}

// Streaming TTS - Returns blob URL for immediate playback
export const textToSpeechStreaming = async (text, language = 'auto') => {
    const authStorage = localStorage.getItem('auth-storage')
    let token = null

    if (authStorage) {
        try {
            const authData = JSON.parse(authStorage)
            if (authData.state && authData.state.token) {
                token = authData.state.token
            }
        } catch (error) {
            throw new Error('Authentication required')
        }
    }

    if (!token) {
        throw new Error('Authentication required for streaming TTS')
    }

    const response = await fetch(`${API_BASE_URL}/speak/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            text,
            language
        })
    })

    if (!response.ok) {
        throw new Error('Streaming TTS failed')
    }

    // Get the streaming audio blob
    const blob = await response.blob()

    // Create object URL for immediate playback
    const audioUrl = URL.createObjectURL(blob)

    return {
        audioUrl,
        blob,
        // Cleanup function to revoke object URL
        cleanup: () => URL.revokeObjectURL(audioUrl)
    }
}

// Document Management APIs
export const listDocuments = async () => {
    const response = await api.get('/documents')

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to list documents')
    }

    return response.data.documents
}

export const deleteDocument = async (documentName) => {
    const response = await api.delete(`/documents/${encodeURIComponent(documentName)}`)

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete document')
    }

    return response.data
}

export const clearAllDocuments = async () => {
    const response = await api.post('/documents/clear-all')

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to clear documents')
    }

    return response.data
}

// Voice APIs
export const transcribeAudio = async (audioBlob) => {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.wav')

    const response = await api.post('/transcribe', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })

    if (!response.data.success) {
        throw new Error(response.data.message || 'Transcription failed')
    }

    return response.data
}

export const voiceQuery = async (audioBlob) => {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'query.wav')

    const response = await api.post('/voice-query', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })

    if (!response.data.success) {
        throw new Error(response.data.message || 'Voice query failed')
    }

    return response.data
}

// System APIs
export const getStats = async () => {
    const response = await api.get('/stats')

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get stats')
    }

    return response.data.stats
}

// Voice Preference APIs
export const getAvailableEngines = async () => {
    const response = await api.get('/tts/engines')

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get available engines')
    }

    return response.data
}

export const getVoicePreferences = async () => {
    const response = await api.get('/voice/preferences')

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get voice preferences')
    }

    return response.data.preferences
}

export const updateVoicePreferences = async (preferences) => {
    const response = await api.put('/voice/preferences', preferences)

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update voice preferences')
    }

    return response.data
}

// Account Management APIs
export const changePassword = async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
    })

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to change password')
    }

    return response.data
}

export const changeEmail = async (newEmail, password) => {
    const response = await api.post('/auth/change-email', {
        new_email: newEmail,
        password: password
    })

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to change email')
    }

    return response.data
}

export const deleteAccount = async (password, confirmation) => {
    const response = await api.delete('/auth/delete-account', {
        data: {
            password: password,
            confirmation: confirmation
        }
    })

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete account')
    }

    return response.data
}

// Document Search & Categories APIs (Phase 2)
export const searchDocuments = async (query, category = null, tags = null) => {
    const params = new URLSearchParams()
    if (query) params.append('q', query)
    if (category) params.append('category', category)
    if (tags && tags.length > 0) params.append('tags', tags.join(','))

    const response = await api.get(`/documents/search?${params.toString()}`)

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to search documents')
    }

    return response.data
}

export const updateDocumentMetadata = async (documentId, updates) => {
    const response = await api.put(`/documents/${documentId}/metadata`, updates)

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update document')
    }

    return response.data
}

export const getDocumentCategories = async () => {
    const response = await api.get('/documents/categories')

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get categories')
    }

    return response.data.categories
}

// Usage Stats API
export const getUserLimits = async () => {
    const response = await api.get('/limits')

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get usage stats')
    }

    return response.data.usage
}

export default api
