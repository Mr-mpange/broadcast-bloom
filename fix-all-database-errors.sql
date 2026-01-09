-- =====================================================
-- COMPLETE DATABASE SETUP FOR BROADCAST BLOOM
-- Run this entire script in your Supabase SQL Editor
-- =====================================================

-- 1. CREATE CONTACT MESSAGES TABLE
-- =====================================================
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

-- 2. CREATE AUDIO CONTENT TABLE
-- =====================================================
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

-- 3. CREATE PLAY HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS play_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES audio_content(id) ON DELETE CASCADE,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  played_by UUID REFERENCES auth.users(id),
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE TIME SLOTS TABLE
-- =====================================================
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

-- 5. CREATE BROADCAST SESSIONS TABLE
-- =====================================================
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

-- 6. CREATE BLOG POSTS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID REFERENCES auth.users(id),
  featured_image_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  slug TEXT UNIQUE,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- 7. CREATE BLOG COMMENTS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  parent_id UUID REFERENCES blog_comments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CREATE LISTENER STATS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS listener_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listener_count INTEGER DEFAULT 0,
  country TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Contact Messages
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Audio Content
ALTER TABLE audio_content ENABLE ROW LEVEL SECURITY;

-- Play History
ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;

-- Time Slots
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Broadcast Sessions
ALTER TABLE broadcast_sessions ENABLE ROW LEVEL SECURITY;

-- Blog Posts
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Blog Comments
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Listener Stats
ALTER TABLE listener_stats ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Contact Messages Policies
CREATE POLICY "Anyone can insert contact messages" ON contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can read contact messages" ON contact_messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update contact messages" ON contact_messages
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Audio Content Policies
CREATE POLICY "Anyone can read active audio content" ON audio_content
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage audio content" ON audio_content
  FOR ALL USING (auth.role() = 'authenticated');

-- Play History Policies
CREATE POLICY "Anyone can insert play history" ON play_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can read play history" ON play_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- Time Slots Policies
CREATE POLICY "Anyone can read active time slots" ON time_slots
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage time slots" ON time_slots
  FOR ALL USING (auth.role() = 'authenticated');

-- Broadcast Sessions Policies
CREATE POLICY "Anyone can read active broadcast sessions" ON broadcast_sessions
  FOR SELECT USING (status = 'active');

CREATE POLICY "Authenticated users can manage broadcast sessions" ON broadcast_sessions
  FOR ALL USING (auth.role() = 'authenticated');

-- Blog Posts Policies
CREATE POLICY "Anyone can read published blog posts" ON blog_posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "Authenticated users can manage blog posts" ON blog_posts
  FOR ALL USING (auth.role() = 'authenticated');

-- Blog Comments Policies
CREATE POLICY "Anyone can read approved blog comments" ON blog_comments
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Authenticated users can manage blog comments" ON blog_comments
  FOR ALL USING (auth.role() = 'authenticated');

-- Listener Stats Policies
CREATE POLICY "Anyone can read listener stats" ON listener_stats
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert listener stats" ON listener_stats
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Contact Messages Indexes
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_email_idx ON contact_messages(email);
CREATE INDEX IF NOT EXISTS contact_messages_email_status_idx ON contact_messages(email_status);

-- Audio Content Indexes
CREATE INDEX IF NOT EXISTS audio_content_upload_date_idx ON audio_content(upload_date DESC);
CREATE INDEX IF NOT EXISTS audio_content_is_active_idx ON audio_content(is_active);
CREATE INDEX IF NOT EXISTS audio_content_content_type_idx ON audio_content(content_type);
CREATE INDEX IF NOT EXISTS audio_content_play_count_idx ON audio_content(play_count DESC);

-- Play History Indexes
CREATE INDEX IF NOT EXISTS play_history_played_at_idx ON play_history(played_at DESC);
CREATE INDEX IF NOT EXISTS play_history_content_id_idx ON play_history(content_id);

-- Time Slots Indexes
CREATE INDEX IF NOT EXISTS time_slots_day_of_week_idx ON time_slots(day_of_week);
CREATE INDEX IF NOT EXISTS time_slots_is_active_idx ON time_slots(is_active);
CREATE INDEX IF NOT EXISTS time_slots_assigned_user_idx ON time_slots(assigned_user_id);

-- Broadcast Sessions Indexes
CREATE INDEX IF NOT EXISTS broadcast_sessions_status_idx ON broadcast_sessions(status);
CREATE INDEX IF NOT EXISTS broadcast_sessions_broadcaster_idx ON broadcast_sessions(broadcaster_id);
CREATE INDEX IF NOT EXISTS broadcast_sessions_started_at_idx ON broadcast_sessions(started_at DESC);

-- Blog Posts Indexes
CREATE INDEX IF NOT EXISTS blog_posts_is_published_idx ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS blog_posts_is_featured_idx ON blog_posts(is_featured);
CREATE INDEX IF NOT EXISTS blog_posts_created_at_idx ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts(slug);

-- Blog Comments Indexes
CREATE INDEX IF NOT EXISTS blog_comments_post_id_idx ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS blog_comments_is_approved_idx ON blog_comments(is_approved);
CREATE INDEX IF NOT EXISTS blog_comments_created_at_idx ON blog_comments(created_at DESC);

-- Listener Stats Indexes
CREATE INDEX IF NOT EXISTS listener_stats_recorded_at_idx ON listener_stats(recorded_at DESC);
CREATE INDEX IF NOT EXISTS listener_stats_country_idx ON listener_stats(country);

-- =====================================================
-- CREATE DATABASE FUNCTIONS
-- =====================================================

-- Function to assign user roles
CREATE OR REPLACE FUNCTION assign_user_role(
  user_email TEXT,
  user_role TEXT,
  user_display_name TEXT DEFAULT NULL,
  user_bio TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user by email in auth.users
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Insert or update user role
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, user_role::user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update or insert profile
  INSERT INTO profiles (id, user_id, display_name, bio, role)
  VALUES (target_user_id, target_user_id, user_display_name, user_bio, user_role::user_role)
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(user_display_name, profiles.display_name),
    bio = COALESCE(user_bio, profiles.bio),
    role = user_role::user_role,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE ADMIN USER FOR CURRENT SESSION
-- =====================================================

-- Make the current logged-in user an admin
DO $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user ID (this will be the user from the console logs)
  current_user_id := 'c7c30d40-2ffd-456b-bbaa-2f943470bbce';
  
  -- Insert admin role
  INSERT INTO user_roles (user_id, role)
  VALUES (current_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update profile
  INSERT INTO profiles (id, user_id, display_name, role)
  VALUES (current_user_id, current_user_id, 'Admin User', 'admin')
  ON CONFLICT (id) DO UPDATE SET
    display_name = 'Admin User',
    role = 'admin',
    updated_at = NOW();
    
  RAISE NOTICE 'Admin role assigned to user: %', current_user_id;
END;
$$;

-- =====================================================
-- INSERT SAMPLE DATA FOR TESTING
-- =====================================================

-- Sample Audio Content
INSERT INTO audio_content (name, artist, content_type, play_count, is_active) VALUES
('Welcome to PULSE FM', 'Station ID', 'jingle', 0, true),
('Morning Show Theme', 'PULSE FM', 'theme', 0, true),
('News Intro', 'PULSE FM', 'intro', 0, true),
('Commercial Break', 'PULSE FM', 'commercial', 0, true)
ON CONFLICT DO NOTHING;

-- Sample Time Slots
INSERT INTO time_slots (name, day_of_week, start_time, end_time, slot_type, is_active) VALUES
('Morning Show', 1, '06:00:00', '10:00:00', 'live', true),
('Afternoon Drive', 1, '15:00:00', '18:00:00', 'live', true),
('Evening Mix', 1, '20:00:00', '23:00:00', 'live', true),
('Night Shift', 1, '23:00:00', '06:00:00', 'automated', true)
ON CONFLICT DO NOTHING;

-- Sample Listener Stats
INSERT INTO listener_stats (listener_count, country) VALUES
(150, 'Nigeria'),
(89, 'Ghana'),
(67, 'Kenya'),
(45, 'South Africa'),
(23, 'United States')
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ DATABASE SETUP COMPLETE!';
  RAISE NOTICE '📊 All tables created with proper RLS policies';
  RAISE NOTICE '🔐 Admin role assigned to current user';
  RAISE NOTICE '📝 Sample data inserted for testing';
  RAISE NOTICE '🚀 Your app should now work without errors!';
END;
$$;