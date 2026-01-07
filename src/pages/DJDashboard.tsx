import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDJData } from "@/hooks/useDJData";
import { useNowPlaying } from "@/hooks/useNowPlaying";
import Header from "@/components/Header";
import ShowManagement from "@/components/ShowManagement";
import LiveShowManager from "@/components/LiveShowManager";
import BlogManagement from "@/components/BlogManagement";
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
  FileText,
} from "lucide-react";

const DJDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { shows, listenerStats, isDJ, loading, updateNowPlaying, profile, refetchShows } = useDJData();
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
    if (!loading && !isDJ && user) {
      toast({
        title: "Access Denied",
        description: "You need DJ, Presenter, or Admin privileges to access this page.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [loading, isDJ, user, navigate, toast]);

  useEffect(() => {
    // Check if user can manage blogs (admin or presenter)
    const checkBlogPermissions = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "presenter"]);
      
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

  // Calculate stats
  const totalListeners = listenerStats.reduce(
    (acc, stat) => acc + (stat.listener_count || 0),
    0
  );
  const uniqueCountries = new Set(
    listenerStats.filter((s) => s.country).map((s) => s.country)
  ).size;
  const avgListeners = listenerStats.length
    ? Math.round(totalListeners / listenerStats.length)
    : 0;

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
          <Radio className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl font-bold text-foreground">
            DJ Dashboard
          </h1>
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
          <Tabs defaultValue="shows" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="shows">Show Management</TabsTrigger>
              {canManageBlogs && <TabsTrigger value="blogs">Blog Management</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="shows" className="mt-6">
              {profile && (
                <ShowManagement 
                  shows={shows} 
                  profileId={profile.id} 
                  onShowsChange={refetchShows} 
                />
              )}
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

        {/* Listener Stats */}
        {listenerStats.length > 0 && (
          <Card className="glass-panel border-border/50 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5 text-primary" />
                Recent Listener Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {listenerStats.slice(0, 8).map((stat) => (
                  <div
                    key={stat.id}
                    className="p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {stat.country || "Unknown"}
                      </span>
                      <span className="font-semibold text-foreground">
                        {stat.listener_count?.toLocaleString() || 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(stat.recorded_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default DJDashboard;
