-- Create contact_messages table
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

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contact messages" ON contact_messages
FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can read contact messages" ON contact_messages
FOR SELECT USING (auth.role() = 'authenticated');

-- Create audio_content table
CREATE TABLE IF NOT EXISTS audio_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    artist TEXT,
    content_type TEXT DEFAULT 'music',
    file_url TEXT,
    duration INTEGER,
    play_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE audio_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active audio content" ON audio_content
FOR SELECT USING (is_active = true);