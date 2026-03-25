import { FadeInView, ParallaxSection } from "@/components/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

const templates = [
  { name: "Clean Minimalist", category: "Web Design", rating: 4.9, uses: 342 },
  { name: "Bold Agency", category: "Branding", rating: 4.8, uses: 218 },
  { name: "Tech Startup", category: "Mobile App", rating: 4.7, uses: 891 },
  { name: "Creative Portfolio", category: "Photography", rating: 4.9, uses: 156 },
  { name: "SEO Powerhouse", category: "Digital Marketing", rating: 4.6, uses: 305 },
  { name: "E-commerce Pro", category: "E-commerce", rating: 4.8, uses: 127 },
];

export function MarketplaceSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <ParallaxSection id="marketplace" className="py-24 lg:py-32" speed={0.15}>
      <div className="container mx-auto px-4">
        <FadeInView className="text-center mb-16">
          <span className="text-sm font-mono text-primary tracking-widest uppercase">Marketplace</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Templates that <span className="text-gradient">win deals</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Browse templates built by top-earning freelancers. All templates are currently free.
          </p>
        </FadeInView>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {templates.map((template, i) => (
            <FadeInView key={i} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -4 }}
                className="group rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-glow cursor-pointer"
                onClick={() => navigate(user ? "/marketplace" : "/auth?mode=signup")}
              >
                <div className="h-36 bg-secondary/50 flex items-center justify-center border-b border-border">
                  <div className="w-3/4 space-y-2">
                    <div className="h-3 rounded bg-muted-foreground/10 w-full" />
                    <div className="h-3 rounded bg-muted-foreground/10 w-4/5" />
                    <div className="h-3 rounded bg-muted-foreground/10 w-3/5" />
                    <div className="h-2 rounded bg-primary/20 w-1/3 mt-3" />
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display text-sm font-semibold text-card-foreground">{template.name}</h3>
                    <span className="text-xs font-semibold text-success px-2 py-0.5 rounded-full bg-success/10">
                      Free
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{template.category}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      <span>{template.rating}</span>
                    </div>
                    <span>{template.uses} uses</span>
                  </div>
                </div>
              </motion.div>
            </FadeInView>
          ))}
        </div>

        <FadeInView className="text-center mt-10">
          <Button
            variant="hero-outline"
            size="lg"
            onClick={() => navigate(user ? "/marketplace" : "/auth?mode=signup")}
          >
            Browse All Templates
          </Button>
        </FadeInView>
      </div>
    </ParallaxSection>
  );
}
