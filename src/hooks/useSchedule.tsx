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
      const { data, error } = await supabase
        .from("schedule")
        .select(`
          id,
          show_id,
          day_of_week,
          start_time,
          end_time,
          is_recurring,
          show:shows (
            id,
            name,
            description,
            genre,
            image_url,
            is_active,
            host:profiles!shows_host_id_fkey (
              display_name,
              avatar_url
            )
          )
        `)
        .eq("day_of_week", dayOfWeek)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching schedule:", error);
      } else {
        setScheduleShows((data as unknown as ScheduleShow[]) || []);
      }
      setLoading(false);
    };

    fetchSchedule();
  }, [dayOfWeek]);

  return { scheduleShows, loading };
};
