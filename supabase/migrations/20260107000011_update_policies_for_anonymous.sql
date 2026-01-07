-- Update policies to allow anonymous users to view content

-- Allow anonymous users to view chat messages (read-only)
DROP POLICY IF EXISTS "Chat messages viewable by everyone" ON public.chat_messages;
CREATE POLICY "Chat messages viewable by everyone" ON public.chat_messages 
FOR SELECT USING (NOT is_deleted);

-- Allow anonymous users to view chat rooms
DROP POLICY IF EXISTS "Chat rooms viewable by everyone" ON public.chat_rooms;
CREATE POLICY "Chat rooms viewable by everyone" ON public.chat_rooms 
FOR SELECT USING (true);

-- Allow anonymous users to view live shows
DROP POLICY IF EXISTS "Live shows viewable by everyone" ON public.live_shows;
CREATE POLICY "Live shows viewable by everyone" ON public.live_shows 
FOR SELECT USING (true);

-- Allow anonymous users to view now playing info
DROP POLICY IF EXISTS "Now playing viewable by everyone" ON public.now_playing;
CREATE POLICY "Now playing viewable by everyone" ON public.now_playing 
FOR SELECT USING (true);

-- Allow anonymous users to view shows and schedules (already exists but ensuring)
DROP POLICY IF EXISTS "Shows are viewable by everyone" ON public.shows;
CREATE POLICY "Shows are viewable by everyone" ON public.shows 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Schedule viewable by everyone" ON public.schedule;
CREATE POLICY "Schedule viewable by everyone" ON public.schedule 
FOR SELECT USING (true);

-- Allow anonymous users to view profiles (for DJ info)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles 
FOR SELECT USING (true);