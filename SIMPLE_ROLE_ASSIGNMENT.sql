-- Simple Role Assignment Script
-- Run this in Supabase SQL Editor

-- 1. Check what columns exist in user_roles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_roles' AND table_schema = 'public';

-- 2. Check current users
SELECT id, email FROM auth.users 
WHERE email IN (
  'kilindosaid771@gmail.com',
  'kilindo1@gmail.com', 
  'kilindo2@gmail.com',
  'kilindo3@gmail.com'
);

-- 3. Clear existing roles
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

-- 4. Assign admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'kilindosaid771@gmail.com';

-- 5. Assign dj role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'dj' FROM auth.users WHERE email = 'kilindo1@gmail.com';

-- 6. Assign presenter role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'presenter' FROM auth.users WHERE email = 'kilindo2@gmail.com';

-- 7. Assign moderator role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'moderator' FROM auth.users WHERE email = 'kilindo3@gmail.com';

-- 8. Verify assignments
SELECT 
  u.email,
  ur.role
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN (
  'kilindosaid771@gmail.com',
  'kilindo1@gmail.com', 
  'kilindo2@gmail.com',
  'kilindo3@gmail.com'
)
ORDER BY u.email;