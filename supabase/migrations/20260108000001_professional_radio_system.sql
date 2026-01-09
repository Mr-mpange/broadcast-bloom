-- Professional Radio Broadcasting System Implementation
-- This migration adds all missing features for a real radio station

-- ============================================================================
-- 1. ENHANCED ROLE SYSTEM & PERMISSIONS
-- ============================================================================

-- Add missing roles to enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'presenter';

-- Create permissions table for granular access control
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission TEXT NOT NULL,
  description TEXT,
  UNIQUE(role, permission)
);

-- Insert role permissions
INSERT INTO public.role_permissions (role, permission, description) VALUES
-- ADMIN permissions (full control)
('admin', 'manage_users', 'Create, update, suspend, delete user accounts'),
('admin', 'assign_roles', 'Assign roles and time slots'),
('admin', 'manage_audio_content', 'Upload and manage all audio content'),
('admin', 'manage_playlists', 'Create and manage all playlists'),
('admin', 'manage_schedule', 'Schedule programs and automation blocks'),
('admin', 'configure_streaming', 'Configure streaming settings'),
('admin', 'view_analytics', 'View system logs, play history, analytics'),
('admin', 'manage_advertisements', 'Manage ads and sponsorship schedules'),
('admin', 'emergency_override', 'Control emergency broadcast override'),
('admin', 'system_settings', 'Access full database and system settings'),
('admin', 'go_live', 'Go live during any time'),
('admin', 'control_microphone', 'Control microphone ON/OFF'),
('admin', 'control_music', 'Play, pause, skip, queue songs'),
('admin', 'trigger_jingles', 'Trigger station jingles and sound effects'),
('admin', 'view_queue', 'View playlist queue and countdown timers'),
('admin', 'switch_modes', 'Switch between Auto Mode and Live Mode'),
('admin', 'manage_calls', 'Manage live call-ins'),

-- DJ permissions (music & on-air control)
('dj', 'go_live_scheduled', 'Go LIVE during assigned time slots only'),
('dj', 'control_microphone', 'Control microphone ON/OFF'),
('dj', 'control_music', 'Play, pause, skip, queue songs'),
('dj', 'trigger_jingles', 'Trigger station jingles and sound effects'),
('dj', 'view_queue', 'View playlist queue and countdown timers'),
('dj', 'switch_modes', 'Switch between Auto Mode and Live Mode within schedule'),
('dj', 'view_now_playing', 'View "Now Playing" and upcoming tracks'),
('dj', 'log_activity', 'Log show activity and notes'),

-- PRESENTER permissions (talk shows & audience interaction)
('presenter', 'go_live_scheduled', 'Go LIVE during assigned programs'),
('presenter', 'control_microphone', 'Control microphone'),
('presenter', 'trigger_intro_outro', 'Trigger intro/outro jingles'),
('presenter', 'manage_calls', 'Manage live call-ins (answer, mute, drop)'),
('presenter', 'view_rundown', 'View program rundown or script notes'),
('presenter', 'interact_messages', 'Interact with messages or requests'),

-- MODERATOR permissions (content management)
('moderator', 'manage_content', 'Moderate user content'),
('moderator', 'manage_chat', 'Moderate live chat'),
('moderator', 'view_reports', 'View user reports and analytics')

ON CONFLICT (role, permission) DO NOTHING;

-- ============================================================================
-- 2. TIME SLOT MANAGEMENT SYSTEM
-- ============================================================================

-- Enhanced schedule table with time slot assignments
CREATE TABLE IF NOT EXISTS public.time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  backup_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN DEFAULT true,
  slot_type TEXT DEFAULT 'live' CHECK (slot_type IN ('live', 'automation', 'maintenance')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. BROADCASTING CONTROL SYSTEM
-- ============================================================================

-- Broadcasting sessions table to track live broadcasts
CREATE TABLE IF NOT EXISTS public.broadcast_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcaster_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  time_slot_id UUID REFERENCES public.time_slots(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('live', 'automation')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'interrupted')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  microphone_active BOOLEAN DEFAULT false,
  current_mode TEXT DEFAULT 'automation' CHECK (current_mode IN ('live', 'automation')),
  emergency_override BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audio content management
CREATE TABLE IF NOT EXISTS public.audio_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  duration INTEGER, -- seconds
  content_type TEXT NOT NULL CHECK (content_type IN ('music', 'jingle', 'advertisement', 'news', 'weather', 'other')),
  category TEXT,
  artist TEXT,
  album TEXT,
  genre TEXT,
  language TEXT DEFAULT 'en',
  explicit_content BOOLEAN DEFAULT false,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  play_count INTEGER DEFAULT 0,
  last_played TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Automation rules for scheduled content
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('time_based', 'content_based', 'event_based')),
  conditions JSONB NOT NULL, -- JSON conditions for when to trigger
  actions JSONB NOT NULL, -- JSON actions to perform
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. COMPREHENSIVE BROADCAST LOGGING SYSTEM
-- ============================================================================

-- Broadcast activity log for compliance and monitoring
CREATE TABLE IF NOT EXISTS public.broadcast_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.broadcast_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'session_start', 'session_end', 'mic_on', 'mic_off', 
    'play_track', 'pause_track', 'skip_track', 'stop_track',
    'trigger_jingle', 'mode_switch', 'emergency_override',
    'call_answer', 'call_end', 'volume_change', 'playlist_change'
  )),
  action_details JSONB,
  content_id UUID REFERENCES public.audio_content(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Play history for music royalty reporting
CREATE TABLE IF NOT EXISTS public.play_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.audio_content(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.broadcast_sessions(id) ON DELETE SET NULL,
  played_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_played INTEGER, -- seconds actually played
  play_type TEXT DEFAULT 'full' CHECK (play_type IN ('full', 'partial', 'skipped')),
  listener_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. EMERGENCY OVERRIDE SYSTEM
-- ============================================================================

-- Emergency broadcasts table
CREATE TABLE IF NOT EXISTS public.emergency_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority_level INTEGER NOT NULL CHECK (priority_level BETWEEN 1 AND 5), -- 1=highest
  broadcast_type TEXT NOT NULL CHECK (broadcast_type IN ('emergency', 'weather', 'news', 'test')),
  triggered_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  affected_sessions UUID[], -- Array of session IDs that were interrupted
  audio_file_path TEXT,
  repeat_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 6. ENHANCED FUNCTIONS FOR RADIO OPERATIONS
-- ============================================================================

-- Function to check if user can broadcast at current time
CREATE OR REPLACE FUNCTION public.can_user_broadcast_now(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_day INTEGER;
  current_time TIME;
  has_slot BOOLEAN := false;
  is_admin BOOLEAN := false;
BEGIN
  -- Check if user is admin (can broadcast anytime)
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_user_id AND role = 'admin'
  ) INTO is_admin;
  
  IF is_admin THEN
    RETURN true;
  END IF;
  
  -- Get current day and time
  current_day := EXTRACT(DOW FROM now());
  current_time := now()::TIME;
  
  -- Check if user has an active time slot now
  SELECT EXISTS(
    SELECT 1 FROM public.time_slots ts
    WHERE (ts.assigned_user_id = p_user_id OR ts.backup_user_id = p_user_id)
      AND ts.day_of_week = current_day
      AND ts.start_time <= current_time
      AND ts.end_time >= current_time
      AND ts.is_active = true
      AND ts.slot_type = 'live'
  ) INTO has_slot;
  
  RETURN has_slot;
END;
$;

-- Function to start a broadcast session
CREATE OR REPLACE FUNCTION public.start_broadcast_session(
  p_session_type TEXT DEFAULT 'live',
  p_time_slot_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  session_id UUID;
  can_broadcast BOOLEAN;
BEGIN
  -- Check if user can broadcast
  SELECT public.can_user_broadcast_now(auth.uid()) INTO can_broadcast;
  
  IF NOT can_broadcast THEN
    RAISE EXCEPTION 'User not authorized to broadcast at this time';
  END IF;
  
  -- End any existing active sessions for this user
  UPDATE public.broadcast_sessions
  SET status = 'interrupted', ended_at = now()
  WHERE broadcaster_id = auth.uid() AND status = 'active';
  
  -- Create new session
  INSERT INTO public.broadcast_sessions (
    broadcaster_id,
    time_slot_id,
    session_type,
    status
  ) VALUES (
    auth.uid(),
    p_time_slot_id,
    p_session_type,
    'active'
  ) RETURNING id INTO session_id;
  
  -- Log the session start
  INSERT INTO public.broadcast_log (
    session_id,
    user_id,
    action_type,
    action_details
  ) VALUES (
    session_id,
    auth.uid(),
    'session_start',
    jsonb_build_object('session_type', p_session_type)
  );
  
  RETURN session_id;
END;
$;

-- Function to end broadcast session
CREATE OR REPLACE FUNCTION public.end_broadcast_session(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  -- Update session
  UPDATE public.broadcast_sessions
  SET status = 'ended', ended_at = now()
  WHERE id = p_session_id AND broadcaster_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Log the session end
  INSERT INTO public.broadcast_log (
    session_id,
    user_id,
    action_type
  ) VALUES (
    p_session_id,
    auth.uid(),
    'session_end'
  );
  
  RETURN true;
END;
$;

-- Function to log broadcast actions
CREATE OR REPLACE FUNCTION public.log_broadcast_action(
  p_session_id UUID,
  p_action_type TEXT,
  p_action_details JSONB DEFAULT NULL,
  p_content_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.broadcast_log (
    session_id,
    user_id,
    action_type,
    action_details,
    content_id
  ) VALUES (
    p_session_id,
    auth.uid(),
    p_action_type,
    p_action_details,
    p_content_id
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$;

-- Function to trigger emergency override
CREATE OR REPLACE FUNCTION public.trigger_emergency_override(
  p_title TEXT,
  p_message TEXT,
  p_priority_level INTEGER,
  p_broadcast_type TEXT DEFAULT 'emergency'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  emergency_id UUID;
  affected_sessions UUID[];
BEGIN
  -- Check if user has emergency override permission
  IF NOT EXISTS(
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'User not authorized for emergency override';
  END IF;
  
  -- Get all active sessions that will be affected
  SELECT ARRAY_AGG(id) INTO affected_sessions
  FROM public.broadcast_sessions
  WHERE status = 'active';
  
  -- Create emergency broadcast record
  INSERT INTO public.emergency_broadcasts (
    title,
    message,
    priority_level,
    broadcast_type,
    triggered_by,
    affected_sessions
  ) VALUES (
    p_title,
    p_message,
    p_priority_level,
    p_broadcast_type,
    auth.uid(),
    affected_sessions
  ) RETURNING id INTO emergency_id;
  
  -- Mark all active sessions as interrupted by emergency
  UPDATE public.broadcast_sessions
  SET emergency_override = true
  WHERE status = 'active';
  
  -- Log emergency override for all affected sessions
  INSERT INTO public.broadcast_log (
    session_id,
    user_id,
    action_type,
    action_details
  )
  SELECT 
    unnest(affected_sessions),
    auth.uid(),
    'emergency_override',
    jsonb_build_object('emergency_id', emergency_id, 'title', p_title)
  WHERE affected_sessions IS NOT NULL;
  
  RETURN emergency_id;
END;
$;

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Time slots indexes
CREATE INDEX IF NOT EXISTS idx_time_slots_user_day_time 
ON public.time_slots (assigned_user_id, day_of_week, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_time_slots_active 
ON public.time_slots (is_active, day_of_week) WHERE is_active = true;

-- Broadcast sessions indexes
CREATE INDEX IF NOT EXISTS idx_broadcast_sessions_active 
ON public.broadcast_sessions (broadcaster_id, status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_broadcast_sessions_time 
ON public.broadcast_sessions (started_at, ended_at);

-- Broadcast log indexes
CREATE INDEX IF NOT EXISTS idx_broadcast_log_session_time 
ON public.broadcast_log (session_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_broadcast_log_user_action 
ON public.broadcast_log (user_id, action_type, timestamp);

-- Audio content indexes
CREATE INDEX IF NOT EXISTS idx_audio_content_type_active 
ON public.audio_content (content_type, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_audio_content_last_played 
ON public.audio_content (last_played) WHERE last_played IS NOT NULL;

-- Play history indexes
CREATE INDEX IF NOT EXISTS idx_play_history_content_time 
ON public.play_history (content_id, played_at);

CREATE INDEX IF NOT EXISTS idx_play_history_session 
ON public.play_history (session_id, played_at);

-- ============================================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_broadcasts ENABLE ROW LEVEL SECURITY;

-- Role permissions policies
CREATE POLICY "Role permissions viewable by all authenticated users" 
ON public.role_permissions FOR SELECT 
TO authenticated USING (true);

-- Time slots policies
CREATE POLICY "Time slots viewable by all" 
ON public.time_slots FOR SELECT USING (true);

CREATE POLICY "Admins can manage time slots" 
ON public.time_slots FOR ALL 
TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Broadcast sessions policies
CREATE POLICY "Users can view own broadcast sessions" 
ON public.broadcast_sessions FOR SELECT 
TO authenticated USING (broadcaster_id = auth.uid());

CREATE POLICY "Admins can view all broadcast sessions" 
ON public.broadcast_sessions FOR SELECT 
TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own broadcast sessions" 
ON public.broadcast_sessions FOR INSERT 
TO authenticated WITH CHECK (broadcaster_id = auth.uid());

CREATE POLICY "Users can update own broadcast sessions" 
ON public.broadcast_sessions FOR UPDATE 
TO authenticated USING (broadcaster_id = auth.uid());

-- Audio content policies
CREATE POLICY "Audio content viewable by DJs and admins" 
ON public.audio_content FOR SELECT 
TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'dj') OR 
  public.has_role(auth.uid(), 'presenter')
);

CREATE POLICY "Admins can manage audio content" 
ON public.audio_content FOR ALL 
TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Broadcast log policies
CREATE POLICY "Users can view own broadcast logs" 
ON public.broadcast_log FOR SELECT 
TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all broadcast logs" 
ON public.broadcast_log FOR SELECT 
TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert broadcast logs" 
ON public.broadcast_log FOR INSERT 
TO authenticated WITH CHECK (true);

-- Play history policies
CREATE POLICY "Play history viewable by admins and DJs" 
ON public.play_history FOR SELECT 
TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'dj')
);

CREATE POLICY "System can insert play history" 
ON public.play_history FOR INSERT 
TO authenticated WITH CHECK (true);

-- Emergency broadcasts policies
CREATE POLICY "Emergency broadcasts viewable by all" 
ON public.emergency_broadcasts FOR SELECT USING (true);

CREATE POLICY "Admins can manage emergency broadcasts" 
ON public.emergency_broadcasts FOR ALL 
TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 9. TRIGGERS FOR AUTOMATION
-- ============================================================================

-- Trigger to update audio content play count
CREATE OR REPLACE FUNCTION public.update_audio_play_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $
BEGIN
  UPDATE public.audio_content
  SET 
    play_count = play_count + 1,
    last_played = NEW.played_at
  WHERE id = NEW.content_id;
  
  RETURN NEW;
END;
$;

CREATE TRIGGER update_audio_play_stats_trigger
  AFTER INSERT ON public.play_history
  FOR EACH ROW EXECUTE FUNCTION public.update_audio_play_stats();

-- Trigger to auto-end sessions after time slot expires
CREATE OR REPLACE FUNCTION public.auto_end_expired_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $
BEGIN
  -- This would be called by a scheduled job
  UPDATE public.broadcast_sessions bs
  SET status = 'ended', ended_at = now()
  FROM public.time_slots ts
  WHERE bs.time_slot_id = ts.id
    AND bs.status = 'active'
    AND (
      ts.day_of_week != EXTRACT(DOW FROM now()) OR
      now()::TIME > ts.end_time
    );
  
  RETURN NULL;
END;
$;

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.time_slots TO authenticated;
GRANT ALL ON public.broadcast_sessions TO authenticated;
GRANT ALL ON public.audio_content TO authenticated;
GRANT ALL ON public.automation_rules TO authenticated;
GRANT ALL ON public.broadcast_log TO authenticated;
GRANT ALL ON public.play_history TO authenticated;
GRANT ALL ON public.emergency_broadcasts TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.can_user_broadcast_now(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_broadcast_session(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_broadcast_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_broadcast_action(UUID, TEXT, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_emergency_override(TEXT, TEXT, INTEGER, TEXT) TO authenticated;

-- Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_broadcasts;