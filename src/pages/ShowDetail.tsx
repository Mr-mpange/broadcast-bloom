import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, Music, User, Play, Twitter, Facebook, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveChat from "@/components/LiveChat";
import { useToast } from "@/hooks/use-toast";

interface Show {
  id: string;
  name: string;
  description: string | null;
  genre: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  host: {
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  } | null;
}

interface ScheduleSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ShowDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [show, setShow] = useState<Show | null>(null);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = show ? `Check out "${show.name}" on PULSE FM!` : "Check out this show on PULSE FM!";

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(twitterUrl, "_blank", "width=550,height=420");
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, "_blank", "width=550,height=420");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard.",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL from your browser.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchShow = async () => {
      if (!id) return;

      const { data: showData, error: showError } = await supabase
        .from("shows")
        .select(`
          id,
          name,
          description,
          genre,
          image_url,
          is_active,
          created_at,
          host:profiles!shows_host_id_fkey (
            display_name,
            avatar_url,
            bio
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (showError) {
        console.error("Error fetching show:", showError);
      } else {
        setShow(showData as unknown as Show);
      }

      const { data: scheduleData, error: scheduleError } = await supabase
        .from("schedule")
        .select("id, day_of_week, start_time, end_time")
        .eq("show_id", id)
        .order("day_of_week", { ascending: true });

      if (scheduleError) {
        console.error("Error fetching schedule:", scheduleError);
      } else {
        setSchedule(scheduleData || []);
      }

      setLoading(false);
    };

    fetchShow();
  }, [id]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-pulse">Loading show details...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Show Not Found</h1>
          <Link to="/" className="text-primary hover:underline">
            Return to Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Banner */}
        <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
          <img
            src={show.image_url || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&h=600&fit=crop"}
            alt={show.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="container mx-auto">
              <Link 
                to="/#schedule" 
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
              >
                <ArrowLeft size={18} />
                Back to Schedule
              </Link>
              <div className="flex items-center gap-3 mb-2">
                {show.genre && (
                  <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                    {show.genre}
                  </span>
                )}
                {show.is_active && (
                  <span className="px-3 py-1 rounded-full bg-secondary/20 text-secondary text-sm font-medium">
                    Active Show
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                {show.name}
              </h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="glass-panel rounded-2xl p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">
                  About This Show
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {show.description || "No description available for this show yet. Stay tuned for updates!"}
                </p>
              </div>

              {/* Live Chat */}
              <LiveChat showId={show.id} className="h-96" />

              {/* Schedule */}
              {schedule.length > 0 && (
                <div className="glass-panel rounded-2xl p-6 sm:p-8">
                  <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-primary" />
                    Show Schedule
                  </h2>
                  <div className="space-y-3">
                    {schedule.map((slot) => (
                      <div 
                        key={slot.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/30"
                      >
                        <span className="font-medium text-foreground">
                          {dayNames[slot.day_of_week]}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Clock size={16} />
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Listen Now CTA */}
              <div className="glass-panel rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-primary/10 to-secondary/10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground mb-1">
                      Tune In Now
                    </h3>
                    <p className="text-muted-foreground">
                      Listen to our live broadcast
                    </p>
                  </div>
                  <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90" asChild>
                    <a href="/#live-player">
                      <Play size={20} />
                      Listen Live
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Host Info */}
              {show.host && (
                <div className="glass-panel rounded-2xl p-6">
                  <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <User size={18} className="text-primary" />
                    Your Host
                  </h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
                      {show.host.avatar_url ? (
                        <img 
                          src={show.host.avatar_url} 
                          alt={show.host.display_name || "Host"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <User size={24} className="text-primary" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {show.host.display_name || "Unknown DJ"}
                      </p>
                      <p className="text-sm text-muted-foreground">DJ / Host</p>
                    </div>
                  </div>
                  {show.host.bio && (
                    <p className="text-sm text-muted-foreground">{show.host.bio}</p>
                  )}
                </div>
              )}

              {/* Genre Info */}
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Music size={18} className="text-secondary" />
                  Music Genre
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium">
                    {show.genre || "Various"}
                  </span>
                </div>
              </div>

              {/* Share */}
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Share2 size={18} className="text-primary" />
                  Share This Show
                </h3>
                <div className="flex flex-col gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2 justify-start"
                    onClick={shareOnTwitter}
                  >
                    <Twitter size={16} className="text-[#1DA1F2]" />
                    Share on Twitter
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2 justify-start"
                    onClick={shareOnFacebook}
                  >
                    <Facebook size={16} className="text-[#1877F2]" />
                    Share on Facebook
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2 justify-start"
                    onClick={copyLink}
                  >
                    <Share2 size={16} />
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ShowDetail;
