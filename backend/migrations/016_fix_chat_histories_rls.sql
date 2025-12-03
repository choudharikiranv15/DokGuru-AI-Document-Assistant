-- Fix RLS policies for chat_histories table
-- Since we're using custom JWT auth (not Supabase Auth), we need to disable RLS

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own chat histories" ON chat_histories;
DROP POLICY IF EXISTS "Users can insert own chat histories" ON chat_histories;
DROP POLICY IF EXISTS "Users can update own chat histories" ON chat_histories;
DROP POLICY IF EXISTS "Users can delete own chat histories" ON chat_histories;

-- Disable RLS (backend handles authorization with @require_auth)
-- This is safe because the backend validates user_id before inserting
ALTER TABLE chat_histories DISABLE ROW LEVEL SECURITY;

-- Note: Since we're using custom JWT authentication in the backend,
-- and the backend validates user_id before inserting,
-- it's safe to disable RLS and let the backend handle authorization.
