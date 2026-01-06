# Testing Checklist - Features Branch → Main

## Overview
This checklist covers all changes in the `features` branch before merging to `main`.

**Total Commits to Test:** 6 commits
**Files Changed:** 49 files (2,306 additions, 835 deletions)

---

## 🔐 1. Authentication System (CRITICAL - Test First)

### 1.1 Supabase Auth Migration
- [ ] **Email/Password Signup**
  - Create new account with email/password
  - Verify email confirmation link is sent
  - Confirm email and login successfully
  - Check user profile is created in database (public.users table)
  - Verify role, institution, occupation fields are saved

- [ ] **Email/Password Login**
  - Login with existing credentials
  - Verify JWT token is stored in localStorage
  - Check `/auth/me` endpoint returns user data
  - Verify session persists on page refresh
  - Test logout clears session and redirects

- [ ] **Google OAuth (CRITICAL)**
  - Click "Sign in with Google" button
  - Verify OAuth redirect to Google
  - Complete Google authentication
  - **CHECK FOR REDIRECT LOOP** - Should redirect to /app ONCE only
  - Verify user profile is created in database
  - Check for ID mismatch errors in console
  - Test if user with same email already exists

- [ ] **Session Management**
  - Refresh page while logged in - should stay logged in
  - Open app in new tab - should be logged in
  - Test token refresh (wait 50+ minutes if possible)
  - Clear localStorage and refresh - should redirect to login

- [ ] **Protected Routes**
  - Access /app without login - should redirect to /login
  - Access /profile without login - should redirect to /login
  - Access /admin without admin privileges - should show error

### 1.2 Auth Edge Cases
- [ ] Signup with existing email - should show clear error
- [ ] Login with wrong password - should show error
- [ ] OAuth with account that has different ID - check for migration
- [ ] Network failure during login - check error handling
- [ ] Rate limiting on `/auth/me` - should be 100 requests/minute

---

## 💬 2. Chat Functionality

### 2.1 Chat History
- [ ] **Create New Chat**
  - Click "New Chat" button
  - Verify new chat session starts
  - Check chat limit counter (if on free plan)

- [ ] **Save Chat History**
  - Send multiple Q&A pairs (at least 5)
  - **VERIFY ALL MESSAGES ARE SAVED** (not just first pair)
  - Refresh page and check messages persist
  - Check chat appears in sidebar

- [ ] **Load Previous Chat**
  - Click on previous chat from sidebar
  - Verify ALL messages load correctly
  - Check document context is maintained

- [ ] **Chat Limits (Free Plan)**
  - Test chat limit enforcement
  - Verify error message when limit reached
  - Check that last chat auto-loads when limit reached

### 2.2 Chat Features
- [ ] **TTS (Text-to-Speech)**
  - Enable TTS for a response
  - **VERIFY COMPLETE AUDIO PLAYS** (not truncated)
  - Check audio duration matches response length
  - Test pause/resume/skip functionality
  - Verify no console errors

- [ ] **Flashcards** (NEW FEATURE)
  - Ask for flashcards from document
  - Verify flashcards generate correctly
  - Test flip animation
  - Check visual AI integration if applicable

- [ ] **Summaries** (NEW FEATURE)
  - Request summary of document
  - Verify summary quality and length
  - Check formatting

- [ ] **Roadmaps** (NEW FEATURE)
  - Ask for a roadmap/flowchart
  - Verify Mermaid diagram renders correctly
  - Test different diagram types

- [ ] **Citations**
  - Check that responses include page references
  - Verify citations are accurate

---

## 📄 3. Document Management

### 3.1 Document Upload
- [ ] Upload PDF document
  - Check upload progress indicator
  - Verify document appears in list immediately (not after refresh)
  - Check processing status updates
  - Verify document is searchable after processing

- [ ] Upload multiple documents
  - Test concurrent uploads
  - Check each document processes correctly

- [ ] Upload error handling
  - Try uploading non-PDF file
  - Try uploading very large file (>50MB)
  - Test network interruption during upload

### 3.2 Document Operations
- [ ] View document details
- [ ] Delete document
- [ ] Search documents
- [ ] Filter documents by category

---

## 🎤 4. Text-to-Speech (TTS) - Audio Compression

### 4.1 Audio Format & Compression (NEW)
- [ ] **Piper TTS (English/Hindi)**
  - Generate TTS audio
  - **CHECK FILE FORMAT** - Should be MP3 (not WAV)
  - Verify file size is smaller (~10x smaller than WAV)
  - Check audio quality is good (128kbps)
  - Verify duration is accurate
  - Check for compression logs in backend

- [ ] **EdgeTTS (Indian Languages)**
  - Test Hindi, Kannada, or other regional language
  - Verify MP3 format is used
  - Check audio quality

- [ ] **Azure TTS** (if configured)
  - Test Azure TTS generation
  - **CHECK FILE FORMAT** - Should be MP3 (not WAV)
  - Verify compression works
  - Check fallback to WAV if compression fails

- [ ] **Audio Playback**
  - Play complete audio (no truncation)
  - Test audio controls (pause, resume, stop)
  - Verify audio preloads correctly
  - Check no console errors

### 4.2 TTS Edge Cases
- [ ] Generate very long TTS (3000+ chars)
- [ ] Test fallback engines (Piper → Edge → gTTS)
- [ ] Test with special characters and emojis
- [ ] Check caching - second request for same text should be instant

---

## ⚡ 5. Performance Optimizations (NEW)

### 5.1 Database Query Performance
- [ ] **User Profile Caching**
  - Login and check `/auth/me` response time
  - Refresh page multiple times - subsequent loads should be faster (<50ms)
  - Check backend logs for "cached" mentions
  - Wait 5+ minutes and verify cache expires correctly

- [ ] **Optimized SELECT Queries**
  - Open browser DevTools → Network tab
  - Monitor API responses for:
    - `/auth/me` - should return only needed user fields
    - `/api/documents` - should return only needed document fields
    - `/api/chat-histories` - should return only needed fields
  - Check response payload sizes are smaller

### 5.2 Frontend Performance
- [ ] **Code Splitting (NEW)**
  - Clear browser cache
  - Open DevTools → Network tab
  - Load homepage (/)
  - **CHECK:** Landing page should load quickly without all pages
  - Navigate to /login
  - **CHECK:** Login page code loads separately (lazy loaded)
  - Navigate to /app
  - **CHECK:** App page code loads separately
  - Monitor bundle sizes - initial bundle should be smaller

- [ ] **Lazy Loading**
  - Navigate between routes multiple times
  - Check for loading spinners (PageLoader component)
  - Verify no blank screens during transitions

### 5.3 Rate Limiting
- [ ] `/auth/me` - 100 requests/minute (up from 50/hour)
- [ ] `/api/upload-status` - 200 requests/minute (up from 50/hour)
- [ ] Test rate limit errors show gracefully

---

## 🔧 6. RAG System & Context Rules

### 6.1 Document Search
- [ ] Test RAG retrieval accuracy
- [ ] Verify strict context rules (no hallucination)
- [ ] Check citation accuracy

### 6.2 Vector Store
- [ ] Test ChromaDB operations
- [ ] Verify Supabase vector store (if used)

---

## 🎨 7. UI/UX

### 7.1 Visual Components
- [ ] Flashcard deck animation works smoothly
- [ ] Mermaid diagrams render correctly
- [ ] Google OAuth button displays correctly
- [ ] New Chat button shows chat limits correctly
- [ ] Loading states show properly

### 7.2 Responsive Design
- [ ] Test on mobile viewport (375px)
- [ ] Test on tablet (768px)
- [ ] Test on desktop (1920px)

### 7.3 Error Messages
- [ ] All error messages are user-friendly
- [ ] No console errors in production
- [ ] Toast notifications work correctly

---

## 🔒 8. Security & CORS

### 8.1 CORS Configuration
- [ ] Test API calls from frontend domain
- [ ] Verify CORS headers are correct
- [ ] Check allowed origins include:
  - `https://dokguru.in`
  - Your backend URL
  - Development URLs (if testing locally)

### 8.2 JWT Security
- [ ] JWT tokens use ES256 (Supabase) or HS256 (fallback)
- [ ] Tokens expire correctly
- [ ] Invalid tokens are rejected
- [ ] Token verification uses correct public keys

---

## 📊 9. Admin Features

### 9.1 Admin Dashboard (if applicable)
- [ ] Access `/admin` with admin account
- [ ] View user analytics
- [ ] View feedback analytics
- [ ] All database queries use optimized SELECT (not SELECT *)

---

## 🐛 10. Known Issues to Verify Fixed

- [ ] **OAuth Redirect Loop** - Should NOT occur
- [ ] **Chat History Only Saving First Q&A** - Should save ALL messages
- [ ] **TTS Audio Truncation (190s → 4s)** - Should play complete audio
- [ ] **Rate Limit 429 Errors on /auth/me** - Should NOT occur (limit increased)
- [ ] **Documents Not Appearing After Upload** - Should appear immediately
- [ ] **Console Log Pollution** - No unnecessary console logs

---

## 🚀 11. Deployment & Environment

### 11.1 Environment Variables
- [ ] Check all required env vars are set:
  - `SUPABASE_URL`
  - `SUPABASE_KEY` (service role)
  - `SUPABASE_JWT_SECRET`
  - `DATABASE_URL`
  - Frontend URLs for CORS
  - TTS API keys (if using premium services)

### 11.2 Database Migrations
- [ ] **CRITICAL:** Apply migration 026_fix_oauth_trigger.sql in Supabase SQL Editor
- [ ] Verify trigger creates users automatically on signup
- [ ] Check all database indexes are present

### 11.3 CI/CD
- [ ] Backend deployment workflow works
- [ ] Frontend deployment workflow works
- [ ] Check Cloud Run logs for errors

---

## 📝 12. Regression Testing

Test these core features to ensure nothing broke:
- [ ] Basic chat functionality (ask a question)
- [ ] PDF upload and processing
- [ ] User profile page
- [ ] Logout functionality
- [ ] Password reset (if implemented)

---

## ✅ Testing Priority

### 🔴 **CRITICAL (Must Test)**
1. OAuth Login (Google) - check for redirect loop
2. Chat history saving all messages (not just first Q&A)
3. TTS complete audio playback (not truncated)
4. Document upload appearing immediately
5. Database migration 026_fix_oauth_trigger.sql

### 🟡 **HIGH (Should Test)**
6. Rate limiting improvements
7. Audio compression (WAV → MP3)
8. Code splitting and lazy loading
9. Database query optimizations
10. New features (Flashcards, Summaries, Roadmaps)

### 🟢 **MEDIUM (Nice to Test)**
11. Cache expiration (5-minute TTL)
12. Admin dashboard
13. Responsive design
14. Error messages

---

## 📞 Testing Environment Setup

### Local Testing
```bash
# Backend
cd backend
python app.py

# Frontend
cd frontend
npm run dev
```

### Staging/Production Testing
- Test on actual deployment URLs
- Use real Supabase instance
- Test with real Google OAuth credentials

---

## 🐞 Bug Reporting Template

If you find issues:
```
**Issue:** [Brief description]
**Steps to Reproduce:**
1. ...
2. ...
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Console Errors:** [Any errors in console]
**Screenshot:** [If applicable]
```

---

## 📋 Sign-off Checklist

Before merging to main:
- [ ] All CRITICAL tests pass
- [ ] No console errors in production
- [ ] No rate limit errors
- [ ] Database migration applied successfully
- [ ] Performance improvements verified (faster load times)
- [ ] Audio compression working (MP3 files ~10x smaller)
- [ ] OAuth works without redirect loop
- [ ] Chat history persists correctly
- [ ] TTS audio plays completely
- [ ] Code review completed
- [ ] Deployment successful on staging

---

**Estimated Testing Time:** 2-3 hours for comprehensive testing
**Recommended:** Test CRITICAL items first, then work through HIGH and MEDIUM priority items.
