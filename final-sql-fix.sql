-- =====================================================
-- FINAL SQL FIX - Run this in Supabase Dashboard
-- =====================================================

-- 1. Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
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

-- Enable RLS and create policies for contact_messages
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contact messages" ON contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can read contact messages" ON contact_messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update contact messages" ON contact_messages
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 2. Create audio_content table
CREATE TABLE IF NOT EXISTS audio_content (
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

-- Enable RLS and create policies for audio_content
ALTER TABLE audio_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active audio content" ON audio_content
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage audio content" ON audio_content
  FOR ALL USING (auth.role() = 'authenticated');

-- 3. Create other missing tables that might be needed
CREATE TABLE IF NOT EXISTS play_history (
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

-- 4. Create time_slots table
CREATE TABLE IF NOT EXISTS time_slots (
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

-- 5. Create broadcast_sessions table
CREATE TABLE IF NOT EXISTS broadcast_sessions (
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

-- 6. Fix profiles table policies (allow updates for authenticated users)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can read profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 7. Assign admin role to current user
INSERT INTO user_roles (user_id, role)
VALUES ('c7c30d40-2ffd-456b-bbaa-2f943470bbce', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 8. Create/update admin profile
INSERT INTO profiles (id, user_id, display_name, role, created_at, updated_at)
VALUES (
  'c7c30d40-2ffd-456b-bbaa-2f943470bbce',
  'c7c30d40-2ffd-456b-bbaa-2f943470bbce',
  'Admin User',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  display_name = 'Admin User',
  role = 'admin',
  updated_at = NOW();

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_email_idx ON contact_messages(email);
CREATE INDEX IF NOT EXISTS audio_content_upload_date_idx ON audio_content(upload_date DESC);
CREATE INDEX IF NOT EXISTS audio_content_is_active_idx ON audio_content(is_active);
CREATE INDEX IF NOT EXISTS play_history_played_at_idx ON play_history(played_at DESC);
CREATE INDEX IF NOT EXISTS time_slots_day_of_week_idx ON time_slots(day_of_week);
CREATE INDEX IF NOT EXISTS broadcast_sessions_status_idx ON broadcast_sessions(status);

-- 10. Insert some sample data for testing
INSERT INTO audio_content (name, artist, content_type, play_count, is_active) VALUES
('Station ID - PULSE FM', 'PULSE FM', 'jingle', 0, true),
('Morning Show Theme', 'PULSE FM', 'theme', 0, true),
('News Intro', 'PULSE FM', 'intro', 0, true),
('Commercial Break Music', 'PULSE FM', 'commercial', 0, true)
ON CONFLICT DO NOTHING;

INSERT INTO time_slots (name, day_of_week, start_time, end_time, slot_type, is_active) VALUES
('Morning Show', 1, '06:00:00', '10:00:00', 'live', true),
('Afternoon Drive', 1, '15:00:00', '18:00:00', 'live', true),
('Evening Mix', 1, '20:00:00', '23:00:00', 'live', true),
('Weekend Special', 6, '10:00:00', '14:00:00', 'live', true)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'SUCCESS: All tables created and admin role assigned!' as result;