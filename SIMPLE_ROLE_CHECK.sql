-- Simple role check - run this first
SELECT 
  u.email,
  ur.role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN (
  'kilindosaid771@gmail.com',
  'kilindo1@gmail.com', 
  'kilindo2@gmail.com',
  'kilindo3@gmail.com'
)
ORDER BY u.email;