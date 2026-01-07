import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Radio, Users } from "lucide-react";
import { useListenerTracking } from "@/hooks/useListenerTracking";

interface LiveShow {
  id: string;
  show_id: string;
  is_live: boolean;
  shows: {
    name: string;
    genre: string | null;
  };
}

const LiveStatus = () => {
  const [liveShows, setLiveShows] = useState<LiveShow[]>([]);
  const currentLiveShow = liveShows.length > 0 ? liveShows[0] : null;
  const { listenerCount } = useListenerTracking(currentLiveShow?.id);

  useEffect(() => {
    fetchLiveShows();
    subscribeToLiveShows();
  }, []);

  const fetchLiveShows = async () => {
    const { data } = await supabase
      .from('live_shows')
      .select(`
        *,
        shows (
          name,
          genre
        )
      `)
      .eq('is_live', true)
      .order('started_at', { ascending: false });

    if (data) {
      setLiveShows(data);
    }
  };

  const subscribeToLiveShows = () => {
    const channel = supabase
      .channel('live_shows_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_shows'
        },
        () => {
          fetchLiveShows();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (liveShows.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Radio size={16} />
        <span className="text-sm">No live shows</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Badge variant="destructive" className="gap-1">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        LIVE
      </Badge>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Users size={14} />
        <span>{listenerCount}</span>
      </div>
      <span className="text-sm font-medium text-foreground">
        {liveShows[0].shows.name}
      </span>
      {liveShows[0].shows.genre && (
        <Badge variant="secondary" className="text-xs">
          {liveShows[0].shows.genre}
        </Badge>
      )}
    </div>
  );
};

export default LiveStatus;