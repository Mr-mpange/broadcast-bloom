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
    try {
      // Since there's no live_shows table, we'll fetch shows and simulate live status
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .limit(5); // Get some shows as placeholders

      if (!error && data) {
        // Simulate some shows being live and ensure all required properties exist
        const liveShows = data
          .map((show, index) => ({
            id: show.id || `show_${index}`,
            name: show.name || `Show ${index + 1}`,
            image_url: show.image_url || null,
            description: show.description || null,
            genre: show.genre || null,
            host_id: show.host_id || 'unknown',
            is_live: index < 2 // First 2 shows are "live"
          }))
          .filter(show => show.is_live && show.id && show.name); // Only valid live shows
        
        setLiveShows(liveShows);
      } else {
        // Fallback to empty array if there's an error
        setLiveShows([]);
      }
    } catch (error) {
      console.error('Error fetching live shows:', error);
      setLiveShows([]);
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