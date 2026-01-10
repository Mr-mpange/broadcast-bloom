import { useState } from "react";
import { Play, Pause, X, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import LiveBadge from "./LiveBadge";
import { useGlobalLiveStatus } from "@/hooks/useGlobalLiveStatus";

const MobilePlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { isLive } = useGlobalLiveStatus();

  const nowPlaying = {
    title: "African Giant",
    artist: "Burna Boy",
    show: "Afrobeats Takeover",
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass-panel border-t border-border/50 safe-area-bottom">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="player"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-11 w-11 shrink-0"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <LiveBadge size="sm" isLive={isLive} />
              </div>
              <p className="text-sm font-medium text-foreground truncate">
                {nowPlaying.title} – {nowPlaying.artist}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(true)}
            className="shrink-0"
          >
            <ChevronUp size={20} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <LiveBadge isLive={isLive} showWhenOffline={true} />
        <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
          <X size={24} />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Waveform placeholder */}
        <div className="w-full max-w-xs aspect-square rounded-2xl bg-card flex items-center justify-center mb-8">
          <div className="flex items-end gap-1 h-24">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-2 bg-primary rounded-full waveform-bar"
                style={{
                  height: `${Math.random() * 80 + 20}%`,
                  animationDelay: `${i * 0.08}s`,
                  opacity: isPlaying ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        </div>

        {/* Now Playing */}
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground mb-1">{nowPlaying.show}</p>
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">
            {nowPlaying.title}
          </h2>
          <p className="text-muted-foreground">{nowPlaying.artist}</p>
        </div>

        {/* Play Button */}
        <Button
          variant="player"
          size="icon-xl"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause size={36} /> : <Play size={36} className="ml-1" />}
        </Button>
      </div>
    </div>
  );
};

export default MobilePlayer;
