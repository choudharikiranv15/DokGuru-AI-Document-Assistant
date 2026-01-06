"""
JWT token verification for Supabase Auth
"""
import os
import jwt
import json
import requests
import logging
from typing import Optional, Dict
from datetime import datetime
from dotenv import load_dotenv
from jwt.algorithms import ECAlgorithm

load_dotenv()

logger = logging.getLogger(__name__)

JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_URL = os.getenv("SUPABASE_URL")

# Cache for JWKS
_jwks_cache = None
_public_key_cache = None

# Track token usage for security monitoring
_token_usage_tracker = {}


def get_supabase_jwks():
    """Fetch Supabase JWKS (JSON Web Key Set) for token verification"""
    global _jwks_cache

    if _jwks_cache:
        return _jwks_cache

    try:
        # Supabase exposes JWKS at /.well-known/jwks.json
        jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        response = requests.get(jwks_url, timeout=5)
        response.raise_for_status()
        _jwks_cache = response.json()
        return _jwks_cache
    except Exception as e:
        print(f"Failed to fetch JWKS: {e}")
        return None


def get_public_key_from_jwk(kid: str):
    """Get public key from JWK using the key ID"""
    global _public_key_cache

    if _public_key_cache and _public_key_cache.get('kid') == kid:
        return _public_key_cache.get('key')

    jwks = get_supabase_jwks()
    if not jwks or 'keys' not in jwks:
        return None

    # Find the key with matching kid
    for key in jwks['keys']:
        if key.get('kid') == kid:
            try:
                # Convert JWK to public key
                public_key = ECAlgorithm.from_jwk(json.dumps(key))
                _public_key_cache = {'kid': kid, 'key': public_key}
                return public_key
            except Exception as e:
                print(f"Error converting JWK to public key: {e}")
                return None

    return None


def check_suspicious_token_usage(user_id: str, ip_address: str = None) -> bool:
    """
    Check for suspicious token usage patterns

    Args:
        user_id: User ID from token payload
        ip_address: Request IP address (optional)

    Returns:
        True if usage is suspicious, False otherwise
    """
    current_time = datetime.utcnow().timestamp()

    if user_id not in _token_usage_tracker:
        _token_usage_tracker[user_id] = {
            'requests': [],
            'ips': set()
        }

    tracker = _token_usage_tracker[user_id]

    # Clean old requests (keep last 5 minutes)
    tracker['requests'] = [req for req in tracker['requests'] if current_time - req < 300]

    # Add current request
    tracker['requests'].append(current_time)
    if ip_address:
        tracker['ips'].add(ip_address)

    # Check for suspicious patterns

    # 1. Too many requests in short time (>100 per minute)
    recent_requests = [req for req in tracker['requests'] if current_time - req < 60]
    if len(recent_requests) > 100:
        logger.warning(f"Suspicious: High request rate for user {user_id}: {len(recent_requests)} req/min")
        return True

    # 2. Multiple IPs in short time (>3 IPs in 5 minutes)
    if len(tracker['ips']) > 3:
        logger.warning(f"Suspicious: Multiple IPs for user {user_id}: {len(tracker['ips'])} IPs")
        return True

    return False


def verify_jwt(token: str, request_ip: str = None) -> Optional[Dict]:
    """Verify Supabase JWT token and return payload"""

    try:
        # Decode header to get algorithm and key ID
        header = jwt.get_unverified_header(token)
        algorithm = header.get('alg')
        kid = header.get('kid')

        # Supabase uses ES256 for access tokens
        if algorithm == 'ES256' and kid:
            public_key = get_public_key_from_jwk(kid)
            if not public_key:
                logger.error(f"Could not find public key for kid: {kid}")
                return None

            try:
                payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=['ES256'],
                    audience='authenticated',
                    options={"verify_aud": False}  # Supabase uses 'authenticated' audience
                )

                # Security monitoring: Check for suspicious usage
                user_id = payload.get('sub')
                if user_id and check_suspicious_token_usage(user_id, request_ip):
                    logger.warning(f"Suspicious token usage detected for user: {user_id}")
                    # Continue to allow request but log for monitoring

                return payload
            except jwt.ExpiredSignatureError:
                logger.debug("Token has expired")
                return None
            except jwt.InvalidTokenError as e:
                logger.warning(f"Invalid ES256 token: {e}")
                return None

        # Fallback to HS256 for service role tokens or other scenarios
        elif algorithm == 'HS256':
            if not JWT_SECRET:
                logger.error("JWT_SECRET not configured for HS256 verification")
                return None

            try:
                payload = jwt.decode(
                    token,
                    JWT_SECRET,
                    algorithms=['HS256'],
                    options={"verify_aud": False}
                )

                # Security monitoring for HS256 tokens too
                user_id = payload.get('sub')
                if user_id and check_suspicious_token_usage(user_id, request_ip):
                    logger.warning(f"Suspicious token usage detected for user: {user_id}")

                return payload
            except jwt.ExpiredSignatureError:
                logger.debug("Token has expired")
                return None
            except jwt.InvalidTokenError as e:
                logger.warning(f"Invalid HS256 token: {e}")
                return None
        else:
            logger.error(f"Unsupported JWT algorithm: {algorithm}")
            return None

    except Exception as e:
        logger.error(f"Error verifying JWT: {e}")
        return None
