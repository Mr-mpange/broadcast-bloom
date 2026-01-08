import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLiveShows } from "@/hooks/useLiveShows";
import { Radio, Play, Square, Clock } from "lucide-react";

interface Show {
  id: string;
  name: string;
  description: string | null;
  genre: string | null;
  image_url: string | null;
  is_active: boolean | null;
}

interface LiveShowManagerProps {
  shows: Show[];
}

const LiveShowManager = ({ shows }: LiveShowManagerProps) => {
  const { liveShows, startLiveShow, endLiveShow, loading } = useLiveShows();
  const [selectedShowId, setSelectedShowId] = useState("");
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState<string | null>(null);

  const handleStartShow = async () => {
    if (!selectedShowId) return;

    setStarting(true);
    await startLiveShow(selectedShowId);
    setStarting(false);
    setSelectedShowId("");
  };

  const handleEndShow = async (liveShowId: string) => {
    setEnding(liveShowId);
    await endLiveShow(liveShowId);
    setEnding(null);
  };

  const availableShows = shows?.filter(show => 
    show?.is_active && !liveShows.some(live => live?.id === show?.id)
  ) || [];

  if (loading) {
    return (
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Radio className="h-5 w-5 text-primary" />
            Live Show Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            Loading shows...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Radio className="h-5 w-5 text-primary" />
          Live Show Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Start New Live Show */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Start Live Show</h3>
          <div className="flex gap-3">
            <Select value={selectedShowId} onValueChange={setSelectedShowId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a show to go live" />
              </SelectTrigger>
              <SelectContent>
                {availableShows.filter(show => show && show.id && show.name).map((show) => (
                  <SelectItem key={show.id} value={show.id}>
                    {show.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleStartShow}
              disabled={!selectedShowId || starting}
              className="gap-2"
            >
              <Play size={16} />
              {starting ? "Starting..." : "Go Live"}
            </Button>
          </div>
          {availableShows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No shows available to go live. All active shows are already broadcasting.
            </p>
          )}
        </div>

        {/* Currently Live Shows */}
        {liveShows.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Currently Live</h3>
            <div className="space-y-3">
              {liveShows.filter(liveShow => liveShow && liveShow.id).map((liveShow) => (
                <div
                  key={liveShow.id}
                  className="p-4 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {liveShow?.image_url && (
                        <img
                          src={liveShow.image_url}
                          alt={liveShow.name || 'Live Show'}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">
                            {liveShow?.name || 'Unknown Show'}
                          </h4>
                          <Badge variant="destructive" className="gap-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            LIVE
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock size={12} />
                          Started recently
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEndShow(liveShow.id)}
                      disabled={ending === liveShow.id}
                      className="gap-2"
                    >
                      <Square size={14} />
                      {ending === liveShow.id ? "Ending..." : "End Show"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {liveShows.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Radio className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No shows are currently live</p>
            <p className="text-sm">Select a show above to start broadcasting</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveShowManager;