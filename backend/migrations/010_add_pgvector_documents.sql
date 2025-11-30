-- Migration: Add pgvector extension and document_chunks table
-- Run this in Supabase SQL Editor

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create document_chunks table for vector storage
-- Using TEXT for user_id to allow application-managed user IDs
CREATE TABLE IF NOT EXISTS document_chunks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,  -- Application-level user ID (not FK to auth.users for flexibility)
    document_name TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(384),  -- For all-MiniLM-L6-v2 model (384 dimensions)
    metadata JSONB DEFAULT '{}',
    chunk_type TEXT DEFAULT 'text',  -- 'text', 'table', 'image'
    chunk_index INTEGER DEFAULT 0,
    page_number INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_document_chunks_user_id ON document_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_name ON document_chunks(document_name);
CREATE INDEX IF NOT EXISTS idx_document_chunks_user_document ON document_chunks(user_id, document_name);

-- Create HNSW index for vector similarity search (faster than IVFFlat for small-medium datasets)
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(384),
    match_user_id TEXT,
    match_count INT DEFAULT 5,
    match_document TEXT DEFAULT NULL
)
RETURNS TABLE (
    id TEXT,
    document_name TEXT,
    content TEXT,
    metadata JSONB,
    chunk_type TEXT,
    page_number INTEGER,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with owner privileges to bypass RLS
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_name,
        dc.content,
        dc.metadata,
        dc.chunk_type,
        dc.page_number,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    WHERE dc.user_id = match_user_id
      AND (match_document IS NULL OR dc.document_name = match_document)
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Disable Row Level Security for now (application handles user isolation)
-- The backend uses service-level access with user_id filtering in queries
ALTER TABLE document_chunks DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated roles
GRANT ALL ON document_chunks TO anon;
GRANT ALL ON document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents TO anon;
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_chunks_updated_at
    BEFORE UPDATE ON document_chunks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE document_chunks IS 'Stores document chunks with vector embeddings for semantic search';
COMMENT ON COLUMN document_chunks.embedding IS 'Vector embedding from all-MiniLM-L6-v2 model (384 dimensions)';
