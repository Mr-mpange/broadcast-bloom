import { Instagram, Twitter, Music } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DJ {
  id: number;
  name: string;
  role: string;
  genre: string;
  image: string;
  socials: {
    instagram?: string;
    twitter?: string;
    spotify?: string;
  };
}

const DJSection = () => {
  const djs: DJ[] = [
    {
      id: 1,
      name: "DJ Spinall",
      role: "Head of Music",
      genre: "Afrobeats",
      image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop",
      socials: { instagram: "#", twitter: "#", spotify: "#" },
    },
    {
      id: 2,
      name: "DJ Cuppy",
      role: "Morning Show Host",
      genre: "Afropop",
      image: "https://images.unsplash.com/photo-1559386484-97dfc0e15539?w=400&h=400&fit=crop",
      socials: { instagram: "#", twitter: "#" },
    },
    {
      id: 3,
      name: "Black Coffee",
      role: "Resident DJ",
      genre: "Deep House",
      image: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400&h=400&fit=crop",
      socials: { instagram: "#", spotify: "#" },
    },
    {
      id: 4,
      name: "Kabza De Small",
      role: "Amapiano Specialist",
      genre: "Amapiano",
      image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=400&fit=crop",
      socials: { instagram: "#", twitter: "#", spotify: "#" },
    },
  ];

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
                  src={dj.image}
                  alt={dj.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                
                {/* Genre Badge */}
                <span className="absolute top-4 right-4 text-xs px-3 py-1 rounded-full bg-primary/90 text-primary-foreground font-semibold">
                  {dj.genre}
                </span>

                {/* Social Icons - Show on hover */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {dj.socials.instagram && (
                    <Button variant="glass" size="icon" className="h-9 w-9" asChild>
                      <a href={dj.socials.instagram} target="_blank" rel="noopener noreferrer">
                        <Instagram size={16} />
                      </a>
                    </Button>
                  )}
                  {dj.socials.twitter && (
                    <Button variant="glass" size="icon" className="h-9 w-9" asChild>
                      <a href={dj.socials.twitter} target="_blank" rel="noopener noreferrer">
                        <Twitter size={16} />
                      </a>
                    </Button>
                  )}
                  {dj.socials.spotify && (
                    <Button variant="glass" size="icon" className="h-9 w-9" asChild>
                      <a href={dj.socials.spotify} target="_blank" rel="noopener noreferrer">
                        <Music size={16} />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                  {dj.name}
                </h3>
                <p className="text-muted-foreground text-sm">{dj.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DJSection;
