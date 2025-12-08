-- Add display_name to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
