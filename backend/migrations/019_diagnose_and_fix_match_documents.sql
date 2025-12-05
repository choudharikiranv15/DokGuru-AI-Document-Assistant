-- Diagnostic and fix for match_documents function
-- This will show what's wrong and fix it

-- Step 1: Check current function signature
SELECT
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'match_documents';

-- Step 2: Drop EVERYTHING related to match_documents
DROP FUNCTION IF EXISTS match_documents(vector, text, integer, text) CASCADE;
DROP FUNCTION IF EXISTS match_documents(vector, text, integer, text[]) CASCADE;
DROP FUNCTION IF EXISTS match_documents(vector(384), text, integer) CASCADE;
DROP FUNCTION IF EXISTS match_documents(vector(384), text, integer, text) CASCADE;
DROP FUNCTION IF EXISTS match_documents(vector(384), text, integer, text[]) CASCADE;

-- Step 3: Create the function with EXACT signature
CREATE FUNCTION match_documents(
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

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION match_documents(vector(384), text, integer, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents(vector(384), text, integer, text[]) TO anon;
GRANT EXECUTE ON FUNCTION match_documents(vector(384), text, integer, text[]) TO service_role;
GRANT EXECUTE ON FUNCTION match_documents(vector(384), text, integer, text[]) TO postgres;

-- Step 5: Verify it was created
SELECT
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'match_documents';
