import { useState } from "react";
import { Clock, Users, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import LiveBadge from "./LiveBadge";

interface Show {
  id: number;
  name: string;
  dj: string;
  startTime: string;
  endTime: string;
  displayTime: string;
  image: string;
  isLive: boolean;
  progress?: number;
}

const ScheduleSection = () => {
  const [activeDay, setActiveDay] = useState("Tue");
  
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const shows: Show[] = [
    { 
      id: 1, 
      name: "Morning Grooves", 
      dj: "", 
      startTime: "08:00", 
      endTime: "10:00 AM",
      displayTime: "03:00 - 10:0 AM",
      image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=100&h=100&fit=crop",
      isLive: true,
      progress: 65,
    },
    { 
      id: 2, 
      name: "Afternoon Vibes", 
      dj: "DJ Mike", 
      startTime: "08:00", 
      endTime: "12:00 AM",
      displayTime: "11-80 AM",
      image: "https://images.unsplash.com/photo-1559386484-97dfc0e15539?w=100&h=100&fit=crop",
      isLive: false,
    },
    { 
      id: 3, 
      name: "Talk & Tunes", 
      dj: "DJ Karen", 
      startTime: "11:00", 
      endTime: "11:00 AM",
      displayTime: "3:40 PM",
      image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=100&h=100&fit=crop",
      isLive: false,
    },
    { 
      id: 4, 
      name: "Evening Chill", 
      dj: "DJ Chris", 
      startTime: "11:00", 
      endTime: "2:00 PM",
      displayTime: "3:00 PM",
      image: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=100&h=100&fit=crop",
      isLive: false,
    },
    { 
      id: 5, 
      name: "Late Night Hits", 
      dj: "DJ Zoe", 
      startTime: "11:00", 
      endTime: "3:00 PM",
      displayTime: "4:00 PM",
      image: "https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?w=100&h=100&fit=crop",
      isLive: false,
    },
  ];

  return (
    <section id="schedule" className="py-16 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Schedule List */}
          <div className="lg:col-span-2">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">
              Schedule
            </h2>
            
            {/* Day Tabs */}
            <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                    activeDay === day
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Shows List */}
            <div className="space-y-3">
              {shows.map((show) => (
                <div
                  key={show.id}
                  className={cn(
                    "glass-panel rounded-xl p-4 transition-all duration-300",
                    show.isLive && "border-primary/30 bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* DJ Image */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={show.image} 
                        alt={show.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Show Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {show.name}
                        </h3>
                        {show.dj && (
                          <span className="text-muted-foreground text-sm">
                            with {show.dj}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {show.startTime} - {show.endTime}
                      </p>
                      {show.isLive && show.progress && (
                        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-secondary rounded-full"
                            style={{ width: `${show.progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-muted-foreground text-sm hidden sm:block">
                        {show.displayTime}
                      </span>
                      {show.isLive ? (
                        <LiveBadge size="sm" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Users size={14} className="text-muted-foreground" />
                        </div>
                      )}
                      <button className="text-muted-foreground hover:text-foreground">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Ongoing Shows Bar */}
            <div className="mt-6 flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Ongoing Shows:</span>
              <span className="text-primary font-medium">Moke: Tony</span>
              <span className="text-muted-foreground">Now:</span>
              <span className="text-foreground font-medium">The Hip Hop Show</span>
              <div className="flex gap-1 ml-2">
                <span className="w-2 h-2 bg-primary rounded-full" />
                <span className="w-2 h-2 bg-muted rounded-full" />
                <span className="w-2 h-2 bg-muted rounded-full" />
              </div>
            </div>
          </div>

          {/* CTA Sidebar */}
          <div className="space-y-6">
            {/* Start Broadcasting CTA */}
            <div className="glass-panel rounded-xl p-6">
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                Start Your Own Internet Radio Station
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Get a free 7 day trial
              </p>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                Start Broadcasting
              </Button>
            </div>

            {/* App Downloads */}
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="aspect-video relative">
                <img 
                  src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=300&fit=crop"
                  alt="DJ at work"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              </div>
              <div className="p-4 flex gap-3">
                <Button variant="outline" size="sm" className="flex-1 gap-2 text-xs">
                  <span>▶</span> Google Play
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-2 text-xs">
                  <span></span> App Store
                </Button>
              </div>
            </div>

            {/* Promo Image */}
            <div className="rounded-xl overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=300&fit=crop"
                alt="DJ Studio"
                className="w-full h-48 object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScheduleSection;
