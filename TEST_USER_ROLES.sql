-- Test script to verify user roles are working properly

-- 1. Check if users exist
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'display_name' as display_name
FROM auth.users 
WHERE email IN (
  'kilindosaid771@gmail.com',
  'kilindo1@gmail.com', 
  'kilindo2@gmail.com',
  'kilindo3@gmail.com'
)
ORDER BY email;

-- 2. Check current role assignments
SELECT 
  u.email,
  ur.role,
  ur.description,
  ur.assigned_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN (
  'kilindosaid771@gmail.com',
  'kilindo1@gmail.com', 
  'kilindo2@gmail.com',
  'kilindo3@gmail.com'
)
ORDER BY u.email, ur.role;

-- 3. Test the assign_user_role function (run this if roles are missing)
-- Uncomment and run these lines if roles are not assigned:

/*
-- Clear existing roles first
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

-- Assign roles
SELECT assign_user_role('kilindosaid771@gmail.com', 'admin', 'Saidi Kilindo', 'Main Administrator');
SELECT assign_user_role('kilindo1@gmail.com', 'dj', 'DJ Kilindo', 'Professional DJ');
SELECT assign_user_role('kilindo2@gmail.com', 'presenter', 'Presenter Kilindo', 'Radio Presenter');
SELECT assign_user_role('kilindo3@gmail.com', 'moderator', 'Moderator Kilindo', 'Community Moderator');
*/

-- 4. Verify roles after assignment
SELECT 
  u.email,
  u.raw_user_meta_data->>'display_name' as auth_display_name,
  p.display_name as profile_display_name,
  ur.role,
  ur.description,
  ur.assigned_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN (
  'kilindosaid771@gmail.com',
  'kilindo1@gmail.com', 
  'kilindo2@gmail.com',
  'kilindo3@gmail.com'
)
ORDER BY 
  CASE ur.role 
    WHEN 'admin' THEN 1 
    WHEN 'dj' THEN 2 
    WHEN 'presenter' THEN 3 
    WHEN 'moderator' THEN 4 
    ELSE 5 
  END,
  u.email;

-- 5. Check if assign_user_role function exists
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE proname = 'assign_user_role';