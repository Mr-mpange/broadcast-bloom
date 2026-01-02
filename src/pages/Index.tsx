import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import ScheduleSection from "@/components/ScheduleSection";
import DJSection from "@/components/DJSection";
import FeaturesSection from "@/components/FeaturesSection";
import BlogSection from "@/components/BlogSection";
import TestimonialSection from "@/components/TestimonialSection";
import Footer from "@/components/Footer";
import MobilePlayer from "@/components/MobilePlayer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <ScheduleSection />
        <DJSection />
        <FeaturesSection />
        <BlogSection />
        <TestimonialSection />
      </main>
      <Footer />
      <MobilePlayer />
    </div>
  );
};

export default Index;
