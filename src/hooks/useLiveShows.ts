import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LiveShow {
  id: string;
  show_id: string;
  started_at: string;
  ended_at: string | null;
  is_live: boolean;
  shows: {
    name: string;
    image_url: string | null;
  };
}

export const useLiveShows = () => {
  const [liveShows, setLiveShows] = useState<LiveShow[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLiveShows();
    subscribeToLiveShows();
  }, []);

  const fetchLiveShows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('live_shows')
      .select(`
        *,
        shows (
          name,
          image_url
        )
      `)
      .eq('is_live', true)
      .order('started_at', { ascending: false });

    if (!error && data) {
      setLiveShows(data);
    }
    setLoading(false);
  };

  const subscribeToLiveShows = () => {
    const channel = supabase
      .channel('live_shows')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_shows'
        },
        (payload) => {
          const newLiveShow = payload.new as LiveShow;
          if (newLiveShow.is_live) {
            setLiveShows(prev => [newLiveShow, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_shows'
        },
        (payload) => {
          const updatedShow = payload.new as LiveShow;
          setLiveShows(prev =>
            prev.map(show =>
              show.id === updatedShow.id ? updatedShow : show
            ).filter(show => show.is_live)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const startLiveShow = async (showId: string) => {
    try {
      // Use the database function to properly start live show
      const { data, error } = await supabase.rpc('start_live_show', {
        p_show_id: showId
      });

      if (error) {
        console.error('Error starting live show:', error);
        toast({
          title: "Failed to start live show",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      // Fetch the created live show with show details
      const { data: liveShowData, error: fetchError } = await supabase
        .from('live_shows')
        .select(`
          *,
          shows (
            name,
            image_url
          )
        `)
        .eq('id', data)
        .single();

      if (fetchError) {
        console.error('Error fetching live show data:', fetchError);
        toast({
          title: "Show started but failed to load details",
          description: "Please refresh the page",
          variant: "destructive"
        });
        return { error: fetchError };
      }

      toast({
        title: "Show is now live!",
        description: "Listeners will be notified about your live broadcast."
      });

      // Manually add to state to ensure immediate UI update
      setLiveShows(prev => {
        const filtered = prev.filter(show => show.show_id !== showId);
        return [liveShowData, ...filtered];
      });

      return { data: liveShowData };
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

  const endLiveShow = async (liveShowId: string) => {
    try {
      const { data, error } = await supabase.rpc('end_live_show', {
        p_live_show_id: liveShowId
      });

      if (error) {
        console.error('Error ending live show:', error);
        toast({
          title: "Failed to end live show",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      if (!data) {
        toast({
          title: "Show was not live",
          description: "The show may have already ended",
          variant: "destructive"
        });
        return { error: "Show was not live" };
      }

      toast({
        title: "Show ended",
        description: "Your live broadcast has ended."
      });

      // Remove from state immediately
      setLiveShows(prev => prev.filter(show => show.id !== liveShowId));

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

  return {
    liveShows,
    loading,
    startLiveShow,
    endLiveShow,
    refetch: fetchLiveShows
  };
};