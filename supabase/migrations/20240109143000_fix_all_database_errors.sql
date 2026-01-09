-- =====================================================
-- FIX ALL DATABASE ERRORS - SAFE MIGRATION
-- =====================================================

-- 1. Create contact_messages table (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contact_messages') THEN
        CREATE TABLE contact_messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          email_sent BOOLEAN DEFAULT FALSE,
          email_status TEXT DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'Anyone can insert contact messages') THEN
        CREATE POLICY "Anyone can insert contact messages" ON contact_messages
          FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'Authenticated users can read contact messages') THEN
        CREATE POLICY "Authenticated users can read contact messages" ON contact_messages
          FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'Authenticated users can update contact messages') THEN
        CREATE POLICY "Authenticated users can update contact messages" ON contact_messages
          FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 2. Create audio_content table (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audio_content') THEN
        CREATE TABLE audio_content (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          artist TEXT,
          album TEXT,
          content_type TEXT DEFAULT 'music',
          file_url TEXT,
          duration INTEGER,
          play_count INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE audio_content ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Anyone can read active audio content" ON audio_content
          FOR SELECT USING (is_active = true);
          
        CREATE POLICY "Authenticated users can manage audio content" ON audio_content
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 3. Create other missing tables
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'play_history') THEN
        CREATE TABLE play_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          content_id UUID REFERENCES audio_content(id) ON DELETE CASCADE,
          played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          played_by UUID REFERENCES auth.users(id),
          session_id TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Anyone can insert play history" ON play_history
          FOR INSERT WITH CHECK (true);
          
        CREATE POLICY "Authenticated users can read play history" ON play_history
          FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'time_slots') THEN
        CREATE TABLE time_slots (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          assigned_user_id UUID REFERENCES auth.users(id),
          backup_user_id UUID REFERENCES auth.users(id),
          day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          is_recurring BOOLEAN DEFAULT TRUE,
          slot_type TEXT DEFAULT 'live',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Anyone can read active time slots" ON time_slots
          FOR SELECT USING (is_active = true);
          
        CREATE POLICY "Authenticated users can manage time slots" ON time_slots
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'broadcast_sessions') THEN
        CREATE TABLE broadcast_sessions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          broadcaster_id UUID REFERENCES auth.users(id) NOT NULL,
          session_type TEXT DEFAULT 'live',
          status TEXT DEFAULT 'active',
          started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          ended_at TIMESTAMP WITH TIME ZONE,
          microphone_active BOOLEAN DEFAULT FALSE,
          current_mode TEXT DEFAULT 'music',
          emergency_override BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE broadcast_sessions ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Anyone can read active broadcast sessions" ON broadcast_sessions
          FOR SELECT USING (status = 'active');
          
        CREATE POLICY "Authenticated users can manage broadcast sessions" ON broadcast_sessions
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 4. Create indexes (safe to run multiple times)
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_email_idx ON contact_messages(email);
CREATE INDEX IF NOT EXISTS contact_messages_email_status_idx ON contact_messages(email_status);

CREATE INDEX IF NOT EXISTS audio_content_upload_date_idx ON audio_content(upload_date DESC);
CREATE INDEX IF NOT EXISTS audio_content_is_active_idx ON audio_content(is_active);
CREATE INDEX IF NOT EXISTS audio_content_content_type_idx ON audio_content(content_type);

-- 5. Insert sample data (safe with ON CONFLICT)
INSERT INTO audio_content (name, artist, content_type, play_count, is_active) VALUES
('Station ID - PULSE FM', 'PULSE FM', 'jingle', 0, true),
('Morning Show Theme', 'PULSE FM', 'theme', 0, true),
('News Intro', 'PULSE FM', 'intro', 0, true),
('Commercial Break Music', 'PULSE FM', 'commercial', 0, true)
ON CONFLICT DO NOTHING;