-- Update the handle_new_user trigger to explicitly set NULL for new columns
-- This makes the trigger more robust and prevents potential 500 errors if new NOT NULL columns are added without updating the trigger.

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the existing function if it exists to allow modification
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function with explicit column handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    password_hash,  -- Explicitly setting to NULL for auth.users-sourced entries
    display_name,   -- Explicitly setting to NULL for auth.users-sourced entries
    role,
    institution,    -- Explicitly setting to NULL
    occupation,     -- Explicitly setting to NULL
    is_verified,    -- Set to new.email_confirmed_at IS NOT NULL for immediate verification
    is_admin,       -- Default to FALSE
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    NULL, -- No password hash for Supabase Auth users
    NULL, -- No display name provided by Supabase Auth directly
    'student', -- Default role for new users
    NULL, -- No institution provided by Supabase Auth directly
    NULL, -- No occupation provided by Supabase Auth directly
    (new.email_confirmed_at IS NOT NULL), -- Set based on Supabase's own confirmation status
    FALSE, -- Default to not admin
    new.created_at,
    new.created_at
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
