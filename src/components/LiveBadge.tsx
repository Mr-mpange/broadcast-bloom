import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const LiveBadge = ({ className, size = "md" }: LiveBadgeProps) => {
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

  return (
    <span
      className={cn(
        "live-badge inline-flex items-center gap-1.5 font-bold uppercase tracking-widest",
        sizeClasses[size],
        className
      )}
    >
      <Radio size={iconSizes[size]} className="animate-pulse" />
      Live
    </span>
  );
};

export default LiveBadge;
