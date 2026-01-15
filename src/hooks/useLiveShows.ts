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

  // Fetch live shows on mount and subscribe to real-time updates
  useEffect(() => {
    fetchLiveShows();
    const unsubscribe = subscribeToLiveShows();
    
    // Poll every 30 seconds as backup
    const interval = setInterval(fetchLiveShows, 30000);
    
    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, []);

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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create a broadcast session in the database
      const { data: session, error: sessionError } = await supabase
        .from('broadcast_sessions' as any)
        .insert({
          broadcaster_id: user.id,
          status: 'active',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Fetch will be triggered by subscription
      await fetchLiveShows();

      toast({
        title: "Show is now live!",
        description: "Listeners will be notified about your live broadcast."
      });

      return { data: showId };
    } catch (err: any) {
      console.error('Error starting live show:', err);
      toast({
        title: "Failed to start live show",
        description: err.message || "An unexpected error occurred",
        variant: "destructive"
      });
      return { error: err };
    }
  };

  const endLiveShow = async (showId: string) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // End all active broadcast sessions for this user
      const { error: updateError } = await supabase
        .from('broadcast_sessions' as any)
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('broadcaster_id', user.id)
        .eq('status', 'active');

      if (updateError) throw updateError;

      // Fetch will be triggered by subscription
      await fetchLiveShows();

      toast({
        title: "Show ended",
        description: "Your live broadcast has ended."
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error ending live show:', err);
      toast({
        title: "Failed to end live show",
        description: err.message || "An unexpected error occurred",
        variant: "destructive"
      });
      return { error: err };
    }
  };

  const clearAllLiveShows = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // End all active sessions for this user
      const { error } = await supabase
        .from('broadcast_sessions' as any)
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('broadcaster_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      await fetchLiveShows();

      toast({
        title: "All shows ended",
        description: "All live broadcasts have been stopped."
      });
    } catch (err: any) {
      console.error('Error clearing live shows:', err);
      toast({
        title: "Failed to end shows",
        description: err.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
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