# Security Best Practices - DokGuru Voice

## 🔒 Overview

This document outlines security best practices for the DokGuru Voice application. Following these guidelines helps protect against common web vulnerabilities including XSS, CSRF, SQL injection, and token theft.

---

## 🛡️ Current Security Measures

### 1. **Authentication & Authorization**
- ✅ Supabase Auth with JWT tokens (ES256 signing)
- ✅ Bearer token authentication (HTTPS only)
- ✅ Token stored in localStorage with Zustand persist
- ✅ Automatic token refresh via Supabase SDK
- ✅ Short-lived tokens (1 hour expiry)
- ✅ Rate limiting on auth endpoints

### 2. **Content Security Policy (CSP)**
Enhanced CSP headers prevent XSS attacks:
```
- frame-ancestors: 'none' (prevents clickjacking)
- base-uri: 'self' (prevents base tag injection)
- object-src: 'none' (blocks plugins)
- form-action: restricted
- upgrade-insecure-requests: true
```

### 3. **Input Sanitization**
Frontend utilities in `frontend/src/utils/security.js`:
- HTML sanitization
- URL validation
- Search query cleaning
- Filename sanitization
- Pattern detection for attacks

### 4. **Security Monitoring**
Backend JWT handler monitors for:
- High request rates (>100/min per user)
- Multiple IPs (>3 IPs in 5 min)
- Invalid token attempts
- Suspicious patterns

---

## 📋 Developer Guidelines

### **Frontend Development**

#### **1. Displaying User Content**

**Always sanitize before rendering:**
```javascript
import { escapeHTML, sanitizeHTML } from '@/utils/security';

// For plain text display
<div>{escapeHTML(userInput)}</div>

// For HTML content (with allowed tags)
<div dangerouslySetInnerHTML={{
  __html: sanitizeHTML(userContent, {
    allowedTags: ['b', 'i', 'p', 'br']
  })
}} />
```

#### **2. Handling URLs**

**Validate URLs before using:**
```javascript
import { sanitizeURL } from '@/utils/security';

const handleLink = (url) => {
  const safeUrl = sanitizeURL(url);
  if (safeUrl) {
    window.open(safeUrl, '_blank', 'noopener,noreferrer');
  }
};
```

#### **3. Form Validation**

**Validate on both client and server:**
```javascript
import { isValidEmail, validatePassword } from '@/utils/security';

const handleSignup = (email, password) => {
  if (!isValidEmail(email)) {
    toast.error('Invalid email format');
    return;
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.isValid) {
    toast.error(passwordCheck.messages.join('. '));
    return;
  }

  // Proceed with signup
};
```

#### **4. Search Queries**

**Sanitize search input:**
```javascript
import { sanitizeSearchQuery } from '@/utils/security';

const handleSearch = (query) => {
  const safeQuery = sanitizeSearchQuery(query, {
    maxLength: 500,
    allowSpecialChars: false
  });

  api.searchDocuments(safeQuery);
};
```

#### **5. File Uploads**

**Sanitize filenames:**
```javascript
import { sanitizeFilename } from '@/utils/security';

const handleFileUpload = (file) => {
  const safeName = sanitizeFilename(file.name);
  const renamedFile = new File([file], safeName, { type: file.type });

  api.uploadDocument(renamedFile);
};
```

---

### **Backend Development**

#### **1. Input Validation**

**Use security middleware:**
```python
from src.security.middleware import validate_request_size, check_suspicious_patterns

@app.route('/api/search', methods=['POST'])
@require_auth
@validate_request_size
def search():
    query = request.json.get('query', '')

    # Check for suspicious patterns
    suspicious = check_suspicious_patterns(query)
    if suspicious:
        log_security_event('Suspicious input detected', {
            'patterns': suspicious,
            'user_id': request.user_id,
            'ip': request.remote_addr
        })
        return jsonify({'error': 'Invalid input'}), 400

    # Process query
    ...
```

#### **2. Database Queries**

**Always use parameterized queries:**
```python
# ✅ GOOD - Parameterized
cursor.execute(
    "SELECT * FROM users WHERE email = %s",
    (email,)
)

# ❌ BAD - String concatenation
cursor.execute(f"SELECT * FROM users WHERE email = '{email}'")
```

#### **3. JWT Token Validation**

**Pass request IP for monitoring:**
```python
from src.auth.jwt_handler import verify_jwt

@require_auth
def protected_endpoint():
    # Decorator handles verification with IP tracking
    user_id = request.user_id
    ...
```

#### **4. Rate Limiting**

**Apply appropriate limits:**
```python
# Sensitive endpoints
@limiter.limit("3 per hour")  # Password reset, account creation

# Auth endpoints
@limiter.limit("5 per minute")  # Login attempts

# Frequent endpoints
@limiter.limit("100 per minute")  # /auth/me, status checks

# Heavy operations
@limiter.limit("10 per minute")  # Document uploads, TTS
```

#### **5. Error Handling**

**Don't leak sensitive info:**
```python
try:
    # Process request
    ...
except Exception as e:
    logger.error(f"Error in endpoint: {str(e)}")
    capture_exception(e)  # Sentry

    # Generic message to user
    return jsonify({
        'success': False,
        'message': 'An error occurred. Please try again.'
    }), 500
```

---

## 🚨 Common Vulnerabilities & Prevention

### **1. Cross-Site Scripting (XSS)**

**Attack:** Injecting malicious scripts into web pages
```javascript
// Attacker input: <script>steal_tokens()</script>
```

**Prevention:**
- ✅ Use `escapeHTML()` for all user content
- ✅ CSP headers block inline scripts
- ✅ Never use `eval()` or `innerHTML` with user input
- ✅ Validate URLs before navigation

### **2. SQL Injection**

**Attack:** Manipulating database queries
```sql
-- Attacker input: ' OR '1'='1
SELECT * FROM users WHERE email = '' OR '1'='1'  -- Returns all users
```

**Prevention:**
- ✅ Always use parameterized queries
- ✅ Sanitize search input
- ✅ Use ORM/query builder when possible
- ✅ Limit database permissions

### **3. Cross-Site Request Forgery (CSRF)**

**Attack:** Tricking users into making unwanted requests

**Why We're Protected:**
- ✅ Bearer tokens (not cookies) = CSRF immune
- ✅ SameSite cookie policy if we add cookies
- ✅ Check Origin/Referer headers
- ✅ Rate limiting prevents automation

### **4. Token Theft**

**Attack:** Stealing authentication tokens via XSS

**Prevention:**
- ✅ HTTPS everywhere (prevents MITM)
- ✅ Short token expiry (1 hour)
- ✅ Automatic token refresh
- ✅ Security monitoring for suspicious usage
- ✅ CSP prevents XSS attacks
- ⚠️ Can't use HttpOnly cookies with Supabase (by design)

### **5. Clickjacking**

**Attack:** Overlaying invisible iframes to capture clicks

**Prevention:**
- ✅ `frame-ancestors: 'none'` in CSP
- ✅ `X-Frame-Options: DENY` header
- ✅ No iframes allowed (`frame-src: 'none'`)

### **6. Path Traversal**

**Attack:** Accessing files outside intended directory
```
// Attacker input: ../../etc/passwd
```

**Prevention:**
- ✅ Sanitize filenames
- ✅ Validate file paths
- ✅ Use absolute paths internally
- ✅ Check for `../` patterns

---

## 🔍 Security Monitoring

### **What We Monitor:**

1. **Token Usage Patterns**
   - High request rates
   - Multiple IP addresses
   - Unusual access times

2. **Input Patterns**
   - SQL injection attempts
   - XSS payloads
   - Path traversal attempts
   - Command injection

3. **Authentication Events**
   - Failed login attempts
   - Token validation failures
   - Suspicious OAuth redirects

4. **Error Rates**
   - Sentry error tracking
   - Rate limit violations
   - Validation failures

### **Logs to Review:**

```bash
# Backend logs (Cloud Run)
gcloud logging read "resource.type=cloud_run_revision" --limit 100

# Check security events
grep "Suspicious" /var/log/app.log

# Monitor rate limits
grep "Rate limit exceeded" /var/log/app.log
```

---

## 📊 Security Checklist

### **Before Deploying:**

- [ ] All environment variables secured (no hardcoded secrets)
- [ ] HTTPS enabled and enforced
- [ ] CSP headers properly configured
- [ ] Rate limiting active on all endpoints
- [ ] Database migrations applied (including auth triggers)
- [ ] Input sanitization functions used
- [ ] Error handling doesn't leak info
- [ ] Sentry error tracking enabled
- [ ] Security monitoring active

### **Regular Maintenance:**

- [ ] Review Sentry errors weekly
- [ ] Check security logs for anomalies
- [ ] Update dependencies monthly
- [ ] Rotate API keys quarterly
- [ ] Review access permissions
- [ ] Test security measures
- [ ] Update CSP as needed

---

## 🆘 Incident Response

### **If Token Theft Suspected:**

1. **Immediate Actions:**
   ```python
   # Invalidate all tokens for user
   supabase_admin.auth.admin.sign_out(user_id)

   # Force password reset
   supabase_admin.auth.admin.generate_link({
       'type': 'recovery',
       'email': user_email
   })
   ```

2. **Investigation:**
   - Check Sentry for errors
   - Review security logs
   - Identify attack vector
   - Assess data exposure

3. **Notification:**
   - Alert affected users
   - Document incident
   - Update security measures

### **If XSS Discovered:**

1. **Immediate Actions:**
   - Deploy sanitization fix
   - Clear affected caches
   - Notify users if needed

2. **Prevention:**
   - Audit all user input points
   - Enhance CSP if needed
   - Add regression tests

---

## 🔗 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [Content Security Policy Guide](https://content-security-policy.com/)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)

---

## 📝 Questions or Concerns?

If you discover a security vulnerability:
1. **DO NOT** create a public GitHub issue
2. Email security concerns privately
3. Follow responsible disclosure

---

**Last Updated:** 2026-01-06
**Version:** 1.0
**Maintainer:** Development Team
