-- Simple migration to add single live session constraint
-- This ensures only one live broadcast can be active at any time

-- First, let's create a function to check for active sessions
CREATE OR REPLACE FUNCTION check_single_active_session()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check for live sessions, allow multiple automation sessions
    IF NEW.session_type = 'live' AND NEW.status = 'active' THEN
        -- Check if there's already an active live session
        IF EXISTS (
            SELECT 1 FROM public.broadcast_sessions 
            WHERE session_type = 'live' 
            AND status = 'active' 
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        ) THEN
            RAISE EXCEPTION 'Only one live broadcast session can be active at a time. Please end the current live session before starting a new one.'
                USING ERRCODE = 'P0001';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for INSERT operations
DROP TRIGGER IF EXISTS enforce_single_live_session_insert ON public.broadcast_sessions;
CREATE TRIGGER enforce_single_live_session_insert
    BEFORE INSERT ON public.broadcast_sessions
    FOR EACH ROW
    EXECUTE FUNCTION check_single_active_session();

-- Create the trigger for UPDATE operations
DROP TRIGGER IF EXISTS enforce_single_live_session_update ON public.broadcast_sessions;
CREATE TRIGGER enforce_single_live_session_update
    BEFORE UPDATE ON public.broadcast_sessions
    FOR EACH ROW
    EXECUTE FUNCTION check_single_active_session();

-- Add a helper function to get current active live session info
CREATE OR REPLACE FUNCTION get_active_live_session()
RETURNS TABLE (
    session_id UUID,
    broadcaster_id UUID,
    broadcaster_name TEXT,
    started_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bs.id,
        bs.broadcaster_id,
        COALESCE(p.display_name, 'Unknown DJ') as broadcaster_name,
        bs.started_at
    FROM public.broadcast_sessions bs
    LEFT JOIN public.profiles p ON p.user_id = bs.broadcaster_id
    WHERE bs.session_type = 'live' 
    AND bs.status = 'active'
    ORDER BY bs.started_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_single_active_session() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_live_session() TO authenticated;

-- Add a comment to document this constraint
COMMENT ON FUNCTION check_single_active_session() IS 'Ensures only one live broadcast session can be active at any time';
COMMENT ON FUNCTION get_active_live_session() IS 'Returns information about the currently active live session, if any';