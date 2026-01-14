-- CORRECTED: Make kilindo1@gmail.com an admin user
-- Run this in your Supabase SQL Editor

-- Step 1: Simple admin role assignment
INSERT INTO public.user_roles (user_id, role) 
VALUES (
    (SELECT id FROM auth.users WHERE email = 'kilindo@gmail.com'),
    'admin'
) ON CONFLICT (user_id, role) DO NOTHING;

-- Step 2: Create/update profile
INSERT INTO public.profiles (user_id, display_name, full_name)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'kilindo@gmail.com'),
    'Admin',
    'System Administrator'
) ON CONFLICT (user_id) DO UPDATE SET
    display_name = COALESCE(profiles.display_name, 'Admin'),
    full_name = COALESCE(profiles.full_name, 'System Administrator');

-- Step 3: Verify everything worked
SELECT 
    u.id,
    u.email,
    u.created_at as user_created,
    p.display_name,
    p.full_name,
    ur.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'kilindo@gmail.com';