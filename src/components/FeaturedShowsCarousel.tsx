import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, Heart, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

interface Show {
  id: string;
  name: string;
  description: string | null;
  genre: string | null;
  image_url: string | null;
  host_name: string | null;
}

const FeaturedShowsCarousel = () => {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    const fetchFeaturedShows = async () => {
      try {
        console.log('Fetching featured shows...');
        
        // First try to get featured shows, fallback to all active shows
        const { data: showsData, error } = await supabase
          .from("shows")
          .select("id, name, description, genre, image_url, host_id, is_featured, created_at")
          .eq("is_active", true)
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(12);

        if (error) {
          console.error("Error fetching featured shows:", error);
          setLoading(false);
          return;
        }

        console.log('Shows data received:', showsData);

        if (!showsData || showsData.length === 0) {
          console.log('No shows found in database');
          setShows([]);
          setLoading(false);
          return;
        }

        // Fetch host profiles
        const hostIds = [...new Set(showsData.map((s) => s.host_id).filter(Boolean))];
        let profilesMap: Record<string, string> = {};

        if (hostIds.length > 0) {
          console.log('Fetching host profiles for IDs:', hostIds);
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", hostIds);

          if (profilesData) {
            profilesMap = profilesData.reduce((acc, p) => {
              acc[p.id] = p.display_name || "Unknown Host";
              return acc;
            }, {} as Record<string, string>);
            console.log('Profiles map:', profilesMap);
          }
        }

        const combinedShows: Show[] = showsData.map((show) => ({
          id: show.id,
          name: show.name,
          description: show.description,
          genre: show.genre,
          image_url: show.image_url,
          host_name: show.host_id ? profilesMap[show.host_id] || null : null,
        }));

        console.log('Final combined shows:', combinedShows);
        setShows(combinedShows);
      } catch (error) {
        console.error("Error in fetchFeaturedShows:", error);
        setShows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedShows();
  }, []);

  if (loading) {
    return (
      <section className="py-16 sm:py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="animate-pulse text-center text-muted-foreground">
            Loading featured shows...
          </div>
        </div>
      </section>
    );
  }

  if (shows.length === 0) {
    return (
      <section className="py-16 sm:py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
                <Star size={18} />
                <span className="text-sm font-medium">Featured Shows</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                Top Radio Shows
              </h2>
            </div>
          </div>
          <div className="text-center py-12 text-muted-foreground">
            <Star className="mx-auto h-16 w-16 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Shows Available Yet</h3>
            <p className="text-sm">Amazing radio shows will be featured here soon!</p>
            <p className="text-xs mt-2">Check back later for the best content.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Star size={18} />
              <span className="text-sm font-medium">Featured Shows</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Top Radio Shows
            </h2>
          </div>
          <Link to="/shows">
            <Button variant="ghost" className="gap-2">
              View All
              <ChevronRight size={18} />
            </Button>
          </Link>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {shows.map((show) => (
              <CarouselItem key={show.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <div className="group glass-panel rounded-2xl overflow-hidden h-full">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={show.image_url || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&h=400&fit=crop"}
                      alt={show.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(show.id);
                      }}
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
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex -left-4" />
          <CarouselNext className="hidden sm:flex -right-4" />
        </Carousel>
      </div>
    </section>
  );
};

export default FeaturedShowsCarousel;
