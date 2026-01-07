import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface ListenerSession {
  id: string;
  live_show_id: string;
  started_at: string;
  is_active: boolean;
}

export const useListenerTracking = (liveShowId?: string) => {
  const { user } = useAuth();
  const [listenerCount, setListenerCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Generate session ID for anonymous users
  const getSessionId = () => {
    if (user) return null; // Authenticated users don't need session ID
    
    let storedSessionId = localStorage.getItem('pulse_fm_session_id');
    if (!storedSessionId) {
      storedSessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('pulse_fm_session_id', storedSessionId);
    }
    return storedSessionId;
  };

  // Fetch current listener count
  const fetchListenerCount = async () => {
    if (!liveShowId) return;

    try {
      const { data, error } = await supabase.rpc('get_listener_count', {
        p_live_show_id: liveShowId
      });

      if (!error && typeof data === 'number') {
        setListenerCount(data);
      }
    } catch (err) {
      console.error('Error fetching listener count:', err);
    }
  };

  // Start listening session
  const startListening = async () => {
    if (!liveShowId || isListening) return;

    try {
      const sessionIdToUse = getSessionId();
      const userAgent = navigator.userAgent;

      const { data, error } = await supabase.rpc('start_listener_session', {
        p_live_show_id: liveShowId,
        p_session_id: sessionIdToUse,
        p_user_agent: userAgent
      });

      if (!error && data) {
        setSessionId(data);
        sessionRef.current = data;
        setIsListening(true);
        
        // Start heartbeat to keep session alive
        startHeartbeat();
        
        // Update listener count
        fetchListenerCount();
      }
    } catch (err) {
      console.error('Error starting listener session:', err);
    }
  };

  // End listening session
  const stopListening = async () => {
    if (!sessionRef.current || !isListening) return;

    try {
      await supabase.rpc('end_listener_session', {
        p_session_id: sessionRef.current
      });

      setIsListening(false);
      setSessionId(null);
      sessionRef.current = null;
      
      // Stop heartbeat
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      
      // Update listener count
      fetchListenerCount();
    } catch (err) {
      console.error('Error ending listener session:', err);
    }
  };

  // Heartbeat to keep session alive
  const startHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    heartbeatRef.current = setInterval(async () => {
      if (sessionRef.current && liveShowId) {
        try {
          // Restart session to update timestamp
          await supabase.rpc('start_listener_session', {
            p_live_show_id: liveShowId,
            p_session_id: getSessionId(),
            p_user_agent: navigator.userAgent
          });
        } catch (err) {
          console.error('Heartbeat error:', err);
        }
      }
    }, 2 * 60 * 1000); // Every 2 minutes
  };

  // Subscribe to listener count changes
  useEffect(() => {
    if (!liveShowId) return;

    fetchListenerCount();

    // Subscribe to listener session changes
    const channel = supabase
      .channel(`listener_count_${liveShowId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listener_sessions',
          filter: `live_show_id=eq.${liveShowId}`
        },
        () => {
          // Debounce the count update
          setTimeout(fetchListenerCount, 500);
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
      if (sessionRef.current) {
        // End session on cleanup
        supabase.rpc('end_listener_session', {
          p_session_id: sessionRef.current
        });
      }
    };
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isListening) {
        // Page is hidden, end session
        stopListening();
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
    refreshCount: fetchListenerCount
  };
};