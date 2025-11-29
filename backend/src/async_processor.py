"""
Async Document Processor
Handles PDF processing in background threads with progress tracking
"""
import os
import time
import uuid
import logging
import threading
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)


class ProcessingStatus(Enum):
    QUEUED = "queued"
    UPLOADING = "uploading"
    EXTRACTING = "extracting"
    EMBEDDING = "embedding"
    STORING = "storing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class ProcessingJob:
    """Represents a document processing job"""
    job_id: str
    user_id: str
    filename: str
    filepath: str
    status: ProcessingStatus = ProcessingStatus.QUEUED
    progress: int = 0  # 0-100
    message: str = "Queued for processing"
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            'job_id': self.job_id,
            'user_id': self.user_id,
            'filename': self.filename,
            'status': self.status.value,
            'progress': self.progress,
            'message': self.message,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'result': self.result,
            'error': self.error
        }


class AsyncDocumentProcessor:
    """
    Async document processor with progress tracking
    Uses thread pool for background processing
    """

    def __init__(self, rag_system, max_workers: int = 2):
        """
        Initialize async processor

        Args:
            rag_system: RAG system instance for document processing
            max_workers: Max concurrent processing jobs
        """
        self.rag_system = rag_system
        self.executor = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="doc_processor")
        self.jobs: Dict[str, ProcessingJob] = {}
        self._lock = threading.Lock()
        self._cleanup_interval = 3600  # Clean old jobs every hour
        self._job_ttl = 86400  # Keep jobs for 24 hours
        logger.info(f"AsyncDocumentProcessor initialized with {max_workers} workers")

    def submit_job(self, user_id: str, filename: str, filepath: str) -> ProcessingJob:
        """
        Submit a document for async processing

        Args:
            user_id: User ID
            filename: Original filename
            filepath: Path to uploaded file

        Returns:
            ProcessingJob with job_id for tracking
        """
        job_id = str(uuid.uuid4())[:8]  # Short job ID

        job = ProcessingJob(
            job_id=job_id,
            user_id=user_id,
            filename=filename,
            filepath=filepath,
            status=ProcessingStatus.QUEUED,
            progress=5,
            message="Document queued for processing"
        )

        with self._lock:
            self.jobs[job_id] = job

        # Submit to thread pool
        self.executor.submit(self._process_document, job)

        logger.info(f"Job {job_id} submitted for {filename} (user: {user_id})")
        return job

    def get_job_status(self, job_id: str, user_id: str = None) -> Optional[ProcessingJob]:
        """
        Get job status

        Args:
            job_id: Job ID
            user_id: Optional user ID for security check

        Returns:
            ProcessingJob or None if not found
        """
        with self._lock:
            job = self.jobs.get(job_id)

        if job and user_id and job.user_id != user_id:
            return None  # Security: don't expose other users' jobs

        return job

    def _update_job(self, job: ProcessingJob, status: ProcessingStatus,
                    progress: int, message: str, result: Dict = None, error: str = None):
        """Update job status (thread-safe)"""
        with self._lock:
            job.status = status
            job.progress = progress
            job.message = message
            job.updated_at = datetime.utcnow()
            if result:
                job.result = result
            if error:
                job.error = error

        logger.info(f"Job {job.job_id}: {status.value} ({progress}%) - {message}")

    def _process_document(self, job: ProcessingJob):
        """
        Process document in background thread

        Stages:
        1. Extracting text (0-40%)
        2. Generating embeddings (40-80%)
        3. Storing in vector DB (80-100%)
        """
        try:
            start_time = time.time()

            # Stage 1: Extract content (0-40%)
            self._update_job(job, ProcessingStatus.EXTRACTING, 10,
                           "Extracting text from PDF...")

            # Get PDF processor from RAG system
            chunks = self.rag_system.pdf_processor.extract_content(job.filepath)

            if not chunks:
                self._update_job(job, ProcessingStatus.FAILED, 0,
                               "No content extracted from PDF", error="Empty PDF or extraction failed")
                return

            self._update_job(job, ProcessingStatus.EXTRACTING, 40,
                           f"Extracted {len(chunks)} chunks from PDF")

            # Stage 2: Generate embeddings (40-80%)
            self._update_job(job, ProcessingStatus.EMBEDDING, 50,
                           "Generating embeddings...")

            # Get document name
            doc_name = os.path.basename(job.filepath).replace('.pdf', '')

            # Prepare data for vector store
            texts = [chunk.content for chunk in chunks]

            # Generate embeddings with progress updates
            total_texts = len(texts)
            batch_size = 32

            self._update_job(job, ProcessingStatus.EMBEDDING, 60,
                           f"Processing {total_texts} text chunks...")

            # Stage 3: Store in vector DB (80-100%)
            self._update_job(job, ProcessingStatus.STORING, 80,
                           "Storing in vector database...")

            # Add to vector store (this handles embedding + storage)
            self.rag_system.vector_store.add_documents(chunks, doc_name, user_id=job.user_id)

            self._update_job(job, ProcessingStatus.STORING, 95,
                           "Finalizing...")

            # Calculate stats
            elapsed = time.time() - start_time
            stats = {
                'total_chunks': len(chunks),
                'text_chunks': len([c for c in chunks if c.chunk_type == 'text']),
                'table_chunks': len([c for c in chunks if c.chunk_type == 'table']),
                'image_chunks': len([c for c in chunks if c.chunk_type == 'image']),
                'processing_time': round(elapsed, 2)
            }

            # Complete!
            self._update_job(job, ProcessingStatus.COMPLETED, 100,
                           f"Document processed in {elapsed:.1f}s",
                           result={
                               'success': True,
                               'document_name': doc_name,
                               'statistics': stats
                           })

            logger.info(f"Job {job.job_id} completed in {elapsed:.1f}s: {stats}")

        except Exception as e:
            logger.error(f"Job {job.job_id} failed: {e}", exc_info=True)
            self._update_job(job, ProcessingStatus.FAILED, 0,
                           f"Processing failed: {str(e)}", error=str(e))

    def cleanup_old_jobs(self):
        """Remove completed/failed jobs older than TTL"""
        cutoff = datetime.utcnow() - timedelta(seconds=self._job_ttl)

        with self._lock:
            old_jobs = [
                job_id for job_id, job in self.jobs.items()
                if job.status in (ProcessingStatus.COMPLETED, ProcessingStatus.FAILED)
                and job.updated_at < cutoff
            ]

            for job_id in old_jobs:
                del self.jobs[job_id]

        if old_jobs:
            logger.info(f"Cleaned up {len(old_jobs)} old jobs")

    def shutdown(self):
        """Shutdown the thread pool"""
        logger.info("Shutting down AsyncDocumentProcessor...")
        self.executor.shutdown(wait=True, cancel_futures=False)
        logger.info("AsyncDocumentProcessor shut down")
