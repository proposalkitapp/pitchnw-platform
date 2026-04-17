"use client";

import { FadeInView, ParallaxSection } from "@/components/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/use-auth";

const plans = [
  {
    name: "Basic",
    price: "Free",
    period: "forever",
    badge: "Get Started",
    description: "Perfect for testing the waters",
    features: [
      "3 lifetime AI proposals",
      "Standard sales copy",
      "2 basic pitch templates",
      "Personal branding only",
      "Public proposal links",
      "Manual signatures",
    ],
    cta: "Start for free",
    variant: "outline" as const,
    highlighted: false,
  },
  {
    name: "Freelancer",
    price: "$2.99",
    period: "/month",
    badge: "Unlimited Access",
    description: "Everything you need to pitch and win",
    features: [
      "Unlimited AI Proposals",
      "Premium Sales Copy",
      "Branding Kit (Logo & Headers)",
      "Client Portal & Link",
      "Digital Signatures",
      "Proposal Analytics",
      "CRM Pipeline Dashboard",
      "PDF Export Tools",
      "AI Win-Rate Coach",
      "Priority Support"
    ],
    cta: "Get Freelancer Access",
    variant: "hero" as const,
    highlighted: true,
  },
];

export function PricingSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePlanClick = (planName: string) => {
    if (user) {
      navigate("/settings");
    } else {
      navigate(`/auth?mode=signup&intent=pro`);
    }
  };

  return (
    <ParallaxSection id="pricing" className="py-20 lg:py-28" speed={0.1}>
      <div className="container mx-auto px-4">
        <FadeInView className="text-center mb-14">
          <span className="inline-block text-xs font-semibold text-primary tracking-widest uppercase bg-primary/5 border border-primary/10 rounded-full px-3 py-1 mb-4">Pricing</span>
          <h2 className="font-display font-syne text-3xl sm:text-4xl lg:text-5xl font-[800] mt-2 mb-4">
            Simple pricing. Unlimited power.
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg max-w-xl mx-auto">
            Get Freelancer access to unlock unlimited power.<br />
            No commitment. Cancel anytime.
          </p>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <FadeInView key={i} delay={i * 0.1}>
              <div
                className={`relative rounded-2xl border p-6 lg:p-8 transition-all duration-300 ${plan.highlighted
                    ? "border-primary bg-card pt-10 shadow-lg shadow-primary/[0.06] scale-[1.02]"
                    : "border-border bg-card hover:border-primary/20"
                  }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-success/15 text-success px-4 py-1 flex items-center justify-center text-xs font-semibold">
                    {plan.badge}
                  </div>
                )}
                <h3 className="font-display text-xl font-bold text-card-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                <div className="mt-5 mb-6">
                  <span className="font-display text-4xl font-extrabold text-card-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="flex-1 break-words leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.variant}
                  size="lg"
                  className="w-full"
                  onClick={() => handlePlanClick(plan.name)}
                >
                  {plan.cta}
                </Button>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </ParallaxSection>
  );
}
