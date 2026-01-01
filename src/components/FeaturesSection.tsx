import { Smartphone, Wifi, Globe2, Music2, Headphones, Radio } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Wifi,
      title: "Low Data Mode",
      description: "Optimized streaming for 2G/3G networks. Save data without sacrificing quality.",
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "Install as an app on any device. Works offline with downloaded content.",
    },
    {
      icon: Globe2,
      title: "Global Reach",
      description: "Listen from anywhere in the world. CDN-powered for lightning-fast streams.",
    },
    {
      icon: Music2,
      title: "24/7 Music",
      description: "Non-stop entertainment with live DJs and Auto-DJ when they're away.",
    },
    {
      icon: Headphones,
      title: "HD Audio",
      description: "Crystal clear AAC+ streaming at up to 320kbps for premium listeners.",
    },
    {
      icon: Radio,
      title: "Live Shows",
      description: "Interactive live shows with real-time chat and song requests.",
    },
  ];

  return (
    <section className="py-20 bg-card relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-primary font-semibold uppercase tracking-widest mb-2">
            Why Choose Us
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Built for Africa, Heard Worldwide
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience radio like never before. Our platform is designed with mobile-first 
            technology optimized for emerging markets.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group glass-panel rounded-xl p-6 transition-all duration-300 hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
