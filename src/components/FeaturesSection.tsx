import { FadeInView, ParallaxSection } from "@/components/ParallaxSection";
import { Zap, LayoutTemplate, BarChart3, Brain, Send, Shield } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI Proposal Generator",
    description: "Fill a short form, get a complete professional proposal with executive summary, scope, pricing, and timeline.",
  },
  {
    icon: LayoutTemplate,
    title: "Template Marketplace",
    description: "Browse, buy, and use stunning proposal templates. Creators earn 80% on every sale.",
  },
  {
    icon: Send,
    title: "Client Portal",
    description: "Share proposals via private branded links. Clients can accept, decline, or comment — no login required.",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "Track every view, scroll depth, and time spent. Know exactly when your client opens your proposal.",
  },
  {
    icon: Brain,
    title: "AI Win-Rate Coach",
    description: "AI analyzes your proposals and tells you why you're winning or losing deals with actionable insights.",
  },
  {
    icon: Shield,
    title: "CRM Pipeline",
    description: "Track every proposal from draft to signed. Manage your entire freelance pipeline in one place.",
  },
];

export function FeaturesSection() {
  return (
    <ParallaxSection id="features" className="py-24 lg:py-32" speed={0.15}>
      <div className="container mx-auto px-4">
        <FadeInView className="text-center mb-16">
          <span className="text-sm font-mono text-primary tracking-widest uppercase">Features</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Everything you need to{" "}
            <span className="text-gradient">win more deals</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From AI generation to client tracking — ProposalKit is the all-in-one platform for freelancers who mean business.
          </p>
        </FadeInView>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FadeInView key={i} delay={i * 0.1}>
              <div className="group relative rounded-xl border border-border bg-card p-6 lg:p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-glow">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2 text-card-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </ParallaxSection>
  );
}
