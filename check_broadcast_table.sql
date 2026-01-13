-- Check if broadcast_sessions table exists and create if missing
DO $$ 
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'broadcast_sessions') THEN
        -- Create the table if it doesn't exist
        CREATE TABLE public.broadcast_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            broadcaster_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            time_slot_id UUID,
            session_type TEXT NOT NULL CHECK (session_type IN ('live', 'automation')),
            status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'interrupted')),
            started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            ended_at TIMESTAMPTZ,
            microphone_active BOOLEAN DEFAULT false,
            current_mode TEXT DEFAULT 'automation' CHECK (current_mode IN ('live', 'automation')),
            emergency_override BOOLEAN DEFAULT false,
            notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        -- Enable RLS
        ALTER TABLE public.broadcast_sessions ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view own broadcast sessions" 
        ON public.broadcast_sessions FOR SELECT 
        TO authenticated USING (broadcaster_id = auth.uid());

        CREATE POLICY "Admins can view all broadcast sessions" 
        ON public.broadcast_sessions FOR SELECT 
        TO authenticated USING (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        );

        CREATE POLICY "Users can create own broadcast sessions" 
        ON public.broadcast_sessions FOR INSERT 
        TO authenticated WITH CHECK (broadcaster_id = auth.uid());

        CREATE POLICY "Users can update own broadcast sessions" 
        ON public.broadcast_sessions FOR UPDATE 
        TO authenticated USING (broadcaster_id = auth.uid());

        -- Grant permissions
        GRANT ALL ON public.broadcast_sessions TO authenticated;

        -- Enable realtime
        ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_sessions;

        RAISE NOTICE 'broadcast_sessions table created successfully';
    ELSE
        RAISE NOTICE 'broadcast_sessions table already exists';
    END IF;
END $$;