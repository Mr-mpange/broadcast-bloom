import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import LiveBadge from "./LiveBadge";
import { useSchedule } from "@/hooks/useSchedule";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalLiveStatus } from "@/hooks/useGlobalLiveStatus";

const ScheduleSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { liveShows } = useGlobalLiveStatus();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date().getDay();
  const [activeDayIndex, setActiveDayIndex] = useState(today);
  
  const { scheduleShows, loading } = useSchedule(activeDayIndex);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isShowLive = (startTime: string, endTime: string) => {
    const now = new Date();
    const currentDay = now.getDay();
    if (currentDay !== activeDayIndex) return false;
    
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  const getProgress = (startTime: string, endTime: string) => {
    const now = new Date();
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    return Math.min(100, Math.max(0, ((currentMinutes - startMinutes) / (endMinutes - startMinutes)) * 100));
  };

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
              {days.map((day, index) => (
                <button
                  key={day}
                  onClick={() => setActiveDayIndex(index)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                    activeDayIndex === index
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
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading schedule...</div>
              ) : scheduleShows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No shows scheduled for this day.</div>
              ) : (
                scheduleShows.map((item) => {
                  const show = item.show;
                  if (!show) return null;
                  
                  // Check if this show is actually live (not just scheduled)
                  const isActuallyLive = Array.isArray(liveShows) && liveShows.some(liveShow => liveShow.id === show.id);
                  const isScheduledLive = isShowLive(item.start_time, item.end_time);
                  const progress = isScheduledLive ? getProgress(item.start_time, item.end_time) : 0;
                  
                  return (
                    <Link
                      key={item.id}
                      to={`/shows/${show.id}`}
                      className={cn(
                        "glass-panel rounded-xl p-4 transition-all duration-300 block hover:bg-muted/50",
                        isActuallyLive && "border-primary/30 bg-primary/5"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        {/* DJ Image */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={show.image_url || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=100&h=100&fit=crop"} 
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
                            {show.host?.display_name && (
                              <span className="text-muted-foreground text-sm">
                                with {show.host.display_name}
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {formatTime(item.start_time)} - {formatTime(item.end_time)}
                          </p>
                          {isScheduledLive && (
                            <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-secondary rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {show.genre && (
                            <span className="text-muted-foreground text-xs hidden sm:block px-2 py-1 bg-muted rounded-full">
                              {show.genre}
                            </span>
                          )}
                          {isActuallyLive ? (
                            <LiveBadge size="sm" isLive={true} />
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
                    </Link>
                  );
                })
              )}
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
                {user ? "Go to your dashboard to start broadcasting" : "Sign in as a DJ to start broadcasting"}
              </p>
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                onClick={() => navigate(user ? "/dj" : "/auth")}
              >
                {user ? "Go to DJ Dashboard" : "Sign In to Broadcast"}
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
