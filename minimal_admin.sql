-- MINIMAL: Just make kilindo@gmail.com an admin
-- This is all you really need

INSERT INTO public.user_roles (user_id, role) 
VALUES (
    (SELECT id FROM auth.users WHERE email = 'kilindo@gmail.com'),
    'admin'
) ON CONFLICT (user_id, role) DO NOTHING;