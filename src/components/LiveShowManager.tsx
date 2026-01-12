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
import { useBroadcastControl } from "@/hooks/useBroadcastControl";
import { Radio, Play, Square, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const { liveShows, startLiveShow, endLiveShow, loading } = useLiveShows();
  const { startBroadcastSession, endBroadcastSession, isLive, canBroadcast } = useBroadcastControl();
  const [selectedShowId, setSelectedShowId] = useState("");
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState<string | null>(null);

  const handleStartShow = async () => {
    if (!selectedShowId) return;

    if (!canBroadcast) {
      toast({
        title: "Not Authorized",
        description: "You don't have permission to start a live broadcast.",
        variant: "destructive"
      });
      return;
    }

    setStarting(true);
    try {
      // First start the broadcast session
      const sessionId = await startBroadcastSession('live');
      
      if (sessionId) {
        // Then start the live show
        await startLiveShow(selectedShowId);
        toast({
          title: "Live broadcast started!",
          description: "Your show is now live and visible to listeners."
        });
      }
    } catch (error) {
      console.error('Error starting show:', error);
      toast({
        title: "Failed to start broadcast",
        description: "There was an error starting your live show.",
        variant: "destructive"
      });
    }
    setStarting(false);
    setSelectedShowId("");
  };

  const handleEndShow = async (liveShowId: string) => {
    setEnding(liveShowId);
    try {
      // End the broadcast session first
      await endBroadcastSession();
      
      // Then end the live show
      await endLiveShow(liveShowId);
      
      toast({
        title: "Broadcast ended",
        description: "Your live show has ended."
      });
    } catch (error) {
      console.error('Error ending show:', error);
      toast({
        title: "Error ending broadcast",
        description: "There was an error ending your live show.",
        variant: "destructive"
      });
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
                              // Multiple layers of safety checks
                              if (!liveShow || 
                                  typeof liveShow !== 'object' || 
                                  !liveShow.hasOwnProperty('image_url') ||
                                  !liveShow.image_url || 
                                  typeof liveShow.image_url !== 'string' ||
                                  liveShow.image_url.trim() === '') {
                                return (
                                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                    <Radio className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                );
                              }
                              
                              return (
                                <img
                                  src={liveShow.image_url}
                                  alt={liveShow.name || 'Show image'}
                                  className="w-12 h-12 rounded-lg object-cover"
                                  onError={(e) => {
                                    try {
                                      const target = e.currentTarget;
                                      if (target && target.parentNode) {
                                        const placeholder = document.createElement('div');
                                        placeholder.className = 'w-12 h-12 rounded-lg bg-muted flex items-center justify-center';
                                        placeholder.innerHTML = '<svg class="h-6 w-6 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
                                        target.parentNode.replaceChild(placeholder, target);
                                      }
                                    } catch (err) {
                                      console.warn('Error replacing failed image:', err);
                                    }
                                  }}
                                />
                              );
                            } catch (error) {
                              console.warn('Error rendering show image:', error);
                              return (
                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                  <Radio className="h-6 w-6 text-muted-foreground" />
                                </div>
                              );
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