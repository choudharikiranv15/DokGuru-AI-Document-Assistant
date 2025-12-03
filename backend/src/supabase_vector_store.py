# src/supabase_vector_store.py
"""
Supabase pgvector-based vector store for persistent cloud storage.
Replaces ChromaDB for production use in Cloud Run.
"""
import os
import json
import logging
import hashlib
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
import numpy as np

logger = logging.getLogger(__name__)

# Try importing supabase
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logger.warning("Supabase client not installed. Install with: pip install supabase")


class SupabaseVectorStore:
    """
    Persistent vector store using Supabase with pgvector extension.

    Features:
    - Cloud-based persistence (survives deployments)
    - Per-user document isolation
    - Efficient vector similarity search
    - Automatic embedding generation
    """

    def __init__(self, config):
        """
        Initialize Supabase vector store

        Args:
            config: Config object with Supabase settings
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.client: Optional[Client] = None
        self.embedding_model = None
        self.initialized = False

        # Table name for document chunks
        self.table_name = "document_chunks"

        # Initialize embedding model
        self.logger.info(f"Loading embedding model: {config.EMBEDDING_MODEL}")
        try:
            self.embedding_model = SentenceTransformer(config.EMBEDDING_MODEL)
            self.logger.info("✓ Embedding model loaded")
        except Exception as e:
            self.logger.error(f"Failed to load embedding model: {e}")
            raise

        # Initialize Supabase client
        if not SUPABASE_AVAILABLE:
            raise ImportError("Supabase client not available")

        supabase_url = config.SUPABASE_URL
        supabase_key = config.SUPABASE_KEY

        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")

        try:
            self.client = create_client(supabase_url, supabase_key)
            self.initialized = True
            self.logger.info("✓ Supabase vector store initialized")
        except Exception as e:
            self.logger.error(f"Failed to initialize Supabase: {e}")
            raise

    def _generate_embeddings(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """Generate embeddings using sentence-transformers"""
        try:
            embeddings = self.embedding_model.encode(
                texts,
                batch_size=batch_size,
                show_progress_bar=len(texts) > 10,
                convert_to_numpy=True,
                normalize_embeddings=True
            )
            return embeddings.tolist()
        except Exception as e:
            self.logger.error(f"Embedding generation failed: {e}")
            raise

    def _generate_chunk_id(self, user_id: str, document_name: str, chunk_index: int) -> str:
        """Generate unique chunk ID"""
        content = f"{user_id}:{document_name}:{chunk_index}"
        return hashlib.sha256(content.encode()).hexdigest()[:32]

    def add_documents(self, chunks: List, document_name: str, user_id: str = None) -> Dict[str, Any]:
        """
        Add document chunks to the vector store

        Args:
            chunks: List of DocumentChunk objects from PDFProcessor
            document_name: Name of the document
            user_id: User ID for document isolation

        Returns:
            Result dictionary with success status and count
        """
        if not chunks:
            return {'success': True, 'added_count': 0}

        try:
            # Extract texts for embedding - handle both dict and DocumentChunk objects
            texts = []
            for chunk in chunks:
                if hasattr(chunk, 'content'):
                    texts.append(chunk.content)
                elif isinstance(chunk, dict):
                    texts.append(chunk.get('text', chunk.get('content', '')))
                else:
                    texts.append(str(chunk))

            # Generate embeddings
            self.logger.info(f"Generating embeddings for {len(texts)} chunks...")
            embeddings = self._generate_embeddings(texts)

            # Prepare records for insertion
            records = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                # Handle DocumentChunk objects
                if hasattr(chunk, 'content'):
                    content = chunk.content
                    chunk_type = chunk.chunk_type if hasattr(chunk, 'chunk_type') else 'text'
                    page_number = chunk.page_number if hasattr(chunk, 'page_number') else 0
                    metadata = chunk.metadata if hasattr(chunk, 'metadata') else {}
                else:
                    content = chunk.get('text', chunk.get('content', ''))
                    chunk_type = chunk.get('type', chunk.get('chunk_type', 'text'))
                    page_number = chunk.get('page_number', 0)
                    metadata = chunk.get('metadata', {})

                chunk_id = self._generate_chunk_id(user_id or 'anonymous', document_name, i)

                record = {
                    'id': chunk_id,
                    'user_id': user_id or 'anonymous',
                    'document_name': document_name,
                    'content': content,
                    'embedding': embedding,
                    'metadata': json.dumps(metadata) if isinstance(metadata, dict) else str(metadata),
                    'chunk_type': chunk_type,
                    'chunk_index': i,
                    'page_number': page_number
                }
                records.append(record)

            # Insert in batches
            batch_size = 100
            total_inserted = 0

            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                try:
                    # Upsert to handle duplicates
                    self.client.table(self.table_name).upsert(batch).execute()
                    total_inserted += len(batch)
                    self.logger.info(f"Inserted batch {i // batch_size + 1}: {len(batch)} chunks")
                except Exception as e:
                    self.logger.error(f"Failed to insert batch: {e}")
                    # Continue with next batch

            self.logger.info(f"✅ Added {total_inserted} chunks for user {user_id}")
            return {'success': True, 'added_count': total_inserted}

        except Exception as e:
            self.logger.error(f"Failed to add documents: {e}")
            return {'success': False, 'error': str(e)}

    def search(self, query: str, n_results: int = 5, document_filter = None,
               user_id: str = None) -> Dict[str, Any]:
        """
        Search for similar chunks using vector similarity

        Interface compatible with ChromaDB for seamless fallback.

        Args:
            query: Search query text
            n_results: Number of results to return
            document_filter: Optional filter by document name (str) or names (List[str])
            user_id: User ID for document isolation

        Returns:
            Dict with 'documents', 'metadatas', 'distances' in ChromaDB format
        """
        try:
            # Generate query embedding
            query_embedding = self._generate_embeddings([query])[0]

            # Call Supabase RPC function for vector similarity search
            params = {
                'query_embedding': query_embedding,
                'match_user_id': user_id or 'anonymous',
                'match_count': n_results
            }

            # Handle both single document and multiple documents
            if document_filter:
                if isinstance(document_filter, list):
                    # Multiple documents - pass as array
                    params['match_documents'] = document_filter
                else:
                    # Single document - convert to array for consistency
                    params['match_documents'] = [document_filter]

            # Use match_documents RPC function
            result = self.client.rpc('match_documents', params).execute()

            if not result.data:
                # Return empty results in ChromaDB format
                return {
                    'documents': [[]],
                    'metadatas': [[]],
                    'distances': [[]]
                }

            # Format results in ChromaDB-compatible format
            documents = []
            metadatas = []
            distances = []

            for row in result.data:
                documents.append(row.get('content', ''))

                # Parse metadata and add chunk info
                meta = json.loads(row.get('metadata', '{}'))
                meta['chunk_type'] = row.get('chunk_type', 'text')
                meta['page_number'] = row.get('page_number', 0)
                meta['document_name'] = row.get('document_name', '')
                metadatas.append(meta)

                # Convert similarity to distance (similarity is 0-1, distance is inverse)
                similarity = row.get('similarity', 0)
                distances.append(1 - similarity)

            # Return in ChromaDB nested format for compatibility
            return {
                'documents': [documents],
                'metadatas': [metadatas],
                'distances': [distances]
            }

        except Exception as e:
            self.logger.error(f"Search failed: {e}")
            # Fallback to basic text search if vector search fails
            return self._fallback_search(query, user_id, n_results, document_filter)

    def _fallback_search(self, query: str, user_id: str, n_results: int = 5,
                         document_filter = None) -> Dict[str, Any]:
        """Fallback text-based search when vector search fails - returns ChromaDB format

        Args:
            document_filter: Single document name (str) or list of document names ([str])
        """
        try:
            query_builder = self.client.table(self.table_name).select('*').eq('user_id', user_id or 'anonymous')

            # Handle both single document and multiple documents
            if document_filter:
                if isinstance(document_filter, list):
                    # Multiple documents - use IN clause
                    query_builder = query_builder.in_('document_name', document_filter)
                else:
                    # Single document
                    query_builder = query_builder.eq('document_name', document_filter)

            # Text search using ilike
            query_builder = query_builder.ilike('content', f'%{query}%').limit(n_results)

            result = query_builder.execute()

            if not result.data:
                return {
                    'documents': [[]],
                    'metadatas': [[]],
                    'distances': [[]]
                }

            documents = []
            metadatas = []
            distances = []

            for row in result.data:
                documents.append(row.get('content', ''))

                meta = json.loads(row.get('metadata', '{}'))
                meta['chunk_type'] = row.get('chunk_type', 'text')
                meta['page_number'] = row.get('page_number', 0)
                meta['document_name'] = row.get('document_name', '')
                metadatas.append(meta)

                distances.append(0.5)  # Default distance for text search

            return {
                'documents': [documents],
                'metadatas': [metadatas],
                'distances': [distances]
            }

        except Exception as e:
            self.logger.error(f"Fallback search failed: {e}")
            return {
                'documents': [[]],
                'metadatas': [[]],
                'distances': [[]]
            }

    def delete_document(self, document_name: str, user_id: str = None) -> Dict[str, Any]:
        """
        Delete a specific document for a user

        Args:
            document_name: Name of document to delete
            user_id: User ID (optional)

        Returns:
            Result dictionary
        """
        try:
            query = self.client.table(self.table_name).delete()

            if user_id:
                query = query.eq('user_id', user_id)

            result = query.eq('document_name', document_name).execute()

            deleted_count = len(result.data) if result.data else 0
            self.logger.info(f"✅ Deleted {deleted_count} chunks from '{document_name}'")
            return {'success': True, 'deleted_count': deleted_count}

        except Exception as e:
            self.logger.error(f"Failed to delete document: {e}")
            return {'success': False, 'error': str(e)}

    def clear_user_documents(self, user_id: str) -> Dict[str, Any]:
        """
        Clear all documents for a specific user

        Args:
            user_id: User ID

        Returns:
            Result dictionary
        """
        try:
            # Get count first
            count_result = self.client.table(self.table_name).select(
                'id', count='exact'
            ).eq('user_id', user_id).execute()

            count = count_result.count or 0

            # Delete all user documents
            self.client.table(self.table_name).delete().eq('user_id', user_id).execute()

            self.logger.info(f"✅ Cleared {count} chunks for user {user_id}")
            return {'success': True, 'deleted_count': count}

        except Exception as e:
            self.logger.error(f"Failed to clear user documents: {e}")
            return {'success': False, 'error': str(e)}

    def clear_all(self) -> Dict[str, Any]:
        """
        Clear all documents (admin only)

        Returns:
            Result dictionary
        """
        try:
            # Get count first
            count_result = self.client.table(self.table_name).select(
                'id', count='exact'
            ).execute()

            count = count_result.count or 0

            # Delete all - use a condition that matches all rows
            self.client.table(self.table_name).delete().neq('id', '').execute()

            self.logger.info(f"✅ Cleared all {count} chunks")
            return {'success': True, 'deleted_count': count}

        except Exception as e:
            self.logger.error(f"Failed to clear all documents: {e}")
            return {'success': False, 'error': str(e)}

    def list_documents(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List all documents with statistics

        Args:
            user_id: Optional user ID filter

        Returns:
            List of document info dictionaries
        """
        try:
            query = self.client.table(self.table_name).select('document_name, chunk_type, user_id')

            if user_id:
                query = query.eq('user_id', user_id)

            result = query.execute()

            if not result.data:
                return []

            # Aggregate by document
            doc_stats = {}
            for row in result.data:
                doc_name = row.get('document_name', 'unknown')
                chunk_type = row.get('chunk_type', 'text')

                if doc_name not in doc_stats:
                    doc_stats[doc_name] = {
                        'name': doc_name,
                        'total_chunks': 0,
                        'text_chunks': 0,
                        'table_chunks': 0,
                        'image_chunks': 0
                    }

                doc_stats[doc_name]['total_chunks'] += 1

                if chunk_type == 'text':
                    doc_stats[doc_name]['text_chunks'] += 1
                elif chunk_type == 'table':
                    doc_stats[doc_name]['table_chunks'] += 1
                elif chunk_type == 'image':
                    doc_stats[doc_name]['image_chunks'] += 1

            return list(doc_stats.values())

        except Exception as e:
            self.logger.error(f"Failed to list documents: {e}")
            return []

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get overall collection statistics"""
        try:
            result = self.client.table(self.table_name).select(
                'id', count='exact'
            ).execute()

            total_chunks = result.count or 0

            # Get unique documents count
            docs_result = self.client.table(self.table_name).select(
                'document_name'
            ).execute()

            unique_docs = set(row.get('document_name') for row in docs_result.data) if docs_result.data else set()

            return {
                'total_chunks': total_chunks,
                'total_documents': len(unique_docs),
                'document_names': list(unique_docs),
                'embedding_model': self.config.EMBEDDING_MODEL,
                'storage': 'supabase_pgvector'
            }

        except Exception as e:
            self.logger.error(f"Failed to get stats: {e}")
            return {
                'total_chunks': 0,
                'total_documents': 0,
                'document_names': [],
                'error': str(e)
            }
