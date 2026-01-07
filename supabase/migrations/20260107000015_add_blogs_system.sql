-- Create blogs table for content management
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create blog categories table
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#8b5cf6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create blog comments table
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_email TEXT,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Blog policies
CREATE POLICY "Published blogs viewable by everyone" ON public.blogs 
FOR SELECT USING (is_published = true OR author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Authors can manage own blogs" ON public.blogs 
FOR ALL USING (author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all blogs" ON public.blogs 
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Blog categories policies
CREATE POLICY "Categories viewable by everyone" ON public.blog_categories 
FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.blog_categories 
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Blog comments policies
CREATE POLICY "Approved comments viewable by everyone" ON public.blog_comments 
FOR SELECT USING (is_approved = true);

CREATE POLICY "Anyone can submit comments" ON public.blog_comments 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Authors and admins can manage comments" ON public.blog_comments 
FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR 
  blog_id IN (SELECT id FROM blogs WHERE author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$;

-- Function to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION public.auto_generate_blog_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_slug(NEW.title);
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.blogs WHERE slug = NEW.slug AND id != COALESCE(NEW.id, gen_random_uuid())) LOOP
      NEW.slug := NEW.slug || '-' || extract(epoch from now())::int;
    END LOOP;
  END IF;
  
  -- Set published_at when first published
  IF NEW.is_published = true AND (OLD IS NULL OR OLD.is_published = false) THEN
    NEW.published_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for auto-generating slugs
CREATE TRIGGER auto_generate_blog_slug_trigger
  BEFORE INSERT OR UPDATE ON public.blogs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_blog_slug();

-- Updated at trigger for blogs
CREATE TRIGGER update_blogs_updated_at 
  BEFORE UPDATE ON public.blogs 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Insert default blog categories
INSERT INTO public.blog_categories (name, slug, description, color) VALUES
('News', 'news', 'Latest news and updates from PULSE FM', '#ef4444'),
('Music', 'music', 'Music reviews, artist interviews, and industry news', '#8b5cf6'),
('Events', 'events', 'Upcoming events and show announcements', '#f59e0b'),
('Behind the Scenes', 'behind-the-scenes', 'Stories from our DJs and team', '#10b981'),
('Community', 'community', 'Community highlights and listener stories', '#3b82f6')
ON CONFLICT (slug) DO NOTHING;

-- Enable realtime for blogs
ALTER PUBLICATION supabase_realtime ADD TABLE public.blogs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blog_comments;