import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Music, Filter, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Show {
  id: string;
  name: string;
  description: string | null;
  genre: string | null;
  image_url: string | null;
  is_active: boolean;
  host: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const Shows = () => {
  const [shows, setShows] = useState<Show[]>([]);
  const [filteredShows, setFilteredShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchShows = async () => {
      const { data: showsData, error } = await supabase
        .from("shows")
        .select(`
          id,
          name,
          description,
          genre,
          image_url,
          is_active,
          host_id
        `)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching shows:", error);
        setLoading(false);
        return;
      }

      // Get unique host IDs and fetch profiles
      const hostIds = [...new Set((showsData || []).map(s => s.host_id).filter(Boolean))];
      let profilesMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};

      if (hostIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", hostIds);

        if (profilesData) {
          profilesMap = profilesData.reduce((acc, p) => {
            acc[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url };
            return acc;
          }, {} as Record<string, { display_name: string | null; avatar_url: string | null }>);
        }
      }

      // Combine data
      const combinedShows: Show[] = (showsData || []).map(show => ({
        id: show.id,
        name: show.name,
        description: show.description,
        genre: show.genre,
        image_url: show.image_url,
        is_active: show.is_active ?? true,
        host: show.host_id ? profilesMap[show.host_id] || null : null,
      }));

      setShows(combinedShows);
      setFilteredShows(combinedShows);

      // Extract unique genres
      const uniqueGenres = [...new Set(combinedShows.map(s => s.genre).filter(Boolean))] as string[];
      setGenres(uniqueGenres.sort());

      setLoading(false);
    };

    fetchShows();
  }, []);

  useEffect(() => {
    let result = shows;

    // Filter by genre
    if (selectedGenre !== "all") {
      result = result.filter(show => show.genre === selectedGenre);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        show =>
          show.name.toLowerCase().includes(query) ||
          show.description?.toLowerCase().includes(query) ||
          show.host?.display_name?.toLowerCase().includes(query)
      );
    }

    setFilteredShows(result);
  }, [shows, selectedGenre, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 sm:py-20 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <Radio size={18} />
                <span className="text-sm font-medium">All Shows</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-4">
                Discover Our <span className="broadcast-gradient">Shows</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Explore our diverse lineup of radio shows, from chart-topping hits to underground beats.
              </p>
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="py-8 border-b border-border bg-card/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search shows, hosts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Filter size={18} className="text-muted-foreground hidden sm:block" />
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="w-full sm:w-48 bg-background">
                    <SelectValue placeholder="Filter by genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Shows Grid */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-pulse text-muted-foreground">Loading shows...</div>
              </div>
            ) : filteredShows.length === 0 ? (
              <div className="text-center py-20">
                <Music size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No shows found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || selectedGenre !== "all"
                    ? "Try adjusting your filters"
                    : "Check back later for new shows"}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-8">
                  <p className="text-muted-foreground">
                    Showing <span className="text-foreground font-medium">{filteredShows.length}</span>{" "}
                    {filteredShows.length === 1 ? "show" : "shows"}
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredShows.map((show) => (
                    <Link
                      key={show.id}
                      to={`/shows/${show.id}`}
                      className="group glass-panel rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300"
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={show.image_url || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&h=400&fit=crop"}
                          alt={show.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                        {show.genre && (
                          <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium">
                            {show.genre}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-display text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                          {show.name}
                        </h3>
                        {show.host?.display_name && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Hosted by {show.host.display_name}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {show.description || "Tune in for the best beats and entertainment."}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Shows;
