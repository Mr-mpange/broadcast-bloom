import { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, SkipForward, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import Waveform from "./Waveform";
import LiveBadge from "./LiveBadge";

interface NowPlaying {
  title: string;
  artist: string;
  show: string;
  dj: string;
  albumArt?: string;
}

const LivePlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const nowPlaying: NowPlaying = {
    title: "African Giant",
    artist: "Burna Boy",
    show: "Afrobeats Takeover",
    dj: "DJ Spinall",
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // Audio playback would be handled here with actual stream URL
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

  return (
    <div className="player-card w-full max-w-2xl mx-auto">
      {/* Live Indicator & Show Info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <LiveBadge size="lg" />
          <div>
            <p className="text-sm text-muted-foreground">Currently on air</p>
            <h3 className="font-display font-semibold text-foreground">{nowPlaying.show}</h3>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Hosted by</p>
          <p className="font-medium text-primary">{nowPlaying.dj}</p>
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="relative py-4 mb-6">
        <Waveform isPlaying={isPlaying} barCount={50} className="h-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background pointer-events-none" />
      </div>

      {/* Now Playing */}
      <div className="text-center mb-8">
        <p className="text-sm text-muted-foreground mb-1">Now Playing</p>
        <h2 className="font-display text-2xl font-bold text-foreground mb-1 glow-text">
          {nowPlaying.title}
        </h2>
        <p className="text-lg text-muted-foreground">{nowPlaying.artist}</p>
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
        >
          {isPlaying ? (
            <Pause size={32} className="ml-0" />
          ) : (
            <Play size={32} className="ml-1" />
          )}
        </Button>

        {/* Skip / Next (disabled for live) */}
        <div className="w-32 flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            disabled
            className="text-muted-foreground/50"
          >
            <SkipForward size={20} />
          </Button>
        </div>
      </div>

      {/* Listener Count */}
      <div className="flex items-center justify-center gap-2 mt-6 text-muted-foreground">
        <Radio size={14} className="text-primary" />
        <span className="text-sm">
          <span className="font-semibold text-foreground">2,847</span> listeners worldwide
        </span>
      </div>

      {/* Hidden audio element for actual streaming */}
      <audio ref={audioRef} preload="none" />
    </div>
  );
};

export default LivePlayer;
