import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LiveShow {
  id: string;
  name: string;
  image_url: string | null;
  description: string | null;
  genre: string | null;
  host_id: string;
  is_live?: boolean;
  session_id?: string;
  host?: {
    display_name: string;
  };
}

export const useLiveShows = () => {
  const [liveShows, setLiveShows] = useState<LiveShow[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load live shows from localStorage on mount
  useEffect(() => {
    const savedLiveShows = localStorage.getItem('pulse_fm_live_shows');
    if (savedLiveShows) {
      try {
        const parsed = JSON.parse(savedLiveShows);
        setLiveShows(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error('Error loading saved live shows:', error);
        setLiveShows([]);
      }
    }
    
    fetchLiveShows();
    subscribeToLiveShows();
  }, []);

  // Save live shows to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pulse_fm_live_shows', JSON.stringify(liveShows));
  }, [liveShows]);

  const fetchLiveShows = async () => {
    setLoading(true);
    try {
      // First, check for active broadcast sessions
      const { data: activeSessions, error: sessionsError } = await supabase
        .from('broadcast_sessions' as any)
        .select(`
          id,
          broadcaster_id,
          status,
          started_at
        `)
        .eq('status', 'active');

      if (!sessionsError && activeSessions && activeSessions.length > 0) {
        // Get profiles for active broadcasters
        const broadcasterIds = (activeSessions as any[]).map((session: any) => session.broadcaster_id);
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, user_id, display_name')
          .in('user_id', broadcasterIds);

        if (!profilesError && profiles) {
          // Get shows for active broadcasters
          const profileIds = profiles.map(p => p.id);
          
          const { data: shows, error: showsError } = await supabase
            .from('shows')
            .select('*')
            .in('host_id', profileIds);

          if (!showsError) {
            // Create live shows from active sessions
            const liveShowsData = (activeSessions as any[]).map((session: any) => {
              const profile = profiles.find(p => p.user_id === session.broadcaster_id);
              const show = shows?.find(s => s.host_id === profile?.id);
              
              return {
                id: show?.id || `session_${session.id}`,
                name: show?.name || `Live with ${profile?.display_name || 'DJ'}`,
                image_url: show?.image_url || null,
                description: show?.description || null,
                genre: show?.genre || null,
                host_id: profile?.id || session.broadcaster_id,
                is_live: true,
                session_id: session.id,
                host: {
                  display_name: profile?.display_name || 'DJ'
                }
              };
            });

            setLiveShows(liveShowsData);
            setLoading(false);
            return;
          }
        }
      }

      // If no active sessions, clear live shows
      setLiveShows([]);
    } catch (error) {
      console.error('Error fetching live shows:', error);
      setLiveShows([]);
    }
    setLoading(false);
  };

  const subscribeToLiveShows = () => {
    // Subscribe to broadcast sessions changes
    const sessionsChannel = supabase
      .channel('broadcast_sessions_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'broadcast_sessions'
        },
        () => {
          fetchLiveShows(); // Refetch when broadcast sessions change
        }
      )
      .subscribe();

    // Also subscribe to shows changes
    const showsChannel = supabase
      .channel('shows_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shows'
        },
        () => {
          fetchLiveShows(); // Refetch when shows change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(showsChannel);
    };
  };

  const startLiveShow = async (showId: string) => {
    try {
      // Simulate starting a live show
      // In a real app, you'd update a live_status field or create a live_shows record
      
      // Find the show to start
      const { data: showData } = await supabase
        .from('shows')
        .select('*')
        .eq('id', showId)
        .single();

      if (showData) {
        const newLiveShow = {
          id: showData.id,
          name: showData.name || 'Unknown Show',
          image_url: showData.image_url || null,
          description: showData.description || null,
          genre: showData.genre || null,
          host_id: showData.host_id || 'unknown',
          is_live: true
        };

        // Update local state to show as live
        setLiveShows(prev => {
          // Remove if already exists, then add to beginning
          const filtered = prev.filter(s => s.id !== showId);
          return [newLiveShow, ...filtered];
        });

        toast({
          title: "Show is now live!",
          description: "Listeners will be notified about your live broadcast."
        });

        return { data: showId };
      } else {
        throw new Error('Show not found');
      }
    } catch (err: any) {
      console.error('Unexpected error starting live show:', err);
      toast({
        title: "Failed to start live show",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return { error: err };
    }
  };

  const endLiveShow = async (showId: string) => {
    try {
      // Remove from live shows immediately
      setLiveShows(prev => {
        const updated = prev.filter(show => show.id !== showId);
        // Also update localStorage immediately
        localStorage.setItem('pulse_fm_live_shows', JSON.stringify(updated));
        return updated;
      });

      toast({
        title: "Show ended",
        description: "Your live broadcast has ended."
      });

      return { success: true };
    } catch (err: any) {
      console.error('Unexpected error ending live show:', err);
      toast({
        title: "Failed to end live show",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return { error: err };
    }
  };

  const clearAllLiveShows = () => {
    setLiveShows([]);
    localStorage.removeItem('pulse_fm_live_shows');
    toast({
      title: "All shows ended",
      description: "All live broadcasts have been stopped."
    });
  };

  return {
    liveShows,
    loading,
    startLiveShow,
    endLiveShow,
    clearAllLiveShows,
    refetch: fetchLiveShows
  };
};