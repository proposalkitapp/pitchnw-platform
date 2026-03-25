import { FadeInView } from "@/components/ParallaxSection";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export function CTASection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px]"
      />

      <div className="container mx-auto px-4 relative z-10">
        <FadeInView className="text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to close deals{" "}
            <span className="text-gradient">faster?</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Join thousands of freelancers who are winning more projects with AI-powered proposals.
            Start for free — no credit card required.
          </p>
          <Button
            variant="hero"
            size="xl"
            onClick={() => navigate(user ? "/dashboard" : "/auth?mode=signup")}
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Button>
        </FadeInView>
      </div>
    </section>
  );
}
