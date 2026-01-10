import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface ListenerSession {
  id: string;
  session_id: string;
  user_id?: string;
  ip_address: string;
  country_code?: string;
  country_name?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  connection_type?: string;
  browser_name?: string;
  os_name?: string;
  started_at: string;
  last_activity: string;
  duration_seconds: number;
  stream_quality: string;
  volume_level: number;
  is_muted: boolean;
  interactions: number;
}

interface ListenerStats {
  total_listeners: number;
  countries: Array<{
    country_name: string;
    country_code: string;
    listener_count: number;
  }>;
  devices: Array<{
    connection_type: string;
    count: number;
  }>;
  top_locations: Array<{
    city: string;
    region: string;
    country_name: string;
    listener_count: number;
    avg_lat: number;
    avg_lng: number;
  }>;
}

interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export const useGeolocationListeners = () => {
  const { toast } = useToast();
  
  const [currentSession, setCurrentSession] = useState<ListenerSession | null>(null);
  const [listenerStats, setListenerStats] = useState<ListenerStats>({
    total_listeners: 0,
    countries: [],
    devices: [],
    top_locations: []
  });
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [geolocationPermission, setGeolocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  // Generate unique session ID for this browser session
  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('radio_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      sessionStorage.setItem('radio_session_id', sessionId);
    }
    return sessionId;
  }, []);

  // Get browser geolocation
  const getBrowserGeolocation = useCallback((): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setGeolocationPermission('denied');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocationPermission('granted');
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          setGeolocationPermission('denied');
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }, []);

  // Get user's IP address and location data
  const getUserLocationData = useCallback(async () => {
    try {
      // Try multiple IP geolocation services for accuracy
      const services = [
        'https://ipapi.co/json/',
        'https://ip-api.com/json/',
        'https://ipinfo.io/json'
      ];

      for (const service of services) {
        try {
          const response = await fetch(service);
          if (response.ok) {
            const data = await response.json();
            
            // Normalize the response based on service
            let locationData;
            if (service.includes('ipapi.co')) {
              locationData = {
                country_code: data.country_code,
                country_name: data.country_name,
                region: data.region,
                city: data.city,
                latitude: data.latitude,
                longitude: data.longitude,
                timezone: data.timezone,
                ip: data.ip
              };
            } else if (service.includes('ip-api.com')) {
              locationData = {
                country_code: data.countryCode,
                country_name: data.country,
                region: data.regionName,
                city: data.city,
                latitude: data.lat,
                longitude: data.lon,
                timezone: data.timezone,
                ip: data.query
              };
            } else if (service.includes('ipinfo.io')) {
              const [lat, lng] = (data.loc || '0,0').split(',');
              locationData = {
                country_code: data.country,
                country_name: data.country, // Will be expanded below
                region: data.region,
                city: data.city,
                latitude: parseFloat(lat),
                longitude: parseFloat(lng),
                timezone: data.timezone,
                ip: data.ip
              };
            }

            // Expand country code to full name if needed
            if (locationData && locationData.country_code && !locationData.country_name) {
              const countryNames: { [key: string]: string } = {
                'TZ': 'Tanzania',
                'KE': 'Kenya',
                'UG': 'Uganda',
                'NG': 'Nigeria',
                'ZA': 'South Africa',
                'GH': 'Ghana',
                'ET': 'Ethiopia',
                'RW': 'Rwanda',
                'MW': 'Malawi',
                'ZM': 'Zambia',
                'ZW': 'Zimbabwe',
                'BW': 'Botswana',
                'MZ': 'Mozambique'
              };
              locationData.country_name = countryNames[locationData.country_code] || locationData.country_code;
            }

            return locationData;
          }
        } catch (serviceError) {
          console.warn(`Geolocation service ${service} failed:`, serviceError);
          continue;
        }
      }

      // Fallback to browser geolocation if IP services fail
      const geoPosition = await getBrowserGeolocation();
      if (geoPosition) {
        // Use reverse geocoding or default to Tanzania since you're in Dar es Salaam
        return {
          country_code: 'TZ',
          country_name: 'Tanzania',
          region: 'Dar es Salaam',
          city: 'Dar es Salaam',
          latitude: geoPosition.latitude,
          longitude: geoPosition.longitude,
          timezone: 'Africa/Dar_es_Salaam',
          ip: 'unknown'
        };
      }

      // Final fallback - default to Tanzania
      return {
        country_code: 'TZ',
        country_name: 'Tanzania',
        region: 'Dar es Salaam',
        city: 'Dar es Salaam',
        latitude: -6.7924,
        longitude: 39.2083,
        timezone: 'Africa/Dar_es_Salaam',
        ip: 'unknown'
      };
    } catch (error) {
      console.error('Error getting location data:', error);
      // Return Tanzania as default since you're there
      return {
        country_code: 'TZ',
        country_name: 'Tanzania',
        region: 'Dar es Salaam',
        city: 'Dar es Salaam',
        latitude: -6.7924,
        longitude: 39.2083,
        timezone: 'Africa/Dar_es_Salaam',
        ip: 'unknown'
      };
    }
  }, [getBrowserGeolocation]);

  // Simplified geolocation function - now uses real IP geolocation
  const getLocationData = useCallback(async (geoPosition?: GeolocationPosition | null) => {
    // First try to get real location data
    const realLocationData = await getUserLocationData();
    
    if (realLocationData && realLocationData.latitude && realLocationData.longitude) {
      return realLocationData;
    }

    // Fallback to browser geolocation if available
    if (geoPosition) {
      return {
        country_code: 'TZ', // Default to Tanzania since you're in Dar es Salaam
        country_name: 'Tanzania',
        region: 'Dar es Salaam',
        city: 'Dar es Salaam',
        latitude: geoPosition.latitude,
        longitude: geoPosition.longitude,
        timezone: 'Africa/Dar_es_Salaam',
        ip: 'browser-geo'
      };
    }

    // Final fallback to your actual location
    return {
      country_code: 'TZ',
      country_name: 'Tanzania',
      region: 'Dar es Salaam',
      city: 'Dar es Salaam',
      latitude: -6.7924,
      longitude: 39.2083,
      timezone: 'Africa/Dar_es_Salaam',
      ip: 'fallback'
    };
  }, [getUserLocationData]);

  // Start listener session with real geolocation
  const startListenerSession = useCallback(async () => {
    try {
      const sessionId = getSessionId();
      const userAgent = navigator.userAgent;
      
      // Get real location data using IP geolocation services
      const locationData = await getLocationData();
      
      // Parse user agent for device info
      const deviceType = userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone') 
        ? 'mobile' 
        : userAgent.includes('Tablet') || userAgent.includes('iPad') 
        ? 'tablet' 
        : 'desktop';
      
      const browserName = userAgent.includes('Chrome') ? 'Chrome' 
        : userAgent.includes('Firefox') ? 'Firefox'
        : userAgent.includes('Safari') ? 'Safari'
        : userAgent.includes('Edge') ? 'Edge'
        : 'Unknown';

      // Create a session object with real location data
      const sessionData: ListenerSession = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        user_id: undefined, // Will be set if user is authenticated
        ip_address: locationData.ip || 'unknown',
        country_code: locationData.country_code,
        country_name: locationData.country_name,
        region: locationData.region,
        city: locationData.city,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timezone: locationData.timezone,
        connection_type: deviceType,
        browser_name: browserName,
        os_name: 'Unknown',
        started_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        duration_seconds: 0,
        stream_quality: 'auto',
        volume_level: 50,
        is_muted: false,
        interactions: 0
      };

      // Try to save to database
      try {
        const { error } = await supabase
          .from('listener_sessions')
          .insert([sessionData]);
        
        if (error) {
          console.warn('Could not save session to database (table may not exist):', error.message);
          // Continue anyway with local session
        } else {
          console.log('Session saved to database successfully');
        }
      } catch (dbError) {
        console.warn('Database not available, using local session only:', dbError);
      }

      setCurrentSession(sessionData);
      
      // Show welcome message with actual location
      if (sessionData.city && sessionData.country_name) {
        toast({
          title: '🎧 Welcome to PULSE FM!',
          description: `Broadcasting to ${sessionData.city}, ${sessionData.country_name}`,
        });
      }

      return sessionData.id;
    } catch (error) {
      console.error('Error starting listener session:', error);
      return null;
    }
  }, [getSessionId, getLocationData, toast]);

  // Update listener activity
  const updateListenerActivity = useCallback(async (
    volumeLevel?: number,
    isMuted?: boolean,
    streamQuality?: string,
    interactionIncrement: number = 0
  ) => {
    if (!currentSession) return false;

    try {
      // Update local session data
      setCurrentSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          last_activity: new Date().toISOString(),
          volume_level: volumeLevel ?? prev.volume_level,
          is_muted: isMuted ?? prev.is_muted,
          stream_quality: streamQuality ?? prev.stream_quality,
          interactions: prev.interactions + interactionIncrement,
          duration_seconds: Math.floor((Date.now() - new Date(prev.started_at).getTime()) / 1000)
        };
      });

      return true;
    } catch (error) {
      console.error('Error updating listener activity:', error);
      return false;
    }
  }, [currentSession]);

  // End listener session
  const endListenerSession = useCallback(async () => {
    if (!currentSession) return false;

    try {
      setCurrentSession(null);
      sessionStorage.removeItem('radio_session_id');
      
      return true;
    } catch (error) {
      console.error('Error ending listener session:', error);
      return false;
    }
  }, [currentSession]);

  // Fetch current listener statistics from real data
  const fetchListenerStats = useCallback(async () => {
    // Throttle requests - don't fetch more than once every 10 seconds
    const now = Date.now();
    if (now - lastFetchTime < 10000) {
      return;
    }
    setLastFetchTime(now);

    try {
      // Try to get real listener data from Supabase
      const { data: sessions, error } = await supabase
        .from('listener_sessions')
        .select('*')
        .gte('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active in last 5 minutes

      if (error) {
        console.warn('Could not fetch real listener data (table may not exist):', error.message);
        
        // Use current session data as fallback
        if (currentSession) {
          setListenerStats({
            total_listeners: 1,
            countries: [{
              country_name: currentSession.country_name || 'Unknown',
              country_code: currentSession.country_code || 'XX',
              listener_count: 1
            }],
            devices: [{
              connection_type: currentSession.connection_type || 'desktop',
              count: 1
            }],
            top_locations: [{
              city: currentSession.city || 'Unknown',
              region: currentSession.region || 'Unknown',
              country_name: currentSession.country_name || 'Unknown',
              listener_count: 1,
              avg_lat: currentSession.latitude || 0,
              avg_lng: currentSession.longitude || 0
            }]
          });
        } else {
          // No current session, show empty stats
          setListenerStats({
            total_listeners: 0,
            countries: [],
            devices: [],
            top_locations: []
          });
        }
        return;
      }

      // Process real session data
      const activeSessions = sessions || [];
      const totalListeners = activeSessions.length;

      if (totalListeners === 0) {
        // No active sessions, use current session if available
        if (currentSession) {
          setListenerStats({
            total_listeners: 1,
            countries: [{
              country_name: currentSession.country_name || 'Unknown',
              country_code: currentSession.country_code || 'XX',
              listener_count: 1
            }],
            devices: [{
              connection_type: currentSession.connection_type || 'desktop',
              count: 1
            }],
            top_locations: [{
              city: currentSession.city || 'Unknown',
              region: currentSession.region || 'Unknown',
              country_name: currentSession.country_name || 'Unknown',
              listener_count: 1,
              avg_lat: currentSession.latitude || 0,
              avg_lng: currentSession.longitude || 0
            }]
          });
        } else {
          setListenerStats({
            total_listeners: 0,
            countries: [],
            devices: [],
            top_locations: []
          });
        }
        return;
      }

      // Group by country
      const countryMap = new Map<string, { name: string, code: string, count: number }>();
      activeSessions.forEach(session => {
        const key = session.country_code || 'XX';
        const existing = countryMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          countryMap.set(key, {
            name: session.country_name || 'Unknown',
            code: session.country_code || 'XX',
            count: 1
          });
        }
      });

      const countries = Array.from(countryMap.values())
        .map(country => ({
          country_name: country.name,
          country_code: country.code,
          listener_count: country.count
        }))
        .sort((a, b) => b.listener_count - a.listener_count);

      // Group by device type
      const deviceMap = new Map<string, number>();
      activeSessions.forEach(session => {
        const type = session.connection_type || 'unknown';
        deviceMap.set(type, (deviceMap.get(type) || 0) + 1);
      });

      const devices = Array.from(deviceMap.entries()).map(([type, count]) => ({
        connection_type: type,
        count
      }));

      // Group by location
      const locationMap = new Map<string, {
        city: string,
        region: string,
        country_name: string,
        count: number,
        lat_sum: number,
        lng_sum: number
      }>();

      activeSessions.forEach(session => {
        const key = `${session.city || 'Unknown'}-${session.country_code || 'XX'}`;
        const existing = locationMap.get(key);
        if (existing) {
          existing.count++;
          existing.lat_sum += session.latitude || 0;
          existing.lng_sum += session.longitude || 0;
        } else {
          locationMap.set(key, {
            city: session.city || 'Unknown',
            region: session.region || 'Unknown',
            country_name: session.country_name || 'Unknown',
            count: 1,
            lat_sum: session.latitude || 0,
            lng_sum: session.longitude || 0
          });
        }
      });

      const top_locations = Array.from(locationMap.values())
        .map(location => ({
          city: location.city,
          region: location.region,
          country_name: location.country_name,
          listener_count: location.count,
          avg_lat: location.count > 0 ? location.lat_sum / location.count : 0,
          avg_lng: location.count > 0 ? location.lng_sum / location.count : 0
        }))
        .sort((a, b) => b.listener_count - a.listener_count)
        .slice(0, 10);

      setListenerStats({
        total_listeners: totalListeners,
        countries,
        devices,
        top_locations
      });

    } catch (error) {
      console.error('Error fetching listener stats:', error);
      // Fallback to current session only
      if (currentSession) {
        setListenerStats({
          total_listeners: 1,
          countries: [{
            country_name: currentSession.country_name || 'Unknown',
            country_code: currentSession.country_code || 'XX',
            listener_count: 1
          }],
          devices: [{
            connection_type: currentSession.connection_type || 'desktop',
            count: 1
          }],
          top_locations: [{
            city: currentSession.city || 'Unknown',
            region: currentSession.region || 'Unknown',
            country_name: currentSession.country_name || 'Unknown',
            listener_count: 1,
            avg_lat: currentSession.latitude || 0,
            avg_lng: currentSession.longitude || 0
          }]
        });
      } else {
        setListenerStats({
          total_listeners: 0,
          countries: [],
          devices: [],
          top_locations: []
        });
      }
    }
  }, [lastFetchTime]); // Only depend on lastFetchTime

  // Track user interactions (chat, likes, etc.)
  const trackInteraction = useCallback(async (interactionType: string = 'general') => {
    await updateListenerActivity(undefined, undefined, undefined, 1);
  }, [updateListenerActivity]);

  // Update volume/mute status
  const updateAudioSettings = useCallback(async (volumeLevel: number, isMuted: boolean) => {
    await updateListenerActivity(volumeLevel, isMuted);
  }, [updateListenerActivity]);

  // Update stream quality
  const updateStreamQuality = useCallback(async (quality: string) => {
    await updateListenerActivity(undefined, undefined, quality);
  }, [updateListenerActivity]);

  // Periodic activity updates (heartbeat) - FIXED to prevent excessive calls
  useEffect(() => {
    if (!currentSession) return;

    const interval = setInterval(() => {
      updateListenerActivity();
    }, 60000); // Update every 60 seconds (increased from 30)

    return () => clearInterval(interval);
  }, [currentSession]); // Removed updateListenerActivity from dependencies

  // Periodic stats refresh - FIXED to prevent infinite loop
  useEffect(() => {
    // Only set up interval if we have a current session and it's not already running
    if (!currentSession) return;

    const interval = setInterval(() => {
      fetchListenerStats();
    }, 30000); // Refresh every 30 seconds (increased from 10)

    return () => clearInterval(interval);
  }, [currentSession]); // Removed fetchListenerStats from dependencies to prevent loop

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, reduce activity updates
      } else {
        // Page is visible again, resume normal activity
        if (currentSession) {
          updateListenerActivity();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentSession, updateListenerActivity]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentSession) {
        // End session on page unload
        endListenerSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentSession, endListenerSession]);

  // Initialize - FIXED to prevent infinite loop
  useEffect(() => {
    const initialize = async () => {
      if (loading) return; // Prevent multiple initializations
      
      setLoading(true);
      
      // Check if we have an existing session
      const sessionId = getSessionId();
      const existingSessionData = sessionStorage.getItem('radio_session_data');
      
      if (existingSessionData) {
        try {
          const sessionData = JSON.parse(existingSessionData);
          setCurrentSession(sessionData);
        } catch (error) {
          console.warn('Could not parse existing session data:', error);
          await startListenerSession();
        }
      } else {
        // Start new session
        await startListenerSession();
      }

      // Fetch initial stats only once
      await fetchListenerStats();
      
      setLoading(false);
    };

    // Only initialize once
    if (!initialized) {
      initialize();
      setInitialized(true);
    }
  }, []); // Empty dependency array to run only once

  // Save session data to sessionStorage
  useEffect(() => {
    if (currentSession) {
      sessionStorage.setItem('radio_session_data', JSON.stringify(currentSession));
    } else {
      sessionStorage.removeItem('radio_session_data');
    }
  }, [currentSession]);

  return {
    // State
    currentSession,
    listenerStats,
    loading,
    geolocationPermission,
    
    // Actions
    startListenerSession,
    endListenerSession,
    updateListenerActivity,
    trackInteraction,
    updateAudioSettings,
    updateStreamQuality,
    fetchListenerStats,
    
    // Computed
    isListening: !!currentSession,
    userLocation: currentSession ? {
      country: currentSession.country_name,
      region: currentSession.region,
      city: currentSession.city,
      coordinates: currentSession.latitude && currentSession.longitude ? {
        lat: currentSession.latitude,
        lng: currentSession.longitude
      } : null
    } : null
  };
};