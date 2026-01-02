import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NowPlaying {
  id: string;
  track_title: string | null;
  track_artist: string | null;
  dj_name: string | null;
  show_id: string | null;
  started_at: string | null;
  updated_at: string | null;
}

export const useNowPlaying = () => {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const { data, error } = await supabase
          .from("now_playing")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setNowPlaying(data);
      } catch (err) {
        console.error("Error fetching now playing:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    };

    fetchNowPlaying();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("now_playing_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "now_playing",
        },
        (payload) => {
          console.log("Now playing updated:", payload);
          if (payload.eventType === "DELETE") {
            setNowPlaying(null);
          } else {
            setNowPlaying(payload.new as NowPlaying);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { nowPlaying, loading, error };
};
