import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartStreaming = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const handleListenLive = () => {
    const scheduleSection = document.getElementById("schedule");
    if (scheduleSection) {
      scheduleSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 pb-16 overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1920&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      
      {/* Decorative wave pattern at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32">
        <svg viewBox="0 0 1440 100" fill="none" className="w-full h-full" preserveAspectRatio="none">
          <path 
            d="M0,50 C360,100 720,0 1080,50 C1260,75 1380,75 1440,50 L1440,100 L0,100 Z" 
            fill="url(#wave-gradient)" 
            opacity="0.3"
          />
          <defs>
            <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-xl">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight">
            <span className="text-primary italic">Broadcast</span> Your{" "}
            <br />
            Voice to the World!
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md">
            Broadcast live. Stream online radio shows to a global audience.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="default" 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
              onClick={handleStartStreaming}
            >
              Start Streaming
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-primary/50 text-foreground hover:bg-primary/10 gap-2"
              onClick={handleListenLive}
            >
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Listen Live
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
