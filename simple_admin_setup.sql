-- SIMPLE: Make kilindo@gmail.com an admin user
-- Run this in your Supabase SQL Editor

-- Step 1: Add admin role (this is the main thing we need)
INSERT INTO public.user_roles (user_id, role) 
VALUES (
    (SELECT id FROM auth.users WHERE email = 'kilindo@gmail.com'),
    'admin'
) ON CONFLICT (user_id, role) DO NOTHING;

-- Step 2: Create/update profile (only with existing columns)
INSERT INTO public.profiles (user_id, display_name)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'kilindo@gmail.com'),
    'Admin'
) ON CONFLICT (user_id) DO UPDATE SET
    display_name = COALESCE(profiles.display_name, 'Admin');

-- Step 3: Verify it worked
SELECT 
    u.id,
    u.email,
    p.display_name,
    ur.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'kilindo@gmail.com';