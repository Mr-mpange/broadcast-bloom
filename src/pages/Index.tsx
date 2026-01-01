import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ScheduleSection from "@/components/ScheduleSection";
import DJSection from "@/components/DJSection";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import MobilePlayer from "@/components/MobilePlayer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ScheduleSection />
        <DJSection />
        <FeaturesSection />
      </main>
      <Footer />
      <MobilePlayer />
    </div>
  );
};

export default Index;
