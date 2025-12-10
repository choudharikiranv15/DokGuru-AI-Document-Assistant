-- Fix OAuth user creation by ensuring all required columns exist and trigger is correct

-- First, ensure password_hash is nullable (might already be done)
ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;

-- Ensure all columns exist that the trigger needs
DO $$
BEGIN
    -- Add display_name if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'display_name'
    ) THEN
        ALTER TABLE public.users ADD COLUMN display_name VARCHAR(255);
    END IF;

    -- Add role if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.users ADD COLUMN role VARCHAR(50) DEFAULT 'student';
    END IF;

    -- Add institution if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'institution'
    ) THEN
        ALTER TABLE public.users ADD COLUMN institution VARCHAR(255);
    END IF;

    -- Add occupation if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'occupation'
    ) THEN
        ALTER TABLE public.users ADD COLUMN occupation VARCHAR(255);
    END IF;

    -- Add is_verified if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add is_admin if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Drop and recreate the trigger function to ensure it's correct
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a simpler, more robust trigger that only inserts required fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Use INSERT with ON CONFLICT to prevent errors if user already exists
  INSERT INTO public.users (
    id,
    email,
    password_hash,
    display_name,
    role,
    is_verified,
    is_admin,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NULL, -- OAuth users don't have password_hash
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), -- Try to get name from OAuth data
    'student', -- Default role
    (NEW.email_confirmed_at IS NOT NULL), -- Verified if email is confirmed
    FALSE, -- Not admin by default
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth.users insert
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
