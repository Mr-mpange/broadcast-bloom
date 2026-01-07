-- Fix admin policies for existing tables only

-- Update blog policies to allow admins full access
DROP POLICY IF EXISTS "Authors can manage own blogs" ON public.blogs;

CREATE POLICY "Authors can manage own blogs" ON public.blogs 
FOR ALL USING (
  author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  public.has_role(auth.uid(), 'admin')
);

-- Update show policies to ensure admins can manage all shows
DROP POLICY IF EXISTS "Admins and DJs can manage shows" ON public.shows;

CREATE POLICY "Admins and DJs can manage shows" ON public.shows 
FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'dj') OR
  public.has_role(auth.uid(), 'presenter')
);

-- Create helper functions for role checking
CREATE OR REPLACE FUNCTION public.can_manage_content(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'dj', 'presenter')
  )
$$;

CREATE OR REPLACE FUNCTION public.can_moderate(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'dj', 'presenter', 'moderator')
  )
$$;