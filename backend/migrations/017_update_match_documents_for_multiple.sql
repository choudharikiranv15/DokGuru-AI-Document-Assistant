-- Migration: Update match_documents RPC function to support multiple document filtering
-- This allows querying across multiple documents simultaneously for comparison and cross-referencing

-- Drop existing function
DROP FUNCTION IF EXISTS match_documents(vector, text, integer, text);

-- Create updated function with array parameter for multiple documents
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(384),
    match_user_id text,
    match_count integer DEFAULT 5,
    match_documents text[] DEFAULT NULL  -- Changed from match_document (single) to match_documents (array)
)
RETURNS TABLE (
    id uuid,
    content text,
    metadata jsonb,
    chunk_type text,
    page_number integer,
    document_name text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        document_chunks.id,
        document_chunks.content,
        document_chunks.metadata,
        document_chunks.chunk_type,
        document_chunks.page_number,
        document_chunks.document_name,
        1 - (document_chunks.embedding <=> query_embedding) AS similarity
    FROM document_chunks
    WHERE document_chunks.user_id = match_user_id
        AND (match_documents IS NULL OR document_chunks.document_name = ANY(match_documents))  -- Support multiple documents with OR logic
    ORDER BY document_chunks.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION match_documents(vector, text, integer, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents(vector, text, integer, text[]) TO anon;

-- Add comment
COMMENT ON FUNCTION match_documents IS 'Vector similarity search with support for multiple document filtering (OR logic)';
