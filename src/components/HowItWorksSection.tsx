import { Globe, MessageSquare, TrendingUp } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      icon: Globe,
      title: "Stream Live",
      description: "Broadcast audio online in real-time from your studio or computer.",
    },
    {
      icon: MessageSquare,
      title: "Engage Listeners",
      description: "Chat with your listeners and take live requests to build your community.",
    },
    {
      icon: TrendingUp,
      title: "Analyze & Grow",
      description: "View detailed analytics on your listener count, locations, and playback sessions.",
    },
  ];

  return (
    <section className="py-16 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-10">
          How It Works
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group glass-panel rounded-xl p-6 transition-all duration-300 hover:border-primary/50"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-display font-semibold text-lg text-primary">
                  {step.title}
                </h3>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
