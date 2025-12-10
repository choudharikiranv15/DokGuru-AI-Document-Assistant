"""
JWT token verification for Supabase Auth
"""
import os
import jwt
import json
import requests
from typing import Optional, Dict
from dotenv import load_dotenv
from jwt.algorithms import ECAlgorithm

load_dotenv()

JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_URL = os.getenv("SUPABASE_URL")

# Cache for JWKS
_jwks_cache = None
_public_key_cache = None


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


def verify_jwt(token: str) -> Optional[Dict]:
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
                print(f"Could not find public key for kid: {kid}")
                return None

            try:
                payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=['ES256'],
                    audience='authenticated',
                    options={"verify_aud": False}  # Supabase uses 'authenticated' audience
                )
                return payload
            except jwt.ExpiredSignatureError:
                print("Token has expired")
                return None
            except jwt.InvalidTokenError as e:
                print(f"Invalid token: {e}")
                return None

        # Fallback to HS256 for service role tokens or other scenarios
        elif algorithm == 'HS256':
            if not JWT_SECRET:
                print("JWT_SECRET not configured for HS256 verification")
                return None

            try:
                payload = jwt.decode(
                    token,
                    JWT_SECRET,
                    algorithms=['HS256'],
                    options={"verify_aud": False}
                )
                return payload
            except jwt.ExpiredSignatureError:
                print("Token has expired")
                return None
            except jwt.InvalidTokenError as e:
                print(f"Invalid token: {e}")
                return None
        else:
            print(f"Unsupported algorithm: {algorithm}")
            return None

    except Exception as e:
        print(f"Error verifying JWT: {e}")
        return None
