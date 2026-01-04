"""
Database connection and operations using Supabase
"""
import os
from supabase import create_client, Client
from typing import Optional, Dict, Any
from dotenv import load_dotenv
import threading
import time
from functools import lru_cache
import logging

load_dotenv()

logger = logging.getLogger(__name__)


# Custom exception for database errors
class DatabaseError(Exception):
    """Custom exception for database operation failures"""
    pass

# Thread-local storage for connection pooling
_thread_local = threading.local()
_supabase_config = None
_config_lock = threading.Lock()


# ============= CACHING UTILITIES =============
def _get_cache_ttl(ttl_seconds: int = 300):
    """
    Returns current time in TTL buckets for cache invalidation
    Default: 300 seconds (5 minutes)

    How it works:
    - Time is divided into 5-minute buckets
    - Cache is automatically invalidated when bucket changes
    - Example: 10:00-10:04 = same bucket, 10:05 = new bucket
    """
    return int(time.time() / ttl_seconds)


@lru_cache(maxsize=1000)  # Cache up to 1000 users' preferences
def _get_voice_preferences_cached(db_instance, user_id: str, ttl_hash: int):
    """
    Cached voice preferences lookup

    Performance: Saves 100-200ms per TTS request
    - Without cache: DB query every time (~150ms)
    - With cache: Instant memory lookup (~1ms)

    Cache invalidation:
    - Automatic: Every 5 minutes (ttl_hash changes)
    - Manual: Call clear_voice_preferences_cache()
    """
    return db_instance._get_voice_preferences_uncached(user_id)


def get_supabase_client() -> Client:
    """Get or create Supabase client with thread-local connection pooling"""
    global _supabase_config

    # Initialize config once (thread-safe)
    if _supabase_config is None:
        with _config_lock:
            if _supabase_config is None:
                url = os.getenv("SUPABASE_URL")
                key = os.getenv("SUPABASE_KEY")

                if not url or not key:
                    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment")

                _supabase_config = {'url': url, 'key': key}

    # Each thread gets its own client instance
    if not hasattr(_thread_local, 'supabase_client') or _thread_local.supabase_client is None:
        # Create Supabase client with increased timeout for cold starts and slow connections
        # Using default configuration - Supabase client handles timeouts internally
        _thread_local.supabase_client = create_client(
            _supabase_config['url'],
            _supabase_config['key']
        )

    return _thread_local.supabase_client


class Database:
    """Database operations wrapper"""

    def __init__(self):
        try:
            self.client = get_supabase_client()
        except ValueError as e:
            import logging
            logging.error(f"Database initialization failed - Missing environment variables: {e}")
            raise
        except Exception as e:
            import logging
            logging.error(f"Database initialization failed: {e}")
            raise

    def create_user(self, email: str, password_hash: str, role: str = None, institution: str = None, occupation: str = None) -> Dict[str, Any]:
        """Create a new user"""
        try:
            user_data = {
                'email': email,
                'password_hash': password_hash
            }

            if role:
                user_data['role'] = role
            if institution:
                user_data['institution'] = institution
            if occupation:
                user_data['occupation'] = occupation

            response = self.client.table('users').insert(user_data).execute()

            if response.data:
                return response.data[0]
            raise Exception("Failed to create user")
        except Exception as e:
            import logging
            logging.error(f"Database error creating user: {e}")
            raise Exception("An error occurred while creating the user account. Please try again.")

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get user by email

        Returns:
            User dict if found, None if not found

        Raises:
            DatabaseError: If database query fails
        """
        try:
            response = self.client.table('users').select('*').eq('email', email).execute()

            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            import traceback
            # Log full details including stack trace for debugging
            error_msg = f"Database error fetching user by email: {type(e).__name__}: {str(e)}"
            logger.error(error_msg)
            logger.error(f"Traceback: {traceback.format_exc()}")

            # Raise custom exception to distinguish from "user not found"
            raise DatabaseError(f"Failed to query user database: {str(e)}") from e

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user by ID

        Returns:
            User dict if found, None if not found

        Raises:
            DatabaseError: If database query fails
        """
        try:
            response = self.client.table('users').select('*').eq('id', user_id).execute()

            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            import traceback
            # Log full details including stack trace for debugging
            error_msg = f"Database error fetching user by ID {user_id}: {type(e).__name__}: {str(e)}"
            logger.error(error_msg)
            logger.error(f"Traceback: {traceback.format_exc()}")

            # Raise custom exception to distinguish from "user not found"
            raise DatabaseError(f"Failed to query user database: {str(e)}") from e

    def update_user(self, user_id: str, updates: Dict[str, Any]) -> bool:
        """Update user fields"""
        try:
            response = self.client.table('users').update(updates).eq('id', user_id).execute()
            return bool(response.data)
        except Exception as e:
            import logging
            logging.error(f"Database error updating user {user_id}: {e}")
            return False

    def delete_user(self, user_id: str) -> bool:
        """Delete user account (cascades to related tables via ON DELETE CASCADE)"""
        try:
            response = self.client.table('users').delete().eq('id', user_id).execute()
            return bool(response.data)
        except Exception as e:
            import logging
            logging.error(f"Database error deleting user {user_id}: {e}")
            return False

    def save_feedback(self, user_id: str, message_id: str, query: str, response: str, rating: int, comment: str = None) -> bool:
        """Save user feedback for an AI response"""
        try:
            self.client.table('feedback').insert({
                'user_id': user_id,
                'message_id': message_id,
                'query': query,
                'response': response,
                'rating': rating,
                'comment': comment
            }).execute()
            return True
        except Exception as e:
            print(f"Error saving feedback: {e}")
            return False

    def get_user_plan(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's plan details"""
        try:
            response = self.client.table('user_plans').select('*').eq('user_id', user_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception:
            return None

    def update_user_plan(self, user_id: str, plan_type: str, max_documents: int, max_queries_per_day: int) -> bool:
        """Update user's plan"""
        try:
            response = self.client.table('user_plans').update({
                'plan_type': plan_type,
                'max_documents': max_documents,
                'max_queries_per_day': max_queries_per_day
            }).eq('user_id', user_id).execute()
            return bool(response.data)
        except Exception:
            return False

    def get_voice_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's voice preferences (with caching)"""
        # Use cached version with 5-minute TTL
        return _get_voice_preferences_cached(self, user_id, _get_cache_ttl())

    def _get_voice_preferences_uncached(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Internal method to fetch voice preferences from database (no cache)"""
        try:
            response = self.client.table('user_voice_preferences').select('*').eq('user_id', user_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception:
            return None

    def update_voice_preferences(self, user_id: str, engine_preference: str, language_preference: str) -> bool:
        """Update or insert user's voice preferences using upsert to avoid race conditions"""
        try:
            # Clear cache before updating to ensure fresh data on next read
            _get_voice_preferences_cached.cache_clear()

            # Use upsert to atomically update or insert
            # This prevents duplicate key violations from race conditions
            response = self.client.table('user_voice_preferences').upsert({
                'user_id': user_id,
                'engine_preference': engine_preference,
                'language_preference': language_preference
            }, on_conflict='user_id').execute()

            return bool(response.data)
        except Exception as e:
            import logging
            logging.error(f"Database error updating voice preferences: {e}")
            return False

    def search_documents(self, user_id: str, search_query: str = None, category: str = None, tags: list = None) -> list:
        """Search documents by query, category, or tags"""
        try:
            query = self.client.table('documents').select('*').eq('user_id', user_id)

            # Filter by category if provided
            if category and category != 'all':
                query = query.eq('category', category)

            # Filter by tags if provided (any tag match)
            if tags and len(tags) > 0:
                query = query.contains('tags', tags)

            # Text search on filename and description if provided
            if search_query and search_query.strip():
                # Use ilike for case-insensitive search
                query = query.or_(f"filename.ilike.%{search_query}%,description.ilike.%{search_query}%")

            response = query.order('uploaded_at', desc=True).execute()
            return response.data if response.data else []
        except Exception as e:
            import logging
            logging.error(f"Database error searching documents: {e}")
            return []

    def update_document_metadata(self, document_id: str, user_id: str, updates: Dict[str, Any]) -> bool:
        """Update document metadata (category, tags, description)"""
        try:
            response = self.client.table('documents').update(updates).eq('id', document_id).eq('user_id', user_id).execute()
            return bool(response.data)
        except Exception as e:
            import logging
            logging.error(f"Database error updating document metadata: {e}")
            return False

    def get_document_categories(self) -> list:
        """Get list of predefined document categories"""
        try:
            response = self.client.table('document_categories').select('*').order('name').execute()
            return response.data if response.data else []
        except Exception as e:
            import logging
            logging.error(f"Database error getting categories: {e}")
            return []

    def get_user_documents_with_filters(self, user_id: str, category: str = None, limit: int = 100) -> list:
        """Get user documents with optional category filter"""
        try:
            query = self.client.table('documents').select('*').eq('user_id', user_id)

            if category and category != 'all':
                query = query.eq('category', category)

            response = query.order('uploaded_at', desc=True).limit(limit).execute()
            return response.data if response.data else []
        except Exception as e:
            import logging
            logging.error(f"Database error getting documents: {e}")
            return []

    # ============= SITE FEEDBACK METHODS =============

    def save_site_feedback(self, feedback_data: Dict[str, Any]) -> bool:
        """Save general site feedback to database"""
        try:
            response = self.client.table('site_feedback').insert(feedback_data).execute()
            return bool(response.data)
        except Exception as e:
            import logging
            logging.error(f"Database error saving site feedback: {e}")
            return False

    def get_user_site_feedback(self, user_id: str) -> list:
        """Get all site feedback submitted by a user"""
        try:
            response = self.client.table('site_feedback') \
                .select('*') \
                .eq('user_id', user_id) \
                .order('created_at', desc=True) \
                .execute()
            return response.data if response.data else []
        except Exception as e:
            import logging
            logging.error(f"Database error getting user site feedback: {e}")
            return []

    def get_all_site_feedback(self, limit: int = 100, status: str = None) -> list:
        """Get all site feedback (admin use) - includes user email"""
        try:
            # Get feedback first
            query = self.client.table('site_feedback').select('*')

            if status:
                query = query.eq('status', status)

            response = query.order('created_at', desc=True).limit(limit).execute()
            feedback_list = response.data if response.data else []
            
            # Fetch user emails separately and merge
            if feedback_list:
                user_ids = [f['user_id'] for f in feedback_list if f.get('user_id')]
                if user_ids:
                    users_response = self.client.table('users').select('id, email').in_('id', user_ids).execute()
                    user_map = {u['id']: u['email'] for u in users_response.data} if users_response.data else {}
                    
                    # Add email to each feedback item
                    for item in feedback_list:
                        item['user_email'] = user_map.get(item.get('user_id'))
            
            return feedback_list
        except Exception as e:
            import logging
            logging.error(f"Database error getting all site feedback: {e}")
            return []

    # ============= ADMIN ANALYTICS METHODS =============

    def get_all_users(self, limit: int = 1000, offset: int = 0) -> list:
        """Get all users (admin only)"""
        try:
            response = self.client.table('users') \
                .select('id, email, role, institution, occupation, is_admin, created_at, last_login') \
                .order('created_at', desc=True) \
                .range(offset, offset + limit - 1) \
                .execute()
            return response.data if response.data else []
        except Exception as e:
            import logging
            logging.error(f"Database error getting all users: {e}")
            return []

    def get_user_stats_admin(self, user_id: str) -> dict:
        """Get detailed user statistics (admin only)"""
        try:
            # Get user info
            user_response = self.client.table('users').select('*').eq('id', user_id).execute()
            if not user_response.data:
                return {}

            user = user_response.data[0]

            # Get document count
            doc_response = self.client.table('documents').select('id').eq('user_id', user_id).execute()
            document_count = len(doc_response.data) if doc_response.data else 0

            # Get feedback count
            feedback_response = self.client.table('feedback').select('id').eq('user_id', user_id).execute()
            feedback_count = len(feedback_response.data) if feedback_response.data else 0

            # Get site feedback
            site_feedback_response = self.client.table('site_feedback').select('*').eq('user_id', user_id).execute()
            site_feedback = site_feedback_response.data if site_feedback_response.data else []

            return {
                'user': user,
                'document_count': document_count,
                'feedback_count': feedback_count,
                'site_feedback': site_feedback
            }
        except Exception as e:
            import logging
            logging.error(f"Database error getting user stats (admin): {e}")
            return {}

    def get_system_analytics(self) -> dict:
        """Get overall system analytics (admin only)"""
        try:
            # Total users
            users_response = self.client.table('users').select('id', count='exact').execute()
            total_users = users_response.count if users_response.count else 0

            # Total documents
            docs_response = self.client.table('documents').select('id', count='exact').execute()
            total_documents = docs_response.count if docs_response.count else 0

            # Total feedback
            feedback_response = self.client.table('site_feedback').select('id, overall_rating', count='exact').execute()
            total_feedback = feedback_response.count if feedback_response.count else 0

            # Average rating
            avg_rating = 0
            if feedback_response.data:
                ratings = [f['overall_rating'] for f in feedback_response.data if f.get('overall_rating')]
                avg_rating = sum(ratings) / len(ratings) if ratings else 0

            # Recent users (last 7 days)
            from datetime import datetime, timedelta
            week_ago = (datetime.now() - timedelta(days=7)).isoformat()
            recent_users_response = self.client.table('users') \
                .select('id', count='exact') \
                .gte('created_at', week_ago) \
                .execute()
            recent_users = recent_users_response.count if recent_users_response.count else 0

            return {
                'total_users': total_users,
                'total_documents': total_documents,
                'total_feedback': total_feedback,
                'average_rating': round(avg_rating, 2),
                'recent_users_week': recent_users
            }
        except Exception as e:
            import logging
            logging.error(f"Database error getting system analytics: {e}")
            return {}

    def get_feedback_analytics(self) -> dict:
        """Get feedback analytics with server-side aggregation (admin only)"""
        try:
            # Get total count (fast - no data transfer)
            total_response = self.client.table('site_feedback').select('id', count='exact').execute()
            total_responses = total_response.count if total_response.count else 0

            # Get all feedback for detailed analytics (only needed for NPS and complex grouping)
            # NOTE: For very large datasets (100k+ records), consider using PostgreSQL views
            response = self.client.table('site_feedback').select('feedback_type, overall_rating, nps_score').execute()
            feedbacks = response.data if response.data else []

            # Group by type (client-side, but only with minimal columns)
            by_type = {}
            by_rating = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            nps_scores = []

            for feedback in feedbacks:
                # By type
                ftype = feedback.get('feedback_type', 'other')
                by_type[ftype] = by_type.get(ftype, 0) + 1

                # By rating
                rating = feedback.get('overall_rating')
                if rating in by_rating:
                    by_rating[rating] += 1

                # NPS
                if feedback.get('nps_score') is not None:
                    nps_scores.append(feedback['nps_score'])

            # Calculate NPS
            nps_score = 0
            if nps_scores:
                promoters = len([s for s in nps_scores if s >= 9])
                detractors = len([s for s in nps_scores if s <= 6])
                nps_score = ((promoters - detractors) / len(nps_scores)) * 100

            return {
                'by_type': by_type,
                'by_rating': by_rating,
                'nps_score': round(nps_score, 1),
                'total_responses': total_responses
            }
        except Exception as e:
            import logging
            logging.error(f"Database error getting feedback analytics: {e}")
            return {}

    def get_all_ai_response_feedback(self, limit: int = 100) -> list:
        """Get all AI response feedback (admin only)"""
        try:
            response = self.client.table('feedback') \
                .select('*') \
                .order('created_at', desc=True) \
                .limit(limit) \
                .execute()
            return response.data if response.data else []
        except Exception as e:
            import logging
            logging.error(f"Database error getting AI response feedback: {e}")
            return []

    def get_ai_feedback_analytics(self) -> dict:
        """Get AI response feedback analytics with server-side aggregation (admin only)"""
        try:
            # Get total count (server-side)
            total_response = self.client.table('feedback').select('id', count='exact').execute()
            total = total_response.count if total_response.count else 0

            # Get likes count (server-side)
            likes_response = self.client.table('feedback').select('id', count='exact').eq('rating', 1).execute()
            likes = likes_response.count if likes_response.count else 0

            # Get dislikes count (server-side)
            dislikes_response = self.client.table('feedback').select('id', count='exact').eq('rating', -1).execute()
            dislikes = dislikes_response.count if dislikes_response.count else 0

            # Calculate satisfaction rate
            satisfaction_rate = (likes / total * 100) if total > 0 else 0

            return {
                'total': total,
                'likes': likes,
                'dislikes': dislikes,
                'satisfaction_rate': round(satisfaction_rate, 1)
            }
        except Exception as e:
            import logging
            logging.error(f"Database error getting AI feedback analytics: {e}")
            return {}

    # ============= CHAT HISTORY METHODS =============

    def create_chat_history(self, user_id: str, document_id: str, document_name: str, first_message: str) -> Optional[Dict[str, Any]]:
        """Create a new chat history session"""
        try:
            chat_data = {
                'user_id': user_id,
                'document_id': document_id,
                'document_name': document_name,
                'first_message': first_message,
                'messages': [],
                'message_count': 0
            }
            response = self.client.table('chat_histories').insert(chat_data).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            import logging
            logging.error(f"Database error creating chat history: {e}")
            return None

    def get_chat_histories(self, user_id: str, limit: int = 50, offset: int = 0) -> list:
        """Get all chat histories for a user"""
        try:
            response = self.client.table('chat_histories') \
                .select('*') \
                .eq('user_id', user_id) \
                .order('updated_at', desc=True) \
                .limit(limit) \
                .offset(offset) \
                .execute()
            return response.data if response.data else []
        except Exception as e:
            import logging
            logging.error(f"Database error fetching chat histories: {e}")
            return []

    def get_chat_history_count(self, user_id: str) -> int:
        """Get total count of chat histories for a user"""
        try:
            response = self.client.table('chat_histories') \
                .select('id', count='exact') \
                .eq('user_id', user_id) \
                .execute()
            return response.count if response.count else 0
        except Exception as e:
            import logging
            logging.error(f"Database error counting chat histories: {e}")
            return 0

    def get_chat_history_by_id(self, chat_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific chat history by ID"""
        try:
            response = self.client.table('chat_histories') \
                .select('*') \
                .eq('id', chat_id) \
                .eq('user_id', user_id) \
                .execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            import logging
            logging.error(f"Database error fetching chat history: {e}")
            return None

    def update_chat_history(self, chat_id: str, user_id: str, messages: list, message_count: int) -> bool:
        """Update chat history with new messages"""
        try:
            response = self.client.table('chat_histories') \
                .update({
                    'messages': messages,
                    'message_count': message_count,
                    'updated_at': 'now()'
                }) \
                .eq('id', chat_id) \
                .eq('user_id', user_id) \
                .execute()
            return bool(response.data)
        except Exception as e:
            import logging
            logging.error(f"Database error updating chat history: {e}")
            return False

    def append_message_to_chat(self, chat_id: str, user_id: str, message: Dict[str, Any]) -> bool:
        """Append a single message to chat history"""
        try:
            # First get current chat
            chat = self.get_chat_history_by_id(chat_id, user_id)
            if not chat:
                return False

            # Append new message
            messages = chat.get('messages', [])
            messages.append(message)
            message_count = len(messages)

            # Update
            return self.update_chat_history(chat_id, user_id, messages, message_count)
        except Exception as e:
            import logging
            logging.error(f"Database error appending message to chat: {e}")
            return False

    def delete_chat_history(self, chat_id: str, user_id: str) -> bool:
        """Delete a chat history"""
        try:
            response = self.client.table('chat_histories') \
                .delete() \
                .eq('id', chat_id) \
                .eq('user_id', user_id) \
                .execute()
            return bool(response.data)
        except Exception as e:
            import logging
            logging.error(f"Database error deleting chat history: {e}")
            return False

    def delete_all_chat_histories(self, user_id: str) -> bool:
        """Delete all chat histories for a user"""
        try:
            response = self.client.table('chat_histories') \
                .delete() \
                .eq('user_id', user_id) \
                .execute()
            return True
        except Exception as e:
            import logging
            logging.error(f"Database error deleting all chat histories: {e}")
            return False

    def search_chat_histories(self, user_id: str, query: str) -> list:
        """Search chat histories by content"""
        try:
            response = self.client.table('chat_histories') \
                .select('*') \
                .eq('user_id', user_id) \
                .or_(f"first_message.ilike.%{query}%,document_name.ilike.%{query}%") \
                .order('updated_at', desc=True) \
                .execute()
            return response.data if response.data else []
        except Exception as e:
            import logging
            logging.error(f"Database error searching chat histories: {e}")
            return []

    def filter_chat_histories_by_date(self, user_id: str, start_date: str, end_date: str = None) -> list:
        """Filter chat histories by date range"""
        try:
            query = self.client.table('chat_histories') \
                .select('*') \
                .eq('user_id', user_id) \
                .gte('created_at', start_date)

            if end_date:
                query = query.lte('created_at', end_date)

            response = query.order('updated_at', desc=True).execute()
            return response.data if response.data else []
        except Exception as e:
            import logging
            logging.error(f"Database error filtering chat histories: {e}")
            return []
