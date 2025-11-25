"""
Redis Cache Manager with Dual Support
Supports both Upstash (REST API) and local Redis with automatic fallback
"""
import json
import hashlib
import logging
from typing import Optional, Dict, Any, List
from datetime import timedelta
import time

# Try importing both Redis clients
try:
    from upstash_redis import Redis as UpstashRedis
    UPSTASH_AVAILABLE = True
except ImportError:
    UPSTASH_AVAILABLE = False

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)


class RedisCacheManager:
    """
    Redis cache manager with dual support:
    1. Upstash Redis (serverless, REST API) - Primary for production
    2. Local Redis - Optional for development
    3. Graceful fallback if Redis unavailable
    """

    def __init__(self, config):
        """
        Initialize Redis cache with dual support

        Args:
            config: Config object with Redis settings
        """
        self.config = config
        self.upstash_client = None
        self.local_client = None
        self.redis_pool = None
        self.enabled = False
        self.mode = "disabled"

        # Try Upstash first (production)
        if UPSTASH_AVAILABLE and config.UPSTASH_REDIS_REST_URL and config.UPSTASH_REDIS_REST_TOKEN:
            try:
                self.upstash_client = UpstashRedis(
                    url=config.UPSTASH_REDIS_REST_URL,
                    token=config.UPSTASH_REDIS_REST_TOKEN
                )
                # Test connection
                self.upstash_client.ping()
                self.enabled = True
                self.mode = "upstash"
                logger.info("✓ Redis cache initialized: Upstash (serverless)")
            except Exception as e:
                logger.warning(f"Upstash Redis connection failed: {e}")
                self.upstash_client = None

        # Try local Redis as fallback (development) - WITH CONNECTION POOLING
        if not self.enabled and REDIS_AVAILABLE and config.REDIS_HOST:
            try:
                # Create connection pool for reusing connections (PERFORMANCE BOOST)
                # Saves 50-100ms per request by reusing connections instead of creating new ones
                redis_pool = redis.ConnectionPool(
                    host=config.REDIS_HOST,
                    port=config.REDIS_PORT,
                    db=config.REDIS_DB,
                    password=config.REDIS_PASSWORD if hasattr(config, 'REDIS_PASSWORD') else None,
                    max_connections=20,  # Max 20 concurrent connections
                    socket_connect_timeout=2,
                    socket_timeout=5,
                    decode_responses=True
                )

                self.local_client = redis.Redis(connection_pool=redis_pool)
                self.redis_pool = redis_pool  # Store pool reference for cleanup

                # Test connection
                self.local_client.ping()
                self.enabled = True
                self.mode = "local"
                logger.info(f"✓ Redis cache initialized: Local ({config.REDIS_HOST}:{config.REDIS_PORT}) with connection pooling (max 20 connections)")
            except Exception as e:
                logger.warning(f"Local Redis connection failed: {e}")
                self.local_client = None
                self.redis_pool = None

        # Final status
        if not self.enabled:
            logger.warning("⚠ Redis cache disabled - no connections available")
            logger.warning("  System will work without caching (slower but functional)")

    def _get_client(self):
        """Get active Redis client"""
        if self.upstash_client:
            return self.upstash_client
        elif self.local_client:
            return self.local_client
        return None

    def _generate_cache_key(self, prefix: str, data: Any) -> str:
        """
        Generate a cache key from prefix and data

        Args:
            prefix: Key prefix (e.g., "query", "session")
            data: Data to hash (string or dict)

        Returns:
            Cache key string
        """
        if isinstance(data, dict):
            data_str = json.dumps(data, sort_keys=True)
        else:
            data_str = str(data)

        hash_digest = hashlib.sha256(data_str.encode()).hexdigest()[:16]
        return f"{prefix}:{hash_digest}"

    # ========== Query Result Caching ==========

    def cache_query_result(self, question: str, document_name: Optional[str],
                          response: Dict[str, Any], ttl: int = 3600, suffix: str = "") -> bool:
        """
        Cache a query result

        Args:
            question: User question
            document_name: Optional document filter
            response: RAG system response
            ttl: Time to live in seconds (default 1 hour)
            suffix: Optional suffix for cache key (e.g., user_id)

        Returns:
            True if cached successfully, False otherwise
        """
        if not self.enabled:
            return False

        try:
            client = self._get_client()
            cache_data = {
                "question": question,
                "document_name": document_name,
                "suffix": suffix
            }
            cache_key = self._generate_cache_key("query", cache_data)

            # Store result
            client.setex(
                cache_key,
                ttl,
                json.dumps(response)
            )

            logger.debug(f"Cached query result: {cache_key[:20]}... (TTL: {ttl}s)")
            return True

        except Exception as e:
            logger.error(f"Failed to cache query result: {e}")
            return False

    def get_cached_query_result(self, question: str, document_name: Optional[str], suffix: str = "") -> Optional[Dict[str, Any]]:
        """
        Retrieve cached query result

        Args:
            question: User question
            document_name: Optional document filter
            suffix: Optional suffix for cache key (e.g., user_id)

        Returns:
            Cached response or None
        """
        if not self.enabled:
            return None

        try:
            client = self._get_client()
            cache_data = {
                "question": question,
                "document_name": document_name,
                "suffix": suffix
            }
            cache_key = self._generate_cache_key("query", cache_data)

            cached = client.get(cache_key)
            if cached:
                logger.debug(f"Cache hit: {cache_key[:20]}...")
                if isinstance(cached, str):
                    return json.loads(cached)
                return cached

            logger.debug(f"Cache miss: {cache_key[:20]}...")
            return None

        except Exception as e:
            logger.error(f"Failed to get cached query: {e}")
            return None

    # ========== Session Management ==========

    def create_session(self, session_id: str, user_data: Dict[str, Any], ttl: int = 86400) -> bool:
        """
        Create a user session

        Args:
            session_id: Unique session identifier
            user_data: Session data (user_id, preferences, etc.)
            ttl: Time to live in seconds (default 24 hours)

        Returns:
            True if created successfully
        """
        if not self.enabled:
            return False

        try:
            client = self._get_client()
            session_key = f"session:{session_id}"

            client.setex(
                session_key,
                ttl,
                json.dumps(user_data)
            )

            logger.debug(f"Created session: {session_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to create session: {e}")
            return False

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get session data

        Args:
            session_id: Session identifier

        Returns:
            Session data or None
        """
        if not self.enabled:
            return None

        try:
            client = self._get_client()
            session_key = f"session:{session_id}"

            cached = client.get(session_key)
            if cached:
                if isinstance(cached, str):
                    return json.loads(cached)
                return cached

            return None

        except Exception as e:
            logger.error(f"Failed to get session: {e}")
            return None

    def delete_session(self, session_id: str) -> bool:
        """
        Delete a session

        Args:
            session_id: Session identifier

        Returns:
            True if deleted successfully
        """
        if not self.enabled:
            return False

        try:
            client = self._get_client()
            session_key = f"session:{session_id}"
            client.delete(session_key)
            logger.debug(f"Deleted session: {session_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete session: {e}")
            return False

    # ========== Conversation Management ==========

    def save_user_conversation(self, user_id: str, messages: List[str], ttl: int = 86400) -> bool:
        """
        Save user conversation history

        Args:
            user_id: User identifier
            messages: List of conversation messages
            ttl: Time to live in seconds (default 24 hours)

        Returns:
            True if saved successfully
        """
        if not self.enabled:
            return False

        try:
            client = self._get_client()
            conversation_key = f"conversation:{user_id}"

            client.setex(
                conversation_key,
                ttl,
                json.dumps(messages)
            )

            logger.debug(f"Saved conversation for user: {user_id} ({len(messages)} messages)")
            return True

        except Exception as e:
            logger.error(f"Failed to save conversation: {e}")
            return False

    def get_user_conversation(self, user_id: str) -> List[str]:
        """
        Get user conversation history

        Args:
            user_id: User identifier

        Returns:
            List of conversation messages (empty list if none found)
        """
        if not self.enabled:
            return []

        try:
            client = self._get_client()
            conversation_key = f"conversation:{user_id}"

            cached = client.get(conversation_key)
            if cached:
                if isinstance(cached, str):
                    messages = json.loads(cached)
                else:
                    messages = cached
                logger.debug(f"Retrieved conversation for user: {user_id} ({len(messages)} messages)")
                return messages

            logger.debug(f"No conversation found for user: {user_id}")
            return []

        except Exception as e:
            logger.error(f"Failed to get conversation: {e}")
            return []

    def clear_user_conversation(self, user_id: str) -> bool:
        """
        Clear user conversation history

        Args:
            user_id: User identifier

        Returns:
            True if cleared successfully
        """
        if not self.enabled:
            return False

        try:
            client = self._get_client()
            conversation_key = f"conversation:{user_id}"
            client.delete(conversation_key)
            logger.debug(f"Cleared conversation for user: {user_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to clear conversation: {e}")
            return False

    # ========== Rate Limiting ==========

    def check_rate_limit(self, identifier: str, max_requests: int = 100,
                        window: int = 3600) -> Dict[str, Any]:
        """
        Check rate limit for an identifier (IP, user_id, etc.)

        Args:
            identifier: Unique identifier (IP address, user_id)
            max_requests: Maximum requests allowed
            window: Time window in seconds (default 1 hour)

        Returns:
            Dict with 'allowed' (bool), 'remaining' (int), 'reset_at' (timestamp)
        """
        if not self.enabled:
            return {"allowed": True, "remaining": max_requests, "reset_at": None}

        try:
            client = self._get_client()
            rate_key = f"rate:{identifier}"

            # Get current count
            current = client.get(rate_key)
            count = int(current) if current else 0

            if count >= max_requests:
                ttl = client.ttl(rate_key)
                reset_at = int(time.time()) + ttl if ttl > 0 else int(time.time()) + window
                return {
                    "allowed": False,
                    "remaining": 0,
                    "reset_at": reset_at
                }

            # Increment counter with atomic operations
            if self.mode == "upstash":
                # Upstash: Use atomic operations
                new_count = client.incr(rate_key)
                # Only set expiry if this is the first request
                if new_count == 1:
                    client.expire(rate_key, window)
                count = new_count
            else:
                # Local Redis: Use pipeline for atomic execution
                pipe = client.pipeline()
                pipe.incr(rate_key)
                pipe.expire(rate_key, window)
                results = pipe.execute()
                count = results[0]

            return {
                "allowed": True,
                "remaining": max_requests - count,
                "reset_at": int(time.time()) + window
            }

        except Exception as e:
            logger.error(f"Failed to check rate limit: {e}")
            # Allow on error (fail open)
            return {"allowed": True, "remaining": max_requests, "reset_at": None}

    # ========== Document Metadata Caching ==========

    def cache_document_metadata(self, document_name: str, metadata: Dict[str, Any],
                               ttl: int = 86400) -> bool:
        """
        Cache document metadata

        Args:
            document_name: Document name
            metadata: Document metadata (stats, chunks, etc.)
            ttl: Time to live in seconds (default 24 hours)

        Returns:
            True if cached successfully
        """
        if not self.enabled:
            return False

        try:
            client = self._get_client()
            meta_key = f"doc_meta:{document_name}"

            client.setex(
                meta_key,
                ttl,
                json.dumps(metadata)
            )

            logger.debug(f"Cached document metadata: {document_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to cache document metadata: {e}")
            return False

    def get_document_metadata(self, document_name: str) -> Optional[Dict[str, Any]]:
        """
        Get cached document metadata

        Args:
            document_name: Document name

        Returns:
            Metadata dict or None
        """
        if not self.enabled:
            return None

        try:
            client = self._get_client()
            meta_key = f"doc_meta:{document_name}"

            cached = client.get(meta_key)
            if cached:
                if isinstance(cached, str):
                    return json.loads(cached)
                return cached

            return None

        except Exception as e:
            logger.error(f"Failed to get document metadata: {e}")
            return None

    # ========== Cache Management ==========

    def clear_all_cache(self) -> bool:
        """
        Clear all cache entries

        Returns:
            True if cleared successfully
        """
        if not self.enabled:
            return False

        try:
            client = self._get_client()

            # Different approach for Upstash vs local Redis
            if self.mode == "upstash":
                # Upstash: Delete specific key patterns
                for prefix in ["query:", "session:", "rate:", "doc_meta:"]:
                    keys = client.keys(f"{prefix}*")
                    if keys:
                        for key in keys:
                            client.delete(key)
            else:
                # Local Redis: Use flushdb
                client.flushdb()

            logger.info("Cleared all cache entries")
            return True

        except Exception as e:
            logger.error(f"Failed to clear cache: {e}")
            return False

    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics

        Returns:
            Dict with cache stats
        """
        if not self.enabled:
            return {
                "enabled": False,
                "mode": "disabled",
                "total_keys": 0
            }

        try:
            client = self._get_client()

            stats = {
                "enabled": True,
                "mode": self.mode,
                "connection": "active"
            }

            # Try to get key counts by prefix
            if self.mode == "upstash":
                try:
                    stats["query_keys"] = len(client.keys("query:*") or [])
                    stats["session_keys"] = len(client.keys("session:*") or [])
                    stats["rate_keys"] = len(client.keys("rate:*") or [])
                    stats["metadata_keys"] = len(client.keys("doc_meta:*") or [])
                    stats["total_keys"] = sum([
                        stats["query_keys"],
                        stats["session_keys"],
                        stats["rate_keys"],
                        stats["metadata_keys"]
                    ])
                except:
                    stats["total_keys"] = "unknown"
            else:
                # Local Redis
                info = client.info()
                stats["total_keys"] = info.get("db0", {}).get("keys", 0)
                stats["memory_used"] = info.get("used_memory_human", "unknown")

            return stats

        except Exception as e:
            logger.error(f"Failed to get cache stats: {e}")
            return {
                "enabled": self.enabled,
                "mode": self.mode,
                "error": str(e)
            }

    def health_check(self) -> Dict[str, Any]:
        """
        Check Redis health

        Returns:
            Dict with health status
        """
        if not self.enabled:
            return {
                "healthy": False,
                "mode": "disabled",
                "message": "Redis cache is disabled"
            }

        try:
            client = self._get_client()
            client.ping()

            return {
                "healthy": True,
                "mode": self.mode,
                "message": f"Redis cache is healthy ({self.mode})"
            }

        except Exception as e:
            return {
                "healthy": False,
                "mode": self.mode,
                "error": str(e),
                "message": "Redis connection failed"
            }

    def close(self):
        """
        Close Redis connections and cleanup connection pool
        Should be called on application shutdown
        """
        try:
            if self.local_client:
                logger.info("Closing Redis local client...")
                self.local_client.close()
                self.local_client = None

            if hasattr(self, 'redis_pool') and self.redis_pool:
                logger.info("Disconnecting Redis connection pool...")
                self.redis_pool.disconnect()
                self.redis_pool = None

            self.enabled = False
            logger.info("✓ Redis connections closed successfully")

        except Exception as e:
            logger.error(f"Error closing Redis connections: {e}")

    @property
    def redis_client(self):
        """Property to access active Redis client for cleanup"""
        return self._get_client()
