-- Quick Role Assignment for Testing
-- Run this in Supabase SQL Editor

-- 1. Check current users
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'display_name' as display_name
FROM auth.users u 
WHERE u.email IN (
  'kilindosaid771@gmail.com',
  'kilindo1@gmail.com', 
  'kilindo2@gmail.com',
  'kilindo3@gmail.com'
)
ORDER BY u.email;

-- 2. Clear existing roles
DELETE FROM public.user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'kilindosaid771@gmail.com',
    'kilindo1@gmail.com', 
    'kilindo2@gmail.com',
    'kilindo3@gmail.com'
  )
);

-- 3. Assign roles directly (without function)
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  CASE 
    WHEN u.email = 'kilindosaid771@gmail.com' THEN 'admin'::user_role
    WHEN u.email = 'kilindo1@gmail.com' THEN 'dj'::user_role
    WHEN u.email = 'kilindo2@gmail.com' THEN 'presenter'::user_role
    WHEN u.email = 'kilindo3@gmail.com' THEN 'moderator'::user_role
  END as role
FROM auth.users u
WHERE u.email IN (
  'kilindosaid771@gmail.com',
  'kilindo1@gmail.com', 
  'kilindo2@gmail.com',
  'kilindo3@gmail.com'
);

-- 4. Update profiles
INSERT INTO public.profiles (user_id, display_name, bio, role)
SELECT 
  u.id,
  CASE 
    WHEN u.email = 'kilindosaid771@gmail.com' THEN 'Saidi Kilindo'
    WHEN u.email = 'kilindo1@gmail.com' THEN 'DJ Kilindo'
    WHEN u.email = 'kilindo2@gmail.com' THEN 'Presenter Kilindo'
    WHEN u.email = 'kilindo3@gmail.com' THEN 'Moderator Kilindo'
  END as display_name,
  CASE 
    WHEN u.email = 'kilindosaid771@gmail.com' THEN 'Main Administrator of PULSE FM'
    WHEN u.email = 'kilindo1@gmail.com' THEN 'Professional DJ and Music Curator'
    WHEN u.email = 'kilindo2@gmail.com' THEN 'Radio Presenter and Show Host'
    WHEN u.email = 'kilindo3@gmail.com' THEN 'Community Moderator'
  END as bio,
  CASE 
    WHEN u.email = 'kilindosaid771@gmail.com' THEN 'admin'::user_role
    WHEN u.email = 'kilindo1@gmail.com' THEN 'dj'::user_role
    WHEN u.email = 'kilindo2@gmail.com' THEN 'presenter'::user_role
    WHEN u.email = 'kilindo3@gmail.com' THEN 'moderator'::user_role
  END as role
FROM auth.users u
WHERE u.email IN (
  'kilindosaid771@gmail.com',
  'kilindo1@gmail.com', 
  'kilindo2@gmail.com',
  'kilindo3@gmail.com'
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  updated_at = now();

-- 5. Verify assignments
SELECT 
  u.email,
  u.raw_user_meta_data->>'display_name' as auth_display_name,
  p.display_name as profile_display_name,
  ur.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN (
  'kilindosaid771@gmail.com',
  'kilindo1@gmail.com', 
  'kilindo2@gmail.com',
  'kilindo3@gmail.com'
)
ORDER BY u.email;