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
  is_live?: boolean; // We'll simulate this
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
    // Since there's no live_shows table, we'll fetch shows and simulate live status
    const { data, error } = await supabase
      .from('shows')
      .select('*')
      .limit(5); // Get some shows as placeholders

    if (!error && data) {
      // Simulate some shows being live
      const liveShows = data.map((show, index) => ({
        ...show,
        is_live: index < 2 // First 2 shows are "live"
      })).filter(show => show.is_live);
      
      setLiveShows(liveShows);
    }
    setLoading(false);
  };

  const subscribeToLiveShows = () => {
    const channel = supabase
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
      supabase.removeChannel(channel);
    };
  };

  const startLiveShow = async (showId: string) => {
    try {
      // Simulate starting a live show
      // In a real app, you'd update a live_status field or create a live_shows record
      toast({
        title: "Show is now live!",
        description: "Listeners will be notified about your live broadcast."
      });

      // Update local state to show as live
      setLiveShows(prev => {
        const show = prev.find(s => s.id === showId);
        if (show) {
          return [{ ...show, is_live: true }, ...prev.filter(s => s.id !== showId)];
        }
        return prev;
      });

      return { data: showId };
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
      // Simulate ending a live show
      toast({
        title: "Show ended",
        description: "Your live broadcast has ended."
      });

      // Remove from live shows
      setLiveShows(prev => prev.filter(show => show.id !== showId));

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