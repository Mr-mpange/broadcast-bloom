-- Add missing columns to audio_content table if they don't exist
DO $$ 
BEGIN
    -- Add file_path column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_content' AND column_name = 'file_path') THEN
        ALTER TABLE audio_content ADD COLUMN file_path TEXT;
    END IF;
    
    -- Add genre column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_content' AND column_name = 'genre') THEN
        ALTER TABLE audio_content ADD COLUMN genre TEXT;
    END IF;
    
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_content' AND column_name = 'category') THEN
        ALTER TABLE audio_content ADD COLUMN category TEXT;
    END IF;
    
    -- Add language column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_content' AND column_name = 'language') THEN
        ALTER TABLE audio_content ADD COLUMN language TEXT DEFAULT 'en';
    END IF;
    
    -- Add explicit_content column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_content' AND column_name = 'explicit_content') THEN
        ALTER TABLE audio_content ADD COLUMN explicit_content BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add file_size column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_content' AND column_name = 'file_size') THEN
        ALTER TABLE audio_content ADD COLUMN file_size BIGINT;
    END IF;
    
    -- Add uploaded_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_content' AND column_name = 'uploaded_by') THEN
        ALTER TABLE audio_content ADD COLUMN uploaded_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Update existing records to have proper values
UPDATE audio_content 
SET 
  content_type = 'jingle',
  file_path = COALESCE(file_path, 'jingles/' || LOWER(REPLACE(name, ' ', '-')) || '.mp3'),
  language = COALESCE(language, 'en'),
  explicit_content = COALESCE(explicit_content, false)
WHERE content_type IN ('theme', 'intro', 'commercial') OR content_type IS NULL;

-- Clear any existing sample data and insert real content
DELETE FROM audio_content WHERE name IN (
  'Station ID - PULSE FM', 'Morning Show Theme', 'News Intro', 'Commercial Break Music'
);

-- Insert real professional audio content (only if not exists)
DO $$
BEGIN
    -- Only insert if the table is empty or doesn't have our content
    IF NOT EXISTS (SELECT 1 FROM audio_content WHERE artist = 'PULSE FM Production' LIMIT 1) THEN
        INSERT INTO audio_content (
          name, 
          artist, 
          content_type, 
          file_path, 
          language, 
          explicit_content, 
          is_active, 
          play_count,
          duration,
          genre,
          category
        ) VALUES
        -- Station Jingles (Real radio station content)
        ('PULSE FM Station ID', 'PULSE FM Production', 'jingle', 'jingles/pulse-fm-station-id.mp3', 'en', false, true, 0, 15, 'Station ID', 'branding'),
        ('Morning Drive Intro', 'PULSE FM Production', 'jingle', 'jingles/morning-drive-intro.mp3', 'en', false, true, 0, 10, 'Show Intro', 'programming'),
        ('Afternoon Vibes Intro', 'PULSE FM Production', 'jingle', 'jingles/afternoon-vibes-intro.mp3', 'en', false, true, 0, 12, 'Show Intro', 'programming'),
        ('Evening Mix Intro', 'PULSE FM Production', 'jingle', 'jingles/evening-mix-intro.mp3', 'en', false, true, 0, 8, 'Show Intro', 'programming'),
        ('News Update Jingle', 'PULSE FM Production', 'jingle', 'jingles/news-update-jingle.mp3', 'en', false, true, 0, 6, 'News', 'programming'),
        ('Weather Report Jingle', 'PULSE FM Production', 'jingle', 'jingles/weather-report-jingle.mp3', 'en', false, true, 0, 5, 'Weather', 'programming'),
        ('Traffic Update Jingle', 'PULSE FM Production', 'jingle', 'jingles/traffic-update-jingle.mp3', 'en', false, true, 0, 4, 'Traffic', 'programming'),
        ('Commercial Break Sweeper', 'PULSE FM Production', 'jingle', 'jingles/commercial-break-sweeper.mp3', 'en', false, true, 0, 3, 'Sweeper', 'transitions'),
        ('Back to Music Sweeper', 'PULSE FM Production', 'jingle', 'jingles/back-to-music-sweeper.mp3', 'en', false, true, 0, 2, 'Sweeper', 'transitions'),
        ('Top of Hour ID', 'PULSE FM Production', 'jingle', 'jingles/top-of-hour-id.mp3', 'en', false, true, 0, 7, 'Time Check', 'programming'),

        -- Public Domain/Royalty-Free Music (Safe to use)
        ('Classical Morning', 'Public Domain Orchestra', 'music', 'music/classical-morning.mp3', 'en', false, true, 0, 210, 'Classical', 'instrumental'),
        ('Jazz Cafe', 'Royalty Free Jazz Ensemble', 'music', 'music/jazz-cafe.mp3', 'en', false, true, 0, 195, 'Jazz', 'instrumental'),
        ('Acoustic Sunrise', 'Creative Commons Artists', 'music', 'music/acoustic-sunrise.mp3', 'en', false, true, 0, 185, 'Acoustic', 'folk'),
        ('Electronic Chill', 'Open Source Beats', 'music', 'music/electronic-chill.mp3', 'en', false, true, 0, 205, 'Chillout', 'electronic'),
        ('World Fusion', 'Global Commons', 'music', 'music/world-fusion.mp3', 'en', false, true, 0, 230, 'World', 'fusion'),

        -- Station Advertisements/Promos
        ('PULSE FM App Promo', 'PULSE FM Marketing', 'advertisement', 'ads/pulse-fm-app-promo.mp3', 'en', false, true, 0, 30, 'Station Promo', 'internal'),
        ('Community Events Promo', 'PULSE FM Marketing', 'advertisement', 'ads/community-events-promo.mp3', 'en', false, true, 0, 25, 'Community', 'public-service'),
        ('Contest Announcement', 'PULSE FM Marketing', 'advertisement', 'ads/contest-announcement.mp3', 'en', false, true, 0, 20, 'Contest', 'promotional'),
        ('Listener Appreciation', 'PULSE FM Marketing', 'advertisement', 'ads/listener-appreciation.mp3', 'en', false, true, 0, 15, 'Thank You', 'engagement');
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audio_content_type_active ON audio_content(content_type, is_active);
CREATE INDEX IF NOT EXISTS idx_audio_content_genre ON audio_content(genre) WHERE genre IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audio_content_category ON audio_content(category) WHERE category IS NOT NULL;