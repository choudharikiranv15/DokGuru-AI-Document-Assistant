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
            return jsonify({"error": "No authorization header"}), 401

        # Extract token (format: "Bearer <token>")
        try:
            token = auth_header.split(' ')[1]
        except IndexError:
            return jsonify({"error": "Invalid authorization header format"}), 401

        # Verify token
        payload = verify_jwt(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Add user info to request context
        request.user_id = payload['user_id']
        request.user_email = payload['email']
        request.is_admin = payload.get('is_admin', False)

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

        # Extract token (format: "Bearer <token>")
        try:
            token = auth_header.split(' ')[1]
        except IndexError:
            return jsonify({"error": "Invalid authorization header format", "success": False}), 401

        # Verify token
        payload = verify_jwt(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token", "success": False}), 401

        # Check if user is admin
        if not payload.get('is_admin', False):
            import logging
            logging.warning(f"Unauthorized admin access attempt by user {payload['user_id']}")
            return jsonify({"error": "Admin access required", "success": False}), 403

        # Add user info to request context
        request.user_id = payload['user_id']
        request.user_email = payload['email']
        request.is_admin = True

        return f(*args, **kwargs)

    return decorated_function
