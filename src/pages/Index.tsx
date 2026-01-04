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

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturedShowsCarousel />
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
