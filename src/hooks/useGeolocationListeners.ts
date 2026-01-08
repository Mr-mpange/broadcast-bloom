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

  // Get user's IP address (simplified - in production use a proper service)
  const getUserIP = useCallback(async (): Promise<string> => {
    try {
      // For development, we'll use a placeholder IP
      // In production, you would use a service like ipify.org
      return '127.0.0.1';
    } catch (error) {
      console.warn('Could not get IP address:', error);
      return '127.0.0.1';
    }
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

  // Simplified geolocation function
  const getLocationData = useCallback(async (geoPosition?: GeolocationPosition | null) => {
    // For now, return default African location data
    // In production, this would call a real geolocation service
    const defaultLocations = [
      { country_code: 'KE', country_name: 'Kenya', region: 'Nairobi', city: 'Nairobi', lat: -1.2921, lng: 36.8219 },
      { country_code: 'NG', country_name: 'Nigeria', region: 'Lagos', city: 'Lagos', lat: 6.5244, lng: 3.3792 },
      { country_code: 'ZA', country_name: 'South Africa', region: 'Western Cape', city: 'Cape Town', lat: -33.9249, lng: 18.4241 },
      { country_code: 'GH', country_name: 'Ghana', region: 'Greater Accra', city: 'Accra', lat: 5.6037, lng: -0.1870 },
      { country_code: 'TZ', country_name: 'Tanzania', region: 'Dar es Salaam', city: 'Dar es Salaam', lat: -6.7924, lng: 39.2083 },
      { country_code: 'UG', country_name: 'Uganda', region: 'Central', city: 'Kampala', lat: 0.3476, lng: 32.5825 }
    ];
    
    const randomLocation = defaultLocations[Math.floor(Math.random() * defaultLocations.length)];
    
    return {
      country_code: randomLocation.country_code,
      country_name: randomLocation.country_name,
      region: randomLocation.region,
      city: randomLocation.city,
      latitude: geoPosition?.latitude || randomLocation.lat,
      longitude: geoPosition?.longitude || randomLocation.lng,
      timezone: 'Africa/Nairobi'
    };
  }, []);

  // Start listener session with geolocation
  const startListenerSession = useCallback(async () => {
    try {
      const sessionId = getSessionId();
      const ipAddress = await getUserIP();
      const userAgent = navigator.userAgent;
      
      // Try to get browser geolocation
      const geoPosition = await getBrowserGeolocation();
      const locationData = await getLocationData(geoPosition);
      
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

      // Create a simplified session object
      const sessionData: ListenerSession = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        user_id: undefined, // Will be set if user is authenticated
        ip_address: ipAddress,
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

      setCurrentSession(sessionData);
      
      // Show welcome message with location (if available)
      if (sessionData.city && sessionData.country_name) {
        toast({
          title: 'Welcome to the broadcast!',
          description: `Listening from ${sessionData.city}, ${sessionData.country_name}`,
        });
      }

      return sessionData.id;
    } catch (error) {
      console.error('Error starting listener session:', error);
      return null;
    }
  }, [getSessionId, getUserIP, getBrowserGeolocation, getLocationData, toast]);

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

  // Fetch current listener statistics (simplified)
  const fetchListenerStats = useCallback(async () => {
    try {
      // Generate realistic but simulated statistics
      const totalListeners = Math.floor(Math.random() * 150) + 50; // 50-200 listeners
      
      const countries = [
        { country_name: 'Kenya', country_code: 'KE', listener_count: Math.floor(totalListeners * 0.3) },
        { country_name: 'Nigeria', country_code: 'NG', listener_count: Math.floor(totalListeners * 0.25) },
        { country_name: 'South Africa', country_code: 'ZA', listener_count: Math.floor(totalListeners * 0.2) },
        { country_name: 'Ghana', country_code: 'GH', listener_count: Math.floor(totalListeners * 0.15) },
        { country_name: 'Tanzania', country_code: 'TZ', listener_count: Math.floor(totalListeners * 0.1) }
      ];

      const devices = [
        { connection_type: 'mobile', count: Math.floor(totalListeners * 0.6) },
        { connection_type: 'desktop', count: Math.floor(totalListeners * 0.3) },
        { connection_type: 'tablet', count: Math.floor(totalListeners * 0.1) }
      ];

      const top_locations = [
        { city: 'Nairobi', region: 'Nairobi', country_name: 'Kenya', listener_count: Math.floor(totalListeners * 0.2), avg_lat: -1.2921, avg_lng: 36.8219 },
        { city: 'Lagos', region: 'Lagos', country_name: 'Nigeria', listener_count: Math.floor(totalListeners * 0.18), avg_lat: 6.5244, avg_lng: 3.3792 },
        { city: 'Cape Town', region: 'Western Cape', country_name: 'South Africa', listener_count: Math.floor(totalListeners * 0.15), avg_lat: -33.9249, avg_lng: 18.4241 },
        { city: 'Accra', region: 'Greater Accra', country_name: 'Ghana', listener_count: Math.floor(totalListeners * 0.12), avg_lat: 5.6037, avg_lng: -0.1870 },
        { city: 'Dar es Salaam', region: 'Dar es Salaam', country_name: 'Tanzania', listener_count: Math.floor(totalListeners * 0.1), avg_lat: -6.7924, avg_lng: 39.2083 }
      ];

      setListenerStats({
        total_listeners: totalListeners,
        countries,
        devices,
        top_locations
      });
    } catch (error) {
      console.error('Error fetching listener stats:', error);
    }
  }, []);

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

  // Periodic activity updates (heartbeat)
  useEffect(() => {
    if (!currentSession) return;

    const interval = setInterval(() => {
      updateListenerActivity();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [currentSession, updateListenerActivity]);

  // Periodic stats refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchListenerStats();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [fetchListenerStats]);

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

  // Initialize
  useEffect(() => {
    const initialize = async () => {
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

      // Fetch initial stats
      await fetchListenerStats();
      
      setLoading(false);
    };

    initialize();
  }, [getSessionId, startListenerSession, fetchListenerStats]);

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