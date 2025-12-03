-- Fix RLS policies for site_feedback table
-- Since we're using custom JWT auth (not Supabase Auth), we need to adjust RLS policies

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own feedback" ON site_feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON site_feedback;
DROP POLICY IF EXISTS "Users can update own feedback within 24h" ON site_feedback;

-- Disable RLS (backend handles authorization with @require_auth)
-- This is safe because the backend validates user_id before inserting
ALTER TABLE site_feedback DISABLE ROW LEVEL SECURITY;

-- Also fix the rating constraints to allow NULL for optional ratings
-- The CHECK constraints should allow NULL values
ALTER TABLE site_feedback 
    DROP CONSTRAINT IF EXISTS site_feedback_ease_of_use_rating_check,
    DROP CONSTRAINT IF EXISTS site_feedback_features_rating_check,
    DROP CONSTRAINT IF EXISTS site_feedback_performance_rating_check;

-- Re-add constraints that allow NULL
ALTER TABLE site_feedback 
    ADD CONSTRAINT site_feedback_ease_of_use_rating_check 
        CHECK (ease_of_use_rating IS NULL OR (ease_of_use_rating >= 1 AND ease_of_use_rating <= 5)),
    ADD CONSTRAINT site_feedback_features_rating_check 
        CHECK (features_rating IS NULL OR (features_rating >= 1 AND features_rating <= 5)),
    ADD CONSTRAINT site_feedback_performance_rating_check 
        CHECK (performance_rating IS NULL OR (performance_rating >= 1 AND performance_rating <= 5));

-- Note: Since we're using custom JWT authentication in the backend,
-- and the backend validates user_id before inserting,
-- it's safe to disable RLS and let the backend handle authorization.
