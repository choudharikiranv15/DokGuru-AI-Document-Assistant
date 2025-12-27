# app_flask.py - Flask interface for RAG System with Voice Support
# Version: 2.3.1 - IAM Propagation Complete
from flask import Flask, render_template, request, jsonify, session, send_file, make_response, Response
import re
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from flask_compress import Compress
import os
from werkzeug.utils import secure_filename

# Try to import python-magic (requires libmagic on Linux)
# If it fails, use fallback MIME detection from filename
try:
    import magic
    MAGIC_AVAILABLE = True
except ImportError:
    MAGIC_AVAILABLE = False
    import mimetypes
    print("WARNING: python-magic not available (libmagic missing). Using fallback MIME detection.")

# ============= DEFERRED IMPORTS =============
# Import only lightweight modules immediately
# Heavy modules (ML, RAG, TTS, STT) imported inside functions to avoid slow startup
from src.auth.jwt_handler import generate_jwt, verify_jwt
from src.auth.decorators import require_auth, require_admin
from src.error_tracking import init_sentry, capture_exception, add_breadcrumb, set_user_context
from sentry_sdk import set_context, set_user

# Heavy imports will be done lazily inside initialization functions
# This prevents slow module loading from blocking port binding
import bcrypt
import secrets
import logging
import threading
import time
import atexit
import signal
from functools import lru_cache

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app FIRST (allows gunicorn to bind to port even if env validation fails)
app = Flask(__name__)

# ============= RESPONSE COMPRESSION =============
# Compress all responses > 500 bytes (saves 60-80% bandwidth)
# Supports gzip and deflate compression
try:
    Compress(app)
    logger.info("✓ Response compression enabled (gzip/deflate)")
except Exception as e:
    logger.warning(f"Compression initialization failed (non-critical): {e}")

# ============= ENVIRONMENT VALIDATION =============
def validate_environment():
    """Validate required environment variables are set"""
    REQUIRED_VARS = {
        'GROQ_API_KEY': 'LLM service (required for chat)',
        'SUPABASE_URL': 'Database (required for auth & data)',
        'SUPABASE_KEY': 'Database authentication',
        'SECRET_KEY': 'Session security (generate with: python -c "import secrets; print(secrets.token_hex(32))")',
        'GEMINI_API_KEY': 'Image analysis (required for visual content)',
    }

    OPTIONAL_VARS = {
        'UPSTASH_REDIS_REST_URL': 'Caching (will use in-memory fallback)',
        'UPSTASH_REDIS_REST_TOKEN': 'Redis authentication',
        'SENTRY_DSN': 'Error tracking (recommended for production)',
        'POSTHOG_API_KEY': 'Analytics (recommended for production)',
        'RESEND_API_KEY': 'Email service (required for password reset)',
        'AZURE_SPEECH_KEY': 'Premium TTS service (optional, falls back to gTTS)',
    }

    missing_required = []
    missing_optional = []

    # Debug: Log all required vars status
    logger.info("Checking required environment variables...")
    for var in REQUIRED_VARS.keys():
        val = os.getenv(var)
        if val:
            logger.info(f"  ✓ {var}: SET (length={len(val)})")
        else:
            logger.error(f"  ✗ {var}: NOT SET")

    for var, description in REQUIRED_VARS.items():
        if not os.getenv(var):
            missing_required.append(f"  [REQUIRED] {var}: {description}")

    for var, description in OPTIONAL_VARS.items():
        if not os.getenv(var):
            missing_optional.append(f"  [OPTIONAL] {var}: {description}")

    if missing_required:
        logger.error("\n" + "="*70)
        logger.error("CRITICAL: Missing Required Environment Variables")
        logger.error("="*70)
        for msg in missing_required:
            logger.error(msg)
        logger.error("\nPlease set these variables in your deployment platform (Cloud Run, Render, etc.)")
        logger.error("="*70 + "\n")
        # Don't raise - let the app start so the platform can detect the port
        # The app will fail gracefully when endpoints are accessed
        return False

    if missing_optional:
        logger.warning("\n" + "="*70)
        logger.warning("WARNING: Missing Optional Environment Variables")
        logger.warning("="*70)
        for msg in missing_optional:
            logger.warning(msg)
        logger.warning("\nApplication will run with reduced functionality.")
        logger.warning("="*70 + "\n")

    return True

# Validate environment after app creation (non-fatal)
try:
    env_valid = validate_environment()
    if not env_valid:
        logger.error("⚠️ App started with missing required environment variables. Configure them in your deployment platform.")
except Exception as e:
    logger.error(f"Environment validation failed: {e}")
    env_valid = False

# ============= RESOURCE CLEANUP =============
# Register cleanup handlers for graceful shutdown
def cleanup_thread_pool():
    """Cleanup thread pool executor on app shutdown"""
    if hasattr(app, 'tts_executor'):
        logger.info("🧹 Shutting down TTS thread pool...")
        try:
            app.tts_executor.shutdown(wait=True, cancel_futures=True)
            logger.info("✓ TTS thread pool shut down successfully")
        except Exception as e:
            logger.error(f"Error shutting down thread pool: {e}")

def cleanup_redis():
    """Cleanup Redis connection pool on app shutdown"""
    try:
        # Access the cache through the rag_system component if it's been initialized
        rag = _components._instances.get('rag_system')
        if rag and hasattr(rag, 'cache') and rag.cache:
            logger.info("🧹 Closing Redis connections...")
            rag.cache.close()
            logger.info("✓ Redis connections closed")
    except Exception as e:
        logger.error(f"Error closing Redis: {e}")

# Register cleanup handlers
atexit.register(cleanup_thread_pool)
atexit.register(cleanup_redis)

# Handle signals for Docker/Kubernetes graceful shutdown
def graceful_shutdown(signum, frame):
    """Handle shutdown signals gracefully"""
    cleanup_thread_pool()
    cleanup_redis()
    import sys
    sys.exit(0)

signal.signal(signal.SIGTERM, graceful_shutdown)
signal.signal(signal.SIGINT, graceful_shutdown)

# Initialize Sentry for error tracking (non-fatal)
try:
    init_sentry(app)
    logger.info("✓ Sentry initialized successfully")
except Exception as e:
    logger.warning(f"Sentry initialization failed (non-critical): {e}")
    # Continue without Sentry

# Security headers with Flask-Talisman
# Content Security Policy to prevent XSS, clickjacking, etc.
csp = {
    'default-src': "'self'",
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],  # Allow React and inline scripts
    'style-src': ["'self'", "'unsafe-inline'"],  # Allow inline styles and Tailwind
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],  # Allow images from CDNs and data URIs
    'font-src': ["'self'", 'data:'],
    'connect-src': [
        "'self'",
        'https://api.groq.com',  # Groq LLM API
        'https://*.supabase.co',  # Supabase database
        'https://*.upstash.io',  # Upstash Redis
        'https://*.sentry.io',  # Sentry error tracking
        'https://app.posthog.com',  # PostHog analytics
    ],
    'media-src': ["'self'", 'blob:', 'data:'],  # Allow audio playback
    'worker-src': ["'self'", 'blob:'],  # Allow web workers
}

# CORS Configuration - MUST be initialized BEFORE Talisman (non-fatal)
# Otherwise Talisman intercepts OPTIONS preflight requests

# Define allowed origins at module level - Vercel frontend + localhost for development
ALLOWED_ORIGINS = [
    'https://dokguru.in',           # Production custom domain
    'https://www.dokguru.in',       # Production custom domain (www)
    'https://dokguru.vercel.app',  # Production frontend on Vercel
    'https://www.dokguru.vercel.app',  # www subdomain variant
    'https://dokguru-backend-383828718978.asia-south2.run.app',  # Cloud Run backend (NEW)
    'http://localhost:5173',  # Vite dev server
    'http://localhost:5174',  # Vite dev server (alternate port)
    'http://localhost:3000',  # React dev server
    'http://localhost:8080',  # Local backend
    'http://127.0.0.1:5173',  # Alternative localhost
    'http://127.0.0.1:8080',  # Alternative localhost
]

# Add any additional origins from environment variable
_env_origins = os.getenv('CORS_ORIGINS', '')
if _env_origins:
    ALLOWED_ORIGINS.extend([o.strip() for o in _env_origins.split(',') if o.strip()])

# Remove duplicates while preserving order
ALLOWED_ORIGINS = list(dict.fromkeys(ALLOWED_ORIGINS))

try:
    # Log CORS configuration
    logger.info(f"CORS enabled for origins: {ALLOWED_ORIGINS}")

    CORS(app, resources={
        r"/*": {
            "origins": ALLOWED_ORIGINS,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": ["*"],  # Allow all headers to prevent header-related CORS issues
            "expose_headers": ["Content-Type", "Authorization", "X-Request-Id"],
            "supports_credentials": True,
            "max_age": 86400  # Cache preflight for 24 hours
        }
    })
    logger.info("✓ CORS initialized successfully")
except Exception as e:
    logger.warning(f"CORS initialization failed (non-critical): {e}")
    # Continue without CORS

# FALLBACK: Manual CORS headers for all responses (belt and suspenders approach)
@app.after_request
def add_cors_headers(response):
    """Add CORS headers to every response as a fallback safety net"""
    origin = request.headers.get('Origin', '')

    # Helper to check if origin is allowed (Exact match OR Wildcard subdomain)
    is_allowed = origin in ALLOWED_ORIGINS or \
                 origin.endswith('.vercel.app') or \
                 origin.endswith('.dokguru.in') or \
                 origin.endswith('.run.app') # Allow all Cloud Run revisions

    if is_allowed:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, Origin, X-Requested-With, baggage, sentry-trace'
        response.headers['Access-Control-Max-Age'] = '86400'

    return response

# Handle OPTIONS preflight requests globally
@app.before_request
def handle_preflight():
    """Handle CORS preflight OPTIONS requests before they reach route handlers"""
    if request.method == 'OPTIONS':
        origin = request.headers.get('Origin', '')
        
        # Helper to check if origin is allowed
        is_allowed = origin in ALLOWED_ORIGINS or \
                     origin.endswith('.vercel.app') or \
                     origin.endswith('.dokguru.in') or \
                     origin.endswith('.run.app')

        if is_allowed:
            response = app.make_default_options_response()
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, Origin, X-Requested-With, baggage, sentry-trace'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Max-Age'] = '86400'
            return response

# Security headers with Flask-Talisman (non-fatal)
# Initialized AFTER CORS to avoid blocking preflight requests
try:
    talisman = Talisman(
        app,
        force_https=False,  # Set to True in production with HTTPS
        content_security_policy=None,  # Disabled for React dev mode (enable in production)
        content_security_policy_nonce_in=['script-src']
    )
    logger.info("✓ Talisman security headers initialized")
except Exception as e:
    logger.warning(f"Talisman initialization failed (non-critical): {e}")
    # Continue without Talisman

# Rate limiter configuration (non-fatal)
# Uses Redis Cloud (standard Redis protocol) for persistent rate limiting
# Falls back to in-memory if REDIS_URL not configured
try:
    redis_url = os.getenv('REDIS_URL')  # Redis Cloud: redis://user:pass@host:port
    storage_uri = redis_url if redis_url else "memory://"

    # Simplified connection options for Cloud Run compatibility
    # Removed socket_keepalive_options which cause "Invalid argument" errors
    storage_options = {}
    if redis_url:
        storage_options = {
            "socket_connect_timeout": 5,
            "socket_timeout": 3,
            "retry_on_timeout": True,
            "max_connections": 10,
            "decode_responses": False
        }

    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        storage_uri=storage_uri,
        storage_options=storage_options,
        default_limits=["200 per day", "50 per hour"],  # Default limits for all endpoints
        strategy="fixed-window",
        swallow_errors=True  # Don't crash on Redis errors
    )
    logger.info(f"✓ Rate limiter initialized with {storage_uri}")
except Exception as e:
    logger.warning(f"Rate limiter initialization failed (non-critical): {e}")
    logger.warning("Falling back to in-memory rate limiting (resets on restart)")
    # Create a dummy limiter that does nothing
    class DummyLimiter:
        def limit(self, *args, **kwargs):
            def decorator(f):
                return f
            return decorator
        def exempt(self, f):
            return f
    limiter = DummyLimiter()

# Log rate limiter storage type
logger.info(f"Rate limiter using: {'Redis (persistent)' if redis_url else 'Memory (resets on restart)'}")

app.secret_key = os.getenv('SECRET_KEY')  # Required - validated above
app.config['UPLOAD_FOLDER'] = './data/pdfs'
app.config['AUDIO_FOLDER'] = './data/audio'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file upload

# Error handler for file size exceeded
@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file size exceeded error"""
    return jsonify({
        'success': False,
        'message': 'File too large. Maximum file size is 50MB.'
    }), 413

# Create necessary directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['AUDIO_FOLDER'], exist_ok=True)

# ============= DOCUMENT LIST CACHING =============
def _get_cache_ttl_hash(ttl_seconds: int = 300):
    """Generate time-based hash for cache invalidation (5 min default)"""
    return int(time.time() / ttl_seconds)

@lru_cache(maxsize=500)  # Cache 500 users' document lists
def _get_user_documents_cached(user_id: str, ttl_hash: int):
    """
    Cached document list lookup

    Performance: Saves 200-500ms per request
    - Without cache: ChromaDB query (~300ms)
    - With cache: Instant memory lookup (~1ms)

    Cache invalidation:
    - Automatic: Every 5 minutes
    - Manual: clear_document_cache() after upload/delete
    """
    rag = _components.get('rag_system')
    if rag:
        return rag.list_documents(user_id=user_id)
    return []

def clear_document_cache():
    """Clear document list cache (call after upload/delete)"""
    _get_user_documents_cached.cache_clear()
    logger.info("Document cache cleared")

# ============= LAZY LOADING SYSTEM =============
# Initialize heavy systems on-demand instead of at import time
# This allows Gunicorn to bind port IMMEDIATELY without waiting for ML models

from src.lazy_loader import LazyLoader, SystemComponents

# Global components container
_components = SystemComponents()

# Register all components with lazy loaders
# Import heavy modules INSIDE the lambdas to defer import time
_components.register('config', LazyLoader(
    'Config',
    lambda: __import__('config.config', fromlist=['Config']).Config()
))

_components.register('db', LazyLoader(
    'Database',
    lambda: __import__('src.database', fromlist=['Database']).Database()
))

_components.register('rag_system', LazyLoader(
    'RAG System',
    lambda: (
        lambda RAGSystem, config: RAGSystem(config) if config else None
    )(
        __import__('src.rag_system', fromlist=['RAGSystem']).RAGSystem,
        _components.get('config')
    )
))

_components.register('stt_handler', LazyLoader(
    'STT Handler',
    lambda: __import__('src.stt_handler', fromlist=['STTHandler']).STTHandler()
))

_components.register('tts_handler', LazyLoader(
    'TTS Handler',
    lambda: (
        lambda MTH: MTH(
            output_dir=app.config['AUDIO_FOLDER'],
            enable_coqui_fallback=True
        )
    )(__import__('src.multilingual_tts_handler', fromlist=['MultilingualTTSHandler']).MultilingualTTSHandler)
))

_components.register('user_limits', LazyLoader(
    'User Limits',
    lambda: (
        lambda UserLimits: UserLimits(
            _components.get('rag_system').cache if _components.get('rag_system') else None,
            _components.get('db')
        ) if (_components.get('rag_system') and _components.get('db')) else None
    )(__import__('src.limits', fromlist=['UserLimits']).UserLimits)
))

_components.register('email_service', LazyLoader(
    'Email Service',
    lambda: __import__('src.email_service', fromlist=['get_email_service']).get_email_service()
))

_components.register('analytics', LazyLoader(
    'Analytics',
    lambda: __import__('src.analytics', fromlist=['get_analytics_service']).get_analytics_service()
))

_components.register('password_reset', LazyLoader(
    'Password Reset',
    lambda: (
        lambda PRS: PRS(
            _components.get('rag_system').cache if _components.get('rag_system') else None
        ) if _components.get('rag_system') else None
    )(__import__('src.auth.password_reset', fromlist=['PasswordResetService']).PasswordResetService)
))

_components.register('async_processor', LazyLoader(
    'Async Processor',
    lambda: (
        lambda AsyncDocumentProcessor: AsyncDocumentProcessor(
            _components.get('rag_system'),
            max_workers=2
        ) if _components.get('rag_system') else None
    )(__import__('src.async_processor', fromlist=['AsyncDocumentProcessor']).AsyncDocumentProcessor)
))

# Backward compatibility - proxy objects that lazy-load on attribute access
class _LazyProxy:
    """Proxy that lazy-loads component on first attribute access"""
    def __init__(self, component_name):
        self._component_name = component_name
        self._cached = None

    def __getattr__(self, name):
        if self._cached is None:
            self._cached = _components.get(self._component_name)
        if self._cached is None:
            raise RuntimeError(f"{self._component_name} not initialized")
        return getattr(self._cached, name)

    def __bool__(self):
        if self._cached is None:
            self._cached = _components.get(self._component_name)
        return self._cached is not None

    def __call__(self, *args, **kwargs):
        if self._cached is None:
            self._cached = _components.get(self._component_name)
        if self._cached is None:
            raise RuntimeError(f"{self._component_name} not initialized")
        return self._cached(*args, **kwargs)

# Create backward-compatible variable names
config = _LazyProxy('config')
db = _LazyProxy('db')
rag_system = _LazyProxy('rag_system')
stt_handler = _LazyProxy('stt_handler')
tts_handler = _LazyProxy('tts_handler')
user_limits = _LazyProxy('user_limits')
email_service = _LazyProxy('email_service')
analytics = _LazyProxy('analytics')
password_reset_service = _LazyProxy('password_reset')
async_processor = _LazyProxy('async_processor')

# Getter functions for explicit access
def get_config(): return _components.get('config')
def get_db(): return _components.get('db')
def get_rag_system(): return _components.get('rag_system')
def get_stt_handler(): return _components.get('stt_handler')
def get_tts_handler(): return _components.get('tts_handler')
def get_user_limits(): return _components.get('user_limits')
def get_email_svc(): return _components.get('email_service')
def get_analytics_svc(): return _components.get('analytics')
def get_password_reset(): return _components.get('password_reset')

# Eagerly initialize critical components (Database and Analytics)
# These are lightweight and needed for every auth request
def init_critical_components():
    """Initialize critical components eagerly on app startup"""
    try:
        logger.info("⚡ Eagerly initializing critical components...")

        # Database is critical for all auth operations
        db_instance = _components.get('db')
        if db_instance:
            logger.info("✓ Database initialized eagerly")

        # Analytics for tracking (non-blocking)
        analytics_instance = _components.get('analytics')
        if analytics_instance:
            logger.info("✓ Analytics initialized eagerly")

        logger.info("⚡ Critical components ready!")
    except Exception as e:
        logger.error(f"⚠️  Critical component initialization failed: {e}")

# Initialize critical components immediately
init_critical_components()

# ============= TTS THREAD POOL INITIALIZATION =============
# Initialize TTS thread pool at startup to avoid cold start penalty
from concurrent.futures import ThreadPoolExecutor
app.tts_executor = ThreadPoolExecutor(max_workers=3, thread_name_prefix='tts-worker')
app.tts_futures = []  # Track futures for cleanup
logger.info("✓ TTS thread pool initialized (3 workers)")

# Warmup flag to trigger background initialization of heavy components
_warmup_started = False
_warmup_lock = threading.Lock()

def trigger_warmup():
    """Trigger background warmup of heavy ML components (called on first request)"""
    global _warmup_started
    with _warmup_lock:
        if not _warmup_started:
            _warmup_started = True
            logger.info("🔥 Triggering background warmup of ML models...")
            # Warmup heavy components (TTS, STT, RAG) in background
            # Database and Analytics are already initialized
            threading.Thread(target=lambda: [
                _components.get('tts_handler'),
                _components.get('stt_handler'),
                _components.get('rag_system'),
                _components.get('email_service'),
                _components.get('user_limits')
            ], daemon=True).start()

# Log startup summary
import sys
logger.info("="*70)
logger.info("🚀 DokGuru Voice API Server - FAST STARTUP MODE")
logger.info("="*70)
logger.info("✓ Flask App: READY (immediate port binding!)")
logger.info("✓ Heavy components: DEFERRED (will load on first use)")
logger.info("✓ This allows Render to detect port immediately")
logger.info("="*70)
logger.info("✓✓✓ APP MODULE LOADED - Gunicorn can now bind to port! ✓✓✓")
logger.info("="*70)
# Also print to stderr for visibility in Render logs
print("="*70, file=sys.stderr)
print("✓✓✓ FAST STARTUP: Flask ready, port can bind immediately! ✓✓✓", file=sys.stderr)
print(f"✓ PORT will be: {os.getenv('PORT', '10000')}", file=sys.stderr)
print("✓ Heavy ML models will load in background after port binding", file=sys.stderr)
print("="*70, file=sys.stderr)
sys.stderr.flush()

# ============= SENTRY CONTEXT ENRICHMENT =============
@app.before_request
def add_sentry_context():
    """Enrich Sentry errors with user and request context"""
    # Add user context if authenticated
    if hasattr(request, 'user_id'):
        set_user({
            "id": request.user_id,
            "email": getattr(request, 'user_email', None),
        })

    # Add request context
    set_context("request_info", {
        "url": request.url,
        "method": request.method,
        "ip": request.remote_addr,
        "user_agent": request.headers.get('User-Agent', 'Unknown'),
    })

# ============= ROUTES =============
@app.route('/')
@limiter.exempt  # Health checks should not be rate limited
def index():
    return render_template('index.html')

@app.route('/voice-test')
def voice_test():
    return render_template('voice_test.html')

# ============= AUTHENTICATION ENDPOINTS =============

@app.route('/auth/signup', methods=['POST'])
@limiter.limit("3 per hour")  # Prevent spam account creation
def signup():
    """User registration endpoint with role/occupation"""
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        role = data.get('role', '').strip()  # student, professional, researcher, other
        institution = data.get('institution', '').strip()
        occupation = data.get('occupation', '').strip()

        # Validation
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required'}), 400

        if len(password) < 6:
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400

        # Check if user already exists
        existing_user = db.get_user_by_email(email)
        if existing_user:
            return jsonify({'success': False, 'message': 'An account with this email already exists. Please log in instead.'}), 400

        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Create user
        user = db.create_user(email, password_hash, role, institution, occupation)

        # Generate JWT (new users are not admin by default)
        token = generate_jwt(user['id'], user['email'], user.get('is_admin', False))

        # Track signup event (non-blocking)
        try:
            analytics.track_signup(user['id'], email, role)
        except Exception as analytics_error:
            logger.warning(f"Failed to track signup analytics: {analytics_error}")

        try:
            add_breadcrumb('User signed up', category='auth', data={'email': email, 'role': role})
        except Exception as breadcrumb_error:
            logger.warning(f"Failed to add breadcrumb: {breadcrumb_error}")

        return jsonify({
            'success': True,
            'message': 'User created successfully',
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'role': user.get('role'),
                'is_admin': user.get('is_admin', False),
                'institution': user.get('institution')
            }
        })

    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        capture_exception(e, {'endpoint': 'signup'})
        return jsonify({'success': False, 'message': 'An error occurred while creating your account. Please try again.'}), 500


@app.route('/auth/login', methods=['GET', 'POST', 'OPTIONS'])
@limiter.limit("5 per minute")  # Prevent brute force attacks
def login():
    """User login endpoint"""
    # Handle OPTIONS request (CORS preflight)
    if request.method == 'OPTIONS':
        return '', 204

    # Handle GET request (browser navigation/prefetch)
    if request.method == 'GET':
        return jsonify({
            'error': 'Method Not Allowed',
            'message': 'This is an API endpoint. Please use POST method with credentials.',
            'endpoint': '/auth/login',
            'method_required': 'POST'
        }), 405

    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()

        # Validation
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required'}), 400

        # Get user
        user = db.get_user_by_email(email)
        if not user:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

        # Check if user has a password set
        if not user.get('password_hash'):
            logger.warning(f"Login attempt for user with no password: {email}")
            return jsonify({
                'success': False,
                'message': 'Account exists but password not set. Please use password reset or contact support.'
            }), 401

        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

        # Update last_login timestamp
        try:
            from datetime import datetime
            db.client.table('users').update({
                'last_login': datetime.utcnow().isoformat()
            }).eq('id', user['id']).execute()
        except Exception as e:
            logger.warning(f"Failed to update last_login: {e}")

        # Generate JWT with is_admin flag
        token = generate_jwt(user['id'], user['email'], user.get('is_admin', False))

        # Track login event (non-blocking)
        try:
            analytics.track_login(user['id'], user['email'])
        except Exception as analytics_error:
            logger.warning(f"Failed to track login analytics: {analytics_error}")

        try:
            add_breadcrumb('User logged in', category='auth', data={'email': user['email']})
        except Exception as breadcrumb_error:
            logger.warning(f"Failed to add breadcrumb: {breadcrumb_error}")

        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'role': user.get('role'),
                'is_admin': user.get('is_admin', False),
                'is_verified': user.get('is_verified', False)
            }
        })

    except RuntimeError as e:
        # Lazy loader component not initialized
        logger.error(f"Login error - Component initialization failed: {str(e)}")
        capture_exception(e, {'endpoint': 'login', 'error_type': 'RuntimeError'})
        return jsonify({'success': False, 'message': 'Service temporarily unavailable. Please try again later.'}), 503
    except Exception as e:
        # Log full exception details for debugging
        import traceback
        logger.error(f"Login error ({type(e).__name__}): {str(e)}\n{traceback.format_exc()}")
        capture_exception(e, {'endpoint': 'login', 'error_type': type(e).__name__})
        return jsonify({'success': False, 'message': 'An error occurred during login. Please try again.'}), 500


@app.route('/auth/me', methods=['GET'])
@require_auth
def get_current_user():
    """Get current user information"""
    try:
        user = db.get_user_by_id(request.user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'is_admin': user.get('is_admin', False),
                'role': user.get('role'),
                'created_at': user['created_at'].isoformat() if hasattr(user['created_at'], 'isoformat') else str(user['created_at'])
            }
        })

    except Exception as e:
        logger.error(f"Get user error: {str(e)}")
        return jsonify({'success': False, 'message': 'An error occurred while fetching user information. Please try again.'}), 500


@app.route('/auth/forgot-password', methods=['POST'])
@limiter.limit("3 per hour")  # Prevent password reset spam
def forgot_password():
    """Request password reset"""
    try:
        data = request.json
        email = data.get('email', '').strip().lower()

        if not email:
            return jsonify({'success': False, 'message': 'Email is required'}), 400

        # Check rate limit
        is_allowed, request_count = password_reset_service.check_rate_limit(email)
        if not is_allowed:
            return jsonify({
                'success': False,
                'message': 'Too many password reset requests. Please try again later.'
            }), 429

        # Generate reset token
        token = password_reset_service.generate_reset_token(email)

        if token:
            # Send reset email
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
            reset_link = f"{frontend_url}/reset-password?token={token}"
            email_service.send_password_reset_email(email, reset_link)

            logger.info(f"Password reset requested for {email}")
            try:
                add_breadcrumb('Password reset requested', category='auth', data={'email': email})
            except Exception as e:
                logger.warning(f"Failed to add breadcrumb: {e}")

        # Always return success (don't reveal if email exists)
        return jsonify({
            'success': True,
            'message': 'If that email exists, a password reset link has been sent.'
        })

    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        capture_exception(e, {'endpoint': 'forgot_password'})
        return jsonify({'success': False, 'message': 'An error occurred'}), 500


@app.route('/auth/reset-password', methods=['POST'])
@limiter.limit("5 per hour")  # Prevent reset token abuse
def reset_password():
    """Reset password using token"""
    try:
        data = request.json
        token = data.get('token', '').strip()
        new_password = data.get('password', '').strip()

        if not token or not new_password:
            return jsonify({'success': False, 'message': 'Token and password are required'}), 400

        if len(new_password) < 6:
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400

        # Hash new password
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Reset password
        success, message = password_reset_service.reset_password(token, password_hash)

        if success:
            logger.info("Password reset successful")
            try:
                add_breadcrumb('Password reset completed', category='auth')
            except Exception as e:
                logger.warning(f"Failed to add breadcrumb: {e}")
            return jsonify({'success': True, 'message': message})
        else:
            return jsonify({'success': False, 'message': message}), 400

    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        capture_exception(e, {'endpoint': 'reset_password'})
        return jsonify({'success': False, 'message': 'An error occurred'}), 500


@app.route('/auth/change-password', methods=['POST'])
@require_auth
@limiter.limit("10 per hour")  # Prevent password change abuse
def change_password():
    """Change password for logged-in user"""
    try:
        data = request.json
        current_password = data.get('current_password', '').strip()
        new_password = data.get('new_password', '').strip()

        # Validation
        if not current_password or not new_password:
            return jsonify({'success': False, 'message': 'Current and new passwords are required'}), 400

        if len(new_password) < 6:
            return jsonify({'success': False, 'message': 'New password must be at least 6 characters'}), 400

        if current_password == new_password:
            return jsonify({'success': False, 'message': 'New password must be different from current password'}), 400

        # Get user
        user = db.get_user_by_id(request.user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        # Verify current password
        if not bcrypt.checkpw(current_password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'success': False, 'message': 'Current password is incorrect'}), 401

        # Hash new password
        new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Update password
        success = db.update_user(request.user_id, {'password_hash': new_password_hash})

        if success:
            logger.info(f"Password changed successfully for user {request.user_id}")
            try:
                add_breadcrumb('Password changed', category='auth', data={'user_id': request.user_id})
            except Exception as e:
                logger.warning(f"Failed to add breadcrumb: {e}")
            try:
                analytics.track_event(request.user_id, 'password_changed')
            except Exception as e:
                logger.warning(f"Failed to track analytics: {e}")
            return jsonify({'success': True, 'message': 'Password changed successfully'})
        else:
            return jsonify({'success': False, 'message': 'Failed to update password'}), 500

    except Exception as e:
        logger.error(f"Change password error: {str(e)}")
        capture_exception(e, {'endpoint': 'change_password'})
        return jsonify({'success': False, 'message': 'An error occurred'}), 500


@app.route('/auth/change-email', methods=['POST'])
@require_auth
@limiter.limit("5 per hour")  # Prevent email change abuse
def change_email():
    """Change email for logged-in user"""
    try:
        data = request.json
        new_email = data.get('new_email', '').strip().lower()
        password = data.get('password', '').strip()

        # Validation
        if not new_email or not password:
            return jsonify({'success': False, 'message': 'New email and password are required'}), 400

        # Basic email validation
        if '@' not in new_email or '.' not in new_email:
            return jsonify({'success': False, 'message': 'Invalid email format'}), 400

        # Get user
        user = db.get_user_by_id(request.user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        # Check if new email is same as current
        if new_email == user['email']:
            return jsonify({'success': False, 'message': 'New email is same as current email'}), 400

        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'success': False, 'message': 'Password is incorrect'}), 401

        # Check if new email already exists
        existing_user = db.get_user_by_email(new_email)
        if existing_user:
            return jsonify({'success': False, 'message': 'Email already in use'}), 400

        # Update email
        success = db.update_user(request.user_id, {'email': new_email})

        if success:
            logger.info(f"Email changed successfully for user {request.user_id}")
            try:
                add_breadcrumb('Email changed', category='auth', data={'user_id': request.user_id, 'new_email': new_email})
            except Exception as e:
                logger.warning(f"Failed to add breadcrumb: {e}")
            try:
                analytics.track_event(request.user_id, 'email_changed')
            except Exception as e:
                logger.warning(f"Failed to track analytics: {e}")

            # Generate new JWT with updated email
            token = generate_jwt(request.user_id, new_email)

            return jsonify({
                'success': True,
                'message': 'Email changed successfully',
                'token': token,
                'email': new_email
            })
        else:
            return jsonify({'success': False, 'message': 'Failed to update email'}), 500

    except Exception as e:
        logger.error(f"Change email error: {str(e)}")
        capture_exception(e, {'endpoint': 'change_email'})
        return jsonify({'success': False, 'message': 'An error occurred'}), 500


@app.route('/auth/delete-account', methods=['DELETE'])
@require_auth
def delete_account():
    """Delete user account and all associated data (GDPR compliance)"""
    try:
        data = request.json
        password = data.get('password', '').strip()
        confirmation = data.get('confirmation', '').strip()

        # Validation
        if not password:
            return jsonify({'success': False, 'message': 'Password is required'}), 400

        if confirmation != 'DELETE':
            return jsonify({'success': False, 'message': 'Please type DELETE to confirm'}), 400

        # Get user
        user = db.get_user_by_id(request.user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'success': False, 'message': 'Password is incorrect'}), 401

        logger.info(f"Deleting account for user {request.user_id}")

        # Delete user documents from vector store
        try:
            user_docs = rag_system.list_documents(user_id=request.user_id)
            for doc in user_docs:
                rag_system.delete_document(doc['name'], user_id=request.user_id)
            logger.info(f"Deleted {len(user_docs)} documents from vector store")
        except Exception as e:
            logger.warning(f"Error deleting documents from vector store: {e}")

        # Clear user cache
        try:
            cache_pattern = f"*_{request.user_id}"
            # Redis cache will auto-expire user's cached queries
            logger.info("User cache will auto-expire")
        except Exception as e:
            logger.warning(f"Error clearing user cache: {e}")

        # Delete user from database (cascades to related tables)
        success = db.delete_user(request.user_id)

        if success:
            logger.info(f"Account deleted successfully for user {request.user_id}")
            try:
                add_breadcrumb('Account deleted', category='auth', data={'user_id': request.user_id})
            except Exception as e:
                logger.warning(f"Failed to add breadcrumb: {e}")
            try:
                analytics.track_event(request.user_id, 'account_deleted')
            except Exception as e:
                logger.warning(f"Failed to track analytics: {e}")

            return jsonify({
                'success': True,
                'message': 'Account deleted successfully. We\'re sorry to see you go!'
            })
        else:
            return jsonify({'success': False, 'message': 'Failed to delete account'}), 500

    except Exception as e:
        logger.error(f"Delete account error: {str(e)}")
        capture_exception(e, {'endpoint': 'delete_account'})
        return jsonify({'success': False, 'message': 'An error occurred'}), 500


# ============= FEEDBACK ENDPOINT =============

@app.route('/feedback', methods=['POST'])
@require_auth
def submit_feedback():
    """Submit feedback for an AI response"""
    try:
        data = request.json
        message_id = data.get('message_id')
        query = data.get('query', '')
        response = data.get('response', '')
        rating = data.get('rating')  # 1 or -1
        comment = data.get('comment', '')

        if not message_id or rating not in [1, -1]:
            return jsonify({'success': False, 'message': 'Invalid feedback data'}), 400

        # Save feedback
        success = db.save_feedback(
            user_id=request.user_id,
            message_id=message_id,
            query=query,
            response=response,
            rating=rating,
            comment=comment
        )

        if success:
            # Track feedback event (non-blocking)
            try:
                analytics.track_feedback(request.user_id, rating, bool(comment))
            except Exception as e:
                logger.warning(f"Failed to track feedback analytics: {e}")
            try:
                add_breadcrumb('Feedback submitted', category='feedback', data={'rating': rating})
            except Exception as e:
                logger.warning(f"Failed to add breadcrumb: {e}")

            logger.info(f"Feedback submitted by user {request.user_id}: {rating}")
            return jsonify({'success': True, 'message': 'Feedback submitted successfully'})
        else:
            return jsonify({'success': False, 'message': 'Failed to save feedback'}), 500

    except Exception as e:
        logger.error(f"Feedback error: {str(e)}")
        capture_exception(e, {'endpoint': 'feedback'})
        return jsonify({'success': False, 'message': 'An error occurred while submitting feedback. Please try again.'}), 500


# ============= USER STATS ENDPOINT =============

@app.route('/user/stats', methods=['GET'])
@require_auth
def get_user_stats():
    """Get user statistics"""
    try:
        stats = analytics.get_user_stats(request.user_id)

        # Get current plan
        plan = db.get_user_plan(request.user_id)
        if plan:
            stats['plan'] = {
                'type': plan['plan_type'],
                'max_documents': plan['max_documents'],
                'max_queries_per_day': plan['max_queries_per_day']
            }

        return jsonify({'success': True, 'stats': stats})

    except Exception as e:
        logger.error(f"Get user stats error: {str(e)}")
        capture_exception(e, {'endpoint': 'user_stats'})
        return jsonify({'success': False, 'message': str(e)}), 500


# ============= SITE FEEDBACK ENDPOINT =============

@app.route('/site-feedback', methods=['POST'])
@require_auth
@limiter.limit("5 per hour")  # Limit to 5 feedback submissions per hour
def submit_site_feedback():
    """Submit general site feedback"""
    try:
        data = request.json
        user_id = request.user_id

        # Required fields
        overall_rating = data.get('overall_rating')
        feedback_type = data.get('feedback_type')
        feedback_message = data.get('feedback_message', '').strip()

        # Validation
        if not overall_rating or not feedback_type or not feedback_message:
            return jsonify({
                'success': False,
                'message': 'Overall rating, feedback type, and message are required'
            }), 400

        if overall_rating not in [1, 2, 3, 4, 5]:
            return jsonify({'success': False, 'message': 'Rating must be between 1 and 5'}), 400

        valid_types = ['bug', 'feature_request', 'improvement', 'praise', 'other']
        if feedback_type not in valid_types:
            return jsonify({'success': False, 'message': f'Invalid feedback type'}), 400

        # Optional fields - convert 0 ratings to None (NULL in DB)
        ease_of_use = data.get('ease_of_use_rating')
        features = data.get('features_rating')
        performance = data.get('performance_rating')
        nps = data.get('nps_score')
        
        feedback_data = {
            'user_id': user_id,
            'overall_rating': overall_rating,
            'ease_of_use_rating': ease_of_use if ease_of_use and ease_of_use > 0 else None,
            'features_rating': features if features and features > 0 else None,
            'performance_rating': performance if performance and performance > 0 else None,
            'feedback_type': feedback_type,
            'feedback_title': data.get('feedback_title', '').strip() or None,
            'feedback_message': feedback_message,
            'likes': data.get('likes', '').strip() or None,
            'improvements': data.get('improvements', '').strip() or None,
            'would_recommend': data.get('would_recommend'),
            'nps_score': nps if nps is not None and nps >= 0 else None,
            'can_contact': data.get('can_contact', False),
            'contact_email': data.get('contact_email', '').strip() or None,
            'user_agent': request.headers.get('User-Agent'),
            'page_url': data.get('page_url', ''),
            'browser_info': data.get('browser_info'),
            'screen_resolution': data.get('screen_resolution')
        }

        # Save feedback to database
        success = db.save_site_feedback(feedback_data)

        if success:
            # Track feedback event (non-blocking)
            try:
                analytics.track_event(user_id, 'site_feedback_submitted', {
                    'rating': overall_rating,
                    'type': feedback_type
                })
            except Exception as e:
                logger.warning(f"Failed to track feedback analytics: {e}")
            try:
                add_breadcrumb('Site feedback submitted', category='feedback', data={
                    'type': feedback_type,
                    'rating': overall_rating
                })
            except Exception as e:
                logger.warning(f"Failed to add breadcrumb: {e}")

            logger.info(f"Site feedback submitted by user {user_id}: {feedback_type} ({overall_rating}/5)")
            return jsonify({
                'success': True,
                'message': 'Thank you for your feedback! We appreciate your input.'
            })
        else:
            return jsonify({'success': False, 'message': 'Failed to save feedback'}), 500

    except Exception as e:
        logger.error(f"Site feedback error: {str(e)}")
        capture_exception(e, {'endpoint': 'site_feedback'})
        return jsonify({'success': False, 'message': 'An error occurred'}), 500


@app.route('/site-feedback', methods=['GET'])
@require_auth
def get_user_feedback():
    """Get user's submitted feedback"""
    try:
        user_id = request.user_id
        feedback_list = db.get_user_site_feedback(user_id)

        return jsonify({
            'success': True,
            'feedback': feedback_list,
            'count': len(feedback_list)
        })

    except Exception as e:
        logger.error(f"Get site feedback error: {str(e)}")
        capture_exception(e, {'endpoint': 'get_site_feedback'})
        return jsonify({'success': False, 'message': str(e)}), 500


# ============= END AUTHENTICATION ENDPOINTS =============

@app.route('/upload', methods=['POST'])
@require_auth
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file uploaded'})

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'})

    if not file.filename.endswith('.pdf'):
        return jsonify({'success': False, 'message': 'Only PDF files are allowed'})

    try:
        # Get user_id from JWT
        user_id = request.user_id

        # Check document limit (beta: 5 docs per user)
        # Use cached version for better performance
        current_docs = _get_user_documents_cached(user_id, _get_cache_ttl_hash())
        doc_limit = user_limits.check_document_limit(user_id, len(current_docs))

        if not doc_limit['allowed']:
            return jsonify({
                'success': False,
                'message': doc_limit['message'],
                'limit_reached': True,
                'limits': doc_limit
            }), 403

        # Check file size (beta: 10MB max)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning

        size_check = user_limits.check_file_size(file_size, file.filename)

        if not size_check['allowed']:
            return jsonify({
                'success': False,
                'message': size_check['message'],
                'file_too_large': True,
                'limits': size_check
            }), 413

        # Save file
        filename = secure_filename(file.filename)
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Verify MIME type (prevent fake PDFs - e.g., .txt renamed to .pdf)
        try:
            if MAGIC_AVAILABLE:
                # Use python-magic for accurate MIME detection
                mime = magic.Magic(mime=True)
                file_type = mime.from_file(filepath)
            else:
                # Fallback: use mimetypes module (less accurate, filename-based)
                file_type, _ = mimetypes.guess_type(filepath)
                if file_type is None:
                    file_type = 'application/octet-stream'

            if file_type != 'application/pdf':
                os.remove(filepath)  # Delete the invalid file
                logger.warning(f"Invalid file type uploaded: {file_type} (expected application/pdf)")
                add_breadcrumb('Invalid file type', category='upload', data={'file_type': file_type, 'filename': filename})
                return jsonify({
                    'success': False,
                    'message': f'Invalid file type: {file_type}. Only PDF files are allowed.'
                }), 400
        except Exception as mime_error:
            logger.warning(f"MIME type check failed: {mime_error}. Proceeding anyway.")
            # Don't block upload if magic library fails - log and continue

        # Process document with user_id for multi-tenancy
        result = rag_system.add_document(filepath, user_id=user_id)

        # Clear document cache after successful upload
        if result['success']:
            clear_document_cache()
            stats = result['statistics']
            return jsonify({
                'success': True,
                'message': f"Successfully added {result['document_name']}",
                'statistics': stats
            })
        else:
            return jsonify({'success': False, 'message': result['message']})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


# ============= ASYNC UPLOAD ENDPOINTS (FAST UPLOAD WITH BACKGROUND PROCESSING) =============

@app.route('/upload-async', methods=['POST', 'OPTIONS'])
@require_auth
def upload_pdf_async():
    """
    Fast async upload - returns immediately, processes in background
    Use /upload-status/<job_id> to check progress
    """
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file uploaded'})

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'})

    if not file.filename.endswith('.pdf'):
        return jsonify({'success': False, 'message': 'Only PDF files are allowed'})

    try:
        user_id = request.user_id

        # Check document limit
        current_docs = _get_user_documents_cached(user_id, _get_cache_ttl_hash())
        doc_limit = user_limits.check_document_limit(user_id, len(current_docs))

        if not doc_limit['allowed']:
            return jsonify({
                'success': False,
                'message': doc_limit['message'],
                'limit_reached': True,
                'limits': doc_limit
            }), 403

        # Check file size
        file.seek(0, 2)
        file_size = file.tell()
        file.seek(0)

        size_check = user_limits.check_file_size(file_size, file.filename)
        if not size_check['allowed']:
            return jsonify({
                'success': False,
                'message': size_check['message'],
                'file_too_large': True,
                'limits': size_check
            }), 413

        # Save file quickly
        filename = secure_filename(file.filename)
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Quick MIME check
        try:
            if MAGIC_AVAILABLE:
                mime = magic.Magic(mime=True)
                file_type = mime.from_file(filepath)
            else:
                file_type, _ = mimetypes.guess_type(filepath)
                file_type = file_type or 'application/octet-stream'

            if file_type != 'application/pdf':
                os.remove(filepath)
                return jsonify({
                    'success': False,
                    'message': f'Invalid file type: {file_type}. Only PDF files are allowed.'
                }), 400
        except Exception as mime_error:
            logger.warning(f"MIME check failed: {mime_error}")

        # Submit for async processing - returns immediately!
        job = async_processor.submit_job(user_id, filename, filepath)

        # Return job info for tracking
        return jsonify({
            'success': True,
            'async': True,
            'job_id': job.job_id,
            'message': 'File uploaded! Processing in background...',
            'status_url': f'/upload-status/{job.job_id}'
        })

    except Exception as e:
        logger.error(f"Async upload error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/upload-status/<job_id>', methods=['GET', 'OPTIONS'])
@require_auth
def get_upload_status(job_id):
    """
    Get async upload job status
    Poll this endpoint to track processing progress
    """
    try:
        user_id = request.user_id
        job = async_processor.get_job_status(job_id, user_id)

        if not job:
            return jsonify({
                'success': False,
                'message': 'Job not found or access denied'
            }), 404

        response = {
            'success': True,
            'job': job.to_dict()
        }

        # If completed successfully, clear document cache
        if job.status.value == 'completed' and job.result:
            clear_document_cache()

        return jsonify(response)

    except Exception as e:
        logger.error(f"Status check error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ============= END ASYNC UPLOAD ENDPOINTS =============


@app.route('/ask', methods=['POST'])
@require_auth
def ask_question():
    data = request.json
    question = data.get('question', '').strip()
    # Support both old (single document_name) and new (multiple document_names) format
    document_names = data.get('document_names') or ([data.get('document_name')] if data.get('document_name') else None)
    language = data.get('language', 'auto')  # Optional language for TTS ('auto', 'en', 'hi', 'kn')
    client_chat_history = data.get('chat_history', [])  # Chat history from frontend

    if not question:
        return jsonify({'success': False, 'message': 'Please enter a question'})

    try:
        # Get user_id from JWT
        user_id = request.user_id

        # Query limit check (beta: 50 queries/day)
        query_limit = user_limits.check_query_limit(user_id)

        if not query_limit['allowed']:
            return jsonify({
                'success': False,
                'message': query_limit['message'],
                'limit_reached': True,
                'limits': query_limit
            }), 429

        # Check if user has uploaded any documents
        user_documents = rag_system.list_documents(user_id=user_id)
        if not user_documents or len(user_documents) == 0:
            return jsonify({
                'success': False,
                'message': 'Please upload at least one PDF document before asking questions.',
                'no_documents': True
            })

        # Build conversation history - prefer client history if available
        # This enables context-aware follow-up questions
        if client_chat_history:
            # Convert client format [{role, content}] to simple list [q, a, q, a...]
            conversation_history = []
            for msg in client_chat_history[-10:]:  # Last 5 exchanges (10 messages)
                if msg.get('content'):
                    conversation_history.append(msg['content'])
        else:
            # Fallback to Redis cache
            conversation_history = rag_system.cache.get_user_conversation(user_id)

        # Get response with user_id filtering for multi-tenancy and multiple documents
        response = rag_system.query(
            question,
            conversation_history,
            document_names=document_names,
            user_id=user_id
        )

        # Update conversation history and save to Redis
        conversation_history.append(question)
        conversation_history.append(response['answer'])
        rag_system.cache.save_user_conversation(user_id, conversation_history)

        # Generate unique audio ID for this response
        import hashlib
        from concurrent.futures import ThreadPoolExecutor
        import threading

        audio_id = hashlib.md5(response['answer'].encode()).hexdigest()[:12]

        # Detect actual language from response text to get correct file extension
        # (don't use 'auto' which defaults to 'en' and returns wrong extension)
        detected_language = tts_handler.detect_language(response['answer']) if language == 'auto' else language

        # Get the expected file extension based on which TTS engine will be used
        file_ext = tts_handler.get_expected_file_extension(detected_language)
        audio_filename = f"auto_{audio_id}{file_ext}"
        audio_url = f"/audio/{audio_filename}"

        # Use pre-initialized TTS thread pool for better resource management
        # Thread pool is initialized at app startup (see TTS THREAD POOL INITIALIZATION)

        # Start audio generation in background thread (non-blocking)
        def generate_audio_background():
            import signal
            import time
            start_time = time.time()
            timeout = 30  # 30 second timeout

            try:
                logger.info(f"🎵 Background: Generating audio for response (ID: {audio_id}, language: {language})...")

                # Check timeout periodically
                if time.time() - start_time > timeout:
                    raise TimeoutError(f"TTS generation exceeded {timeout}s timeout")

                tts_result = tts_handler.synthesize(
                    response['answer'],
                    language=language,  # Support multilingual TTS
                    output_filename=f"auto_{audio_id}"
                )

                elapsed = time.time() - start_time
                logger.info(f"✅ Background: Audio ready at {audio_url} ({tts_result.get('engine', 'unknown')}) in {elapsed:.2f}s")
            except TimeoutError as e:
                logger.error(f"⏱️ Background: TTS timeout: {e}")
                capture_exception(e, {'context': 'background_tts_timeout', 'audio_id': audio_id})
            except Exception as tts_error:
                logger.error(f"❌ Background: TTS generation failed: {tts_error}")
                capture_exception(tts_error, {'context': 'background_tts', 'audio_id': audio_id})

        # Submit to pre-initialized thread pool
        future = app.tts_executor.submit(generate_audio_background)
        # Store future for potential cancellation (cleanup completed futures)
        app.tts_futures.append(future)
        app.tts_futures = [f for f in app.tts_futures if not f.done()]

        result_payload = {
            'success': True,
            'answer': response['answer'],
            'metadata': {
                'sources_used': response.get('sources_used', 0),
                'confidence': response.get('confidence', 0),
                'query_type': response.get('query_type', 'unknown'),
                'cached': response.get('cached', False)
            },
            'limits': {
                'queries_remaining': query_limit['remaining'],
                'queries_limit': query_limit['limit']
            },
            'audio': {
                'url': audio_url,
                'generating': True,  # Indicates audio is being generated
                'audio_id': audio_id
            }
        }

        return jsonify(result_payload)

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/ask-stream', methods=['POST', 'OPTIONS'])
@require_auth
def ask_question_stream():
    """
    Streaming endpoint for real-time LLM + TTS
    Returns Server-Sent Events (SSE) for progressive response
    """
    import json
    import re
    from flask import stream_with_context

    logger.info(f"🔄 Streaming request received from user")

    try:
        data = request.json
        question = data.get('question', '').strip()
        # Support both old (single document_name) and new (multiple document_names) format
        document_names = data.get('document_names') or ([data.get('document_name')] if data.get('document_name') else None)
        language = data.get('language', 'en')
        user_id = request.user_id

        if not question:
            return jsonify({'success': False, 'message': 'Question is required'}), 400

        # Check query limits
        query_limit = user_limits.check_query_limit(user_id)
        if not query_limit['allowed']:
            return jsonify({
                'success': False,
                'message': query_limit['message'],
                'limit_reached': True
            }), 429

        # Check if user has documents
        user_documents = rag_system.list_documents(user_id=user_id)
        if not user_documents:
            return jsonify({
                'success': False,
                'message': 'Please upload at least one PDF document.',
                'no_documents': True
            }), 400

        # Get conversation history
        conversation_history = rag_system.cache.get_user_conversation(user_id)

        @stream_with_context
        def generate():
            """
            True LLM streaming with PARALLEL TTS generation
            - Text chunks stream immediately (~0.5s to first token)
            - TTS runs in parallel threads (3 workers)
            - Audio URLs sent as they complete (not blocking text)
            """
            try:
                import hashlib
                import re as regex
                from concurrent.futures import as_completed
                import queue
                import threading

                full_response = ""
                sources_used = 0
                current_sentence = ""
                sentence_count = 0
                audio_urls = []
                tts_futures = {}  # {future: (sentence_id, sentence_text)}
                pending_audio = queue.Queue()  # Thread-safe queue for completed audio

                def tts_worker(sentence_id, sentence_text, lang):
                    """Generate TTS in thread pool"""
                    try:
                        audio_id = f"stream_{user_id[:8]}_{sentence_id}_{hashlib.md5(sentence_text.encode()).hexdigest()[:8]}"
                        result = tts_handler.synthesize(
                            sentence_text,
                            language=lang,
                            output_filename=audio_id
                        )
                        if result.get('filename'):
                            return {
                                'sentence_id': sentence_id,
                                'audio_url': f"/audio/{result.get('filename')}",
                                'duration': result.get('duration', 0),
                                'success': True
                            }
                    except Exception as e:
                        logger.warning(f"TTS error for sentence {sentence_id}: {e}")
                    return {'sentence_id': sentence_id, 'success': False}

                def check_completed_tts():
                    """Check for completed TTS futures and yield results"""
                    completed = []
                    for future in list(tts_futures.keys()):
                        if future.done():
                            try:
                                result = future.result(timeout=0)
                                if result.get('success'):
                                    completed.append(result)
                                    audio_urls.append(result['audio_url'])
                            except Exception as e:
                                logger.warning(f"TTS future error: {e}")
                            del tts_futures[future]
                    return completed

                # Use true streaming from RAG system
                for chunk in rag_system.query_stream(
                    question,
                    conversation_history,
                    document_names=document_names,
                    user_id=user_id
                ):
                    chunk_type = chunk.get('type')

                    # Check for completed TTS and yield audio events
                    for audio_result in check_completed_tts():
                        yield f"data: {json.dumps({'type': 'audio', 'sentence_id': audio_result['sentence_id'], 'audio_url': audio_result['audio_url'], 'duration': audio_result['duration']})}\n\n"

                    if chunk_type == 'context':
                        sources_used = chunk.get('sources_used', 0)
                        yield f"data: {json.dumps({'type': 'context', 'sources_used': sources_used})}\n\n"

                    elif chunk_type == 'chunk':
                        content = chunk.get('content', '')
                        full_response += content
                        current_sentence += content

                        # Stream text chunk immediately (non-blocking)
                        yield f"data: {json.dumps({'type': 'text', 'content': content, 'streaming': True})}\n\n"

                        # Check if we completed a sentence (submit TTS to thread pool)
                        if regex.search(r'[.!?]\s*$', current_sentence):
                            sentence_count += 1
                            sentence_text = current_sentence.strip()

                            # Submit TTS to thread pool (non-blocking!)
                            future = app.tts_executor.submit(
                                tts_worker, sentence_count, sentence_text, language
                            )
                            tts_futures[future] = (sentence_count, sentence_text)
                            logger.debug(f"Submitted TTS for sentence {sentence_count} to thread pool")

                            current_sentence = ""

                    elif chunk_type == 'done':
                        # Handle any remaining text as final sentence
                        if current_sentence.strip():
                            sentence_count += 1
                            future = app.tts_executor.submit(
                                tts_worker, sentence_count, current_sentence.strip(), language
                            )
                            tts_futures[future] = (sentence_count, current_sentence.strip())

                        # Wait for all pending TTS to complete (with timeout)
                        logger.info(f"Waiting for {len(tts_futures)} pending TTS jobs...")
                        for future in as_completed(tts_futures.keys(), timeout=30):
                            try:
                                result = future.result()
                                if result.get('success'):
                                    audio_urls.append(result['audio_url'])
                                    yield f"data: {json.dumps({'type': 'audio', 'sentence_id': result['sentence_id'], 'audio_url': result['audio_url'], 'duration': result['duration']})}\n\n"
                            except Exception as e:
                                logger.warning(f"TTS completion error: {e}")

                        # Send completion with all audio URLs
                        yield f"data: {json.dumps({'type': 'done', 'full_response': full_response, 'sources_used': sources_used, 'total_sentences': sentence_count, 'audio_urls': audio_urls, 'provider': chunk.get('provider', 'unknown')})}\n\n"

                        # Update conversation history
                        conversation_history.append(question)
                        conversation_history.append(full_response)
                        rag_system.cache.save_user_conversation(user_id, conversation_history)

                        logger.info(f"Parallel streaming complete: {sentence_count} sentences, {len(audio_urls)} audio files")

                    elif chunk_type == 'error':
                        yield f"data: {json.dumps({'type': 'error', 'message': chunk.get('content', 'Unknown error')})}\n\n"

            except Exception as e:
                logger.error(f"Streaming error: {e}", exc_info=True)
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

        return Response(
            generate(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no',
                'Connection': 'keep-alive'
            }
        )

    except Exception as e:
        logger.error(f"Stream endpoint error: {e}", exc_info=True)
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/clear', methods=['POST'])
@require_auth
def clear_conversation():
    """Clear user's conversation history"""
    user_id = request.user_id
    # Clear conversation from Redis
    rag_system.cache.clear_user_conversation(user_id)
    rag_system.clear_conversation_history()
    return jsonify({'success': True, 'message': 'Conversation cleared'})

@app.route('/stats', methods=['GET'])
def get_stats():
    try:
        stats = rag_system.get_system_stats()
        return jsonify({'success': True, 'stats': stats})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/limits', methods=['GET'])
@require_auth
def get_user_limits():
    """Get user's current usage and limits"""
    try:
        user_id = request.user_id

        # Get current document count
        current_docs = rag_system.list_documents(user_id=user_id)
        document_count = len(current_docs)

        # Get comprehensive usage stats
        usage_stats = user_limits.get_user_usage_stats(user_id, document_count)

        return jsonify({
            'success': True,
            'usage': usage_stats,
            'beta_info': {
                'message': 'These are beta limits and may change.',
                'upgrade_available': False  # Future: paid plans
            }
        })

    except Exception as e:
        logger.error(f"Get limits error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    """Convert speech to text"""
    try:
        if 'audio' not in request.files:
            return jsonify({'success': False, 'message': 'No audio file provided'})
        
        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({'success': False, 'message': 'No file selected'})
        
        # Get language parameter (optional)
        language = request.form.get('language', None)
        
        # Read audio bytes
        audio_bytes = audio_file.read()
        
        logger.info(f"Transcribing audio file: {audio_file.filename}")
        
        # Transcribe
        result = stt_handler.transcribe_from_bytes(audio_bytes, language)
        
        return jsonify({
            'success': True,
            'text': result['text'],
            'language': result['language'],
            'duration': result['duration']
        })
        
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/speak', methods=['POST'])
@require_auth
def text_to_speech():
    """Convert text to speech with multilingual support and user preferences"""
    try:
        user_id = request.user_id
        data = request.json
        text = data.get('text', '').strip()
        language = data.get('language', 'auto')  # 'auto', 'en', 'hi', 'kn', etc.
        engine_preference = data.get('engine', None)  # Optional: 'auto', 'gtts', 'azure', 'coqui'

        if not text:
            return jsonify({'success': False, 'message': 'No text provided'})

        # Get user's voice preferences if no engine specified
        if not engine_preference:
            try:
                user_prefs = db.get_voice_preferences(user_id)
                if user_prefs:
                    engine_preference = user_prefs['engine_preference']
                else:
                    engine_preference = 'auto'
            except Exception as e:
                logger.warning(f"Could not fetch user voice preferences: {e}")
                engine_preference = 'auto'

        # Check user's plan for engine restrictions
        user_plan = db.get_user_plan(user_id)

        # Free users can only use 'auto' mode (which may use Azure automatically)
        # Paid users can explicitly choose Azure
        if user_plan and user_plan['plan_type'] == 'free' and engine_preference == 'azure':
            logger.info(f"Free user tried to use Azure explicitly, using auto mode")
            engine_preference = 'auto'

        logger.info(f"Synthesizing speech for {len(text)} characters (language: {language}, engine: {engine_preference})")

        # Synthesize speech with language and engine preference
        result = tts_handler.synthesize(text, language=language, engine_preference=engine_preference)

        return jsonify({
            'success': True,
            'audio_url': f"/audio/{result['filename']}",
            'duration': result['duration'],
            'filename': result['filename'],
            'language': result.get('language', 'unknown'),
            'language_name': result.get('language_name', 'Unknown'),
            'engine': result.get('engine', 'unknown')
        })

    except Exception as e:
        logger.error(f"TTS error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/speak/stream', methods=['POST'])
@require_auth
def text_to_speech_stream():
    """
    Stream text-to-speech audio (better UX - starts playing immediately)

    Benefits:
    - User hears first words in ~0.1s instead of waiting for full synthesis
    - Progressive playback for better perceived performance
    - Works with Piper (true streaming) and EdgeTTS (chunked streaming)
    """
    try:
        user_id = request.user_id
        data = request.json
        text = data.get('text', '').strip()
        language = data.get('language', 'auto')  # 'auto', 'en', 'hi', 'kn', etc.

        if not text:
            return jsonify({'success': False, 'message': 'No text provided'}), 400

        logger.info(f"Streaming TTS for {len(text)} characters (language: {language})")

        # Create streaming generator
        def generate():
            try:
                for chunk in tts_handler.synthesize_streaming(text, language=language):
                    yield chunk
            except Exception as e:
                logger.error(f"Streaming TTS error: {str(e)}")
                # Can't send JSON error in middle of stream

        # Return streaming response
        from flask import Response
        return Response(
            generate(),
            mimetype='audio/mpeg',  # MP3 for EdgeTTS, WAV for Piper
            headers={
                'Cache-Control': 'no-cache',
                'X-Content-Type-Options': 'nosniff',
                'Transfer-Encoding': 'chunked'
            }
        )

    except Exception as e:
        logger.error(f"Streaming TTS setup error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/audio/<filename>', methods=['GET', 'HEAD'])
@limiter.exempt  # Audio files don't need rate limiting
def serve_audio(filename):
    """Serve generated audio files with proper Range support for streaming"""
    try:
        audio_path = os.path.join(app.config['AUDIO_FOLDER'], filename)
        if not os.path.exists(audio_path):
            return jsonify({'success': False, 'message': 'Audio file not found'}), 404

        # Determine MIME type based on extension
        mimetype = 'audio/mpeg' if filename.endswith('.mp3') else 'audio/wav'

        # Get file size
        file_size = os.path.getsize(audio_path)

        # Handle HEAD request
        if request.method == 'HEAD':
            response = make_response('')
            response.headers['Content-Type'] = mimetype
            response.headers['Content-Length'] = file_size
            response.headers['Accept-Ranges'] = 'bytes'
            return response

        # Handle Range requests for proper audio streaming/seeking
        range_header = request.headers.get('Range', None)

        if range_header:
            # Parse range header (e.g., "bytes=0-1000")
            byte_start = 0
            byte_end = file_size - 1

            match = re.match(r'bytes=(\d+)-(\d*)', range_header)
            if match:
                byte_start = int(match.group(1))
                if match.group(2):
                    byte_end = int(match.group(2))

            # Ensure valid range
            byte_end = min(byte_end, file_size - 1)
            content_length = byte_end - byte_start + 1

            # Read the requested byte range
            with open(audio_path, 'rb') as f:
                f.seek(byte_start)
                data = f.read(content_length)

            # Return 206 Partial Content
            response = make_response(data)
            response.status_code = 206
            response.headers['Content-Type'] = mimetype
            response.headers['Content-Length'] = content_length
            response.headers['Content-Range'] = f'bytes {byte_start}-{byte_end}/{file_size}'
            response.headers['Accept-Ranges'] = 'bytes'
            # CORS headers for audio playback
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range, Accept-Ranges'
            return response

        # No Range header - return full file with Accept-Ranges header
        response = send_file(audio_path, mimetype=mimetype, conditional=True)
        # Note: send_file returns a Response object, we can't add headers directly
        # CORS is handled globally by flask-cors
        return response
    except Exception as e:
        logger.error(f"Audio serve error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/tts/languages', methods=['GET'])
def get_supported_languages():
    """Get list of supported TTS languages"""
    try:
        languages = tts_handler.get_supported_languages()
        return jsonify({
            'success': True,
            'languages': languages,
            'total': len(languages)
        })
    except Exception as e:
        logger.error(f"Get languages error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})


@app.route('/tts/engines', methods=['GET'])
@require_auth
def get_available_engines():
    """Get list of available TTS engines and user's access level"""
    try:
        user_id = request.user_id

        # Get user's plan using Supabase
        user_plan = db.get_user_plan(user_id)
        plan_type = user_plan['plan_type'] if user_plan else 'free'

        # Define engine info
        engines = {
            'auto': {
                'name': 'Auto (Smart Selection)',
                'description': 'Automatically selects the best engine based on language and text',
                'available': True,
                'quality': 'mixed',
                'free': True
            },
            'gtts': {
                'name': 'Google TTS (Standard)',
                'description': 'Free, reliable, supports 100+ languages',
                'available': True,
                'quality': 'good',
                'free': True
            },
            'azure': {
                'name': 'Azure Neural TTS (Premium)',
                'description': 'Best quality neural voices for Kannada, Hindi, and English',
                'available': tts_handler.azure_available,
                'quality': 'excellent',
                'free': False,
                'premium_only': True
            },
            'coqui': {
                'name': 'Coqui TTS (High Quality)',
                'description': 'High quality English voice',
                'available': tts_handler.coqui_available,
                'quality': 'very_good',
                'free': True
            }
        }

        # Free users can't explicitly select Azure
        if plan_type == 'free':
            engines['azure']['accessible'] = False
            engines['azure']['reason'] = 'Premium feature - upgrade to access'
        else:
            engines['azure']['accessible'] = True

        return jsonify({
            'success': True,
            'engines': engines,
            'user_plan': plan_type,
            'azure_configured': tts_handler.azure_available
        })

    except Exception as e:
        logger.error(f"Get engines error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})


@app.route('/voice/preferences', methods=['GET'])
@require_auth
def get_voice_preferences():
    """Get user's voice preferences"""
    try:
        user_id = request.user_id

        # Get voice preferences using Supabase
        prefs = db.get_voice_preferences(user_id)

        if not prefs:
            # Create default preferences if not exists
            db.update_voice_preferences(user_id, 'auto', 'auto')
            prefs = {
                'engine_preference': 'auto',
                'language_preference': 'auto'
            }

        return jsonify({
            'success': True,
            'preferences': prefs
        })

    except Exception as e:
        logger.error(f"Get voice preferences error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})


@app.route('/voice/preferences', methods=['PUT'])
@require_auth
def update_voice_preferences_endpoint():
    """Update user's voice preferences"""
    try:
        user_id = request.user_id
        data = request.json

        engine_preference = data.get('engine_preference', 'auto')
        language_preference = data.get('language_preference', 'auto')

        # Validate engine preference
        valid_engines = ['auto', 'gtts', 'azure', 'coqui']
        if engine_preference not in valid_engines:
            return jsonify({'success': False, 'message': f'Invalid engine. Must be one of: {", ".join(valid_engines)}'})

        # Check if user has access to Azure
        if engine_preference == 'azure':
            user_plan = db.get_user_plan(user_id)

            if user_plan and user_plan['plan_type'] == 'free':
                return jsonify({
                    'success': False,
                    'message': 'Azure Neural TTS is a premium feature. Please upgrade your plan.',
                    'premium_required': True
                })

        # Update preferences using Supabase
        success = db.update_voice_preferences(user_id, engine_preference, language_preference)

        if not success:
            return jsonify({'success': False, 'message': 'Failed to update preferences'})

        logger.info(f"Updated voice preferences for user {user_id}: engine={engine_preference}, language={language_preference}")

        return jsonify({
            'success': True,
            'message': 'Voice preferences updated successfully',
            'preferences': {
                'engine_preference': engine_preference,
                'language_preference': language_preference
            }
        })

    except Exception as e:
        logger.error(f"Update voice preferences error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})


def cleanup_old_audio_files():
    """Delete audio files older than 24 hours to save disk space"""
    try:
        import time
        import glob

        audio_folder = app.config['AUDIO_FOLDER']
        if not os.path.exists(audio_folder):
            return

        current_time = time.time()
        max_age = 24 * 3600  # 24 hours in seconds
        deleted_count = 0

        # Clean up both WAV and MP3 files
        for pattern in ["*.wav", "*.mp3"]:
            for audio_file in glob.glob(os.path.join(audio_folder, pattern)):
                file_age = current_time - os.path.getmtime(audio_file)
                if file_age > max_age:
                    try:
                        os.remove(audio_file)
                        deleted_count += 1
                    except Exception as e:
                        logger.warning(f"Failed to delete old audio file {audio_file}: {e}")

        if deleted_count > 0:
            logger.info(f"🧹 Cleaned up {deleted_count} old audio files")
    except Exception as e:
        logger.error(f"Audio cleanup error: {str(e)}")


# Schedule audio cleanup on startup and periodically
import atexit
from threading import Timer

def schedule_audio_cleanup():
    """Schedule periodic audio cleanup"""
    cleanup_old_audio_files()
    # Schedule next cleanup in 6 hours
    Timer(6 * 3600, schedule_audio_cleanup).start()

# Run cleanup on startup
cleanup_old_audio_files()

# Register cleanup on app shutdown
atexit.register(cleanup_old_audio_files)

@app.route('/voice-query', methods=['POST'])
@require_auth
def voice_query():
    """Complete voice pipeline: audio -> text -> RAG -> text -> audio"""
    try:
        user_id = request.user_id

        if 'audio' not in request.files:
            return jsonify({'success': False, 'message': 'No audio file provided'})

        audio_file = request.files['audio']
        audio_bytes = audio_file.read()

        # Step 1: Transcribe audio to text
        logger.info("Step 1: Transcribing audio...")
        transcription = stt_handler.transcribe_from_bytes(audio_bytes)
        question = transcription['text']

        if not question:
            return jsonify({'success': False, 'message': 'Could not transcribe audio'})

        logger.info(f"Transcribed: {question}")

        # Check if user has uploaded any documents
        user_documents = rag_system.list_documents(user_id=user_id)
        if not user_documents or len(user_documents) == 0:
            return jsonify({
                'success': False,
                'message': 'Please upload at least one PDF document before asking questions.',
                'no_documents': True
            })

        # Step 2: Get RAG response
        logger.info("Step 2: Querying RAG system...")
        conversation_history = rag_system.cache.get_user_conversation(user_id)

        response = rag_system.query(question, conversation_history, user_id=user_id)
        answer = response['answer']

        # Update conversation history and save to Redis
        conversation_history.append(question)
        conversation_history.append(answer)
        rag_system.cache.save_user_conversation(user_id, conversation_history)
        
        logger.info(f"RAG Answer: {answer[:100]}...")
        
        # Step 3: Convert answer to speech
        logger.info("Step 3: Synthesizing speech...")
        tts_result = tts_handler.synthesize(answer)
        
        return jsonify({
            'success': True,
            'question': question,
            'answer': answer,
            'audio_url': f"/audio/{tts_result['filename']}",
            'transcription_language': transcription['language'],
            'metadata': {
                'sources_used': response.get('sources_used', 0),
                'confidence': response.get('confidence', 0),
                'query_type': response.get('query_type', 'unknown')
            }
        })
        
    except Exception as e:
        logger.error(f"Voice query error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/documents', methods=['GET'])
@limiter.exempt  # Read-only endpoint, no rate limiting needed
@require_auth
def list_documents():
    """List all indexed documents with statistics for current user (cached)"""
    try:
        user_id = request.user_id
        # Use cached version for better performance
        documents = _get_user_documents_cached(user_id, _get_cache_ttl_hash())
        return jsonify({
            'success': True,
            'documents': documents
        })
    except Exception as e:
        logger.error(f"List documents error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/documents/<document_name>', methods=['DELETE'])
@require_auth
def delete_document(document_name):
    """Delete a specific document from the vector store for current user"""
    try:
        user_id = request.user_id
        result = rag_system.delete_document(document_name, user_id=user_id)

        # Clear document cache after successful deletion
        if result['success']:
            clear_document_cache()
            return jsonify({
                'success': True,
                'message': f"Deleted {result['deleted_count']} chunks from '{document_name}'"
            })
        else:
            return jsonify(result)
    except Exception as e:
        logger.error(f"Delete document error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/documents/clear-all', methods=['POST'])
@require_auth
def clear_all_documents():
    """Clear all documents for the current user only (requires authentication)"""
    try:
        user_id = request.user_id
        result = rag_system.clear_all_documents(user_id=user_id)

        # Clear document cache after successful deletion
        if result['success']:
            clear_document_cache()
            return jsonify({
                'success': True,
                'message': f"Cleared {result['deleted_count']} documents from your account"
            })
        else:
            return jsonify(result)
    except Exception as e:
        logger.error(f"Clear all documents error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})


# ============= DOCUMENT SEARCH & CATEGORIES (PHASE 2) =============

@app.route('/documents/search', methods=['GET'])
@require_auth
def search_documents():
    """Search documents by query, category, or tags"""
    try:
        search_query = request.args.get('q', '').strip()
        category = request.args.get('category', None)
        tags_param = request.args.get('tags', '')
        tags = [t.strip() for t in tags_param.split(',') if t.strip()] if tags_param else None

        logger.info(f"Searching documents: query='{search_query}', category='{category}', tags={tags}")

        documents = db.search_documents(request.user_id, search_query, category, tags)

        return jsonify({
            'success': True,
            'documents': documents,
            'count': len(documents)
        })

    except Exception as e:
        logger.error(f"Search documents error: {str(e)}")
        capture_exception(e, {'endpoint': 'search_documents'})
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/documents/<document_id>/metadata', methods=['PUT'])
@require_auth
def update_document_metadata(document_id):
    """Update document metadata (category, tags, description)"""
    try:
        data = request.json
        updates = {}

        if 'category' in data:
            updates['category'] = data['category']

        if 'tags' in data:
            # Ensure tags is a list
            if isinstance(data['tags'], list):
                updates['tags'] = data['tags']
            elif isinstance(data['tags'], str):
                updates['tags'] = [t.strip() for t in data['tags'].split(',') if t.strip()]

        if 'description' in data:
            updates['description'] = data['description']

        if not updates:
            return jsonify({'success': False, 'message': 'No updates provided'}), 400

        success = db.update_document_metadata(document_id, request.user_id, updates)

        if success:
            return jsonify({
                'success': True,
                'message': 'Document metadata updated successfully'
            })
        else:
            return jsonify({'success': False, 'message': 'Failed to update document'}), 500

    except Exception as e:
        logger.error(f"Update document metadata error: {str(e)}")
        capture_exception(e, {'endpoint': 'update_document_metadata'})
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/documents/categories', methods=['GET'])
@require_auth
def get_document_categories():
    """Get list of predefined document categories"""
    try:
        categories = db.get_document_categories()

        return jsonify({
            'success': True,
            'categories': categories
        })

    except Exception as e:
        logger.error(f"Get categories error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/cache/clear', methods=['POST'])
def clear_cache():
    """Clear all cache entries"""
    try:
        result = rag_system.cache.clear_all_cache()
        if result:
            return jsonify({
                'success': True,
                'message': 'Cache cleared successfully'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Cache not enabled or failed to clear'
            })
    except Exception as e:
        logger.error(f"Clear cache error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/cache/stats', methods=['GET'])
def get_cache_stats():
    """Get cache statistics"""
    try:
        stats = rag_system.cache.get_cache_stats()
        return jsonify({
            'success': True,
            'cache': stats
        })
    except Exception as e:
        logger.error(f"Get cache stats error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/health', methods=['GET'])
@limiter.exempt  # Exempt from rate limiting for monitoring/load balancers
def health_check():
    """
    Lightweight health check endpoint that responds IMMEDIATELY
    Triggers background warmup on first call for Render deployment
    """
    # Trigger background warmup on first health check (typically from Render)
    trigger_warmup()

    # Return immediate response without waiting for heavy components
    # This allows Render to detect the port is open
    component_status = _components.get_status()

    # Consider healthy if Flask app is running (even if components not loaded yet)
    all_initialized = all(status['initialized'] for status in component_status.values())
    any_errors = any(status['has_error'] for status in component_status.values())

    return jsonify({
        'success': True,
        'status': 'healthy',  # Always healthy if Flask is responding
        'app': 'ready',
        'port': 'listening',
        'components': {
            name: {
                'status': 'ready' if status['initialized'] and not status['has_error']
                         else 'error' if status['has_error']
                         else 'loading',
                'error': status['error'] if status['has_error'] else None
            }
            for name, status in component_status.items()
        },
        'initialization': {
            'all_ready': all_initialized and not any_errors,
            'in_progress': not all_initialized
        }
    }), 200  # Always return 200 if Flask is running


# ============= ADMIN ENDPOINTS =============

@app.route('/auth/check-admin', methods=['GET'])
@require_auth
def check_admin_status():
    """Debug endpoint to check admin status"""
    try:
        user = db.get_user_by_id(request.user_id)
        return jsonify({
            'success': True,
            'user_id': request.user_id,
            'email': request.user_email,
            'is_admin_from_request': request.is_admin,
            'is_admin_from_db': user.get('is_admin', False) if user else None,
            'user_data': user
        })
    except Exception as e:
        logger.error(f"Check admin error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/admin/dashboard', methods=['GET', 'OPTIONS'])
@require_admin
def admin_dashboard():
    """Get admin dashboard statistics"""
    try:
        system_stats = db.get_system_analytics() if db else {}
        feedback_stats = db.get_feedback_analytics() if db else {}

        return jsonify({
            'success': True,
            'system': system_stats,
            'feedback': feedback_stats
        })
    except Exception as e:
        logger.error(f"Admin dashboard error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/admin/users', methods=['GET', 'OPTIONS'])
@require_admin
def admin_get_users():
    """Get all users (admin only)"""
    try:
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))

        users = db.get_all_users(limit=limit, offset=offset) if db else []

        return jsonify({
            'success': True,
            'users': users,
            'count': len(users)
        })
    except Exception as e:
        logger.error(f"Admin get users error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/admin/users/<user_id>', methods=['GET', 'OPTIONS'])
@require_admin
def admin_get_user_details(user_id):
    """Get detailed user information and statistics (admin only)"""
    try:
        # Get user basic info
        user = db.get_user_by_id(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        # Get ALL user documents from ChromaDB (same source as profile)
        all_documents = rag_system.list_documents(user_id=user_id) if rag_system else []
        
        # Format recent documents for display (limit to 10)
        formatted_docs = []
        if all_documents:
            for doc in all_documents[:10]:
                formatted_docs.append({
                    'id': doc.get('name', 'unknown'),
                    'filename': doc.get('name', 'Untitled'),
                    'created_at': doc.get('uploaded_at', doc.get('created_at')),
                    'file_size': f"{doc.get('total_chunks', 0)} chunks"
                })
        
        # Get user feedback count
        user_feedback = db.get_user_site_feedback(user_id)
        
        # Get user query count from chat_histories table
        try:
            query_response = db.client.table('chat_histories').select('id', count='exact').eq('user_id', user_id).execute()
            query_count = query_response.count if query_response.count else 0
        except Exception as e:
            logger.warning(f"Failed to get query count: {e}")
            query_count = 0
        
        # Get last active time from most recent chat activity
        last_active = 'Never'
        try:
            from datetime import datetime, timedelta
            # Get the most recent chat activity (updated_at from chat_histories)
            last_activity_response = db.client.table('chat_histories').select('updated_at').eq('user_id', user_id).order('updated_at', desc=True).limit(1).execute()

            if last_activity_response.data and len(last_activity_response.data) > 0:
                last_activity_time = last_activity_response.data[0]['updated_at']
                if last_activity_time:
                    if isinstance(last_activity_time, str):
                        last_activity_dt = datetime.fromisoformat(last_activity_time.replace('Z', '+00:00'))
                    else:
                        last_activity_dt = last_activity_time

                    # Convert to IST (UTC+5:30)
                    ist_offset = timedelta(hours=5, minutes=30)
                    last_activity_ist = last_activity_dt + ist_offset
                    last_active = last_activity_ist.strftime('%b %d, %Y at %I:%M %p IST')
            else:
                # Fallback to last_login if no chat history
                last_login = user.get('last_login')
                if last_login:
                    if isinstance(last_login, str):
                        last_login_dt = datetime.fromisoformat(last_login.replace('Z', '+00:00'))
                    else:
                        last_login_dt = last_login

                    ist_offset = timedelta(hours=5, minutes=30)
                    last_login_ist = last_login_dt + ist_offset
                    last_active = last_login_ist.strftime('%b %d, %Y at %I:%M %p IST')
        except Exception as e:
            logger.warning(f"Failed to get last active time: {e}")
            last_active = 'Never'
        
        # Get user stats
        stats = {
            'document_count': len(all_documents) if all_documents else 0,
            'query_count': query_count,
            'feedback_count': len(user_feedback) if user_feedback else 0,
            'last_active': last_active
        }

        # Get last 5 chat sessions (recent activity)
        recent_queries = []
        try:
            # Fetch last 5 chat sessions with their details
            sessions_response = db.client.table('chat_histories').select('id, document_name, first_message, messages, message_count, created_at, updated_at').eq('user_id', user_id).order('updated_at', desc=True).limit(5).execute()

            if sessions_response.data:
                for session in sessions_response.data:
                    # Extract the first user query from the session
                    query_text = session.get('first_message', 'No query')

                    # Use updated_at to show when this session was last active
                    session_time = session.get('updated_at', session.get('created_at'))

                    recent_queries.append({
                        'id': session.get('id'),
                        'query': query_text,
                        'document_name': session.get('document_name', 'Unknown Document'),
                        'message_count': session.get('message_count', 0),
                        'created_at': session_time
                    })
        except Exception as e:
            logger.warning(f"Failed to get recent sessions: {e}")

        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'role': user.get('role'),
                'institution': user.get('institution'),
                'occupation': user.get('occupation'),
                'is_admin': user.get('is_admin', False),
                'created_at': user['created_at'].isoformat() if hasattr(user['created_at'], 'isoformat') else str(user['created_at']),
                'last_login': user.get('last_login')
            },
            'stats': stats,
            'documents': formatted_docs,
            'recent_queries': recent_queries
        })
    except Exception as e:
        logger.error(f"Admin get user details error: {e}")
        capture_exception(e, {'endpoint': 'admin_user_details', 'user_id': user_id})
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/admin/feedback', methods=['GET', 'OPTIONS'])
@require_admin
def admin_get_feedback():
    """Get all feedback (admin only)"""
    try:
        limit = int(request.args.get('limit', 100))
        status = request.args.get('status')

        feedback = db.get_all_site_feedback(limit=limit, status=status) if db else []

        return jsonify({
            'success': True,
            'feedback': feedback,
            'count': len(feedback)
        })
    except Exception as e:
        logger.error(f"Admin get feedback error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/admin/analytics', methods=['GET', 'OPTIONS'])
@require_admin
def admin_analytics():
    """Get comprehensive analytics (admin only)"""
    try:
        system_stats = db.get_system_analytics() if db else {}
        feedback_stats = db.get_feedback_analytics() if db else {}

        return jsonify({
            'success': True,
            'analytics': {
                'system': system_stats,
                'feedback': feedback_stats
            }
        })
    except Exception as e:
        logger.error(f"Admin analytics error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/admin/ai-feedback', methods=['GET', 'OPTIONS'])
@require_admin
def admin_get_ai_feedback():
    """Get AI response feedback with analytics (admin only)"""
    try:
        limit = int(request.args.get('limit', 100))

        # Get all AI response feedback (query, response, rating)
        feedback = db.get_all_ai_response_feedback(limit=limit) if db else []

        # Get analytics
        analytics = db.get_ai_feedback_analytics() if db else {}

        return jsonify({
            'success': True,
            'feedback': feedback,
            'analytics': analytics,
            'count': len(feedback)
        })
    except Exception as e:
        logger.error(f"Admin get AI feedback error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/admin/promote', methods=['POST', 'OPTIONS'])
@require_admin
def admin_promote_user():
    """Promote a user to admin (requires existing admin)"""
    try:
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({'success': False, 'message': 'Email required'}), 400

        # Find user
        user = db.get_user_by_email(email)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        # Promote to admin
        result = db.client.table('users').update({
            'is_admin': True,
            'admin_notes': f'Promoted by {request.user_email}'
        }).eq('email', email).execute()

        logger.info(f"Admin {request.user_email} promoted {email} to admin")

        return jsonify({
            'success': True,
            'message': f'{email} promoted to admin',
            'user_id': user.get('id')
        })
    except Exception as e:
        logger.error(f"Admin promote error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/admin/setup', methods=['POST'])
def admin_setup():
    """
    One-time admin setup endpoint
    Requires ADMIN_SETUP_KEY environment variable
    Creates the first admin user
    """
    try:
        data = request.get_json()
        setup_key = data.get('setup_key')
        email = data.get('email')

        # Verify setup key
        expected_key = os.getenv('ADMIN_SETUP_KEY')
        if not expected_key:
            return jsonify({
                'success': False,
                'message': 'ADMIN_SETUP_KEY not configured. Set it in environment variables.'
            }), 403

        if setup_key != expected_key:
            logger.warning(f"Invalid admin setup attempt for {email}")
            return jsonify({'success': False, 'message': 'Invalid setup key'}), 403

        if not email:
            return jsonify({'success': False, 'message': 'Email required'}), 400

        # Check if user exists
        user = db.get_user_by_email(email)
        if not user:
            return jsonify({'success': False, 'message': 'User not found. Register first.'}), 404

        # Check if already admin
        if user.get('is_admin'):
            return jsonify({
                'success': True,
                'message': f'{email} is already an admin',
                'user_id': user.get('id')
            })

        # Promote to admin
        result = db.client.table('users').update({
            'is_admin': True,
            'admin_notes': 'Initial admin - set via setup endpoint'
        }).eq('email', email).execute()

        logger.info(f"Admin setup: {email} set as admin")

        return jsonify({
            'success': True,
            'message': f'{email} is now an admin',
            'user_id': user.get('id')
        })
    except Exception as e:
        logger.error(f"Admin setup error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/admin/users/<user_id>', methods=['DELETE', 'OPTIONS'])
@require_admin
def admin_delete_user(user_id):
    """Delete a user (admin only)"""
    try:
        # Prevent self-deletion
        if request.user_id == user_id:
            return jsonify({'success': False, 'message': 'Cannot delete your own account'}), 400

        # Check if user exists
        user_result = db.client.table('users').select('*').eq('id', user_id).execute()
        if not user_result.data:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        user = user_result.data[0]

        # Prevent deleting other admins
        if user.get('is_admin'):
            return jsonify({'success': False, 'message': 'Cannot delete admin users'}), 403

        # Delete user (CASCADE will delete associated documents, etc.)
        db.client.table('users').delete().eq('id', user_id).execute()

        logger.info(f"Admin {request.user_email} deleted user {user.get('email')} (ID: {user_id})")

        return jsonify({
            'success': True,
            'message': f'User {user.get("email")} deleted successfully'
        })
    except Exception as e:
        logger.error(f"Admin delete user error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/admin/users/<user_id>/ban', methods=['POST', 'OPTIONS'])
@require_admin
def admin_ban_user(user_id):
    """Ban/suspend a user (admin only)"""
    try:
        data = request.get_json()
        reason = data.get('reason', 'No reason provided')

        # Prevent self-ban
        if request.user_id == user_id:
            return jsonify({'success': False, 'message': 'Cannot ban your own account'}), 400

        # Check if user exists
        user_result = db.client.table('users').select('*').eq('id', user_id).execute()
        if not user_result.data:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        user = user_result.data[0]

        # Prevent banning other admins
        if user.get('is_admin'):
            return jsonify({'success': False, 'message': 'Cannot ban admin users'}), 403

        # Ban user
        db.client.table('users').update({
            'is_active': False,
            'banned_at': 'now()',
            'banned_by': request.user_id,
            'ban_reason': reason
        }).eq('id', user_id).execute()

        logger.info(f"Admin {request.user_email} banned user {user.get('email')} (ID: {user_id}). Reason: {reason}")

        return jsonify({
            'success': True,
            'message': f'User {user.get("email")} has been banned'
        })
    except Exception as e:
        logger.error(f"Admin ban user error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/admin/users/<user_id>/unban', methods=['POST', 'OPTIONS'])
@require_admin
def admin_unban_user(user_id):
    """Unban/activate a user (admin only)"""
    try:
        # Check if user exists
        user_result = db.client.table('users').select('*').eq('id', user_id).execute()
        if not user_result.data:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        user = user_result.data[0]

        # Unban user
        db.client.table('users').update({
            'is_active': True,
            'banned_at': None,
            'banned_by': None,
            'ban_reason': None
        }).eq('id', user_id).execute()

        logger.info(f"Admin {request.user_email} unbanned user {user.get('email')} (ID: {user_id})")

        return jsonify({
            'success': True,
            'message': f'User {user.get("email")} has been unbanned'
        })
    except Exception as e:
        logger.error(f"Admin unban user error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/admin/users/<user_id>', methods=['PATCH', 'OPTIONS'])
@require_admin
def admin_update_user(user_id):
    """Update user details (admin only)"""
    try:
        data = request.get_json()

        # Check if user exists
        user_result = db.client.table('users').select('*').eq('id', user_id).execute()
        if not user_result.data:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        # Allowed fields to update
        allowed_fields = ['role', 'institution', 'occupation', 'admin_notes']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}

        if not update_data:
            return jsonify({'success': False, 'message': 'No valid fields to update'}), 400

        # Update user
        db.client.table('users').update(update_data).eq('id', user_id).execute()

        logger.info(f"Admin {request.user_email} updated user {user_id}: {update_data}")

        return jsonify({
            'success': True,
            'message': 'User updated successfully',
            'updated_fields': list(update_data.keys())
        })
    except Exception as e:
        logger.error(f"Admin update user error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/admin/system/health', methods=['GET', 'OPTIONS'])
@require_admin
def admin_system_health():
    """Get system health metrics (admin only)"""
    try:
        from datetime import datetime, timedelta

        # Server metrics (only available in local/VM deployments, not Cloud Run)
        try:
            import psutil
            cpu_percent = psutil.cpu_percent(interval=0.5)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            server_metrics = {
                'cpu_percent': round(cpu_percent, 2),
                'memory': {
                    'total': memory.total,
                    'available': memory.available,
                    'percent': memory.percent,
                    'used': memory.used
                },
                'disk': {
                    'total': disk.total,
                    'used': disk.used,
                    'free': disk.free,
                    'percent': disk.percent
                }
            }
        except Exception as e:
            # psutil not available or Cloud Run environment
            logger.warning(f"Server metrics unavailable: {e}")
            server_metrics = None

        # Database stats
        db_stats = {
            'total_users': db.client.table('users').select('id', count='exact').execute().count,
            'active_users': db.client.table('users').select('id', count='exact').eq('is_active', True).execute().count,
            'total_documents': db.client.table('documents').select('id', count='exact').execute().count,
            'total_queries': db.client.table('chat_histories').select('id', count='exact').execute().count,
        }

        # Recent activity (last 24 hours)
        yesterday = (datetime.now() - timedelta(days=1)).isoformat()
        recent_activity = {
            'new_users_24h': db.client.table('users').select('id', count='exact').gte('created_at', yesterday).execute().count,
            'new_documents_24h': db.client.table('documents').select('id', count='exact').gte('uploaded_at', yesterday).execute().count,
            'queries_24h': db.client.table('chat_histories').select('id', count='exact').gte('created_at', yesterday).execute().count,
        }

        # Error logs (last 100 errors from logs if available)
        # This is a placeholder - you'd need to implement log storage
        error_logs = []

        # Storage usage (sum of all document file sizes)
        storage_result = db.client.table('documents').select('file_size').execute()
        total_storage = sum(doc.get('file_size', 0) for doc in storage_result.data if doc.get('file_size'))

        response_data = {
            'success': True,
            'database': db_stats,
            'recent_activity': recent_activity,
            'storage': {
                'total_bytes': total_storage,
                'total_mb': round(total_storage / (1024 * 1024), 2),
                'total_gb': round(total_storage / (1024 * 1024 * 1024), 2)
            },
            'error_logs': error_logs,
            'timestamp': datetime.now().isoformat()
        }

        # Only include server metrics if available
        if server_metrics:
            response_data['server'] = server_metrics

        return jsonify(response_data)
    except Exception as e:
        logger.error(f"Admin system health error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/admin/analytics/timeseries', methods=['GET', 'OPTIONS'])
@require_admin
def admin_analytics_timeseries():
    """Get time-based analytics (admin only)"""
    try:
        from datetime import datetime, timedelta

        # Get time range from query params (default: last 30 days)
        days = int(request.args.get('days', 30))
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        # User registrations over time
        users_result = db.client.table('users').select('created_at').gte('created_at', start_date.isoformat()).execute()

        # Document uploads over time
        docs_result = db.client.table('documents').select('uploaded_at').gte('uploaded_at', start_date.isoformat()).execute()

        # Queries over time
        queries_result = db.client.table('chat_histories').select('created_at').gte('created_at', start_date.isoformat()).execute()

        # Feedback over time
        feedback_result = db.client.table('site_feedback').select('created_at').gte('created_at', start_date.isoformat()).execute()

        # Group by date
        def group_by_date(data, date_field):
            from collections import defaultdict
            grouped = defaultdict(int)
            for item in data:
                if item.get(date_field):
                    date = item[date_field][:10]  # Extract YYYY-MM-DD
                    grouped[date] += 1
            return dict(grouped)

        users_by_date = group_by_date(users_result.data, 'created_at')
        docs_by_date = group_by_date(docs_result.data, 'uploaded_at')
        queries_by_date = group_by_date(queries_result.data, 'created_at')
        feedback_by_date = group_by_date(feedback_result.data, 'created_at')

        # Fill in missing dates with 0
        date_range = []
        current = start_date
        while current <= end_date:
            date_str = current.strftime('%Y-%m-%d')
            date_range.append({
                'date': date_str,
                'users': users_by_date.get(date_str, 0),
                'documents': docs_by_date.get(date_str, 0),
                'queries': queries_by_date.get(date_str, 0),
                'feedback': feedback_by_date.get(date_str, 0)
            })
            current += timedelta(days=1)

        return jsonify({
            'success': True,
            'data': date_range,
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': days
            }
        })
    except Exception as e:
        logger.error(f"Admin analytics timeseries error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ============= END ADMIN ENDPOINTS =============

# ============= MODEL WARMUP (PRE-LOADING) =============
def warmup_models():
    """
    Pre-warm ML models on startup to avoid first-request delays
    Runs in background thread to not block server startup

    Performance Impact:
    - First user request: 2-3s faster (no model loading delay)
    - Subsequent requests: Already loaded
    """
    import time
    time.sleep(5)  # Wait for server to fully start

    logger.info("🔥 Starting model warmup...")
    start = time.time()

    try:
        # Pre-load RAG system (embeddings model)
        rag = _components.get('rag_system')
        if rag:
            logger.info("✓ RAG system loaded")

        # Pre-load TTS handler
        tts = _components.get('tts_handler')
        if tts:
            logger.info("✓ TTS handler loaded")

        # Pre-load database connection
        db = _components.get('db')
        if db:
            logger.info("✓ Database connected")

        elapsed = time.time() - start
        logger.info(f"🚀 Model warmup complete in {elapsed:.2f}s - Ready for fast responses!")

    except Exception as e:
        logger.warning(f"Model warmup failed (non-critical): {e}")

# Start warmup in background thread (doesn't block server startup)
import threading
warmup_thread = threading.Thread(target=warmup_models, daemon=True)
warmup_thread.start()

# ============= END MODEL WARMUP =============

# ============= CHAT HISTORY API ENDPOINTS =============

@app.route('/chat-history', methods=['POST'])
@require_auth
def create_chat_history():
    """Create a new chat history session"""
    try:
        from src.plans_config import check_limit
        
        user_id = request.user_id
        data = request.get_json()
        document_name = data.get('document_name')
        document_id = data.get('document_id')
        first_message = data.get('first_message', 'New conversation')

        if not document_name:
            return jsonify({'error': 'document_name is required'}), 400

        # Check plan limits
        user_plan = db.get_user_plan(user_id)
        plan_type = user_plan.get('plan_type', 'free') if user_plan else 'free'

        # Get current chat count
        current_count = db.get_chat_history_count(user_id)

        # Check if user has reached chat history limit
        allowed, limit, message = check_limit(plan_type, 'max_chat_histories', current_count)
        if not allowed:
            return jsonify({
                'error': message,
                'limit_reached': True,
                'limit': limit,
                'current': current_count,
                'plan': plan_type
            }), 403

        # Create chat history
        chat = db.create_chat_history(
            user_id=user_id,
            document_id=document_id,
            document_name=document_name,
            first_message=first_message
        )

        if chat:
            return jsonify({
                'success': True,
                'chat': chat,
                'remaining': limit - current_count - 1 if limit != -1 else -1
            }), 201
        else:
            return jsonify({'error': 'Failed to create chat history'}), 500

    except Exception as e:
        logger.error(f"Error creating chat history: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/chat-history', methods=['GET'])
@limiter.exempt  # Read-only endpoint, no rate limiting needed
@require_auth
def get_chat_histories():
    """Get all chat histories for the current user"""
    try:
        user_id = request.user_id
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)

        chats = db.get_chat_histories(user_id, limit=limit, offset=offset)
        total_count = db.get_chat_history_count(user_id)

        # Get plan info
        user_plan = db.get_user_plan(user_id)
        plan_type = user_plan.get('plan_type', 'free') if user_plan else 'free'

        from src.plans_config import get_plan_limits
        plan_limits = get_plan_limits(plan_type)

        return jsonify({
            'success': True,
            'chats': chats,
            'total': total_count,
            'limit': plan_limits.get('max_chat_histories', 5),
            'plan': plan_type
        }), 200

    except Exception as e:
        logger.error(f"Error fetching chat histories: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/chat-history/<chat_id>', methods=['GET'])
@require_auth
def get_chat_history(chat_id):
    """Get a specific chat history by ID"""
    try:
        user_id = request.user_id
        chat = db.get_chat_history_by_id(chat_id, user_id)

        if not chat:
            return jsonify({'error': 'Chat history not found'}), 404

        return jsonify({
            'success': True,
            'chat': chat
        }), 200

    except Exception as e:
        logger.error(f"Error fetching chat history: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/chat-history/<chat_id>', methods=['PUT'])
@require_auth
def update_chat_history(chat_id):
    """Update chat history with new messages"""
    try:
        user_id = request.user_id
        from src.plans_config import check_limit

        data = request.get_json()
        messages = data.get('messages', [])

        if not messages:
            return jsonify({'error': 'messages array is required'}), 400

        # Check plan limits for queries per chat
        user_plan = db.get_user_plan(user_id)
        plan_type = user_plan.get('plan_type', 'free') if user_plan else 'free'

        # Count user messages (queries) in the chat
        user_message_count = sum(1 for msg in messages if msg.get('role') == 'user')

        allowed, limit, message = check_limit(plan_type, 'max_queries_per_chat', user_message_count)
        if not allowed:
            return jsonify({
                'error': message,
                'limit_reached': True,
                'limit': limit,
                'current': user_message_count,
                'plan': plan_type
            }), 403

        # Update chat
        success = db.update_chat_history(
            chat_id=chat_id,
            user_id=user_id,
            messages=messages,
            message_count=len(messages)
        )

        if success:
            return jsonify({
                'success': True,
                'remaining_queries': limit - user_message_count if limit != -1 else -1
            }), 200
        else:
            return jsonify({'error': 'Failed to update chat history'}), 500

    except Exception as e:
        logger.error(f"Error updating chat history: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/chat-history/<chat_id>/message', methods=['POST'])
@require_auth
def append_message(chat_id):
    """Append a single message to chat history"""
    try:
        user_id = request.user_id
        from src.plans_config import check_limit

        data = request.get_json()
        message = data.get('message')

        if not message:
            return jsonify({'error': 'message object is required'}), 400

        # Get current chat
        chat = db.get_chat_history_by_id(chat_id, user_id)
        if not chat:
            return jsonify({'error': 'Chat history not found'}), 404

        # Check plan limits if it's a user message
        if message.get('role') == 'user':
            user_plan = db.get_user_plan(user_id)
            plan_type = user_plan.get('plan_type', 'free') if user_plan else 'free'

            # Count existing user messages
            existing_messages = chat.get('messages', [])
            user_message_count = sum(1 for msg in existing_messages if msg.get('role') == 'user')

            allowed, limit, error_message = check_limit(plan_type, 'max_queries_per_chat', user_message_count + 1)
            if not allowed:
                return jsonify({
                    'error': error_message,
                    'limit_reached': True,
                    'limit': limit,
                    'current': user_message_count,
                    'plan': plan_type
                }), 403

        # Append message
        success = db.append_message_to_chat(chat_id, user_id, message)

        if success:
            return jsonify({'success': True}), 200
        else:
            return jsonify({'error': 'Failed to append message'}), 500

    except Exception as e:
        logger.error(f"Error appending message: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/chat-history/<chat_id>', methods=['DELETE'])
@require_auth
def delete_chat_history(chat_id):
    """Delete a specific chat history"""
    try:
        user_id = request.user_id
        success = db.delete_chat_history(chat_id, user_id)

        if success:
            return jsonify({'success': True}), 200
        else:
            return jsonify({'error': 'Failed to delete chat history'}), 500

    except Exception as e:
        logger.error(f"Error deleting chat history: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/chat-history/clear-all', methods=['DELETE'])
@require_auth
def clear_all_chat_histories(current_user):
    """Delete all chat histories for the current user"""
    try:
        success = db.delete_all_chat_histories(user_id)

        if success:
            return jsonify({'success': True}), 200
        else:
            return jsonify({'error': 'Failed to clear chat histories'}), 500

    except Exception as e:
        logger.error(f"Error clearing chat histories: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/chat-history/search', methods=['GET'])
@require_auth
def search_chat_histories(current_user):
    """Search chat histories by content"""
    try:
        query = request.args.get('q', '')

        if not query:
            return jsonify({'error': 'Search query (q) is required'}), 400

        chats = db.search_chat_histories(user_id, query)

        return jsonify({
            'success': True,
            'chats': chats,
            'total': len(chats)
        }), 200

    except Exception as e:
        logger.error(f"Error searching chat histories: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/chat-history/filter', methods=['GET'])
@require_auth
def filter_chat_histories(current_user):
    """Filter chat histories by date range"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        if not start_date:
            return jsonify({'error': 'start_date is required'}), 400

        chats = db.filter_chat_histories_by_date(user_id, start_date, end_date)

        return jsonify({
            'success': True,
            'chats': chats,
            'total': len(chats)
        }), 200

    except Exception as e:
        logger.error(f"Error filtering chat histories: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/plan/limits', methods=['GET'])
@require_auth
def get_plan_limits_endpoint(current_user):
    """Get current user's plan limits and usage"""
    try:
        from src.plans_config import get_plan_limits

        # Get user plan
        user_plan = db.get_user_plan(user_id)
        plan_type = user_plan.get('plan_type', 'free') if user_plan else 'free'

        # Get plan limits
        limits = get_plan_limits(plan_type)

        # Get current usage
        chat_count = db.get_chat_history_count(user_id)

        return jsonify({
            'success': True,
            'plan': plan_type,
            'limits': limits,
            'usage': {
                'chat_histories': chat_count,
                'documents': user_plan.get('documents_uploaded', 0) if user_plan else 0
            }
        }), 200

    except Exception as e:
        logger.error(f"Error fetching plan limits: {e}")
        return jsonify({'error': str(e)}), 500

# ============= END CHAT HISTORY API ENDPOINTS =============

# ============= AUTO-RUN DATABASE MIGRATIONS =============
# Run migrations on app startup (works with both direct python and gunicorn)
try:
    logger.info("Checking database migrations...")
    from src.migrator import run_migrations
    run_migrations()
    logger.info("Database migrations completed successfully")
except Exception as e:
    logger.warning(f"Migration check failed: {e}")
    logger.warning("Continuing with startup...")

if __name__ == '__main__':
    print("=" * 70)
    print("dokguru Voice - Multimodal RAG System")
    print("=" * 70)

    print("Configuration:")
    print("  Voice Input: Groq Whisper STT (with fallbacks)")
    print("  Voice Output: Coqui TTS (VITS) - High Quality Neural Speech")
    print("  RAG Engine: Llama-3.1 + MiniLM")
    print("  Vector Store: ChromaDB (Persistent)")
    print(f"  Redis Cache: {rag_system.cache.mode} ({rag_system.cache.enabled and 'enabled' or 'disabled'})")
    print(f"  Beta Limits: {user_limits.MAX_DOCUMENTS_PER_USER} docs, {user_limits.MAX_QUERIES_PER_DAY} queries/day, {user_limits.MAX_FILE_SIZE_MB}MB files")
    print("\n[SERVER] Open your browser at: http://localhost:8080")
    print("\nEndpoints:")
    print("  POST /auth/signup - User registration")
    print("  POST /auth/login - User login")
    print("  GET  /auth/me - Get current user")
    print("  POST /upload - Upload PDF (requires auth)")
    print("  GET  /documents - List all documents (requires auth)")
    print("  DELETE /documents/<name> - Delete specific document (requires auth)")
    print("  POST /documents/clear-all - Clear all documents (requires auth)")
    print("  POST /ask - Text query (requires auth)")
    print("  POST /transcribe - Audio to text")
    print("  POST /speak - Text to audio")
    print("  POST /voice-query - Complete voice pipeline (requires auth)")
    print("  GET  /limits - Get user limits and usage (requires auth)")
    print("  GET  /stats - System statistics")
    print("  GET  /cache/stats - Cache statistics")
    print("  POST /cache/clear - Clear cache")
    print("  GET  /health - Health check")
    port = int(os.getenv('PORT', 8080))
    # Use 0.0.0.0 for production (allows external connections)
    # Use 127.0.0.1 for local development
    host = '0.0.0.0' if os.getenv('FLASK_ENV') == 'production' else '127.0.0.1'
    app.run(host=host, port=port, debug=False)
