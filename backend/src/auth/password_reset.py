"""
Password Reset Service
Handles password reset token generation, validation, and password updates.
"""
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Tuple
from src.database import get_supabase_client, DatabaseError
from src.redis_cache import RedisCacheManager
import logging
import traceback

logger = logging.getLogger(__name__)


class PasswordResetService:
    """Handles password reset operations"""

    def __init__(self, cache: RedisCacheManager):
        self.client = get_supabase_client()
        self.cache = cache
        self.token_expiry = 3600  # 1 hour in seconds

    def generate_reset_token(self, email: str) -> Optional[str]:
        """
        Generate a password reset token

        Args:
            email: User's email address

        Returns:
            str: Reset token if user exists, None otherwise

        Raises:
            DatabaseError: If database query fails
        """
        try:
            # Check if user exists
            response = self.client.table('users').select('id, email').eq('email', email).execute()

            if not response.data or len(response.data) == 0:
                logger.warning(f"Password reset requested for non-existent email: {email}")
                # Don't reveal if email exists or not for security
                return None

            user = response.data[0]

            # Generate secure token
            token = secrets.token_urlsafe(32)

            # Store token in Redis with 1-hour expiry
            token_key = f"password_reset:{token}"
            self.cache.set(token_key, user['id'], ttl=self.token_expiry)

            # Also store by email for rate limiting (max 3 requests per hour)
            email_key = f"password_reset_requests:{email}"
            request_count = self.cache.get(email_key) or 0
            self.cache.set(email_key, int(request_count) + 1, ttl=3600)

            logger.info(f"Password reset token generated for user {user['id']}")
            return token

        except Exception as e:
            # Log full details
            error_msg = f"Error generating reset token: {type(e).__name__}: {str(e)}"
            logger.error(error_msg)
            logger.error(f"Traceback: {traceback.format_exc()}")

            # Raise DatabaseError for postgrest/supabase errors
            raise DatabaseError(f"Failed to process password reset request: {str(e)}") from e

    def validate_reset_token(self, token: str) -> Optional[str]:
        """
        Validate a reset token and return user_id

        Args:
            token: Reset token

        Returns:
            str: User ID if token is valid, None otherwise
        """
        try:
            token_key = f"password_reset:{token}"
            user_id = self.cache.get(token_key)

            if user_id:
                logger.info(f"Valid reset token for user {user_id}")
                return user_id
            else:
                logger.warning(f"Invalid or expired reset token")
                return None

        except Exception as e:
            logger.error(f"Error validating reset token: {e}")
            return None

    def reset_password(self, token: str, new_password_hash: str) -> Tuple[bool, str]:
        """
        Reset user's password using a valid token

        Args:
            token: Reset token
            new_password_hash: New hashed password

        Returns:
            Tuple[bool, str]: (Success, Message)
        """
        try:
            # Validate token
            user_id = self.validate_reset_token(token)

            if not user_id:
                return False, "Invalid or expired reset token"

            # Update password
            response = self.client.table('users').update({
                'password_hash': new_password_hash,
                'updated_at': datetime.now().isoformat()
            }).eq('id', user_id).execute()

            if response.data:
                # Invalidate the token
                token_key = f"password_reset:{token}"
                self.cache.delete(token_key)

                logger.info(f"Password reset successful for user {user_id}")
                return True, "Password reset successfully"
            else:
                logger.error(f"Failed to update password for user {user_id}")
                return False, "Failed to reset password"

        except Exception as e:
            logger.error(f"Error resetting password: {e}")
            return False, "An error occurred while resetting password"

    def check_rate_limit(self, email: str) -> Tuple[bool, int]:
        """
        Check if user has exceeded password reset rate limit

        Args:
            email: User's email address

        Returns:
            Tuple[bool, int]: (Is allowed, Requests made)
        """
        email_key = f"password_reset_requests:{email}"
        request_count = self.cache.get(email_key) or 0

        max_requests = 3  # Max 3 requests per hour
        is_allowed = int(request_count) < max_requests

        return is_allowed, int(request_count)
