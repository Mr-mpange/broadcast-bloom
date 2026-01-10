import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDJData } from "@/hooks/useDJData";
import { useGeolocationListeners } from "@/hooks/useGeolocationListeners";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import LiveChat from "@/components/LiveChat";
import GeolocationListenerMap from "@/components/GeolocationListenerMap";
import BlogManagement from "@/components/BlogManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Users,
  Globe,
  TrendingUp,
  MessageCircle,
  FileText,
  Eye,
} from "lucide-react";

const ModeratorDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { shows, loading, profile } = useDJData();
  const { listenerStats } = useGeolocationListeners();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkModeratorRole = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["moderator", "admin"]);
      
      const hasModeratorAccess = data && data.length > 0;
      setIsModerator(hasModeratorAccess);
      
      if (!loading && !hasModeratorAccess) {
        toast({
          title: "Access Denied",
          description: "You need Moderator or Admin privileges to access this page.",
          variant: "destructive",
        });
        navigate("/");
      }
    };

    if (user) {
      checkModeratorRole();
    }
  }, [user, loading, navigate, toast]);

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
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl font-bold text-foreground">
            Moderator Dashboard
          </h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="glass-panel border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Live Listeners</p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalListeners.toLocaleString()}
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
                <div className="p-3 rounded-xl bg-primary/10">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monitoring</p>
                  <p className="text-2xl font-bold text-foreground">
                    Active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <div className="mt-6">
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat">Live Chat Moderation</TabsTrigger>
              <TabsTrigger value="listeners">Listener Analytics</TabsTrigger>
              <TabsTrigger value="content">Content Management</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="mt-6">
              <div className="grid gap-6">
                <Card className="glass-panel border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      Live Chat Moderation
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Monitor and moderate live chat messages from listeners
                    </p>
                  </CardHeader>
                </Card>
                
                <div className="h-[600px]">
                  <LiveChat className="h-full" />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="listeners" className="mt-6">
              <div className="grid gap-6">
                <Card className="glass-panel border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      Real-Time Listener Analytics
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Monitor listener activity, geographic distribution, and engagement metrics
                    </p>
                  </CardHeader>
                </Card>
                
                <GeolocationListenerMap />
                
                {/* Detailed Listener Stats */}
                {listenerStats.total_listeners > 0 && (
                  <Card className="glass-panel border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <Users className="h-5 w-5 text-primary" />
                        Detailed Listener Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {listenerStats.countries.map((country) => (
                          <div
                            key={country.country_code}
                            className="p-4 rounded-lg bg-muted/30 border border-border/50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-foreground">
                                {country.country_name}
                              </span>
                              <span className="font-bold text-primary">
                                {country.listener_count.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {((country.listener_count / totalListeners) * 100).toFixed(1)}% of total listeners
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="content" className="mt-6">
              <div className="grid gap-6">
                <Card className="glass-panel border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Content Management
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Manage blog posts, announcements, and community content
                    </p>
                  </CardHeader>
                </Card>
                
                {profile && (
                  <BlogManagement 
                    profileId={profile.id} 
                    canManageAll={true} 
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ModeratorDashboard;