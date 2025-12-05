# src/chroma_vector_store.py
"""
ChromaDB-based vector store with persistent storage.
Replaces the simple in-memory hash-based store with proper embeddings.
"""
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
import logging
import os


class ChromaVectorStore:
    """Persistent vector store using ChromaDB with sentence-transformers"""

    def __init__(self, config):
        self.config = config
        self.logger = logging.getLogger(__name__)

        # Initialize sentence transformer for embeddings
        self.logger.info(f"Loading embedding model: {config.EMBEDDING_MODEL}")
        self.embedding_model = SentenceTransformer(config.EMBEDDING_MODEL)

        # Create persistent ChromaDB client
        db_path = config.VECTOR_DB_PATH
        os.makedirs(db_path, exist_ok=True)

        self.logger.info(f"Initializing ChromaDB at: {db_path}")
        self.client = chromadb.PersistentClient(
            path=db_path,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )

        # Get or create collection
        try:
            self.collection = self.client.get_or_create_collection(
                name=config.COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
            self.logger.info(f"✅ ChromaDB collection '{config.COLLECTION_NAME}' ready")
            self.logger.info(f"📊 Collection has {self.collection.count()} documents")
        except Exception as e:
            self.logger.error(f"Failed to create collection: {e}")
            raise

    def _generate_embeddings(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """Generate embeddings using sentence-transformers with batching for performance"""
        try:
            # Use batch processing for better performance
            embeddings = self.embedding_model.encode(
                texts,
                batch_size=batch_size,
                show_progress_bar=len(texts) > 10,
                convert_to_numpy=True,
                normalize_embeddings=True  # Normalize for better cosine similarity
            )
            return embeddings.tolist()
        except Exception as e:
            self.logger.error(f"Embedding generation failed: {e}")
            raise

    def add_documents(self, chunks: List, document_name: str, user_id: str = None) -> Dict[str, Any]:
        """Add document chunks to ChromaDB with optional user_id for multi-tenancy"""
        try:
            self.logger.info(f"Processing {len(chunks)} chunks for '{document_name}' (user: {user_id})")

            # Prepare data
            texts = []
            metadatas = []
            ids = []

            for i, chunk in enumerate(chunks):
                # Include user_id in chunk_id for uniqueness across users
                chunk_id = f"{user_id}_{document_name}_{i}" if user_id else f"{document_name}_{i}"

                texts.append(chunk.content)
                # Ensure page_number is stored as integer for proper sorting
                page_num = getattr(chunk, 'page_number', 1)
                metadata = {
                    'document_name': document_name,
                    'chunk_type': getattr(chunk, 'chunk_type', 'text'),
                    'page_number': int(page_num) if page_num else 1
                }
                # Add user_id to metadata for filtering
                if user_id:
                    metadata['user_id'] = user_id
                metadatas.append(metadata)
                ids.append(chunk_id)

            # Generate embeddings with optimized batch size
            self.logger.info(f"Generating embeddings for {len(texts)} chunks...")
            batch_size = min(64, len(texts))  # Adaptive batch size
            embeddings = self._generate_embeddings(texts, batch_size=batch_size)

            # Add to ChromaDB in batches to avoid memory issues with large documents
            CHROMA_BATCH_SIZE = 1000
            total_added = 0

            for i in range(0, len(texts), CHROMA_BATCH_SIZE):
                batch_end = min(i + CHROMA_BATCH_SIZE, len(texts))
                self.collection.add(
                    embeddings=embeddings[i:batch_end],
                    documents=texts[i:batch_end],
                    metadatas=metadatas[i:batch_end],
                    ids=ids[i:batch_end]
                )
                total_added += (batch_end - i)
                self.logger.info(f"  Added batch: {total_added}/{len(texts)} chunks")

            self.logger.info(f"✅ Added {len(chunks)} chunks from '{document_name}'")
            self.logger.info(f"📊 Collection now has {self.collection.count()} total documents")

            return {'success': True, 'count': len(chunks)}

        except Exception as e:
            self.logger.error(f"Failed to add documents: {e}")
            return {'success': False, 'error': str(e)}

    def search(self, query: str, n_results: int = 5, document_filter: Any = None, user_id: str = None) -> Dict[str, Any]:
        """Search for relevant documents using semantic similarity with optional user filtering"""
        try:
            # Check if collection is empty
            if self.collection.count() == 0:
                self.logger.warning("Collection is empty, no results to return")
                return {
                    'documents': [[]],
                    'metadatas': [[]],
                    'distances': [[]]
                }

            # Generate query embedding
            query_embedding = self._generate_embeddings([query])[0]

            # Build filter with user_id and optional document name
            where_filter = {}
            conditions = []

            if user_id:
                conditions.append({"user_id": user_id})

            if document_filter:
                if isinstance(document_filter, list):
                    if len(document_filter) > 1:
                        conditions.append({"document_name": {"$in": document_filter}})
                    elif len(document_filter) == 1:
                        conditions.append({"document_name": document_filter[0]})
                else:
                    conditions.append({"document_name": document_filter})

            if len(conditions) > 1:
                where_filter = {"$and": conditions}
            elif len(conditions) == 1:
                where_filter = conditions[0]
            else:
                where_filter = None

            if where_filter:
                self.logger.info(f"Search filter: {where_filter}")

            # Search ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_filter
            )

            self.logger.info(f"Found {len(results['documents'][0])} results for query")

            return results

        except Exception as e:
            self.logger.error(f"Search failed: {e}")
            return {
                'documents': [[]],
                'metadatas': [[]],
                'distances': [[]]
            }

    def get_document_text(self, document_name: str, user_id: str = None, with_page_numbers: bool = False) -> str:
        """Retrieve full text of a document (sorted by page)"""
        try:
            where_filter = {"document_name": document_name}
            if user_id:
                where_filter = {"$and": [{"user_id": user_id}, {"document_name": document_name}]}
            
            results = self.collection.get(where=where_filter, include=['documents', 'metadatas'])
            
            if not results['documents']:
                return ""
                
            # Combine text and metadata
            chunks = []
            for i, text in enumerate(results['documents']):
                meta = results['metadatas'][i]
                # Handle potential None or string page numbers
                try:
                    page = int(meta.get('page_number', 0))
                except:
                    page = 0
                chunks.append({'text': text, 'page': page})
                
            # Sort by page
            chunks.sort(key=lambda x: x['page'])
            
            if with_page_numbers:
                return "\n\n".join([f"{c['text']} [Page {c['page']}]" for c in chunks])
            else:
                return "\n\n".join([c['text'] for c in chunks])
        except Exception as e:
            self.logger.error(f"Failed to get document text: {e}")
            return ""

    def delete_document(self, document_name: str, user_id: str = None) -> Dict[str, Any]:
        """Delete all chunks from a specific document, optionally filtered by user"""
        try:
            self.logger.info(f"Deleting document: {document_name} (user: {user_id})")

            # Build where filter
            if user_id:
                # Use $and operator for multiple conditions
                where_filter = {
                    "$and": [
                        {"user_id": user_id},
                        {"document_name": document_name}
                    ]
                }
            else:
                where_filter = {"document_name": document_name}

            # Get all IDs for this document
            results = self.collection.get(where=where_filter)

            if not results['ids']:
                self.logger.warning(f"No chunks found for document: {document_name}")
                return {'success': False, 'message': 'Document not found'}

            # Delete the chunks
            self.collection.delete(ids=results['ids'])

            self.logger.info(f"✅ Deleted {len(results['ids'])} chunks from '{document_name}'")
            return {'success': True, 'deleted_count': len(results['ids'])}

        except Exception as e:
            self.logger.error(f"Failed to delete document: {e}")
            return {'success': False, 'error': str(e)}

    def clear_all(self) -> Dict[str, Any]:
        """Clear all documents from the collection"""
        try:
            count = self.collection.count()
            self.logger.info(f"Clearing all {count} documents from collection")

            # Delete the collection and recreate it
            self.client.delete_collection(self.config.COLLECTION_NAME)
            self.collection = self.client.create_collection(
                name=self.config.COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )

            self.logger.info("✅ Collection cleared")
            return {'success': True, 'deleted_count': count}

        except Exception as e:
            self.logger.error(f"Failed to clear collection: {e}")
            return {'success': False, 'error': str(e)}

    def clear_user_documents(self, user_id: str) -> Dict[str, Any]:
        """Clear all documents belonging to a specific user"""
        try:
            self.logger.info(f"Clearing all documents for user: {user_id}")

            # Get all chunks for this user
            results = self.collection.get(
                where={"user_id": user_id}
            )

            if not results['ids']:
                self.logger.info(f"No documents found for user {user_id}")
                return {'success': True, 'deleted_count': 0}

            # Count unique documents
            unique_docs = set(m.get('document_name', 'unknown') for m in results['metadatas']) if results['metadatas'] else set()

            # Delete all chunks for this user
            self.collection.delete(ids=results['ids'])

            self.logger.info(f"✅ Cleared {len(results['ids'])} chunks from {len(unique_docs)} documents for user {user_id}")
            return {'success': True, 'deleted_count': len(unique_docs), 'chunks_deleted': len(results['ids'])}

        except Exception as e:
            self.logger.error(f"Failed to clear user documents: {e}")
            return {'success': False, 'error': str(e)}

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get collection statistics"""
        try:
            count = self.collection.count()

            # Get unique documents
            all_metadata = self.collection.get()
            unique_docs = set()
            if all_metadata['metadatas']:
                unique_docs = set(m.get('document_name', 'unknown')
                                for m in all_metadata['metadatas'])

            return {
                'total_chunks': count,
                'total_documents': len(unique_docs),
                'document_names': list(unique_docs),
                'embedding_model': self.config.EMBEDDING_MODEL,
                'collection_name': self.config.COLLECTION_NAME
            }
        except Exception as e:
            self.logger.error(f"Failed to get stats: {e}")
            return {'error': str(e)}

    def list_documents(self, user_id: str = None) -> List[Dict[str, Any]]:
        """List all documents with their statistics, optionally filtered by user"""
        try:
            # Build where filter if user_id provided
            where_filter = {"user_id": user_id} if user_id else None

            if where_filter:
                all_data = self.collection.get(where=where_filter)
            else:
                all_data = self.collection.get()

            if not all_data['metadatas']:
                return []

            # Group by document name
            doc_stats = {}
            for metadata in all_data['metadatas']:
                doc_name = metadata.get('document_name', 'unknown')
                chunk_type = metadata.get('chunk_type', 'text')

                if doc_name not in doc_stats:
                    doc_stats[doc_name] = {
                        'name': doc_name,
                        'total_chunks': 0,
                        'text_chunks': 0,
                        'table_chunks': 0,
                        'image_chunks': 0
                    }

                doc_stats[doc_name]['total_chunks'] += 1
                doc_stats[doc_name][f'{chunk_type}_chunks'] += 1

            return list(doc_stats.values())

        except Exception as e:
            self.logger.error(f"Failed to list documents: {e}")
            return []
