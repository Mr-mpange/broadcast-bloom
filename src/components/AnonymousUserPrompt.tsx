import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Heart, Bell, MessageCircle } from "lucide-react";

interface AnonymousUserPromptProps {
  feature: "favorites" | "notifications" | "chat" | "general";
  className?: string;
}

const AnonymousUserPrompt = ({ feature, className = "" }: AnonymousUserPromptProps) => {
  const getFeatureConfig = () => {
    switch (feature) {
      case "favorites":
        return {
          icon: Heart,
          title: "Save Your Favorite Shows",
          description: "Sign up to save shows and get notified when they go live!",
          buttonText: "Sign Up to Save Favorites"
        };
      case "notifications":
        return {
          icon: Bell,
          title: "Never Miss a Show",
          description: "Get real-time notifications when your favorite shows start broadcasting.",
          buttonText: "Sign Up for Notifications"
        };
      case "chat":
        return {
          icon: MessageCircle,
          title: "Join the Conversation",
          description: "Sign in to chat with other listeners during live shows.",
          buttonText: "Sign In to Chat"
        };
      default:
        return {
          icon: UserPlus,
          title: "Join PULSE FM",
          description: "Sign up for free to unlock personalized features and never miss your favorite shows.",
          buttonText: "Sign Up Free"
        };
    }
  };

  const config = getFeatureConfig();
  const Icon = config.icon;

  return (
    <Card className={`glass-panel border-border/50 ${className}`}>
      <CardContent className="text-center p-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">
          {config.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {config.description}
        </p>
        <Button asChild className="w-full">
          <a href="/auth">{config.buttonText}</a>
        </Button>
      </CardContent>
    </Card>
  );
};

export default AnonymousUserPrompt;