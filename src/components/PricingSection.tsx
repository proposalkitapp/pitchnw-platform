import { FadeInView, ParallaxSection } from "@/components/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with AI proposals",
    features: [
      "3 AI proposals per month",
      "Free templates only",
      "Private client links",
      "3 lifetime analytics views",
    ],
    cta: "Start Free",
    variant: "hero-outline" as const,
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    description: "For serious freelancers",
    features: [
      "Unlimited AI proposals",
      "All templates (free + paid)",
      "Full proposal analytics",
      "CRM pipeline dashboard",
      "Client accept/decline flow",
      "Manual proposal crafting",
    ],
    cta: "Go Pro",
    variant: "hero" as const,
    highlighted: true,
  },
  {
    name: "Standard",
    price: "$29",
    period: "/month",
    description: "Build, sell, and earn",
    features: [
      "Everything in Pro",
      "Template Builder",
      "Sell templates — earn 80%",
      "AI Win-Rate Coach",
      "Revenue dashboard",
      "Priority support",
    ],
    cta: "Go Standard",
    variant: "hero-outline" as const,
    highlighted: false,
  },
];

export function PricingSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePlanClick = (planName: string) => {
    if (user) {
      navigate("/dashboard");
    } else {
      const intent = planName.toLowerCase();
      navigate(intent === "free" ? "/auth?mode=signup" : `/auth?mode=signup&intent=${intent}`);
    }
  };

  return (
    <ParallaxSection id="pricing" className="py-24 lg:py-32" speed={0.1}>
      <div className="container mx-auto px-4">
        <FadeInView className="text-center mb-16">
          <span className="text-sm font-mono text-primary tracking-widest uppercase">Pricing</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Simple, <span className="text-gradient">transparent</span> pricing
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Start free. Upgrade when you're ready to close more deals.
          </p>
        </FadeInView>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <FadeInView key={i} delay={i * 0.1}>
              <div
                className={`relative rounded-xl border p-6 lg:p-8 transition-all duration-300 ${
                  plan.highlighted
                    ? "border-primary/50 bg-card shadow-glow scale-[1.02]"
                    : "border-border bg-card hover:border-primary/20"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <h3 className="font-display text-xl font-bold text-card-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                <div className="mt-6 mb-6">
                  <span className="font-display text-4xl font-extrabold text-card-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      {feature}
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
