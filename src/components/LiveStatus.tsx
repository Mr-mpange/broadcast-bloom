import { useGlobalLiveStatus } from "@/hooks/useGlobalLiveStatus";
import { Badge } from "@/components/ui/badge";
import { Radio, Users } from "lucide-react";
import { useListenerTracking } from "@/hooks/useListenerTracking";

const LiveStatus = () => {
  const { isLive, liveShows } = useGlobalLiveStatus();
  const currentLiveShow = liveShows.length > 0 ? liveShows[0] : null;
  const { listenerCount } = useListenerTracking(currentLiveShow?.id);

  if (!isLive || liveShows.length === 0) {
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
        {currentLiveShow?.name}
      </span>
      {currentLiveShow?.genre && (
        <Badge variant="secondary" className="text-xs">
          {currentLiveShow.genre}
        </Badge>
      )}
    </div>
  );
};

export default LiveStatus;