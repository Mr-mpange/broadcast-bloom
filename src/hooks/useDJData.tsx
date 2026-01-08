import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Show {
  id: string;
  name: string;
  description: string | null;
  genre: string | null;
  image_url: string | null;
  is_active: boolean | null;
  host_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ListenerStat {
  id: string;
  listener_count: number | null;
  country: string | null;
  recorded_at: string;
}

export const useDJData = () => {
  const { user } = useAuth();
  const [shows, setShows] = useState<Show[]>([]);
  const [listenerStats, setListenerStats] = useState<ListenerStat[]>([]);
  const [profile, setProfile] = useState<{ id: string; role?: string } | null>(null);
  const [isDJ, setIsDJ] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Check if user is DJ
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .in("role", ["dj", "admin"]);

        const hasDJRole = roleData && roleData.length > 0;
        setIsDJ(hasDJRole);

        if (!hasDJRole) {
          setLoading(false);
          return;
        }

        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        // Add role to profile if available
        const userRole = roleData && roleData.length > 0 ? roleData[0].role : null;
        setProfile(profileData ? { ...profileData, role: userRole } : null);

        // Fetch shows
        const { data: showsData } = await supabase
          .from("shows")
          .select("*")
          .order("created_at", { ascending: false });

        setShows(showsData || []);

        // Fetch listener stats
        const { data: statsData } = await supabase
          .from("listener_stats")
          .select("*")
          .order("recorded_at", { ascending: false })
          .limit(50);

        setListenerStats(statsData || []);
      } catch (err) {
        console.error("Error fetching DJ data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const updateNowPlaying = async (
    trackTitle: string,
    trackArtist: string,
    showId?: string
  ) => {
    if (!profile) return { error: "No profile found" };

    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user?.id)
        .maybeSingle();

      // First, try to delete any existing "current" entry
      await supabase.from("now_playing").delete().eq("id", "current");

      // Then insert the new current track
      const { error } = await supabase.from("now_playing").insert({
        id: "current",
        track_title: trackTitle,
        track_artist: trackArtist,
        dj_name: profileData?.display_name || "Unknown DJ",
        show_id: showId || null,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error updating now playing:", error);
        return { error: error.message };
      }

      return { error: null };
    } catch (err: any) {
      console.error("Error in updateNowPlaying:", err);
      return { error: err.message || "Failed to update now playing" };
    }
  };

  const refetchShows = async () => {
    if (!profile) return;
    const { data: showsData } = await supabase
      .from("shows")
      .select("*")
      .order("created_at", { ascending: false });
    setShows(showsData || []);
  };

  return {
    shows,
    listenerStats,
    isDJ,
    loading,
    updateNowPlaying,
    profile,
    refetchShows,
  };
};
