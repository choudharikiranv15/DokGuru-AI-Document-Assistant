-- Fix match_documents function return type
-- The id column in document_chunks is TEXT (hash), not UUID
-- Previous migrations (018, 019) incorrectly defined the return type as UUID

DROP FUNCTION IF EXISTS match_documents(vector(384), text, integer, text[]);

CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(384),
    match_user_id text,
    match_count integer DEFAULT 5,
    match_documents text[] DEFAULT NULL
)
RETURNS TABLE (
    id text,
    content text,
    metadata jsonb,
    chunk_type text,
    page_number integer,
    document_name text,
    similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.content,
        dc.metadata,
        dc.chunk_type,
        dc.page_number,
        dc.document_name,
        (1 - (dc.embedding <=> query_embedding))::float AS similarity
    FROM document_chunks dc
    WHERE dc.user_id = match_user_id
        AND (match_documents IS NULL OR dc.document_name = ANY(match_documents))
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION match_documents(vector(384), text, integer, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents(vector(384), text, integer, text[]) TO anon;
GRANT EXECUTE ON FUNCTION match_documents(vector(384), text, integer, text[]) TO service_role;
