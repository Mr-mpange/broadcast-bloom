-- Create DJ roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'dj', 'moderator', 'listener');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role user_role DEFAULT 'listener',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table for role management (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create shows table
CREATE TABLE public.shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create schedule table
CREATE TABLE public.schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES public.shows(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create playlists table
CREATE TABLE public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  dj_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tracks table
CREATE TABLE public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  duration INTEGER, -- seconds
  file_url TEXT,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create donations table
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name TEXT,
  donor_email TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL, -- 'paypal', 'mpesa'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  transaction_id TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create listener_stats table for analytics
CREATE TABLE public.listener_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listener_count INTEGER DEFAULT 0,
  country TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create now_playing table for current track info
CREATE TABLE public.now_playing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES public.shows(id),
  track_title TEXT,
  track_artist TEXT,
  dj_name TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listener_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.now_playing ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is admin or DJ
CREATE OR REPLACE FUNCTION public.is_admin_or_dj(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'dj')
  )
$$;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies (admin only management)
CREATE POLICY "Roles viewable by owner" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Shows policies
CREATE POLICY "Shows are viewable by everyone" ON public.shows FOR SELECT USING (true);
CREATE POLICY "Admins and DJs can manage shows" ON public.shows FOR ALL USING (public.is_admin_or_dj(auth.uid()));

-- Schedule policies  
CREATE POLICY "Schedule viewable by everyone" ON public.schedule FOR SELECT USING (true);
CREATE POLICY "Admins and DJs can manage schedule" ON public.schedule FOR ALL USING (public.is_admin_or_dj(auth.uid()));

-- Playlists policies
CREATE POLICY "Public playlists viewable by all" ON public.playlists FOR SELECT USING (is_public = true OR dj_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "DJs can manage own playlists" ON public.playlists FOR ALL USING (dj_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Tracks policies
CREATE POLICY "Tracks viewable if playlist accessible" ON public.tracks FOR SELECT USING (
  playlist_id IN (SELECT id FROM playlists WHERE is_public = true OR dj_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);
CREATE POLICY "DJs can manage tracks in own playlists" ON public.tracks FOR ALL USING (
  playlist_id IN (SELECT id FROM playlists WHERE dj_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- Donations policies (admins only for viewing)
CREATE POLICY "Donations insertable by anyone" ON public.donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view donations" ON public.donations FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Listener stats policies
CREATE POLICY "Stats viewable by admins and DJs" ON public.listener_stats FOR SELECT USING (public.is_admin_or_dj(auth.uid()));
CREATE POLICY "Stats insertable by system" ON public.listener_stats FOR INSERT WITH CHECK (true);

-- Now playing policies
CREATE POLICY "Now playing viewable by everyone" ON public.now_playing FOR SELECT USING (true);
CREATE POLICY "Admins and DJs can update now playing" ON public.now_playing FOR ALL USING (public.is_admin_or_dj(auth.uid()));

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  
  -- Default role is listener
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'listener');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_shows_updated_at BEFORE UPDATE ON public.shows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON public.playlists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_now_playing_updated_at BEFORE UPDATE ON public.now_playing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for now_playing
ALTER PUBLICATION supabase_realtime ADD TABLE public.now_playing;
ALTER PUBLICATION supabase_realtime ADD TABLE public.listener_stats;