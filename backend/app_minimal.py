"""
Minimal Flask app wrapper for INSTANT startup on Render
This app starts immediately and proxies to the real app once it's loaded
"""
from flask import Flask, jsonify
from flask_cors import CORS
import os
import threading
import time

# Create minimal Flask app IMMEDIATELY
app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'temp-key-for-startup')

# Configure CORS immediately for health checks and proxied requests
cors_origins = os.getenv('CORS_ORIGINS', 'https://dokguru.in,https://www.dokguru.in,https://dokguru-backend-383828718978.asia-south2.run.app,http://localhost:5173,http://localhost:3000,https://dokguru.vercel.app').split(',')
CORS(app, resources={
    r"/*": {
        "origins": cors_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept", "Origin"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# Status tracking
_real_app_loaded = False
_real_app = None
_load_error = None
_load_start_time = None


def load_real_app():
    """Load the real app in background"""
    global _real_app_loaded, _real_app, _load_error, _load_start_time

    try:
        print("="*70)
        print("[BACKGROUND] Loading real application...")
        print("="*70)
        _load_start_time = time.time()

        # Import the real app module
        from app import app as real_flask_app
        from app import _components

        # Trigger warmup of heavy components
        _components.warmup_all()

        _real_app = real_flask_app
        _real_app_loaded = True

        elapsed = time.time() - _load_start_time
        print("="*70)
        print(f"[SUCCESS] Real application loaded in {elapsed:.1f}s")
        print("="*70)

    except Exception as e:
        _load_error = str(e)
        print("="*70)
        print(f"[ERROR] Failed to load real application: {e}")
        print("="*70)
        import traceback
        traceback.print_exc()


# Start loading real app in background immediately when module is imported
_load_thread = threading.Thread(target=load_real_app, daemon=True)
_load_thread.start()


@app.route('/health', methods=['GET'])
def health_check():
    """Instant health check that always responds"""
    elapsed = time.time() - _load_start_time if _load_start_time else 0

    return jsonify({
        'success': True,
        'status': 'healthy',
        'app': 'ready',
        'port': 'listening',
        'real_app': {
            'loaded': _real_app_loaded,
            'error': _load_error,
            'loading_time': f"{elapsed:.1f}s" if _load_start_time else 'not started'
        }
    }), 200


@app.route('/status', methods=['GET'])
def status():
    """Detailed status endpoint"""
    elapsed = time.time() - _load_start_time if _load_start_time else 0

    return jsonify({
        'minimal_app': 'running',
        'real_app_loaded': _real_app_loaded,
        'load_error': _load_error,
        'loading_time': f"{elapsed:.1f}s" if _load_start_time else 'not started',
        'port': os.getenv('PORT', '10000'),
        'message': 'Real app loading in background' if not _real_app_loaded else 'Ready'
    })


# Catch-all route to proxy to real app or show loading message
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'])
def catch_all(path):
    """Proxy all requests to real app once loaded"""
    from flask import request, Response

    # If real app not loaded yet, return loading message
    if not _real_app_loaded:
        if _load_error:
            return jsonify({
                'success': False,
                'message': 'Application failed to load',
                'error': str(_load_error),
                'path': request.path
            }), 503
        else:
            elapsed = time.time() - _load_start_time if _load_start_time else 0
            return jsonify({
                'success': False,
                'message': f'Application still loading... ({elapsed:.0f}s elapsed)',
                'retry_after': 30,
                'path': request.path
            }), 503

    # Real app is loaded - dispatch request to it
    try:
        with _real_app.test_request_context(request.path, method=request.method,
                                           headers=dict(request.headers),
                                           data=request.get_data(),
                                           query_string=request.query_string):
            try:
                rv = _real_app.preprocess_request()
                if rv is None:
                    rv = _real_app.dispatch_request()
            except Exception as e:
                rv = _real_app.handle_user_exception(e)

            response = _real_app.make_response(rv)
            response = _real_app.process_response(response)

            # Convert to Response object for minimal app
            return Response(
                response.get_data(),
                status=response.status_code,
                headers=dict(response.headers)
            )
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error proxying request: {str(e)}',
            'path': request.path
        }), 500


# Print startup message
print("="*70)
print("[MINIMAL APP READY - Port can bind IMMEDIATELY]")
print(f"[PORT]: {os.getenv('PORT', '10000')}")
print("[STATUS]: Real app loading in background thread...")
print("="*70)
