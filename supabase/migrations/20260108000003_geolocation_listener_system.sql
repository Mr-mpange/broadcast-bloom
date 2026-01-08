-- Geolocation-Based Listener Tracking System
-- This migration creates a comprehensive system for tracking listeners based on their real geographic location

-- ============================================================================
-- 1. ENHANCED LISTENER TRACKING TABLES
-- ============================================================================

-- Drop existing listener_stats if it exists and recreate with better structure
DROP TABLE IF EXISTS public.listener_stats CASCADE;

-- Create comprehensive listener sessions table
CREATE TABLE public.listener_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL, -- Browser/client session ID
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- For registered users
  ip_address INET NOT NULL,
  user_agent TEXT,
  
  -- Geolocation data (from IP or browser geolocation API)
  country_code CHAR(2), -- ISO 3166-1 alpha-2 country code
  country_name TEXT,
  region TEXT, -- State/Province
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone TEXT,
  
  -- Connection details
  connection_type TEXT, -- 'mobile', 'desktop', 'tablet'
  browser_name TEXT,
  os_name TEXT,
  
  -- Session tracking
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  
  -- Listening behavior
  stream_quality TEXT DEFAULT 'auto', -- 'low', 'medium', 'high', 'auto'
  volume_level INTEGER DEFAULT 50,
  is_muted BOOLEAN DEFAULT false,
  
  -- Engagement metrics
  page_views INTEGER DEFAULT 1,
  interactions INTEGER DEFAULT 0, -- Chat messages, likes, etc.
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Real-time listener statistics (aggregated data)
CREATE TABLE public.listener_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Time period
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_type TEXT NOT NULL CHECK (period_type IN ('minute', 'hour', 'day')),
  
  -- Geographic breakdown
  country_code CHAR(2),
  country_name TEXT,
  region TEXT,
  city TEXT,
  
  -- Listener counts
  total_listeners INTEGER NOT NULL DEFAULT 0,
  new_listeners INTEGER DEFAULT 0,
  returning_listeners INTEGER DEFAULT 0,
  peak_concurrent INTEGER DEFAULT 0,
  
  -- Engagement metrics
  avg_session_duration INTEGER DEFAULT 0, -- seconds
  total_interactions INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0, -- percentage
  
  -- Technical metrics
  mobile_listeners INTEGER DEFAULT 0,
  desktop_listeners INTEGER DEFAULT 0,
  tablet_listeners INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Geolocation cache to avoid repeated API calls
CREATE TABLE public.geolocation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  
  -- Location data
  country_code CHAR(2),
  country_name TEXT,
  region TEXT,
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone TEXT,
  
  -- ISP information
  isp_name TEXT,
  organization TEXT,
  
  -- Cache metadata
  source TEXT DEFAULT 'ip_api', -- 'ip_api', 'maxmind', 'browser_geo'
  confidence_score INTEGER DEFAULT 0, -- 0-100
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days')
);

-- ============================================================================
-- 2. FUNCTIONS FOR GEOLOCATION AND LISTENER TRACKING
-- ============================================================================

-- Function to get or create geolocation data for an IP address
CREATE OR REPLACE FUNCTION public.get_geolocation_for_ip(p_ip_address INET)
RETURNS TABLE (
  country_code CHAR(2),
  country_name TEXT,
  region TEXT,
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cached_data RECORD;
BEGIN
  -- Check if we have cached data for this IP
  SELECT * INTO cached_data
  FROM public.geolocation_cache
  WHERE ip_address = p_ip_address
    AND expires_at > now();
  
  IF FOUND THEN
    -- Return cached data
    RETURN QUERY SELECT 
      cached_data.country_code,
      cached_data.country_name,
      cached_data.region,
      cached_data.city,
      cached_data.latitude,
      cached_data.longitude,
      cached_data.timezone;
  ELSE
    -- For now, return default African location (will be enhanced with real IP geolocation service)
    -- In production, this would call an external geolocation API
    RETURN QUERY SELECT 
      'KE'::CHAR(2) as country_code,
      'Kenya'::TEXT as country_name,
      'Nairobi'::TEXT as region,
      'Nairobi'::TEXT as city,
      -1.2921::DECIMAL(10, 8) as latitude,
      36.8219::DECIMAL(11, 8) as longitude,
      'Africa/Nairobi'::TEXT as timezone;
    
    -- Cache the result
    INSERT INTO public.geolocation_cache (
      ip_address, country_code, country_name, region, city, 
      latitude, longitude, timezone, source, confidence_score
    ) VALUES (
      p_ip_address, 'KE', 'Kenya', 'Nairobi', 'Nairobi',
      -1.2921, 36.8219, 'Africa/Nairobi', 'default', 50
    ) ON CONFLICT (ip_address) DO UPDATE SET
      last_updated = now(),
      expires_at = now() + interval '30 days';
  END IF;
END;
$$;

-- Function to start a listener session
CREATE OR REPLACE FUNCTION public.start_listener_session(
  p_session_id TEXT,
  p_ip_address INET,
  p_user_agent TEXT DEFAULT NULL,
  p_browser_latitude DECIMAL(10, 8) DEFAULT NULL,
  p_browser_longitude DECIMAL(11, 8) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_uuid UUID;
  geo_data RECORD;
  device_type TEXT;
  browser_name TEXT;
  os_name TEXT;
BEGIN
  -- Generate session UUID
  session_uuid := gen_random_uuid();
  
  -- Get geolocation data
  IF p_browser_latitude IS NOT NULL AND p_browser_longitude IS NOT NULL THEN
    -- Use browser geolocation if available (more accurate)
    -- For now, we'll use a reverse geocoding approximation
    -- In production, this would call a reverse geocoding service
    SELECT 'KE', 'Kenya', 'Nairobi', 'Nairobi', p_browser_latitude, p_browser_longitude, 'Africa/Nairobi'
    INTO geo_data;
  ELSE
    -- Fall back to IP geolocation
    SELECT * INTO geo_data FROM public.get_geolocation_for_ip(p_ip_address);
  END IF;
  
  -- Parse user agent for device/browser info
  device_type := CASE 
    WHEN p_user_agent ILIKE '%mobile%' OR p_user_agent ILIKE '%android%' OR p_user_agent ILIKE '%iphone%' THEN 'mobile'
    WHEN p_user_agent ILIKE '%tablet%' OR p_user_agent ILIKE '%ipad%' THEN 'tablet'
    ELSE 'desktop'
  END;
  
  browser_name := CASE 
    WHEN p_user_agent ILIKE '%chrome%' THEN 'Chrome'
    WHEN p_user_agent ILIKE '%firefox%' THEN 'Firefox'
    WHEN p_user_agent ILIKE '%safari%' THEN 'Safari'
    WHEN p_user_agent ILIKE '%edge%' THEN 'Edge'
    ELSE 'Unknown'
  END;
  
  os_name := CASE 
    WHEN p_user_agent ILIKE '%windows%' THEN 'Windows'
    WHEN p_user_agent ILIKE '%mac%' THEN 'macOS'
    WHEN p_user_agent ILIKE '%linux%' THEN 'Linux'
    WHEN p_user_agent ILIKE '%android%' THEN 'Android'
    WHEN p_user_agent ILIKE '%ios%' THEN 'iOS'
    ELSE 'Unknown'
  END;
  
  -- Create listener session
  INSERT INTO public.listener_sessions (
    id,
    session_id,
    user_id,
    ip_address,
    user_agent,
    country_code,
    country_name,
    region,
    city,
    latitude,
    longitude,
    timezone,
    connection_type,
    browser_name,
    os_name
  ) VALUES (
    session_uuid,
    p_session_id,
    auth.uid(), -- Will be NULL for anonymous users
    p_ip_address,
    p_user_agent,
    geo_data.country_code,
    geo_data.country_name,
    geo_data.region,
    geo_data.city,
    geo_data.latitude,
    geo_data.longitude,
    geo_data.timezone,
    device_type,
    browser_name,
    os_name
  );
  
  RETURN session_uuid;
END;
$$;

-- Function to update listener session activity
CREATE OR REPLACE FUNCTION public.update_listener_activity(
  p_session_id TEXT,
  p_volume_level INTEGER DEFAULT NULL,
  p_is_muted BOOLEAN DEFAULT NULL,
  p_stream_quality TEXT DEFAULT NULL,
  p_interaction_increment INTEGER DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.listener_sessions
  SET 
    last_activity = now(),
    volume_level = COALESCE(p_volume_level, volume_level),
    is_muted = COALESCE(p_is_muted, is_muted),
    stream_quality = COALESCE(p_stream_quality, stream_quality),
    interactions = interactions + p_interaction_increment,
    updated_at = now()
  WHERE session_id = p_session_id
    AND ended_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Function to end listener session
CREATE OR REPLACE FUNCTION public.end_listener_session(p_session_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.listener_sessions
  SET 
    ended_at = now(),
    duration_seconds = EXTRACT(EPOCH FROM (now() - started_at))::INTEGER,
    updated_at = now()
  WHERE session_id = p_session_id
    AND ended_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Function to get current listener statistics
CREATE OR REPLACE FUNCTION public.get_current_listener_stats()
RETURNS TABLE (
  total_listeners BIGINT,
  countries JSONB,
  devices JSONB,
  top_locations JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH active_sessions AS (
    SELECT *
    FROM public.listener_sessions
    WHERE ended_at IS NULL
      AND last_activity > now() - interval '5 minutes'
  ),
  country_stats AS (
    SELECT 
      country_name,
      country_code,
      COUNT(*) as listener_count
    FROM active_sessions
    WHERE country_name IS NOT NULL
    GROUP BY country_name, country_code
    ORDER BY listener_count DESC
  ),
  device_stats AS (
    SELECT 
      connection_type,
      COUNT(*) as count
    FROM active_sessions
    GROUP BY connection_type
  ),
  location_stats AS (
    SELECT 
      city,
      region,
      country_name,
      COUNT(*) as listener_count,
      AVG(latitude) as avg_lat,
      AVG(longitude) as avg_lng
    FROM active_sessions
    WHERE city IS NOT NULL
    GROUP BY city, region, country_name
    ORDER BY listener_count DESC
    LIMIT 10
  )
  SELECT 
    (SELECT COUNT(*) FROM active_sessions)::BIGINT as total_listeners,
    (SELECT jsonb_agg(row_to_json(country_stats)) FROM country_stats) as countries,
    (SELECT jsonb_agg(row_to_json(device_stats)) FROM device_stats) as devices,
    (SELECT jsonb_agg(row_to_json(location_stats)) FROM location_stats) as top_locations;
END;
$$;

-- ============================================================================
-- 3. AUTOMATED STATISTICS AGGREGATION
-- ============================================================================

-- Function to aggregate listener statistics
CREATE OR REPLACE FUNCTION public.aggregate_listener_stats(p_period_type TEXT DEFAULT 'hour')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
BEGIN
  -- Determine time period
  CASE p_period_type
    WHEN 'minute' THEN
      start_time := date_trunc('minute', now() - interval '1 minute');
      end_time := date_trunc('minute', now());
    WHEN 'hour' THEN
      start_time := date_trunc('hour', now() - interval '1 hour');
      end_time := date_trunc('hour', now());
    WHEN 'day' THEN
      start_time := date_trunc('day', now() - interval '1 day');
      end_time := date_trunc('day', now());
    ELSE
      RAISE EXCEPTION 'Invalid period type: %', p_period_type;
  END CASE;
  
  -- Aggregate statistics by country
  INSERT INTO public.listener_stats (
    recorded_at,
    period_type,
    country_code,
    country_name,
    total_listeners,
    new_listeners,
    returning_listeners,
    avg_session_duration,
    total_interactions,
    mobile_listeners,
    desktop_listeners,
    tablet_listeners
  )
  SELECT 
    start_time as recorded_at,
    p_period_type,
    country_code,
    country_name,
    COUNT(DISTINCT id) as total_listeners,
    COUNT(DISTINCT CASE WHEN started_at >= start_time THEN id END) as new_listeners,
    COUNT(DISTINCT CASE WHEN started_at < start_time THEN id END) as returning_listeners,
    AVG(CASE WHEN ended_at IS NOT NULL THEN duration_seconds ELSE EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at)) END)::INTEGER as avg_session_duration,
    SUM(interactions) as total_interactions,
    COUNT(CASE WHEN connection_type = 'mobile' THEN 1 END) as mobile_listeners,
    COUNT(CASE WHEN connection_type = 'desktop' THEN 1 END) as desktop_listeners,
    COUNT(CASE WHEN connection_type = 'tablet' THEN 1 END) as tablet_listeners
  FROM public.listener_sessions
  WHERE (started_at BETWEEN start_time AND end_time)
     OR (started_at < start_time AND (ended_at IS NULL OR ended_at > start_time))
  GROUP BY country_code, country_name
  ON CONFLICT DO NOTHING;
END;
$$;

-- ============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Listener sessions indexes
CREATE INDEX idx_listener_sessions_active ON public.listener_sessions (session_id, ended_at) WHERE ended_at IS NULL;
CREATE INDEX idx_listener_sessions_country ON public.listener_sessions (country_code, started_at);
CREATE INDEX idx_listener_sessions_location ON public.listener_sessions (latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_listener_sessions_activity ON public.listener_sessions (last_activity) WHERE ended_at IS NULL;

-- Listener stats indexes
CREATE INDEX idx_listener_stats_time_country ON public.listener_stats (recorded_at, country_code, period_type);
CREATE INDEX idx_listener_stats_period ON public.listener_stats (period_type, recorded_at DESC);

-- Geolocation cache indexes
CREATE INDEX idx_geolocation_cache_expires ON public.geolocation_cache (expires_at);

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.listener_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listener_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geolocation_cache ENABLE ROW LEVEL SECURITY;

-- Policies for listener sessions
CREATE POLICY "Users can view own sessions" ON public.listener_sessions
  FOR SELECT USING (user_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "System can manage listener sessions" ON public.listener_sessions
  FOR ALL USING (true);

-- Policies for listener stats (readable by all, manageable by admins)
CREATE POLICY "Listener stats viewable by all" ON public.listener_stats
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage listener stats" ON public.listener_stats
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for geolocation cache
CREATE POLICY "Geolocation cache readable by system" ON public.geolocation_cache
  FOR SELECT USING (true);

CREATE POLICY "System can manage geolocation cache" ON public.geolocation_cache
  FOR ALL USING (true);

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON public.listener_sessions TO authenticated;
GRANT ALL ON public.listener_stats TO authenticated;
GRANT ALL ON public.geolocation_cache TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_geolocation_for_ip(INET) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_listener_session(TEXT, INET, TEXT, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_listener_activity(TEXT, INTEGER, BOOLEAN, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_listener_session(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_listener_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.aggregate_listener_stats(TEXT) TO authenticated;

-- Enable realtime for listener tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.listener_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.listener_stats;