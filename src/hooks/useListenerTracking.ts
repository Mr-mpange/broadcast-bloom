import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useGeolocationListeners } from "./useGeolocationListeners";

export const useListenerTracking = (liveShowId?: string) => {
  const { user } = useAuth();
  const {
    listenerStats,
    currentSession,
    startListenerSession,
    endListenerSession,
    updateListenerActivity,
    trackInteraction,
    isListening: isGeoListening,
    userLocation
  } = useGeolocationListeners();
  
  const [listenerCount, setListenerCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Update listener count from geolocation stats
  useEffect(() => {
    setListenerCount(listenerStats.total_listeners);
  }, [listenerStats.total_listeners]);

  // Sync with geolocation listening state
  useEffect(() => {
    setIsListening(isGeoListening);
    if (currentSession) {
      setSessionId(currentSession.id);
      sessionRef.current = currentSession.id;
    } else {
      setSessionId(null);
      sessionRef.current = null;
    }
  }, [isGeoListening, currentSession]);

  // Start listening session using geolocation system
  const startListening = async () => {
    if (isListening) return;

    try {
      const sessionUuid = await startListenerSession();
      
      if (sessionUuid) {
        // Also create a show-specific listener record if we have a live show
        if (liveShowId) {
          await supabase
            .from('listener_stats')
            .insert({
              show_id: liveShowId,
              country: userLocation?.country || 'Unknown',
              listener_count: 1,
              recorded_at: new Date().toISOString()
            });
        }
        
        // Start heartbeat for activity tracking
        startHeartbeat();
      }
    } catch (err) {
      console.error('Error starting listener session:', err);
    }
  };

  // End listening session using geolocation system
  const stopListening = async () => {
    if (!isListening) return;

    try {
      await endListenerSession();
      
      // Stop heartbeat
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    } catch (err) {
      console.error('Error ending listener session:', err);
    }
  };

  // Heartbeat to keep session alive and track activity
  const startHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    heartbeatRef.current = setInterval(async () => {
      if (sessionRef.current && isListening) {
        try {
          // Update activity in geolocation system
          await updateListenerActivity();
        } catch (err) {
          console.error('Heartbeat error:', err);
        }
      }
    }, 30 * 1000); // Every 30 seconds
  };

  // Track user interactions
  const recordInteraction = async (interactionType: string = 'general') => {
    if (isListening) {
      await trackInteraction(interactionType);
    }
  };

  // Subscribe to listener count changes from geolocation system
  useEffect(() => {
    if (!liveShowId) return;

    // Subscribe to listener stats changes
    const channel = supabase
      .channel(`listener_count_${liveShowId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listener_sessions',
        },
        () => {
          // Listener sessions changed, stats will be updated automatically
          // by the geolocation system
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveShowId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isListening) {
        // Page is hidden, but don't end session immediately
        // The geolocation system will handle session timeout
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
      } else if (!document.hidden && isListening) {
        // Page is visible again, resume heartbeat
        startHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isListening]);

  return {
    listenerCount,
    isListening,
    startListening,
    stopListening,
    recordInteraction,
    refreshCount: () => {}, // No longer needed, stats auto-refresh
    
    // Additional geolocation-based data
    userLocation,
    listenerStats,
    currentSession
  };
};