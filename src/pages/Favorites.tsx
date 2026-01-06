import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Music, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Show {
  id: string;
  name: string;
  description: string | null;
  genre: string | null;
  image_url: string | null;
  host_name: string | null;
}

const Favorites = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { favorites, toggleFavorite, isFavorite, loading: favoritesLoading } = useFavorites();
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchFavoriteShows = async () => {
      if (favorites.length === 0) {
        setShows([]);
        setLoading(false);
        return;
      }

      const { data: showsData, error } = await supabase
        .from("shows")
        .select("id, name, description, genre, image_url, host_id")
        .in("id", favorites);

      if (error) {
        console.error("Error fetching favorite shows:", error);
        setLoading(false);
        return;
      }

      // Fetch host profiles
      const hostIds = [...new Set((showsData || []).map((s) => s.host_id).filter(Boolean))];
      let profilesMap: Record<string, string> = {};

      if (hostIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", hostIds);

        if (profilesData) {
          profilesMap = profilesData.reduce((acc, p) => {
            acc[p.id] = p.display_name || "Unknown Host";
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const combinedShows: Show[] = (showsData || []).map((show) => ({
        id: show.id,
        name: show.name,
        description: show.description,
        genre: show.genre,
        image_url: show.image_url,
        host_name: show.host_id ? profilesMap[show.host_id] || null : null,
      }));

      setShows(combinedShows);
      setLoading(false);
    };

    if (!favoritesLoading) {
      fetchFavoriteShows();
    }
  }, [favorites, favoritesLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link to="/">
              <Button variant="ghost" className="mb-4 gap-2">
                <ArrowLeft size={18} />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-500/10">
                <Heart className="h-8 w-8 text-red-500 fill-red-500" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">
                  My Favorites
                </h1>
                <p className="text-muted-foreground">
                  {shows.length} {shows.length === 1 ? "show" : "shows"} saved
                </p>
              </div>
            </div>
          </div>

          {/* Favorites Grid */}
          {loading || favoritesLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading your favorites...
            </div>
          ) : shows.length === 0 ? (
            <div className="text-center py-16">
              <Music className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No favorites yet
              </h2>
              <p className="text-muted-foreground mb-6">
                Start exploring shows and save your favorites!
              </p>
              <Link to="/shows">
                <Button>Browse Shows</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shows.map((show) => (
                <div
                  key={show.id}
                  className="group glass-panel rounded-2xl overflow-hidden"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={show.image_url || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&h=400&fit=crop"}
                      alt={show.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <button
                      onClick={() => toggleFavorite(show.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors"
                    >
                      <Heart
                        size={18}
                        className={cn(
                          "transition-colors",
                          isFavorite(show.id)
                            ? "fill-red-500 text-red-500"
                            : "text-foreground"
                        )}
                      />
                    </button>
                    {show.genre && (
                      <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium">
                        {show.genre}
                      </span>
                    )}
                  </div>
                  <Link to={`/shows/${show.id}`} className="block p-4">
                    <h3 className="font-display text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {show.name}
                    </h3>
                    {show.host_name && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Hosted by {show.host_name}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {show.description || "Tune in for the best beats and entertainment."}
                    </p>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;
