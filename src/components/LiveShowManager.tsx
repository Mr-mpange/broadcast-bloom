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
  description?: string | null;
  genre?: string | null;
  image_url?: string | null;
  is_active?: boolean | null;
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
    try {
      await startLiveShow(selectedShowId);
    } catch (error) {
      console.error('Error starting show:', error);
    }
    setStarting(false);
    setSelectedShowId("");
  };

  const handleEndShow = async (liveShowId: string) => {
    setEnding(liveShowId);
    try {
      await endLiveShow(liveShowId);
    } catch (error) {
      console.error('Error ending show:', error);
    }
    setEnding(null);
  };

  // Safely process shows data with comprehensive error handling
  let availableShows: Show[] = [];
  let validLiveShows: any[] = [];

  try {
    // Safely filter available shows with null checks
    availableShows = Array.isArray(shows) 
      ? shows.filter(show => {
          try {
            return show && 
                   typeof show === 'object' &&
                   show.id && 
                   show.name && 
                   show.is_active !== false &&
                   Array.isArray(liveShows) &&
                   !liveShows.some(live => live && live.id === show.id);
          } catch (e) {
            console.warn('Error filtering show:', e);
            return false;
          }
        })
      : [];

    // Safely filter live shows with null checks
    validLiveShows = Array.isArray(liveShows) 
      ? liveShows.filter(liveShow => {
          try {
            return liveShow && 
                   typeof liveShow === 'object' &&
                   liveShow.id && 
                   liveShow.name;
          } catch (e) {
            console.warn('Error filtering live show:', e);
            return false;
          }
        })
      : [];
  } catch (error) {
    console.error('Error processing shows data:', error);
    availableShows = [];
    validLiveShows = [];
  }

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
                {availableShows.length > 0 ? (
                  availableShows.map((show) => {
                    try {
                      // Additional safety check for each show
                      if (!show || !show.id || !show.name) {
                        return null;
                      }
                      return (
                        <SelectItem key={show.id} value={show.id}>
                          {show.name}
                        </SelectItem>
                      );
                    } catch (error) {
                      console.warn('Error rendering show option:', error);
                      return null;
                    }
                  }).filter(Boolean)
                ) : (
                  <SelectItem value="no-shows" disabled>
                    No shows available
                  </SelectItem>
                )}
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
        {validLiveShows.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Currently Live</h3>
            <div className="space-y-3">
              {validLiveShows.map((liveShow) => {
                try {
                  // Comprehensive safety checks
                  if (!liveShow || typeof liveShow !== 'object' || !liveShow.id || !liveShow.name) {
                    return null;
                  }
                  
                  return (
                    <div
                      key={liveShow.id}
                      className="p-4 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Safe image rendering with multiple fallbacks */}
                          {(() => {
                            try {
                              return liveShow.image_url && typeof liveShow.image_url === 'string' ? (
                                <img
                                  src={liveShow.image_url}
                                  alt={liveShow.name || 'Show image'}
                                  className="w-12 h-12 rounded-lg object-cover"
                                  onError={(e) => {
                                    try {
                                      e.currentTarget.style.display = 'none';
                                    } catch (err) {
                                      console.warn('Error hiding failed image:', err);
                                    }
                                  }}
                                />
                              ) : null;
                            } catch (error) {
                              console.warn('Error rendering show image:', error);
                              return null;
                            }
                          })()}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-foreground">
                                {liveShow.name || 'Unknown Show'}
                              </h4>
                              <Badge variant="destructive" className="gap-1">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                LIVE
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock size={12} />
                              Broadcasting now
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
                  );
                } catch (error) {
                  console.warn('Error rendering live show:', error);
                  return null;
                }
              }).filter(Boolean)}
            </div>
          </div>
        )}

        {validLiveShows.length === 0 && !loading && (
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