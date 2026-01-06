import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, SkipForward, Radio, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import Waveform from "./Waveform";
import LiveBadge from "./LiveBadge";
import { useNowPlaying } from "@/hooks/useNowPlaying";

// Default demo stream URL (public radio stream)
const DEFAULT_STREAM_URL = "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one";

const LivePlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [isMuted, setIsMuted] = useState(false);
  const [streamUrl, setStreamUrl] = useState(DEFAULT_STREAM_URL);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { nowPlaying: liveData, loading } = useNowPlaying();

  // Fallback to defaults if no live data
  const displayData = {
    title: liveData?.track_title || "Live Radio Stream",
    artist: liveData?.track_artist || "Tune in now",
    show: "Live Radio",
    dj: liveData?.dj_name || "AutoDJ",
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      setError(null);
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        audioRef.current.src = streamUrl;
        await audioRef.current.play();
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (err) {
      setError("Failed to play stream. Check the URL or try another stream.");
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100;
    }
  };

  const handleStreamUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStreamUrl(e.target.value);
  };

  const handleStreamUrlSubmit = () => {
    setShowUrlInput(false);
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleAudioError = () => {
    setError("Stream unavailable. Try a different URL.");
    setIsPlaying(false);
    setIsLoading(false);
  };

  return (
    <div className="player-card w-full max-w-2xl mx-auto">
      {/* Live Indicator & Show Info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <LiveBadge size="lg" />
          <div>
            <p className="text-sm text-muted-foreground">Currently on air</p>
            <h3 className="font-display font-semibold text-foreground">{displayData.show}</h3>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Hosted by</p>
          <p className="font-medium text-primary">{displayData.dj}</p>
        </div>
      </div>

      {/* Stream URL Input (optional) */}
      {showUrlInput && (
        <div className="mb-4 flex gap-2">
          <Input
            value={streamUrl}
            onChange={handleStreamUrlChange}
            placeholder="Enter stream URL..."
            className="flex-1"
          />
          <Button onClick={handleStreamUrlSubmit} size="sm">
            Set
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10">
          <AlertCircle size={16} />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setShowUrlInput(true)}
          >
            Change URL
          </Button>
        </div>
      )}

      {/* Waveform Visualization */}
      <div className="relative py-4 mb-6">
        <Waveform isPlaying={isPlaying} barCount={50} className="h-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background pointer-events-none" />
      </div>

      {/* Now Playing */}
      <div className="text-center mb-8">
        <p className="text-sm text-muted-foreground mb-1">Now Playing</p>
        <h2 className="font-display text-2xl font-bold text-foreground mb-1 glow-text">
          {loading ? "Loading..." : displayData.title}
        </h2>
        <p className="text-lg text-muted-foreground">{displayData.artist}</p>
      </div>

      {/* Player Controls */}
      <div className="flex items-center justify-center gap-6">
        {/* Volume */}
        <div className="flex items-center gap-2 w-32">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="text-muted-foreground hover:text-foreground"
          >
            {isMuted || volume[0] === 0 ? (
              <VolumeX size={20} />
            ) : (
              <Volume2 size={20} />
            )}
          </Button>
          <Slider
            value={isMuted ? [0] : volume}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="flex-1"
          />
        </div>

        {/* Play Button */}
        <Button
          variant="player"
          size="icon-xl"
          onClick={togglePlay}
          className="relative"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-8 h-8 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause size={32} className="ml-0" />
          ) : (
            <Play size={32} className="ml-1" />
          )}
        </Button>

        {/* Settings */}
        <div className="w-32 flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-muted-foreground hover:text-foreground"
            title="Change stream URL"
          >
            <Radio size={20} />
          </Button>
        </div>
      </div>

      {/* Listener Count */}
      <div className="flex items-center justify-center gap-2 mt-6 text-muted-foreground">
        <Radio size={14} className="text-primary" />
        <span className="text-sm">
          <span className="font-semibold text-foreground">Live</span> streaming worldwide
        </span>
      </div>

      {/* Hidden audio element for actual streaming */}
      <audio
        ref={audioRef}
        preload="none"
        onError={handleAudioError}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default LivePlayer;
