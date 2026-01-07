-- Clean up duplicate live shows and fix the auto-cancelling issue

-- First, end all currently live shows to clean up duplicates
UPDATE public.live_shows 
SET is_live = false, ended_at = now()
WHERE is_live = true;

-- Add a unique constraint to prevent multiple live shows for the same show
-- This will prevent the auto-cancelling issue
CREATE UNIQUE INDEX IF NOT EXISTS idx_live_shows_unique_active 
ON public.live_shows (show_id) 
WHERE is_live = true;

-- Add a function to properly handle live show transitions
CREATE OR REPLACE FUNCTION public.start_live_show(p_show_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  live_show_id UUID;
  existing_live_show_id UUID;
BEGIN
  -- Check if there's already a live show for this show
  SELECT id INTO existing_live_show_id 
  FROM public.live_shows 
  WHERE show_id = p_show_id AND is_live = true;
  
  IF existing_live_show_id IS NOT NULL THEN
    -- Return the existing live show ID
    RETURN existing_live_show_id;
  END IF;
  
  -- End any other live shows for this show (cleanup)
  UPDATE public.live_shows 
  SET is_live = false, ended_at = now()
  WHERE show_id = p_show_id AND is_live = true;
  
  -- Create new live show
  INSERT INTO public.live_shows (show_id, is_live, started_at)
  VALUES (p_show_id, true, now())
  RETURNING id INTO live_show_id;
  
  RETURN live_show_id;
END;
$$;

-- Add a function to properly end live shows
CREATE OR REPLACE FUNCTION public.end_live_show(p_live_show_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.live_shows 
  SET is_live = false, ended_at = now()
  WHERE id = p_live_show_id AND is_live = true;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.start_live_show(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_live_show(UUID) TO authenticated;