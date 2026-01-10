-- Create listener_sessions table for real geolocation tracking
-- Run this in Supabase SQL Editor

-- Drop table if it exists (for clean recreation)
DROP TABLE IF EXISTS public.listener_sessions CASCADE;

-- Create the table
CREATE TABLE public.listener_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address TEXT,
    country_code TEXT,
    country_name TEXT,
    region TEXT,
    city TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone TEXT,
    connection_type TEXT,
    browser_name TEXT,
    os_name TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_seconds INTEGER DEFAULT 0,
    stream_quality TEXT DEFAULT 'auto',
    volume_level INTEGER DEFAULT 50,
    is_muted BOOLEAN DEFAULT FALSE,
    interactions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance (after table is created)
CREATE INDEX idx_listener_sessions_last_activity ON public.listener_sessions(last_activity);
CREATE INDEX idx_listener_sessions_country ON public.listener_sessions(country_code);
CREATE INDEX idx_listener_sessions_session_id ON public.listener_sessions(session_id);
CREATE INDEX idx_listener_sessions_user_id ON public.listener_sessions(user_id);

-- Enable Row Level Security
ALTER TABLE public.listener_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to listener sessions" ON public.listener_sessions;
DROP POLICY IF EXISTS "Allow public insert for listener sessions" ON public.listener_sessions;
DROP POLICY IF EXISTS "Allow public update for own sessions" ON public.listener_sessions;

-- Create policies for public access (since this is for anonymous listeners)
CREATE POLICY "Allow public read access to listener sessions" ON public.listener_sessions
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert for listener sessions" ON public.listener_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update for own sessions" ON public.listener_sessions
    FOR UPDATE USING (true);

-- Create a function to automatically update the updated_at timestamp
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_listener_sessions_updated_at ON public.listener_sessions;
CREATE TRIGGER update_listener_sessions_updated_at 
    BEFORE UPDATE ON public.listener_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to clean up old sessions (older than 24 hours)
DROP FUNCTION IF EXISTS cleanup_old_listener_sessions() CASCADE;
CREATE OR REPLACE FUNCTION cleanup_old_listener_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM public.listener_sessions 
    WHERE last_activity < NOW() - INTERVAL '24 hours';
END;
$$ language 'plpgsql';

-- Grant necessary permissions
GRANT ALL ON public.listener_sessions TO anon;
GRANT ALL ON public.listener_sessions TO authenticated;

-- Insert a test session to verify the table works
INSERT INTO public.listener_sessions (
    session_id,
    ip_address,
    country_code,
    country_name,
    region,
    city,
    latitude,
    longitude,
    timezone,
    connection_type,
    browser_name,
    os_name
) VALUES (
    'test_session_' || extract(epoch from now()),
    '127.0.0.1',
    'TZ',
    'Tanzania',
    'Dar es Salaam',
    'Dar es Salaam',
    -6.7924,
    39.2083,
    'Africa/Dar_es_Salaam',
    'desktop',
    'Chrome',
    'Unknown'
);

-- Verify the table was created successfully
SELECT 'listener_sessions table created successfully' as status,
       count(*) as test_records
FROM public.listener_sessions;