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
      // Check if we have saved live shows first
      const savedLiveShows = localStorage.getItem('pulse_fm_live_shows');
      if (savedLiveShows) {
        try {
          const parsed = JSON.parse(savedLiveShows);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLiveShows(parsed);
            setLoading(false);
            return; // Use saved data, don't simulate
          }
        } catch (error) {
          console.error('Error parsing saved live shows:', error);
        }
      }

      // Only simulate if no saved live shows exist
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .limit(5);

      if (!error && data) {
        // Don't automatically mark shows as live - start with empty state
        setLiveShows([]);
      } else {
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