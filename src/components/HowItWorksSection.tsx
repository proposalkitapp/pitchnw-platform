import { FadeInView, ParallaxSection } from "@/components/ParallaxSection";
import { FileText, Sparkles, Palette, Send } from "lucide-react";

const steps = [
  {
    icon: FileText,
    number: "01",
    title: "Fill in the details",
    description: "Enter your client info, project type, and key requirements. It takes less than 30 seconds.",
  },
  {
    icon: Sparkles,
    number: "02",
    title: "AI generates your proposal",
    description: "Our AI crafts a complete professional proposal with scope, timeline, pricing, and terms — in under 60 seconds.",
  },
  {
    icon: Palette,
    number: "03",
    title: "Customize & brand it",
    description: "Edit any section, apply your brand kit, or swap in a premium template from the marketplace.",
  },
  {
    icon: Send,
    number: "04",
    title: "Send & track engagement",
    description: "Share via a private link. Track views, time spent, and get notified the moment your client accepts.",
  },
];

export function HowItWorksSection() {
  return (
    <ParallaxSection id="how-it-works" className="py-20 lg:py-28 bg-muted/30" speed={0.1}>
      <div className="container mx-auto px-4">
        <FadeInView className="text-center mb-14">
          <span className="inline-block text-xs font-semibold text-primary tracking-widest uppercase bg-primary/5 border border-primary/10 rounded-full px-3 py-1 mb-4">How it works</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-2 mb-4">
            From brief to <span className="text-gradient">signed deal</span>
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg max-w-xl mx-auto">
            Four simple steps to close more clients, faster.
          </p>
        </FadeInView>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <FadeInView key={i} delay={i * 0.12}>
              <div className="relative rounded-2xl border border-border bg-card p-6 text-center hover:border-primary/20 transition-colors">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="text-xs font-mono text-primary font-semibold mb-2">STEP {step.number}</div>
                <h3 className="font-display text-base font-semibold text-card-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </ParallaxSection>
  );
}
