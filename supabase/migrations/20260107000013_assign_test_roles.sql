-- Assign roles to existing users (update emails to match your actual test users)
-- This script assumes you've already created users through the auth system

-- Function to assign role to user by email
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
    
    -- If admin, also add dj and moderator roles
    IF user_role = 'admin' THEN
        INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'dj') ON CONFLICT DO NOTHING;
        INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'moderator') ON CONFLICT DO NOTHING;
    END IF;
    
    -- If dj, also add moderator role
    IF user_role = 'dj' THEN
        INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'moderator') ON CONFLICT DO NOTHING;
    END IF;
    
    RAISE NOTICE 'Successfully assigned % role to %', user_role, user_email;
END;
$$;

-- Example usage - Update these emails to match your actual test users
-- Uncomment and modify the lines below with your actual user emails

/*
-- Assign admin role
SELECT assign_user_role('admin@pulsefm.test', 'admin', 'Admin User', 'System Administrator - Managing PULSE FM operations');

-- Assign DJ role  
SELECT assign_user_role('dj@pulsefm.test', 'dj', 'DJ Mike', 'Professional DJ specializing in Afrobeats and Hip-Hop');

-- Assign moderator role
SELECT assign_user_role('moderator@pulsefm.test', 'moderator', 'Sarah Moderator', 'Community Moderator keeping the chat friendly');

-- Assign listener role
SELECT assign_user_role('listener@pulsefm.test', 'listener', 'John Listener', 'Music lover and regular PULSE FM listener');
*/

-- Create sample shows (only if they don't exist)
INSERT INTO public.shows (name, description, genre, image_url, is_active, is_featured)
SELECT * FROM (VALUES
    ('Morning Vibes', 'Start your day with the best Afrobeats and contemporary hits', 'Afrobeats', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', true, true),
    ('Evening Jazz', 'Smooth jazz to wind down your evening', 'Jazz', 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=400&fit=crop', true, false),
    ('Hip-Hop Central', 'The latest and greatest in hip-hop music', 'Hip Hop', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop', true, true),
    ('Reggae Roots', 'Classic and modern reggae from around the world', 'Reggae', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', true, false)
) AS v(name, description, genre, image_url, is_active, is_featured)
WHERE NOT EXISTS (SELECT 1 FROM public.shows WHERE shows.name = v.name);

-- Add sample listener stats
INSERT INTO public.listener_stats (listener_count, country, recorded_at) 
SELECT * FROM (VALUES
    (45, 'Kenya', now() - interval '1 hour'),
    (52, 'Nigeria', now() - interval '2 hours'),
    (38, 'South Africa', now() - interval '3 hours'),
    (41, 'Ghana', now() - interval '4 hours'),
    (29, 'Tanzania', now() - interval '5 hours'),
    (67, 'Kenya', now() - interval '6 hours'),
    (73, 'Nigeria', now() - interval '7 hours'),
    (55, 'Uganda', now() - interval '8 hours')
) AS v(listener_count, country, recorded_at)
WHERE NOT EXISTS (SELECT 1 FROM public.listener_stats WHERE recorded_at > now() - interval '1 day');

-- Add sample now playing
INSERT INTO public.now_playing (show_id, track_title, track_artist, dj_name, started_at)
SELECT s.id, 'Essence', 'Wizkid ft. Tems', 'DJ Mike', now() - interval '2 minutes'
FROM public.shows s 
WHERE s.name = 'Morning Vibes'
AND NOT EXISTS (SELECT 1 FROM public.now_playing WHERE started_at > now() - interval '1 hour');