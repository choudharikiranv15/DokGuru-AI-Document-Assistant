-- Migration: Create chat_histories table with plan-based restrictions
-- This table stores chat conversation history for users
-- Free plan: 5 chats, 50 queries each
-- Basic plan: 20 chats, 200 queries each
-- Premium plan: 100 chats, 1000 queries each
-- Enterprise: Unlimited

CREATE TABLE IF NOT EXISTS chat_histories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id TEXT, -- Store document ID (can be null if document deleted)
    document_name TEXT NOT NULL,
    first_message TEXT NOT NULL, -- Preview of first user message
    messages JSONB DEFAULT '[]'::jsonb, -- Array of message objects
    message_count INTEGER DEFAULT 0, -- Track query count for plan limits
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_histories_user_id ON chat_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_histories_document_id ON chat_histories(document_id);
CREATE INDEX IF NOT EXISTS idx_chat_histories_created_at ON chat_histories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_histories_updated_at ON chat_histories(updated_at DESC);

-- GIN index for searching within messages JSONB
CREATE INDEX IF NOT EXISTS idx_chat_histories_messages_gin ON chat_histories USING gin(messages);

-- Enable Row Level Security (RLS)
ALTER TABLE chat_histories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own chat histories
CREATE POLICY chat_histories_select_policy ON chat_histories
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own chat histories
CREATE POLICY chat_histories_insert_policy ON chat_histories
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own chat histories
CREATE POLICY chat_histories_update_policy ON chat_histories
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own chat histories
CREATE POLICY chat_histories_delete_policy ON chat_histories
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_histories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER chat_histories_updated_at_trigger
    BEFORE UPDATE ON chat_histories
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_histories_updated_at();

-- COMMENT: Message structure in JSONB
-- {
--   "role": "user" | "assistant",
--   "text": "message content",
--   "timestamp": "2025-12-03T10:30:00Z",
--   "audioUrl": "/path/to/audio.wav" (optional),
--   "metadata": { ... } (optional)
-- }
