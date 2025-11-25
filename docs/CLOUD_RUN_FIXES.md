# Cloud Run Deployment Fixes

## Issues Identified

### 1. **401 Unauthorized Errors** on `/upload` and `/ask`
**Cause:** These endpoints require JWT authentication but the frontend doesn't have a valid token.

**Fix:** Users must login/signup first to get a JWT token.

### 2. **Signup Failure**
**Cause:** Environment variables (SUPABASE_URL, SUPABASE_KEY, etc.) are not configured in Cloud Run.

**Fix:** Set all required environment variables in Cloud Run.

### 3. **503 Service Unavailable**
**Cause:** Backend service might be cold-starting or missing dependencies.

**Fix:** Increase timeout and ensure all dependencies are installed.

---

## Step 1: Set Environment Variables in Cloud Run

Run this command to set all required environment variables:

```bash
gcloud run services update dokguru-backend \
  --region asia-south1 \
  --project utilitarian-bee-479308-f9 \
  --set-env-vars "GROQ_API_KEY=your_groq_key_here" \
  --set-env-vars "SUPABASE_URL=your_supabase_url" \
  --set-env-vars "SUPABASE_KEY=your_supabase_key" \
  --set-env-vars "SECRET_KEY=$(python -c 'import secrets; print(secrets.token_hex(32))')" \
  --set-env-vars "GEMINI_API_KEY=your_gemini_key" \
  --set-env-vars "UPSTASH_REDIS_REST_URL=your_redis_url" \
  --set-env-vars "UPSTASH_REDIS_REST_TOKEN=your_redis_token" \
  --set-env-vars "CORS_ORIGINS=https://dokguru-backend-739437500880.asia-south1.run.app,http://localhost:3000,http://localhost:5173"
```

**Required Variables:**
- `GROQ_API_KEY` - For LLM (Groq)
- `SUPABASE_URL` - Database URL
- `SUPABASE_KEY` - Database API key
- `SECRET_KEY` - JWT secret (generate new one)
- `GEMINI_API_KEY` - For image analysis

**Optional but Recommended:**
- `UPSTASH_REDIS_REST_URL` - Redis caching
- `UPSTASH_REDIS_REST_TOKEN` - Redis auth
- `SENTRY_DSN` - Error tracking
- `POSTHOG_API_KEY` - Analytics

---

## Step 2: Update CORS Configuration

The current CORS configuration only allows localhost. We need to add the Cloud Run URL.

### Option A: Set via Environment Variable (Recommended)

```bash
gcloud run services update dokguru-backend \
  --region asia-south1 \
  --project utilitarian-bee-479308-f9 \
  --update-env-vars "CORS_ORIGINS=https://dokguru-backend-739437500880.asia-south1.run.app,http://localhost:3000,http://localhost:5173"
```

### Option B: Update Code

Edit `backend/app.py` line 181:

```python
# OLD:
cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:5174,http://localhost:3000').split(',')

# NEW:
cors_origins = os.getenv('CORS_ORIGINS',
    'https://dokguru-backend-739437500880.asia-south1.run.app,'
    'http://localhost:5173,http://localhost:5174,http://localhost:3000'
).split(',')
```

---

## Step 3: Fix Authentication Flow

The embedded frontend needs proper authentication. Users should:

1. **Signup:** POST to `/auth/signup` with email, password, name
2. **Login:** POST to `/auth/login` with email, password
3. **Get Token:** Save the JWT token from login response
4. **Use Token:** Include `Authorization: Bearer <token>` in all requests

### Test Authentication:

```bash
# 1. Signup
curl -X POST https://dokguru-backend-739437500880.asia-south1.run.app/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123!","name":"Test User"}'

# 2. Login
TOKEN=$(curl -s -X POST https://dokguru-backend-739437500880.asia-south1.run.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123!"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 3. Upload with token
curl -X POST https://dokguru-backend-739437500880.asia-south1.run.app/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"
```

---

## Step 4: Increase Cloud Run Timeout and Resources

```bash
gcloud run services update dokguru-backend \
  --region asia-south1 \
  --project utilitarian-bee-479308-f9 \
  --timeout 600 \
  --memory 4Gi \
  --cpu 2 \
  --max-instances 10 \
  --min-instances 1 \
  --concurrency 80
```

**Why:**
- `--timeout 600`: Allow 10 minutes for long streaming responses
- `--memory 4Gi`: Ensure enough memory for ML models + ChromaDB
- `--cpu 2`: Better performance for TTS generation
- `--min-instances 1`: Avoid cold starts (costs ~$20/month for always-on)
- `--concurrency 80`: Handle multiple requests per instance

---

## Step 5: Add Health Check Endpoint

Add this to `backend/app.py` to help Cloud Run determine service health:

```python
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Cloud Run"""
    return jsonify({
        'status': 'healthy',
        'timestamp': time.time(),
        'service': 'dokguru-backend'
    }), 200
```

---

## Step 6: Fix Frontend JavaScript

The frontend served at the root needs to handle authentication properly.

### Add to the embedded frontend HTML:

```html
<script>
// Check if user has token
let token = localStorage.getItem('auth_token');

// Login function
async function login(email, password) {
    const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
        token = data.token;
        localStorage.setItem('auth_token', token);
        return true;
    }
    return false;
}

// Upload with authentication
async function uploadFile(file) {
    if (!token) {
        alert('Please login first');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    return await response.json();
}

// Ask with authentication
async function askQuestion(question) {
    if (!token) {
        alert('Please login first');
        return;
    }

    const response = await fetch('/ask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question })
    });

    return await response.json();
}
</script>
```

---

## Step 7: Redeploy with All Fixes

```bash
cd backend

# Redeploy with updated code
gcloud run deploy dokguru-backend \
  --source . \
  --platform managed \
  --region asia-south1 \
  --project utilitarian-bee-479308-f9 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 600 \
  --max-instances 10 \
  --min-instances 1 \
  --concurrency 80 \
  --allow-unauthenticated \
  --set-env-vars-file=.env.production  # Create this file with all env vars
```

---

## Complete Environment Variables File

Create `backend/.env.production`:

```env
# Required
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here
SECRET_KEY=generate_with_python_secrets_module
GEMINI_API_KEY=your_gemini_api_key_here

# Optional but recommended
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
SENTRY_DSN=your_sentry_dsn_here
POSTHOG_API_KEY=your_posthog_key_here

# CORS
CORS_ORIGINS=https://dokguru-backend-739437500880.asia-south1.run.app,http://localhost:3000,http://localhost:5173

# ML Models (optional, reduces startup time)
DISABLE_ML_MODELS=false
```

---

## Testing After Deployment

### 1. Test Health Check
```bash
curl https://dokguru-backend-739437500880.asia-south1.run.app/health
```

Expected: `{"status":"healthy",...}`

### 2. Test Signup
```bash
curl -X POST https://dokguru-backend-739437500880.asia-south1.run.app/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!","name":"Test"}'
```

Expected: `{"success":true,"message":"Account created successfully"}`

### 3. Test Login
```bash
curl -X POST https://dokguru-backend-739437500880.asia-south1.run.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
```

Expected: `{"success":true,"token":"eyJ..."}`

### 4. Test Authenticated Upload
```bash
TOKEN="your_token_from_login"

curl -X POST https://dokguru-backend-739437500880.asia-south1.run.app/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"
```

Expected: `{"success":true,"document_id":"..."}`

---

## Common Issues and Solutions

### Issue: "GROQ_API_KEY is not set"
**Solution:** Set environment variable in Cloud Run console or via gcloud command

### Issue: "Supabase connection failed"
**Solution:** Verify SUPABASE_URL and SUPABASE_KEY are correct

### Issue: "CORS error from external domain"
**Solution:** Add the domain to CORS_ORIGINS environment variable

### Issue: "Service Unavailable (503)"
**Solution:**
- Check Cloud Run logs for errors
- Increase memory/CPU allocation
- Set min-instances to 1 to avoid cold starts

### Issue: "Request timeout"
**Solution:** Increase --timeout to 600 seconds

---

## Cost Optimization

### Current Setup Cost (Estimated):
- **With min-instances=0** (cold starts): ~$0-5/month (free tier)
- **With min-instances=1** (always-on): ~$15-25/month
- **With 4Gi memory + 2CPU**: ~$30-40/month with moderate traffic

### Recommendations:
1. **Development:** Use min-instances=0 (save costs, accept cold starts)
2. **Production:** Use min-instances=1 (better UX, predictable performance)
3. **High Traffic:** Scale to min-instances=2-3, max-instances=20

---

## Next Steps

1. ✅ Set all environment variables in Cloud Run
2. ✅ Update CORS configuration
3. ✅ Add health check endpoint
4. ✅ Redeploy backend
5. ✅ Test authentication flow
6. ✅ Test file upload
7. ✅ Test streaming chat
8. ✅ Monitor logs and metrics
9. ✅ Configure custom domain (optional)
10. ✅ Set up monitoring alerts (optional)

---

## Support

If issues persist:
1. Check Cloud Run logs: `gcloud run logs read dokguru-backend --region asia-south1`
2. Check environment variables: `gcloud run services describe dokguru-backend --region asia-south1`
3. Test locally: `docker build -t dokguru . && docker run -p 8080:8080 --env-file .env dokguru`
