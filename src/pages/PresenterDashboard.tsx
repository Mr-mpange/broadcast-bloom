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
import LiveChat from "@/components/LiveChat";
import BroadcastControlPanel from "@/components/BroadcastControlPanel";
import GeolocationListenerMap from "@/components/GeolocationListenerMap";
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
  Mic,
} from "lucide-react";

const PresenterDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { shows, isDJ, loading, updateNowPlaying, profile, refetchShows } = useDJData();
  const { listenerStats } = useGeolocationListeners();
  const { nowPlaying } = useNowPlaying();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [trackTitle, setTrackTitle] = useState("");
  const [trackArtist, setTrackArtist] = useState("");
  const [selectedShow, setSelectedShow] = useState("");
  const [updating, setUpdating] = useState(false);
  const [isPresenter, setIsPresenter] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkPresenterRole = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["presenter", "admin"]);
      
      const hasPresenterAccess = data && data.length > 0;
      setIsPresenter(hasPresenterAccess);
      
      if (!loading && !hasPresenterAccess) {
        toast({
          title: "Access Denied",
          description: "You need Presenter or Admin privileges to access this page.",
          variant: "destructive",
        });
        navigate("/");
      }
    };

    if (user) {
      checkPresenterRole();
    }
  }, [user, loading, navigate, toast]);

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
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-3 mb-8">
          <Mic className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl font-bold text-foreground">
            Presenter Dashboard
          </h1>
        </div>

        {/* Broadcast Control Panel - Priority Component */}
        <div className="mb-8">
          <BroadcastControlPanel />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="glass-panel border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Music className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Shows</p>
                  <p className="text-2xl font-bold text-foreground">
                    {shows.filter((s) => s.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Listeners</p>
                  <p className="text-2xl font-bold text-foreground">
                    {avgListeners.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Countries</p>
                  <p className="text-2xl font-bold text-foreground">
                    {uniqueCountries}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <TrendingUp className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Plays</p>
                  <p className="text-2xl font-bold text-foreground">
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
          <Tabs defaultValue="broadcast" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="broadcast">Broadcast Control</TabsTrigger>
              <TabsTrigger value="listeners">Live Listeners</TabsTrigger>
              <TabsTrigger value="shows">Show Management</TabsTrigger>
              <TabsTrigger value="chat">Live Chat</TabsTrigger>
            </TabsList>
            
            <TabsContent value="broadcast" className="mt-6">
              <div className="grid gap-6">
                <Card className="glass-panel border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="h-5 w-5 text-primary" />
                      Professional Broadcasting Controls
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Full control panel for live broadcasting with microphone control and show management
                    </p>
                  </CardHeader>
                </Card>
                
                <BroadcastControlPanel />
              </div>
            </TabsContent>
            
            <TabsContent value="listeners" className="mt-6">
              <div className="grid gap-6">
                <Card className="glass-panel border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      Real-Time Listener Tracking
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
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

            <TabsContent value="chat" className="mt-6">
              <div className="grid gap-6">
                <Card className="glass-panel border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      Interact with Your Listeners
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Chat with your audience in real-time during your live broadcast
                    </p>
                  </CardHeader>
                </Card>
                
                <div className="h-[600px]">
                  <LiveChat className="h-full" />
                </div>
              </div>
            </TabsContent>
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

export default PresenterDashboard;