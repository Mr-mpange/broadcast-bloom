import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDJData } from "@/hooks/useDJData";
import { useNowPlaying } from "@/hooks/useNowPlaying";
import { useGeolocationListeners } from "@/hooks/useGeolocationListeners";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import ShowManagement from "@/components/ShowManagement";
import LiveShowManager from "@/components/LiveShowManager";
import BlogManagement from "@/components/BlogManagement";
import LiveChat from "@/components/LiveChat";
import LocalAudioPlayer from "@/components/LocalAudioPlayer";
import BroadcastControlPanel from "@/components/BroadcastControlPanel";
import AudioContentManager from "@/components/AudioContentManager";
import QuickAudioSetup from "@/components/QuickAudioSetup";
import LiveAudioQueue from "@/components/LiveAudioQueue";
import GeolocationListenerMap from "@/components/GeolocationListenerMap";
import HardwareMixerControl from "@/components/HardwareMixerControl";
import MixerTroubleshootingGuide from "@/components/MixerTroubleshootingGuide";
import AudioDeviceDiagnostics from "@/components/AudioDeviceDiagnostics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Radio,
  Music,
  Users,
  Globe,
  Play,
  TrendingUp,
  MessageCircle,
  Headphones,
  Mic,
  Zap,
} from "lucide-react";

const DJDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { shows, loading, updateNowPlaying, profile, refetchShows } = useDJData();
  const { listenerStats } = useGeolocationListeners();
  const { nowPlaying } = useNowPlaying();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [trackTitle, setTrackTitle] = useState("");
  const [trackArtist, setTrackArtist] = useState("");
  const [selectedShow, setSelectedShow] = useState("");
  const [updating, setUpdating] = useState(false);
  const [canManageBlogs, setCanManageBlogs] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkDJRole = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["dj", "admin"]);
      
      const hasDJAccess = data && data.length > 0;
      
      if (!loading && !hasDJAccess) {
        toast({
          title: "Access Denied",
          description: "You need DJ or Admin privileges to access this page.",
          variant: "destructive",
        });
        navigate("/");
      }
    };

    if (user) {
      checkDJRole();
    }
  }, [user, loading, navigate, toast]);

  useEffect(() => {
    // Check if user can manage blogs (admin or moderator)
    const checkBlogPermissions = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "moderator"]);
      
      setCanManageBlogs(data && data.length > 0);
    };

    if (user) {
      checkBlogPermissions();
    }
  }, [user]);

  const handleUpdateNowPlaying = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackTitle.trim() || !trackArtist.trim()) {
      toast({
        title: "Missing Info",
        description: "Please enter both track title and artist.",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    const { error } = await updateNowPlaying(
      trackTitle,
      trackArtist,
      selectedShow || undefined
    );
    setUpdating(false);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated!",
        description: "Now playing info has been updated.",
      });
      setTrackTitle("");
      setTrackArtist("");
    }
  };

  // Calculate stats from geolocation data
  const totalListeners = listenerStats.total_listeners;
  const uniqueCountries = listenerStats.countries.length;
  const avgListeners = totalListeners;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 pt-20 sm:pt-24">
        <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          <Radio className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            DJ Dashboard
          </h1>
        </div>

        {/* Broadcast Control Panel - Priority Component */}
        <div className="mb-6 sm:mb-8">
          <BroadcastControlPanel />
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="glass-panel border-border/50">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-xl bg-primary/10">
                  <Music className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Active Shows</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {shows.filter((s) => s.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-xl bg-secondary/10">
                  <Users className="h-4 w-4 sm:h-6 sm:w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Avg. Listeners</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {avgListeners.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-xl bg-primary/10">
                  <Globe className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Countries</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {uniqueCountries}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-xl bg-secondary/10">
                  <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Plays</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {totalListeners.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Live Show Manager */}
          <LiveShowManager shows={shows} />

          {/* Update Now Playing */}
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Play className="h-5 w-5 text-primary" />
                Update Now Playing
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nowPlaying && (
                <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Currently Playing
                  </p>
                  <p className="font-semibold text-foreground">
                    {nowPlaying.track_title || "Unknown Track"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {nowPlaying.track_artist || "Unknown Artist"}
                  </p>
                </div>
              )}
              <form onSubmit={handleUpdateNowPlaying} className="space-y-4">
                <div>
                  <Label htmlFor="trackTitle" className="text-foreground">
                    Track Title
                  </Label>
                  <Input
                    id="trackTitle"
                    value={trackTitle}
                    onChange={(e) => setTrackTitle(e.target.value)}
                    placeholder="Enter track title..."
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="trackArtist" className="text-foreground">
                    Artist
                  </Label>
                  <Input
                    id="trackArtist"
                    value={trackArtist}
                    onChange={(e) => setTrackArtist(e.target.value)}
                    placeholder="Enter artist name..."
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="show" className="text-foreground">
                    Show (Optional)
                  </Label>
                  <select
                    id="show"
                    value={selectedShow}
                    onChange={(e) => setSelectedShow(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-background border border-border text-foreground"
                  >
                    <option value="">Select a show...</option>
                    {shows.map((show) => (
                      <option key={show.id} value={show.id}>
                        {show.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={updating}>
                  {updating ? "Updating..." : "Update Now Playing"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <div className="mt-6">
          <Tabs defaultValue="hardware" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-1">
              <TabsTrigger value="hardware" className="text-xs sm:text-sm">
                <Zap className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Hardware</span>
                <span className="sm:hidden">Mixer</span>
              </TabsTrigger>
              <TabsTrigger value="broadcast" className="text-xs sm:text-sm">
                <Mic className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Broadcast</span>
                <span className="sm:hidden">Live</span>
              </TabsTrigger>
              <TabsTrigger value="listeners" className="text-xs sm:text-sm">
                <Users className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Listeners</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
              <TabsTrigger value="shows" className="text-xs sm:text-sm">
                <Music className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Shows</span>
                <span className="sm:hidden">Shows</span>
              </TabsTrigger>
              <TabsTrigger value="audio" className="text-xs sm:text-sm">
                <Headphones className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Audio</span>
                <span className="sm:hidden">Audio</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="text-xs sm:text-sm">
                <MessageCircle className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Chat</span>
                <span className="sm:hidden">Chat</span>
              </TabsTrigger>
              {canManageBlogs && (
                <TabsTrigger value="blogs" className="text-xs sm:text-sm col-span-2 sm:col-span-1">
                  <MessageCircle className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Blogs</span>
                  <span className="sm:hidden">Blog</span>
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="hardware" className="mt-6">
              <div className="space-y-6">
                <Card className="glass-panel border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Hardware Mixer Control
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Connect and control your physical DJ mixer hardware for live broadcasting
                    </p>
                  </CardHeader>
                </Card>
                
                <HardwareMixerControl />
                
                <AudioDeviceDiagnostics />
                
                <MixerTroubleshootingGuide />
              </div>
            </TabsContent>
            
            <TabsContent value="broadcast" className="mt-6">
              <div className="grid gap-6">
                <Card className="glass-panel border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Professional Broadcasting Controls
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Full control panel for live broadcasting with role-based permissions, microphone control, and emergency override capabilities
                    </p>
                  </CardHeader>
                </Card>
                
                <QuickAudioSetup />
                
                <LiveAudioQueue />
                
                <BroadcastControlPanel />
              </div>
            </TabsContent>
            <TabsContent value="listeners" className="mt-6">
              <div className="grid gap-6">
                <Card className="glass-panel border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Real-Time Listener Tracking
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Live geolocation-based listener statistics and geographic distribution
                    </p>
                  </CardHeader>
                </Card>
                
                <GeolocationListenerMap />
              </div>
            </TabsContent>
            
            <TabsContent value="shows" className="mt-6">
              {profile && (
                <ShowManagement 
                  shows={shows} 
                  profileId={profile.id} 
                  onShowsChange={refetchShows} 
                />
              )}
            </TabsContent>

            <TabsContent value="audio" className="mt-6">
              <div className="grid gap-6">
                <Card className="glass-panel border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <Headphones className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Audio Management
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Manage your station's audio content library and upload files for broadcasting
                    </p>
                  </CardHeader>
                </Card>
                
                <AudioContentManager />
                
                <LiveAudioQueue />
                
                <Card className="glass-panel border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <Headphones className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Local Audio Player
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Upload and play audio files directly from your computer for live broadcasting
                    </p>
                  </CardHeader>
                </Card>
                
                <LocalAudioPlayer />
              </div>
            </TabsContent>

            <TabsContent value="chat" className="mt-6">
              <div className="grid gap-6">
                <Card className="glass-panel border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Interact with Your Listeners
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Chat with your audience in real-time during your live broadcast
                    </p>
                  </CardHeader>
                </Card>
                
                <div className="h-[500px] sm:h-[600px]">
                  <LiveChat className="h-full" />
                </div>
              </div>
            </TabsContent>
            
            {canManageBlogs && (
              <TabsContent value="blogs" className="mt-6">
                {profile && (
                  <BlogManagement 
                    profileId={profile.id} 
                    canManageAll={profile.role === 'admin'} 
                  />
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Real-Time Listener Overview */}
        {listenerStats.total_listeners > 0 && (
          <Card className="glass-panel border-border/50 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5 text-primary" />
                Live Listener Overview
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Real-time geolocation-based listener statistics
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {listenerStats.countries.slice(0, 8).map((country) => (
                  <div
                    key={country.country_code}
                    className="p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {country.country_name}
                      </span>
                      <span className="font-semibold text-foreground">
                        {country.listener_count.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Live listeners
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  View detailed listener map in the "Live Listeners" tab
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default DJDashboard;
