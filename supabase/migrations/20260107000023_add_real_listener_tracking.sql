-- Add real listener tracking system

-- Create listener_sessions table to track real listeners
CREATE TABLE IF NOT EXISTS public.listener_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL, -- For anonymous users
  live_show_id UUID REFERENCES public.live_shows(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  user_agent TEXT,
  ip_address INET
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_listener_sessions_active 
ON public.listener_sessions (live_show_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_listener_sessions_show_time 
ON public.listener_sessions (live_show_id, started_at);

-- Enable RLS
ALTER TABLE public.listener_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view listener sessions" ON public.listener_sessions 
FOR SELECT USING (true);

CREATE POLICY "Anyone can create listener sessions" ON public.listener_sessions 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own sessions" ON public.listener_sessions 
FOR UPDATE USING (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Function to get current listener count for a live show
CREATE OR REPLACE FUNCTION public.get_listener_count(p_live_show_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  listener_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT COALESCE(user_id::text, session_id))
  INTO listener_count
  FROM public.listener_sessions
  WHERE live_show_id = p_live_show_id 
    AND is_active = true
    AND started_at > now() - interval '5 minutes'; -- Consider active if started within 5 minutes
  
  RETURN COALESCE(listener_count, 0);
END;
$$;

-- Function to start a listener session
CREATE OR REPLACE FUNCTION public.start_listener_session(
  p_live_show_id UUID,
  p_session_id TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_uuid UUID;
  existing_session_id UUID;
BEGIN
  -- Check if user already has an active session for this show
  IF auth.uid() IS NOT NULL THEN
    SELECT id INTO existing_session_id
    FROM public.listener_sessions
    WHERE user_id = auth.uid()
      AND live_show_id = p_live_show_id
      AND is_active = true;
  ELSE
    SELECT id INTO existing_session_id
    FROM public.listener_sessions
    WHERE session_id = p_session_id
      AND live_show_id = p_live_show_id
      AND is_active = true
      AND user_id IS NULL;
  END IF;
  
  -- If session exists, return it
  IF existing_session_id IS NOT NULL THEN
    -- Update the started_at to extend the session
    UPDATE public.listener_sessions
    SET started_at = now()
    WHERE id = existing_session_id;
    
    RETURN existing_session_id;
  END IF;
  
  -- Create new session
  INSERT INTO public.listener_sessions (
    user_id,
    session_id,
    live_show_id,
    user_agent
  ) VALUES (
    auth.uid(),
    COALESCE(p_session_id, gen_random_uuid()::text),
    p_live_show_id,
    p_user_agent
  ) RETURNING id INTO session_uuid;
  
  RETURN session_uuid;
END;
$$;

-- Function to end a listener session
CREATE OR REPLACE FUNCTION public.end_listener_session(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.listener_sessions
  SET is_active = false, ended_at = now()
  WHERE id = p_session_id;
  
  RETURN FOUND;
END;
$$;

-- Function to cleanup old inactive sessions (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_listener_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  -- Mark sessions as inactive if they haven't been updated in 10 minutes
  UPDATE public.listener_sessions
  SET is_active = false, ended_at = now()
  WHERE is_active = true
    AND started_at < now() - interval '10 minutes';
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  RETURN cleaned_count;
END;
$$;

-- Grant permissions
GRANT ALL ON public.listener_sessions TO authenticated;
GRANT SELECT ON public.listener_sessions TO anon;
GRANT EXECUTE ON FUNCTION public.get_listener_count(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.start_listener_session(UUID, TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.end_listener_session(UUID) TO authenticated, anon;