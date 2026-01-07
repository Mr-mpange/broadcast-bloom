-- Fix chat message policies to allow authenticated users to send messages

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Chat messages viewable by everyone" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat rooms viewable by everyone" ON public.chat_rooms;

-- Chat messages policies
-- Allow everyone to view non-deleted messages
CREATE POLICY "Chat messages viewable by everyone" ON public.chat_messages 
FOR SELECT USING (NOT is_deleted);

-- Allow authenticated users to insert messages
CREATE POLICY "Authenticated users can send messages" ON public.chat_messages 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own messages (for editing/deleting)
CREATE POLICY "Users can update own messages" ON public.chat_messages 
FOR UPDATE USING (auth.uid() = user_id);

-- Chat rooms policies
-- Allow everyone to view active chat rooms
CREATE POLICY "Chat rooms viewable by everyone" ON public.chat_rooms 
FOR SELECT USING (is_active = true);

-- Allow authenticated users to create chat rooms (for shows)
CREATE POLICY "Authenticated users can create chat rooms" ON public.chat_rooms 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_rooms TO authenticated;
GRANT SELECT ON public.chat_messages TO anon;
GRANT SELECT ON public.chat_rooms TO anon;

-- Add missing columns if they don't exist (safety check)
DO $$ 
BEGIN
    -- Check if chat_messages has message_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_messages' AND column_name = 'message_type') THEN
        ALTER TABLE public.chat_messages ADD COLUMN message_type TEXT DEFAULT 'text';
    END IF;
    
    -- Add updated_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_messages' AND column_name = 'updated_at') THEN
        ALTER TABLE public.chat_messages ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;