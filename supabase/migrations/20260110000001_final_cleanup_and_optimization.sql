-- Final cleanup and optimization migration
-- This ensures all tables have the proper structure for the production app

-- Ensure shows table has all needed columns
ALTER TABLE public.shows 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ensure profiles table has social_links for DJs and Presenters
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Ensure blogs table exists with proper structure
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image_url TEXT,
  author_id UUID REFERENCES public.profiles(id),
  category_id UUID,
  slug TEXT UNIQUE,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure blog_categories table exists
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_shows_active_featured 
ON public.shows (is_active, is_featured, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shows_host_active 
ON public.shows (host_id, is_active);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON public.user_roles (user_id, role);

CREATE INDEX IF NOT EXISTS idx_blogs_published 
ON public.blogs (is_published, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_blogs_author 
ON public.blogs (author_id, is_published);

CREATE INDEX IF NOT EXISTS idx_favorites_user_show 
ON public.favorites (user_id, show_id);

CREATE INDEX IF NOT EXISTS idx_schedule_show_day 
ON public.schedule (show_id, day_of_week);

-- Ensure RLS policies are properly set
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

-- Shows policies (if not already exist)
DROP POLICY IF EXISTS "Shows are viewable by everyone" ON public.shows;
CREATE POLICY "Shows are viewable by everyone" ON public.shows 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage their shows" ON public.shows;
CREATE POLICY "Authenticated users can manage their shows" ON public.shows 
FOR ALL USING (
  auth.uid() = host_id OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'dj') OR 
  public.has_role(auth.uid(), 'presenter')
);

-- Blog policies
DROP POLICY IF EXISTS "Published blogs are viewable by everyone" ON public.blogs;
CREATE POLICY "Published blogs are viewable by everyone" ON public.blogs 
FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Authors can manage their blogs" ON public.blogs;
CREATE POLICY "Authors can manage their blogs" ON public.blogs 
FOR ALL USING (
  auth.uid() = author_id OR 
  public.has_role(auth.uid(), 'admin')
);

-- Blog categories policies
DROP POLICY IF EXISTS "Blog categories are viewable by everyone" ON public.blog_categories;
CREATE POLICY "Blog categories are viewable by everyone" ON public.blog_categories 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage blog categories" ON public.blog_categories;
CREATE POLICY "Admins can manage blog categories" ON public.blog_categories 
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add some default blog categories if they don't exist
INSERT INTO public.blog_categories (name, description) 
VALUES 
  ('News', 'Station news and announcements'),
  ('Music', 'Music-related articles and reviews'),
  ('Events', 'Upcoming events and shows'),
  ('Technology', 'Broadcasting technology and tips'),
  ('Community', 'Community stories and features')
ON CONFLICT (name) DO NOTHING;

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers if they don't exist
DROP TRIGGER IF EXISTS update_shows_updated_at ON public.shows;
CREATE TRIGGER update_shows_updated_at 
  BEFORE UPDATE ON public.shows 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_blogs_updated_at ON public.blogs;
CREATE TRIGGER update_blogs_updated_at 
  BEFORE UPDATE ON public.blogs 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Clean up any test data (optional - uncomment if needed)
-- DELETE FROM public.shows WHERE name LIKE 'Test%' OR name LIKE 'Sample%' OR name LIKE 'Demo%';
-- DELETE FROM public.blogs WHERE title LIKE 'Test%' OR title LIKE 'Sample%';

-- Optimize database
ANALYZE;