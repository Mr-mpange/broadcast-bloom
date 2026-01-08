import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useListenerTracking } from "@/hooks/useListenerTracking";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { supabase } from "@/integrations/supabase/client";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Heart, 
  Share2,
  Radio,
  Users,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LiveShow {
  id: string;
  name: string;
  description: string | null;
  genre: string | null;
  image_url: string | null;
  host_id: string;
  host: {
    display_name: string | null;
  } | null;
}

interface NowPlaying {
  track_title: string | null;
  track_artist: string | null;
  dj_name: string | null;
}

const LivePlayer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liveShows, setLiveShows] = useState<LiveShow[]>([]);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  
  const currentLiveShow = liveShows.length > 0 ? liveShows[0] : null;
  const { listenerCount, isListening, startListening, stopListening } = useListenerTracking(currentLiveShow?.id);
  
  // Audio player hook with stream configuration
  const { 
    isPlaying, 
    isLoading, 
    volume, 
    isMuted, 
    error,
    togglePlay: audioTogglePlay, 
    toggleMute: audioToggleMute, 
    setVolume: setAudioVolume 
  } = useAudioPlayer({ quality: 'medium' }); // You can make this configurable

  useEffect(() => {
    fetchLiveShows();
    fetchNowPlaying();
    subscribeToUpdates();
  }, []);

  useEffect(() => {
    if (user && liveShows.length > 0) {
      checkIfFavorited();
    }
  }, [user, liveShows]);

  const fetchLiveShows = async () => {
    // Since there's no live_shows table, we'll fetch shows and simulate live status
    // In a real app, you'd have a way to track which shows are currently live
    const { data } = await supabase
      .from('shows')
      .select(`
        *,
        host:profiles!shows_host_id_fkey (
          display_name
        )
      `)
      .limit(1); // Get the first show as a placeholder

    if (data && data.length > 0) {
      setLiveShows(data);
    }
  };

  const fetchNowPlaying = async () => {
    const { data } = await supabase
      .from('now_playing')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setNowPlaying(data[0]);
    }
  };

  const subscribeToUpdates = () => {
    // Subscribe to shows table changes
    const showsChannel = supabase
      .channel('shows_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shows'
        },
        () => {
          fetchLiveShows();
        }
      )
      .subscribe();

    const nowPlayingChannel = supabase
      .channel('now_playing_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'now_playing'
        },
        () => {
          fetchNowPlaying();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(showsChannel);
      supabase.removeChannel(nowPlayingChannel);
    };
  };

  const checkIfFavorited = async () => {
    if (!user || liveShows.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('show_id', liveShows[0].id) // Use show id directly
        .maybeSingle(); // Use maybeSingle instead of single

      if (!error) {
        setIsFavorited(!!data);
      }
    } catch (err) {
      console.log('Error checking favorites:', err);
      // Silently fail - not critical functionality
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add shows to your favorites.",
        variant: "destructive"
      });
      return;
    }

    if (liveShows.length === 0) return;

    const showId = liveShows[0].id; // Use show id directly

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('show_id', showId);

        if (!error) {
          setIsFavorited(false);
          toast({ title: "Removed from favorites" });
        } else {
          console.log('Error removing favorite:', error);
        }
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            show_id: showId
          });

        if (!error) {
          setIsFavorited(true);
          toast({ title: "Added to favorites!" });
        } else {
          console.log('Error adding favorite:', error);
        }
      }
    } catch (err) {
      console.log('Error toggling favorite:', err);
      toast({
        title: "Error",
        description: "Unable to update favorites. Please try again.",
        variant: "destructive"
      });
    }
  };

  const togglePlay = async () => {
    if (!currentLiveShow) {
      toast({
        title: "No live show",
        description: "There are no live shows currently broadcasting.",
        variant: "destructive"
      });
      return;
    }

    // Toggle audio playback
    audioTogglePlay();
    
    if (!isPlaying) {
      // Start listening session
      await startListening();
      toast({
        title: "Now streaming live!",
        description: "Connecting to live broadcast..."
      });
    } else {
      // Stop listening session
      await stopListening();
      toast({
        title: "Stream paused",
        description: "Audio stream paused"
      });
    }
  };

  const toggleMute = () => {
    audioToggleMute();
  };

  const shareStream = async () => {
    const shareData = {
      title: liveShows.length > 0 ? `${liveShows[0].name} - Live on PULSE FM` : 'PULSE FM Live Stream',
      text: 'Listen to live radio on PULSE FM!',
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareData.url);
        toast({ title: "Link copied to clipboard!" });
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  const currentShow = liveShows.length > 0 ? liveShows[0] : null;

  return (
    <Card className="glass-panel border-border/50 sticky top-20 z-40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Radio className="h-5 w-5 text-primary" />
            Live Stream
          </CardTitle>
          {currentShow && (
            <Badge variant="destructive" className="gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Show Info */}
        {currentShow ? (
          <div className="flex items-start gap-3">
            {currentShow.image_url && (
              <img
                src={currentShow.image_url}
                alt={currentShow.name}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {currentShow.name}
              </h3>
              {currentShow.host?.display_name && (
                <p className="text-sm text-muted-foreground">
                  with {currentShow.host.display_name}
                </p>
              )}
              {currentShow.genre && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {currentShow.genre}
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Radio className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No live shows currently</p>
            <p className="text-xs text-muted-foreground">Check back later for live broadcasts</p>
          </div>
        )}

        {/* Now Playing */}
        {nowPlaying && (nowPlaying.track_title || nowPlaying.track_artist) && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Now Playing</p>
            <p className="font-medium text-foreground text-sm">
              {nowPlaying.track_title || "Unknown Track"}
            </p>
            <p className="text-sm text-muted-foreground">
              {nowPlaying.track_artist || "Unknown Artist"}
            </p>
          </div>
        )}

        {/* Player Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant={isPlaying ? "default" : "outline"}
              onClick={togglePlay}
              className="h-10 w-10"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={18} />
              ) : (
                <Play size={18} />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleMute}
              className="h-8 w-8"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users size={12} />
              <span>{listenerCount}</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleFavorite}
              className={`h-8 w-8 ${isFavorited ? 'text-red-500' : ''}`}
            >
              <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={shareStream}
              className="h-8 w-8"
            >
              <Share2 size={16} />
            </Button>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <VolumeX size={14} className="text-muted-foreground" />
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : Math.round(volume * 100)}
            onChange={(e) => setAudioVolume(parseInt(e.target.value) / 100)}
            className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
          <Volume2 size={14} className="text-muted-foreground" />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Call to Action for Anonymous Users */}
        {!user && (
          <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-foreground mb-2">
              Want to get notified when your favorite shows go live?
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="/auth">Sign Up Free</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LivePlayer;