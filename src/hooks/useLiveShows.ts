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
    const { data, error } = await supabase
      .from('live_shows')
      .insert({
        show_id: showId,
        is_live: true
      })
      .select(`
        *,
        shows (
          name,
          image_url
        )
      `)
      .single();

    if (error) {
      toast({
        title: "Failed to start live show",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }

    toast({
      title: "Show is now live!",
      description: "Listeners will be notified about your live broadcast."
    });

    return { data };
  };

  const endLiveShow = async (liveShowId: string) => {
    const { error } = await supabase
      .from('live_shows')
      .update({
        ended_at: new Date().toISOString(),
        is_live: false
      })
      .eq('id', liveShowId);

    if (error) {
      toast({
        title: "Failed to end live show",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }

    toast({
      title: "Show ended",
      description: "Your live broadcast has ended."
    });

    return { success: true };
  };

  return {
    liveShows,
    loading,
    startLiveShow,
    endLiveShow,
    refetch: fetchLiveShows
  };
};