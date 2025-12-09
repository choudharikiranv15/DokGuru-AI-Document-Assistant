-- Add user status fields for admin management
-- Allows admins to ban/suspend users

-- Add is_active column (default true for existing users)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add banned_at timestamp
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='banned_at') THEN
        ALTER TABLE users ADD COLUMN banned_at TIMESTAMP;
    END IF;
END $$;

-- Add banned_by (admin who banned the user)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='banned_by') THEN
        ALTER TABLE users ADD COLUMN banned_by UUID REFERENCES users(id);
    END IF;
END $$;

-- Add ban_reason
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='ban_reason') THEN
        ALTER TABLE users ADD COLUMN ban_reason TEXT;
    END IF;
END $$;

-- Create index for active users
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = true;

COMMENT ON COLUMN users.is_active IS 'Whether user account is active (not banned/suspended)';
COMMENT ON COLUMN users.banned_at IS 'Timestamp when user was banned';
COMMENT ON COLUMN users.banned_by IS 'Admin who banned this user';
COMMENT ON COLUMN users.ban_reason IS 'Reason for banning the user';
