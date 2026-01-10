import { useState, useEffect } from "react";
import { Instagram, Twitter, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface DJ {
  id: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  social_links?: {
    instagram?: string;
    twitter?: string;
    spotify?: string;
  };
  roles?: string[];
}

const DJSection = () => {
  const [djs, setDjs] = useState<DJ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDJsAndPresenters();
  }, []);

  const fetchDJsAndPresenters = async () => {
    try {
      // Fetch users with DJ or Presenter roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          profiles!user_roles_user_id_fkey (
            id,
            display_name,
            bio,
            avatar_url,
            social_links
          )
        `)
        .in('role', ['dj', 'presenter']);

      if (rolesError) {
        console.error('Error fetching DJs and Presenters:', rolesError);
        setLoading(false);
        return;
      }

      // Group by user and combine roles
      const djMap = new Map<string, DJ>();
      
      userRoles?.forEach(userRole => {
        const profile = userRole.profiles;
        if (!profile) return;

        const userId = profile.id;
        if (djMap.has(userId)) {
          // Add role to existing user
          const existingDJ = djMap.get(userId)!;
          existingDJ.roles = [...(existingDJ.roles || []), userRole.role];
        } else {
          // Create new DJ entry
          djMap.set(userId, {
            id: profile.id,
            display_name: profile.display_name || 'Unknown',
            bio: profile.bio || undefined,
            avatar_url: profile.avatar_url || undefined,
            social_links: profile.social_links || {},
            roles: [userRole.role]
          });
        }
      });

      setDjs(Array.from(djMap.values()));
    } catch (error) {
      console.error('Error in fetchDJsAndPresenters:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplay = (roles: string[] = []) => {
    if (roles.includes('dj') && roles.includes('presenter')) {
      return 'DJ & Presenter';
    } else if (roles.includes('dj')) {
      return 'DJ';
    } else if (roles.includes('presenter')) {
      return 'Presenter';
    }
    return 'Staff';
  };

  const getGenreFromBio = (bio?: string) => {
    // Extract genre from bio or return default
    if (bio?.toLowerCase().includes('afrobeats')) return 'Afrobeats';
    if (bio?.toLowerCase().includes('house')) return 'House';
    if (bio?.toLowerCase().includes('jazz')) return 'Jazz';
    if (bio?.toLowerCase().includes('hip hop')) return 'Hip Hop';
    if (bio?.toLowerCase().includes('amapiano')) return 'Amapiano';
    return 'Music';
  };

  if (loading) {
    return (
      <section id="djs" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary font-semibold uppercase tracking-widest mb-2">
              Meet the Team
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Our DJs & Presenters
            </h2>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            Loading our amazing team...
          </div>
        </div>
      </section>
    );
  }

  if (djs.length === 0) {
    return (
      <section id="djs" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary font-semibold uppercase tracking-widest mb-2">
              Meet the Team
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Our DJs & Presenters
            </h2>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <p>Our amazing DJs and Presenters will be featured here soon!</p>
            <p className="text-sm mt-2">Check back later to meet the team.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="djs" className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-primary font-semibold uppercase tracking-widest mb-2">
            Meet the Team
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Our DJs & Presenters
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {djs.map((dj) => (
            <div
              key={dj.id}
              className="group glass-panel rounded-2xl overflow-hidden transition-all duration-500 hover:border-primary/50 hover:transform hover:-translate-y-2"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={dj.avatar_url || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop"}
                  alt={dj.display_name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                
                {/* Genre Badge */}
                <span className="absolute top-4 right-4 text-xs px-3 py-1 rounded-full bg-primary/90 text-primary-foreground font-semibold">
                  {getGenreFromBio(dj.bio)}
                </span>

                {/* Social Icons - Show on hover */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {dj.social_links?.instagram && (
                    <Button variant="glass" size="icon" className="h-9 w-9" asChild>
                      <a href={dj.social_links.instagram} target="_blank" rel="noopener noreferrer">
                        <Instagram size={16} />
                      </a>
                    </Button>
                  )}
                  {dj.social_links?.twitter && (
                    <Button variant="glass" size="icon" className="h-9 w-9" asChild>
                      <a href={dj.social_links.twitter} target="_blank" rel="noopener noreferrer">
                        <Twitter size={16} />
                      </a>
                    </Button>
                  )}
                  {dj.social_links?.spotify && (
                    <Button variant="glass" size="icon" className="h-9 w-9" asChild>
                      <a href={dj.social_links.spotify} target="_blank" rel="noopener noreferrer">
                        <Music size={16} />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                  {dj.display_name}
                </h3>
                <p className="text-muted-foreground text-sm">{getRoleDisplay(dj.roles)}</p>
                {dj.bio && (
                  <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{dj.bio}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DJSection;
