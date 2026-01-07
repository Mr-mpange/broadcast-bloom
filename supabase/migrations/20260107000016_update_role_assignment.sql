-- Update the assign_user_role function to handle presenter role
CREATE OR REPLACE FUNCTION assign_user_role(user_email TEXT, user_role user_role, user_display_name TEXT DEFAULT NULL, user_bio TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id UUID;
    profile_id UUID;
BEGIN
    -- Get user ID from auth.users by email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User with email % not found', user_email;
        RETURN;
    END IF;
    
    -- Update or create profile
    INSERT INTO public.profiles (user_id, display_name, bio, role)
    VALUES (target_user_id, COALESCE(user_display_name, user_email), user_bio, user_role)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        display_name = COALESCE(user_display_name, profiles.display_name),
        bio = COALESCE(user_bio, profiles.bio),
        role = user_role,
        updated_at = now();
    
    -- Add role to user_roles table
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, user_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- If admin, also add all other roles
    IF user_role = 'admin' THEN
        INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'dj') ON CONFLICT DO NOTHING;
        INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'presenter') ON CONFLICT DO NOTHING;
        INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'moderator') ON CONFLICT DO NOTHING;
    END IF;
    
    -- If dj, also add moderator role
    IF user_role = 'dj' THEN
        INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'moderator') ON CONFLICT DO NOTHING;
    END IF;
    
    -- If presenter, also add moderator role
    IF user_role = 'presenter' THEN
        INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'moderator') ON CONFLICT DO NOTHING;
    END IF;
    
    RAISE NOTICE 'Successfully assigned % role to %', user_role, user_email;
END;
$$;

-- Update the is_admin_or_dj function to include presenters for show management
CREATE OR REPLACE FUNCTION public.is_admin_dj_or_presenter(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'dj', 'presenter')
  )
$$;

-- Create sample blog post
INSERT INTO public.blogs (title, content, excerpt, author_id, category, is_published, is_featured) 
SELECT 
  'Welcome to PULSE FM Blog',
  'We''re excited to launch our new blog where we''ll share the latest news, music reviews, artist interviews, and behind-the-scenes stories from PULSE FM. Stay tuned for amazing content from our team of DJs and presenters!

Our blog will feature:
- Latest music industry news
- Exclusive artist interviews
- Behind-the-scenes content from our shows
- Event announcements and coverage
- Community highlights and stories

We believe in the power of music to bring people together, and our blog is another way to connect with our amazing community of listeners across Africa and beyond.',
  'Introducing the new PULSE FM blog with news, reviews, and behind-the-scenes content from our team.',
  p.id,
  'News',
  true,
  true
FROM public.profiles p 
WHERE p.role = 'admin' 
LIMIT 1
ON CONFLICT DO NOTHING;