import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FeaturedShowsCarousel from "@/components/FeaturedShowsCarousel";
import ScheduleSection from "@/components/ScheduleSection";
import DJSection from "@/components/DJSection";
import FeaturesSection from "@/components/FeaturesSection";
import BlogSection from "@/components/BlogSection";
import TestimonialSection from "@/components/TestimonialSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import MobilePlayer from "@/components/MobilePlayer";
import LivePlayer from "@/components/LivePlayer";
import LiveChat from "@/components/LiveChat";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="relative">
        <HeroSection />
        <HowItWorksSection />
        <FeaturedShowsCarousel />
        
        {/* Live Player & Chat Section */}
        <section id="live-player" className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Listen Live & Chat
              </h2>
              <p className="text-muted-foreground">
                Join the live broadcast and chat with other listeners in real-time
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {/* Live Player */}
              <div className="order-2 lg:order-1">
                <LivePlayer />
              </div>
              
              {/* Live Chat */}
              <div className="order-1 lg:order-2">
                <LiveChat className="h-[600px]" />
              </div>
            </div>
            
            {/* Mobile Chat Toggle - Show chat below player on mobile */}
            <div className="lg:hidden mt-6">
              <div className="text-center text-sm text-muted-foreground">
                💬 Chat with other listeners above while you listen!
              </div>
            </div>
          </div>
        </section>
        
        <ScheduleSection />
        <DJSection />
        <FeaturesSection />
        <BlogSection />
        <TestimonialSection />
        <ContactSection />
      </main>
      <Footer />
      <MobilePlayer />
    </div>
  );
};

export default Index;
