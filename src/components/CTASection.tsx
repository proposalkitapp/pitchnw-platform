"use client";

import { FadeInView } from "@/components/ParallaxSection";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/use-auth";

export function CTASection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <FadeInView className="text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to close deals{" "}
            <span className="text-gradient">faster?</span>
          </h2>
          <p className="text-base lg:text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Join freelancers who are winning more projects with AI-powered proposals.
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
