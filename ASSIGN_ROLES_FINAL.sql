-- Final Role Assignment Script for PULSE FM Users
-- Run this in Supabase SQL Editor

-- 1. First, clear any existing roles to avoid conflicts
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

-- 2. Assign roles using the assign_user_role function
DO $$
BEGIN
  -- Main admin account (gets all permissions)
  PERFORM assign_user_role(
    'kilindosaid771@gmail.com', 
    'admin', 
    'Saidi Kilindo', 
    'Main Administrator - Full system access and emergency override'
  );
  
  -- DJ account (gets DJ + moderator permissions)
  PERFORM assign_user_role(
    'kilindo1@gmail.com', 
    'dj', 
    'DJ Kilindo', 
    'Professional DJ with full mixer access and broadcasting capabilities'
  );
  
  -- Presenter account (gets presenter + moderator permissions)
  PERFORM assign_user_role(
    'kilindo2@gmail.com', 
    'presenter', 
    'Presenter Kilindo', 
    'Radio presenter with microphone control and show hosting'
  );
  
  -- Moderator account (gets moderator permissions)
  PERFORM assign_user_role(
    'kilindo3@gmail.com', 
    'moderator', 
    'Moderator Kilindo', 
    'Community moderator with chat and content management'
  );
  
  RAISE NOTICE 'All roles assigned successfully!';
END $$;

-- 3. Update display names in auth.users metadata
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"display_name": "DJ Kilindo"}'::jsonb
WHERE email = 'kilindo1@gmail.com';

UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"display_name": "Presenter Kilindo"}'::jsonb
WHERE email = 'kilindo2@gmail.com';

UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"display_name": "Moderator Kilindo"}'::jsonb
WHERE email = 'kilindo3@gmail.com';

-- 4. Verify the role assignments
SELECT 
  u.email,
  u.raw_user_meta_data->>'display_name' as auth_display_name,
  p.display_name as profile_display_name,
  p.role as profile_role,
  STRING_AGG(ur.role, ', ' ORDER BY ur.role) as assigned_roles,
  p.bio
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN (
  'kilindosaid771@gmail.com',
  'kilindo1@gmail.com', 
  'kilindo2@gmail.com',
  'kilindo3@gmail.com'
)
GROUP BY u.email, u.raw_user_meta_data, p.display_name, p.role, p.bio
ORDER BY 
  CASE 
    WHEN p.role = 'admin' THEN 1 
    WHEN p.role = 'dj' THEN 2 
    WHEN p.role = 'presenter' THEN 3 
    WHEN p.role = 'moderator' THEN 4 
    ELSE 5 
  END;

-- 5. Check individual role assignments
SELECT 
  u.email,
  ur.role,
  ur.assigned_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN (
  'kilindosaid771@gmail.com',
  'kilindo1@gmail.com', 
  'kilindo2@gmail.com',
  'kilindo3@gmail.com'
)
ORDER BY u.email, ur.role;