# Gunicorn configuration for dokguru Voice Production Server
# NOTE: Gunicorn is for Linux/Unix production environments only
# For Windows development, use Flask dev server: python app.py
# For Windows production, use Waitress: pip install waitress && waitress-serve --port=8080 app:app
import multiprocessing
import os

# Server socket
# CRITICAL: Render requires binding to 0.0.0.0 with PORT environment variable
# Render provides PORT automatically (usually 10000)
# Falls back to 8080 for local development
port = os.getenv('PORT', '8080')
bind = f"0.0.0.0:{port}"
backlog = 2048

# Log the binding address for debugging
import sys
print(f"\n{'='*70}", file=sys.stderr)
print(f"[Gunicorn Config] Binding to {bind}", file=sys.stderr)
print(f"[Gunicorn Config] PORT environment variable: {os.getenv('PORT', 'NOT SET')}", file=sys.stderr)
print(f"{'='*70}\n", file=sys.stderr)
sys.stderr.flush()

# Worker processes
# Render Free Tier: 0.5 GB RAM - use gevent for maximum I/O concurrency with minimal RAM
# For I/O-bound apps (LLM/DB/Redis), gevent is optimal:
# - gthread: 8 threads = 64MB RAM, handles 8 concurrent requests
# - gevent: 1000 greenlets = 2MB RAM, handles 1000+ concurrent requests
workers = int(os.getenv('GUNICORN_WORKERS', '1'))  # 1 worker for Render free tier
worker_class = 'gevent'  # Async worker for I/O-bound operations (LLM, DB, Redis)
worker_connections = int(os.getenv('GUNICORN_CONNECTIONS', '1000'))  # 1000 concurrent connections
timeout = 300  # 5 minutes for ML model loading, PDF processing and LLM responses
graceful_timeout = 300  # Allow 5 minutes for worker to finish during shutdown
keepalive = 5

# Restart workers after N requests (prevent memory leaks)
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = '-'  # stdout
errorlog = '-'   # stderr
loglevel = 'info'
capture_output = True
enable_stdio_inheritance = True

# Process naming
proc_name = 'DokGuru_voice'

# Server mechanics
daemon = False  # Run in foreground (required for most hosting platforms)
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Development vs Production
# Set FLASK_ENV=production in .env for production mode
raw_env = [
    f"FLASK_ENV={os.getenv('FLASK_ENV', 'development')}",
]

# Preload app for better memory efficiency
# NOTE: Set to False for Render to ensure port binding happens BEFORE app initialization
# This prevents timeout issues when app has heavy dependencies (ML models, etc.)
preload_app = False

# Worker lifecycle hooks
def on_starting(server):
    """Called just before the master process is initialized."""
    server.log.info("=" * 60)
    server.log.info("DokGuru Voice - Gunicorn Starting")
    server.log.info("=" * 60)
    server.log.info(f"Binding to: {bind}")
    server.log.info(f"Workers: {workers}, Worker class: {worker_class}")
    server.log.info(f"Connections per worker: {worker_connections}")
    server.log.info("=" * 60)

def on_reload(server):
    """Called to recycle workers during reload."""
    server.log.info("Reloading Gunicorn workers")

def when_ready(server):
    """Called just after the server is started."""
    import sys
    server.log.info("=" * 60)
    server.log.info("✓✓✓ Gunicorn server READY ✓✓✓")
    server.log.info(f"✓ Listening on: {bind}")
    server.log.info(f"✓ PORT env var: {os.getenv('PORT', 'NOT SET')}")
    server.log.info(f"✓ Workers: {workers}, Worker class: {worker_class}")
    server.log.info(f"✓ Connections per worker: {worker_connections}")
    server.log.info(f"✓ Max concurrent requests: {workers * worker_connections}")
    server.log.info("=" * 60)
    # Also print to stderr to ensure Render sees it
    print(f"\n{'='*60}", file=sys.stderr)
    print(f"✓✓✓ SERVER IS LISTENING ON {bind} ✓✓✓", file=sys.stderr)
    print(f"✓ Using gevent worker with {worker_connections} connections", file=sys.stderr)
    print(f"{'='*60}\n", file=sys.stderr)
    sys.stderr.flush()

def worker_int(worker):
    """Called when a worker receives the INT or QUIT signal."""
    worker.log.info("Worker received INT or QUIT signal")

def worker_abort(worker):
    """Called when a worker receives the ABRT signal."""
    worker.log.warning("Worker received ABRT signal")
