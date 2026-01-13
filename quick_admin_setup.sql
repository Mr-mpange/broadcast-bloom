-- Quick Admin Setup for kilindo1@gmail.com
-- Run this single query in Supabase SQL Editor

DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'kilindo1@gmail.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Add admin role
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (user_uuid, 'admin') 
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Create/update profile
        INSERT INTO public.profiles (user_id, display_name, full_name)
        VALUES (user_uuid, 'Admin', 'System Administrator')
        ON CONFLICT (user_id) DO UPDATE SET
            display_name = COALESCE(profiles.display_name, 'Admin'),
            full_name = COALESCE(profiles.full_name, 'System Administrator');
            
        RAISE NOTICE 'Admin role added successfully for kilindo1@gmail.com';
    ELSE
        RAISE NOTICE 'User kilindo1@gmail.com not found';
    END IF;
END $$;