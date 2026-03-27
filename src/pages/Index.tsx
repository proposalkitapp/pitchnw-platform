import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { TrustMarquee } from "@/components/TrustMarquee";
import { FeaturesSection } from "@/components/FeaturesSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { PricingSection } from "@/components/PricingSection";
import { MarketplaceSection } from "@/components/MarketplaceSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { CursorGlow } from "@/components/CursorGlow";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <CursorGlow />
      <Navbar />
      <HeroSection />
      <TrustMarquee />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <MarketplaceSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
