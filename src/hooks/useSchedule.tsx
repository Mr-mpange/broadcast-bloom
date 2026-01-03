import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ScheduleShow {
  id: string;
  show_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  show: {
    id: string;
    name: string;
    description: string | null;
    genre: string | null;
    image_url: string | null;
    is_active: boolean;
    host: {
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

export const useSchedule = (dayOfWeek: number) => {
  const [scheduleShows, setScheduleShows] = useState<ScheduleShow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      
      // First fetch schedule entries for the day
      const { data: scheduleData, error: scheduleError } = await supabase
        .from("schedule")
        .select("id, show_id, day_of_week, start_time, end_time, is_recurring")
        .eq("day_of_week", dayOfWeek)
        .order("start_time", { ascending: true });

      if (scheduleError) {
        console.error("Error fetching schedule:", scheduleError);
        setLoading(false);
        return;
      }

      if (!scheduleData || scheduleData.length === 0) {
        setScheduleShows([]);
        setLoading(false);
        return;
      }

      // Get unique show IDs
      const showIds = [...new Set(scheduleData.map(s => s.show_id).filter(Boolean))];

      // Fetch shows with host info
      const { data: showsData, error: showsError } = await supabase
        .from("shows")
        .select(`
          id,
          name,
          description,
          genre,
          image_url,
          is_active,
          host_id
        `)
        .in("id", showIds);

      if (showsError) {
        console.error("Error fetching shows:", showsError);
      }

      // Fetch host profiles
      const hostIds = [...new Set((showsData || []).map(s => s.host_id).filter(Boolean))];
      let profilesMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      
      if (hostIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", hostIds);
        
        if (profilesData) {
          profilesMap = profilesData.reduce((acc, p) => {
            acc[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url };
            return acc;
          }, {} as Record<string, { display_name: string | null; avatar_url: string | null }>);
        }
      }

      // Combine data
      const combined: ScheduleShow[] = scheduleData.map(schedule => {
        const show = showsData?.find(s => s.id === schedule.show_id);
        return {
          id: schedule.id,
          show_id: schedule.show_id || "",
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          is_recurring: schedule.is_recurring ?? true,
          show: show ? {
            id: show.id,
            name: show.name,
            description: show.description,
            genre: show.genre,
            image_url: show.image_url,
            is_active: show.is_active ?? true,
            host: show.host_id ? profilesMap[show.host_id] || null : null,
          } : null,
        };
      });

      setScheduleShows(combined);
      setLoading(false);
    };

    fetchSchedule();
  }, [dayOfWeek]);

  return { scheduleShows, loading };
};
