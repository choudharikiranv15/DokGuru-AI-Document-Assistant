-- Force fix match_documents function
-- Drop ALL versions of the function to ensure clean slate

-- Drop all possible variations
DROP FUNCTION IF EXISTS match_documents(vector, text, integer, text);
DROP FUNCTION IF EXISTS match_documents(vector, text, integer, text[]);
DROP FUNCTION IF EXISTS match_documents(vector(384), text, integer, text);
DROP FUNCTION IF EXISTS match_documents(vector(384), text, integer, text[]);

-- Create the correct function with proper return types
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(384),
    match_user_id text,
    match_count integer DEFAULT 5,
    match_documents text[] DEFAULT NULL
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
        (1 - (document_chunks.embedding <=> query_embedding))::float AS similarity
    FROM document_chunks
    WHERE document_chunks.user_id = match_user_id
        AND (match_documents IS NULL OR document_chunks.document_name = ANY(match_documents))
    ORDER BY document_chunks.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION match_documents(vector(384), text, integer, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents(vector(384), text, integer, text[]) TO anon;
GRANT EXECUTE ON FUNCTION match_documents(vector(384), text, integer, text[]) TO service_role;

-- Comment
COMMENT ON FUNCTION match_documents IS 'Vector similarity search with multiple document filtering - FIXED version';
