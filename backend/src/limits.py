"""
User Limits for Beta Launch
- Document limits: 5 docs per user
- Query limits: 100 queries per day (increased for testing)
- File size limits: 10MB max
"""
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class UserLimits:
    """
    Manage user limits for beta launch
    Uses Redis for tracking if available, otherwise in-memory
    """

    # Beta limits (increased for testing phase)
    MAX_DOCUMENTS_PER_USER = 5
    MAX_QUERIES_PER_DAY = 100  # Increased from 50 for testing
    MAX_FILE_SIZE_MB = 10
    MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

    def __init__(self, cache_manager, database):
        """
        Initialize user limits manager

        Args:
            cache_manager: RedisCacheManager instance
            database: Database instance
        """
        self.cache = cache_manager
        self.db = database
        logger.info(f"User limits initialized: {self.MAX_DOCUMENTS_PER_USER} docs, "
                   f"{self.MAX_QUERIES_PER_DAY} queries/day, {self.MAX_FILE_SIZE_MB}MB files")

    def check_document_limit(self, user_id: str, current_count: int) -> Dict[str, Any]:
        """
        Check if user can upload more documents

        Args:
            user_id: User identifier
            current_count: Current number of documents

        Returns:
            Dict with 'allowed' (bool), 'remaining' (int), 'limit' (int), 'message' (str)
        """
        allowed = current_count < self.MAX_DOCUMENTS_PER_USER
        remaining = max(0, self.MAX_DOCUMENTS_PER_USER - current_count)

        if not allowed:
            message = (f"Document limit reached. Beta users can upload up to "
                      f"{self.MAX_DOCUMENTS_PER_USER} documents. "
                      f"Please delete existing documents to upload new ones.")
        else:
            message = f"You can upload {remaining} more document(s)."

        return {
            'allowed': allowed,
            'remaining': remaining,
            'limit': self.MAX_DOCUMENTS_PER_USER,
            'current': current_count,
            'message': message
        }

    def check_query_limit(self, user_id: str) -> Dict[str, Any]:
        """
        Check if user can make more queries today
        Uses Redis rate limiting (24-hour window)

        Args:
            user_id: User identifier

        Returns:
            Dict with 'allowed' (bool), 'remaining' (int), 'reset_at' (timestamp), 'message' (str)
        """
        # Use Redis rate limiting (24 hour window = 86400 seconds)
        rate_limit = self.cache.check_rate_limit(
            identifier=f"query:{user_id}",
            max_requests=self.MAX_QUERIES_PER_DAY,
            window=86400  # 24 hours
        )

        if not rate_limit['allowed']:
            import datetime
            reset_time = datetime.datetime.fromtimestamp(rate_limit['reset_at'])
            message = (f"Query limit reached. Beta users can make up to "
                      f"{self.MAX_QUERIES_PER_DAY} queries per day. "
                      f"Your limit resets at {reset_time.strftime('%I:%M %p')}.")
        else:
            message = f"You have {rate_limit['remaining']} queries remaining today."

        return {
            'allowed': rate_limit['allowed'],
            'remaining': rate_limit['remaining'],
            'limit': self.MAX_QUERIES_PER_DAY,
            'reset_at': rate_limit['reset_at'],
            'message': message
        }

    def check_file_size(self, file_size_bytes: int, filename: str = "") -> Dict[str, Any]:
        """
        Check if file size is within limits

        Args:
            file_size_bytes: File size in bytes
            filename: Optional filename for better error messages

        Returns:
            Dict with 'allowed' (bool), 'size_mb' (float), 'limit_mb' (int), 'message' (str)
        """
        size_mb = file_size_bytes / (1024 * 1024)
        allowed = file_size_bytes <= self.MAX_FILE_SIZE_BYTES

        if not allowed:
            file_ref = f"'{filename}'" if filename else "This file"
            message = (f"{file_ref} is {size_mb:.1f}MB. "
                      f"Beta users can upload files up to {self.MAX_FILE_SIZE_MB}MB. "
                      f"Please compress or split your PDF.")
        else:
            message = f"File size OK ({size_mb:.1f}MB / {self.MAX_FILE_SIZE_MB}MB)."

        return {
            'allowed': allowed,
            'size_mb': round(size_mb, 2),
            'limit_mb': self.MAX_FILE_SIZE_MB,
            'message': message
        }

    def get_user_usage_stats(self, user_id: str, document_count: int) -> Dict[str, Any]:
        """
        Get comprehensive usage statistics for a user

        Args:
            user_id: User identifier
            document_count: Current number of documents

        Returns:
            Dict with usage stats and limits
        """
        doc_limit = self.check_document_limit(user_id, document_count)
        query_limit = self.check_query_limit(user_id)

        return {
            'documents': {
                'current': document_count,
                'limit': self.MAX_DOCUMENTS_PER_USER,
                'remaining': doc_limit['remaining'],
                'can_upload': doc_limit['allowed']
            },
            'queries': {
                'limit_per_day': self.MAX_QUERIES_PER_DAY,
                'remaining_today': query_limit['remaining'],
                'can_query': query_limit['allowed'],
                'reset_at': query_limit['reset_at']
            },
            'file_size': {
                'max_mb': self.MAX_FILE_SIZE_MB
            }
        }

    def increment_query_count(self, user_id: str) -> bool:
        """
        Increment user's query count (handled automatically by check_rate_limit)

        Args:
            user_id: User identifier

        Returns:
            True (rate limiting handles this automatically)
        """
        # The check_rate_limit function automatically increments
        # We just need to call it (which is done in check_query_limit)
        return True

    def reset_query_limit(self, user_id: str) -> bool:
        """
        Manually reset user's query limit (admin function)

        Args:
            user_id: User identifier

        Returns:
            True if reset successful
        """
        try:
            if self.cache.enabled:
                client = self.cache._get_client()
                rate_key = f"rate:query:{user_id}"
                client.delete(rate_key)
                logger.info(f"Reset query limit for user: {user_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to reset query limit: {e}")
            return False

    def get_all_limits(self) -> Dict[str, Any]:
        """
        Get all beta limits (for display to users)

        Returns:
            Dict with all limit values
        """
        return {
            'beta_limits': {
                'documents_per_user': self.MAX_DOCUMENTS_PER_USER,
                'queries_per_day': self.MAX_QUERIES_PER_DAY,
                'max_file_size_mb': self.MAX_FILE_SIZE_MB
            },
            'note': 'These are beta limits and may be adjusted based on usage.'
        }
