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
      "3 AI proposals",
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
      "Delete & manage proposals",
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
      navigate("/settings");
    } else {
      const intent = planName.toLowerCase();
      navigate(intent === "free" ? "/auth?mode=signup" : `/auth?mode=signup&intent=${intent}`);
    }
  };

  return (
    <ParallaxSection id="pricing" className="py-20 lg:py-28" speed={0.1}>
      <div className="container mx-auto px-4">
        <FadeInView className="text-center mb-14">
          <span className="inline-block text-xs font-semibold text-primary tracking-widest uppercase bg-primary/5 border border-primary/10 rounded-full px-3 py-1 mb-4">Pricing</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-2 mb-4">
            Simple, <span className="text-gradient">transparent</span> pricing
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg max-w-xl mx-auto">
            Start free. Upgrade when you're ready to close more deals.
          </p>
        </FadeInView>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <FadeInView key={i} delay={i * 0.1}>
              <div
                className={`relative rounded-2xl border p-6 lg:p-8 transition-all duration-300 ${
                  plan.highlighted
                    ? "border-primary bg-card shadow-lg shadow-primary/[0.06] scale-[1.02]"
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
                <div className="mt-5 mb-6">
                  <span className="font-display text-4xl font-extrabold text-card-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
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
