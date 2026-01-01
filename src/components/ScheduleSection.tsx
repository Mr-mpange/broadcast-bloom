import { Clock, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import LiveBadge from "./LiveBadge";

interface Show {
  id: number;
  name: string;
  dj: string;
  time: string;
  genre: string;
  isLive: boolean;
  isNext?: boolean;
}

const ScheduleSection = () => {
  const todayShows: Show[] = [
    { id: 1, name: "Morning Vibes", dj: "DJ Cuppy", time: "06:00 - 10:00", genre: "Afrobeats", isLive: false },
    { id: 2, name: "Afrobeats Takeover", dj: "DJ Spinall", time: "10:00 - 14:00", genre: "Afrobeats", isLive: true },
    { id: 3, name: "Amapiano Sessions", dj: "Kabza De Small", time: "14:00 - 18:00", genre: "Amapiano", isLive: false, isNext: true },
    { id: 4, name: "Evening Drive", dj: "DJ Tunez", time: "18:00 - 22:00", genre: "Mixed", isLive: false },
    { id: 5, name: "Late Night Grooves", dj: "Black Coffee", time: "22:00 - 02:00", genre: "Deep House", isLive: false },
    { id: 6, name: "Night Owls", dj: "Auto-DJ", time: "02:00 - 06:00", genre: "Chill", isLive: false },
  ];

  return (
    <section id="schedule" className="py-20 bg-card relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-primary font-semibold uppercase tracking-widest mb-2">
            Today's Programming
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Show Schedule
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid gap-4">
            {todayShows.map((show) => (
              <div
                key={show.id}
                className={cn(
                  "group glass-panel rounded-xl p-4 sm:p-6 transition-all duration-300 hover:border-primary/50",
                  show.isLive && "border-primary/50 bg-primary/5"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Time */}
                  <div className="flex items-center gap-2 text-muted-foreground min-w-[140px]">
                    <Clock size={16} className={cn(show.isLive && "text-primary")} />
                    <span className={cn("font-mono text-sm", show.isLive && "text-primary font-semibold")}>
                      {show.time}
                    </span>
                  </div>

                  {/* Show Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className={cn(
                        "font-display font-semibold text-lg",
                        show.isLive ? "text-primary glow-text" : "text-foreground"
                      )}>
                        {show.name}
                      </h3>
                      {show.isLive && <LiveBadge size="sm" />}
                      {show.isNext && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-medium">
                          Up Next
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Hosted by <span className="text-foreground font-medium">{show.dj}</span>
                    </p>
                  </div>

                  {/* Genre Tag */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                      {show.genre}
                    </span>
                    {show.isLive && (
                      <Radio size={16} className="text-primary animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View Full Schedule Link */}
          <div className="text-center mt-8">
            <a
              href="#full-schedule"
              className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2 transition-colors"
            >
              View Full Week Schedule
              <span className="text-lg">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScheduleSection;
