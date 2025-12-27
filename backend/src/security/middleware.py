"""
Security Middleware for Flask Application
Provides request validation, rate limiting helpers, and security checks
"""
from flask import request, jsonify
from functools import wraps
import time
from typing import Callable
import logging

logger = logging.getLogger(__name__)

# Request size limits
MAX_QUERY_LENGTH = 10000  # 10K characters
MAX_TTS_TEXT_LENGTH = 5000  # 5K characters
MAX_JSON_SIZE = 1024 * 1024  # 1MB
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB


def validate_request_size(f: Callable) -> Callable:
    """
    Decorator to validate request payload size
    Prevents DoS attacks via large payloads
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check Content-Length header
        content_length = request.content_length
        if content_length and content_length > MAX_CONTENT_LENGTH:
            size_mb = content_length / (1024 * 1024)
            return jsonify({
                "error": "Request too large",
                "message": f"Request size ({size_mb:.1f}MB) exceeds maximum allowed (50MB)"
            }), 413

        # Check JSON payload size
        if request.is_json:
            try:
                data = request.get_json()
                if data:
                    # Check specific field lengths
                    if 'query' in data and len(str(data['query'])) > MAX_QUERY_LENGTH:
                        return jsonify({
                            "error": "Query too long",
                            "message": f"Query must be less than {MAX_QUERY_LENGTH} characters"
                        }), 400

                    if 'text' in data and len(str(data['text'])) > MAX_TTS_TEXT_LENGTH:
                        return jsonify({
                            "error": "Text too long",
                            "message": f"Text must be less than {MAX_TTS_TEXT_LENGTH} characters"
                        }), 400

            except Exception as e:
                logger.warning(f"Error validating request size: {e}")

        return f(*args, **kwargs)

    return decorated_function


def check_token_blacklist(redis_client, token: str) -> bool:
    """
    Check if JWT token is blacklisted

    Args:
        redis_client: Redis client instance
        token: JWT token to check

    Returns:
        True if token is blacklisted, False otherwise
    """
    try:
        if redis_client and redis_client.exists(f"blacklist:{token}"):
            return True
        return False
    except Exception as e:
        logger.error(f"Error checking token blacklist: {e}")
        # Fail open (allow request) on Redis errors
        return False


def verify_ownership(user_id: str, resource_user_id: str) -> bool:
    """
    Verify that user owns the resource

    Args:
        user_id: Current user's ID
        resource_user_id: Resource owner's user ID

    Returns:
        True if user owns resource, False otherwise
    """
    return str(user_id) == str(resource_user_id)


def log_security_event(event_type: str, details: dict):
    """
    Log security-related events

    Args:
        event_type: Type of security event
        details: Additional details about the event
    """
    try:
        from src.error_tracking import add_breadcrumb, set_context

        # Add breadcrumb for Sentry
        add_breadcrumb(
            category='security',
            message=event_type,
            level='warning',
            data=details
        )

        # Also log to application logger
        logger.warning(f"Security Event: {event_type} - {details}")

    except Exception as e:
        logger.error(f"Error logging security event: {e}")


def check_suspicious_patterns(text: str) -> list:
    """
    Check text for suspicious patterns that might indicate attack attempts

    Args:
        text: Text to check

    Returns:
        List of detected suspicious patterns
    """
    import re

    suspicious = []

    patterns = {
        'sql_injection': [
            r"(\bOR\b|\bAND\b)\s+['\"]?\d+['\"]?\s*=\s*['\"]?\d+['\"]?",
            r";\s*(DROP|DELETE|UPDATE|INSERT|EXEC|UNION)",
            r"UNION\s+SELECT",
            r"--\s*$",
            r"/\*.*\*/",
        ],
        'xss': [
            r"<script[^>]*>",
            r"javascript:",
            r"on\w+\s*=",
            r"<iframe",
            r"<object",
            r"<embed",
        ],
        'path_traversal': [
            r"\.\./",
            r"\.\./\.\./",
            r"%2e%2e/",
            r"\.\.\\",
        ],
        'command_injection': [
            r";\s*(cat|ls|rm|wget|curl|nc|bash|sh)\s+",
            r"\|\s*(cat|ls|rm|wget|curl|nc|bash|sh)\s+",
            r"`.*`",
            r"\$\(.*\)",
        ],
    }

    for attack_type, pattern_list in patterns.items():
        for pattern in pattern_list:
            if re.search(pattern, text, re.IGNORECASE):
                suspicious.append(attack_type)
                break  # Only report each type once

    return suspicious


def rate_limit_key(user_id: str, endpoint: str) -> str:
    """
    Generate rate limit key for user and endpoint

    Args:
        user_id: User ID
        endpoint: Endpoint name

    Returns:
        Rate limit key string
    """
    return f"ratelimit:{user_id}:{endpoint}"


def check_ip_whitelist(ip_address: str, whitelist: list) -> bool:
    """
    Check if IP address is in whitelist

    Args:
        ip_address: IP address to check
        whitelist: List of allowed IP addresses

    Returns:
        True if IP is whitelisted, False otherwise
    """
    if not whitelist:
        return True  # No whitelist = all allowed

    # Support CIDR notation in future
    return ip_address in whitelist


def sanitize_error_message(error: Exception, is_production: bool = True) -> str:
    """
    Sanitize error messages to prevent information disclosure

    Args:
        error: Exception object
        is_production: Whether running in production mode

    Returns:
        Sanitized error message
    """
    if is_production:
        # Generic messages in production
        error_type = type(error).__name__

        generic_messages = {
            'ValueError': 'Invalid input provided',
            'KeyError': 'Required field missing',
            'FileNotFoundError': 'Resource not found',
            'PermissionError': 'Access denied',
            'ConnectionError': 'Service temporarily unavailable',
        }

        return generic_messages.get(error_type, 'An error occurred')
    else:
        # Detailed messages in development
        return str(error)


def validate_content_type(allowed_types: list) -> Callable:
    """
    Decorator to validate request content type

    Args:
        allowed_types: List of allowed content types

    Returns:
        Decorator function
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            content_type = request.content_type

            if not content_type:
                return jsonify({
                    "error": "Content-Type header is required"
                }), 400

            # Extract base content type (ignore charset, etc.)
            base_type = content_type.split(';')[0].strip()

            if base_type not in allowed_types:
                return jsonify({
                    "error": "Invalid Content-Type",
                    "message": f"Expected one of: {', '.join(allowed_types)}",
                    "received": base_type
                }), 415

            return f(*args, **kwargs)

        return decorated_function
    return decorator


class SecurityHeaders:
    """
    Security headers configuration
    """
    @staticmethod
    def get_headers():
        """Get recommended security headers"""
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        }


def add_security_headers(response):
    """
    Add security headers to response

    Args:
        response: Flask response object

    Returns:
        Response with security headers added
    """
    headers = SecurityHeaders.get_headers()
    for header, value in headers.items():
        response.headers[header] = value

    return response
