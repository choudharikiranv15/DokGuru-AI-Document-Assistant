"""
Authentication decorators for Flask routes
"""
from functools import wraps
from flask import request, jsonify
from src.auth.jwt_handler import verify_jwt


def require_auth(f):
    """Decorator to require authentication for a route"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Allow OPTIONS requests for CORS preflight
        if request.method == 'OPTIONS':
            return '', 204

        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            print("[AUTH] No authorization header")
            return jsonify({"error": "No authorization header"}), 401

        # Extract token (format: "Bearer <token>")
        try:
            token = auth_header.split(' ')[1]
            print(f"[AUTH] Token extracted (first 20 chars): {token[:20]}...")
        except IndexError:
            print("[AUTH] Invalid authorization header format")
            return jsonify({"error": "Invalid authorization header format"}), 401

        # Verify token
        print("[AUTH] Attempting to verify JWT...")
        payload = verify_jwt(token)
        if not payload:
            print("[AUTH] JWT verification failed")
            return jsonify({"error": "Invalid or expired token"}), 401

        print(f"[AUTH] JWT verified successfully for user: {payload.get('sub') or payload.get('user_id')}")

        # Add user info to request context
        # Supabase Auth uses 'sub', our custom auth used 'user_id'
        request.user_id = payload.get('sub') or payload.get('user_id')
        request.user_email = payload.get('email')
        
        # 'is_admin' might be in metadata or custom claims, but best to check DB or default False here
        # If app_metadata is present (Supabase standard), check there
        app_metadata = payload.get('app_metadata', {})
        request.is_admin = app_metadata.get('is_admin', False) or payload.get('is_admin', False)

        if not request.user_id:
             return jsonify({"error": "Invalid token payload: missing user_id"}), 401

        return f(*args, **kwargs)

    return decorated_function


def require_admin(f):
    """Decorator to require admin privileges for a route"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Allow OPTIONS requests for CORS preflight
        if request.method == 'OPTIONS':
            return '', 204

        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return jsonify({"error": "No authorization header", "success": False}), 401

        # Extract token
        try:
            token = auth_header.split(' ')[1]
        except IndexError:
            return jsonify({"error": "Invalid authorization header format", "success": False}), 401

        # Verify token
        payload = verify_jwt(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token", "success": False}), 401

        # Get user ID
        user_id = payload.get('sub') or payload.get('user_id')
        
        # Check admin status from Database (Source of Truth)
        try:
            # Import here to avoid circular imports
            from src.lazy_loader import SystemComponents
            db = SystemComponents().get('db')
            
            user = db.get_user_by_id(user_id)
            
            if not user or not user.get('is_admin', False):
                import logging
                logging.warning(f"Unauthorized admin access attempt by user {user_id}")
                return jsonify({"error": "Admin access required", "success": False}), 403
                
            # Add user info to request context
            request.user_id = user_id
            request.user_email = user.get('email')
            request.is_admin = True
            
        except Exception as e:
            import logging
            logging.error(f"Admin check failed: {e}")
            return jsonify({"error": "Authorization check failed", "success": False}), 500

        return f(*args, **kwargs)

    return decorated_function
