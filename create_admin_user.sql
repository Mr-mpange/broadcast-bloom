-- Create admin user kilindo@gmail.com
-- NOTE: This only works if you have service role access
-- Otherwise, use Supabase Dashboard to create user first

-- This approach requires service role key, which you might not have access to
-- It's better to create user via Supabase Dashboard first

-- After creating user in dashboard, run this:
INSERT INTO public.user_roles (user_id, role) 
VALUES (
    (SELECT id FROM auth.users WHERE email = 'kilindo@gmail.com'),
    'admin'
) ON CONFLICT (user_id, role) DO NOTHING;

-- Verify user exists first:
SELECT id, email, created_at FROM auth.users WHERE email = 'kilindo@gmail.com';