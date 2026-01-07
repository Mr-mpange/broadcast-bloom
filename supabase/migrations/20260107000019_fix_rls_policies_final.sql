-- Fix RLS policies for live_shows and now_playing tables

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Admins and DJs can manage live shows" ON public.live_shows;
DROP POLICY IF EXISTS "Admins and DJs can update now playing" ON public.now_playing;

-- Create more permissive policies for authenticated users
-- Live shows policies
CREATE POLICY "Authenticated users can view live shows" ON public.live_shows 
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage live shows" ON public.live_shows 
FOR ALL USING (auth.role() = 'authenticated');

-- Now playing policies  
CREATE POLICY "Authenticated users can view now playing" ON public.now_playing 
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage now playing" ON public.now_playing 
FOR ALL USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON public.live_shows TO authenticated;
GRANT ALL ON public.now_playing TO authenticated;
GRANT SELECT ON public.live_shows TO anon;
GRANT SELECT ON public.now_playing TO anon;