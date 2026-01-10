import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  isLive?: boolean;
  showWhenOffline?: boolean;
}

const LiveBadge = ({ 
  className, 
  size = "md", 
  isLive = false, 
  showWhenOffline = false 
}: LiveBadgeProps) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm",
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14,
  };

  // Don't render if not live and showWhenOffline is false
  if (!isLive && !showWhenOffline) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-bold uppercase tracking-widest",
        isLive ? "live-badge" : "bg-muted text-muted-foreground",
        sizeClasses[size],
        className
      )}
    >
      <Radio 
        size={iconSizes[size]} 
        className={isLive ? "animate-pulse" : ""} 
      />
      {isLive ? "Live" : "Offline"}
    </span>
  );
};

export default LiveBadge;
