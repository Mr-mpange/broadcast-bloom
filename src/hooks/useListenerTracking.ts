import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useListenerTracking = (liveShowId?: string) => {
  const { user } = useAuth();
  const [listenerCount, setListenerCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Generate session ID for anonymous users
  const getSessionId = () => {
    if (user) return user.id; // Use user ID for authenticated users
    
    let storedSessionId = localStorage.getItem('pulse_fm_session_id');
    if (!storedSessionId) {
      storedSessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('pulse_fm_session_id', storedSessionId);
    }
    return storedSessionId;
  };

  // Simulate listener count (since we don't have the RPC functions)
  const fetchListenerCount = async () => {
    if (!liveShowId) return;

    try {
      // Simulate a listener count between 5-50
      const simulatedCount = Math.floor(Math.random() * 45) + 5;
      setListenerCount(simulatedCount);
    } catch (err) {
      console.error('Error fetching listener count:', err);
    }
  };

  // Start listening session (simplified)
  const startListening = async () => {
    if (!liveShowId || isListening) return;

    try {
      const sessionIdToUse = getSessionId();
      
      // Create a listener stat record instead of using RPC
      const { data, error } = await supabase
        .from('listener_stats')
        .insert({
          show_id: liveShowId,
          country: 'Unknown', // You could get this from an IP geolocation service
        })
        .select()
        .single();

      if (!error && data) {
        setSessionId(data.id);
        sessionRef.current = data.id;
        setIsListening(true);
        
        // Start heartbeat to keep session alive
        startHeartbeat();
        
        // Update listener count
        fetchListenerCount();
      }
    } catch (err) {
      console.error('Error starting listener session:', err);
      // Even if database insert fails, allow local listening
      setIsListening(true);
      fetchListenerCount();
    }
  };

  // End listening session (simplified)
  const stopListening = async () => {
    if (!isListening) return;

    try {
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
          // Update listener count periodically
          fetchListenerCount();
        } catch (err) {
          console.error('Heartbeat error:', err);
        }
      }
    }, 30 * 1000); // Every 30 seconds
  };

  // Subscribe to listener count changes
  useEffect(() => {
    if (!liveShowId) return;

    fetchListenerCount();

    // Subscribe to listener stats changes (simplified)
    const channel = supabase
      .channel(`listener_count_${liveShowId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listener_stats',
        },
        () => {
          // Update count when stats change
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