-- Debug Role Assignment Issues
-- Run this in Supabase SQL Editor to check what's happening

-- 1. Check if users exist
SELECT 'Users Check' as check_type, count(*) as count
FROM auth.users 
WHERE email IN (
  'kilindosaid771@gmail.com',
  'kilindo1@gmail.com', 
  'kilindo2@gmail.com',
  'kilindo3@gmail.com'
);

-- 2. Check user_roles table
SELECT 'Roles Check' as check_type, count(*) as count
FROM public.user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'kilindosaid771@gmail.com',
    'kilindo1@gmail.com', 
    'kilindo2@gmail.com',
    'kilindo3@gmail.com'
  )
);

-- 3. Detailed role check
SELECT 
  u.email,
  ur.role,
  CASE 
    WHEN ur.role = 'admin' THEN 'Should redirect to /admin'
    WHEN ur.role IN ('dj', 'presenter', 'moderator') THEN 'Should redirect to /dj'
    ELSE 'Should redirect to /'
  END as expected_redirect
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN (
  'kilindosaid771@gmail.com',
  'kilindo1@gmail.com', 
  'kilindo2@gmail.com',
  'kilindo3@gmail.com'
)
ORDER BY u.email;

-- 4. Check if user_roles table has proper permissions
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename = 'user_roles';