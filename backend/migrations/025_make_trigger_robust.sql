-- Make the handle_new_user trigger more robust by using INSERT ... ON CONFLICT (id) DO NOTHING
-- This prevents the trigger from failing with a 500 Internal Server Error if a user with the same ID
-- somehow already exists in public.users (e.g., from a partial previous attempt or re-triggering).

-- Drop the existing trigger and function first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the robust function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    password_hash,
    display_name,
    role,
    institution,
    occupation,
    is_verified,
    is_admin,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    NULL,
    NULL,
    'student',
    NULL,
    NULL,
    (new.email_confirmed_at IS NOT NULL),
    FALSE,
    new.created_at,
    new.created_at
  )
  ON CONFLICT (id) DO NOTHING; -- If a user with this ID already exists, do nothing (i.e., don't fail)
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
