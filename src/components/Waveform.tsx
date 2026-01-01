import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface WaveformProps {
  isPlaying: boolean;
  barCount?: number;
  className?: string;
}

const Waveform = ({ isPlaying, barCount = 40, className }: WaveformProps) => {
  const [heights, setHeights] = useState<number[]>([]);

  useEffect(() => {
    // Generate random heights for visual variety
    const generateHeights = () => {
      return Array.from({ length: barCount }, () => Math.random() * 0.7 + 0.3);
    };
    setHeights(generateHeights());

    if (isPlaying) {
      const interval = setInterval(() => {
        setHeights(generateHeights());
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isPlaying, barCount]);

  return (
    <div className={cn("flex items-center justify-center gap-[2px] h-16", className)}>
      {heights.map((height, index) => (
        <div
          key={index}
          className={cn(
            "w-1 rounded-full transition-all duration-150",
            isPlaying ? "bg-primary" : "bg-muted-foreground/30"
          )}
          style={{
            height: isPlaying ? `${height * 100}%` : "20%",
            animationDelay: `${index * 0.05}s`,
            opacity: isPlaying ? 0.6 + height * 0.4 : 0.3,
          }}
        />
      ))}
    </div>
  );
};

export default Waveform;
