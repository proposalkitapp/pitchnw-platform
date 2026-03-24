import { FadeInView, ParallaxSection } from "@/components/ParallaxSection";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Fill in the details",
    description: "Enter your name, client info, project type, and key requirements. It takes less than 30 seconds.",
  },
  {
    number: "02",
    title: "AI generates your proposal",
    description: "Our AI crafts a complete professional proposal with scope, timeline, pricing, and terms — in under 60 seconds.",
  },
  {
    number: "03",
    title: "Customize & brand it",
    description: "Edit any section, apply your brand kit, or swap in a premium template from the marketplace.",
  },
  {
    number: "04",
    title: "Send & track engagement",
    description: "Share via a private link. Track views, time spent, and get notified the moment your client accepts.",
  },
];

export function HowItWorksSection() {
  return (
    <ParallaxSection id="how-it-works" className="py-24 lg:py-32" speed={0.1}>
      <div className="container mx-auto px-4">
        <FadeInView className="text-center mb-16">
          <span className="text-sm font-mono text-primary tracking-widest uppercase">How it works</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            From brief to <span className="text-gradient">signed deal</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Four simple steps to close more clients, faster.
          </p>
        </FadeInView>

        <div className="relative max-w-3xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-6 lg:left-8 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-12">
            {steps.map((step, i) => (
              <FadeInView key={i} delay={i * 0.15}>
                <div className="relative flex gap-6 lg:gap-8">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="relative z-10 flex h-12 w-12 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-background font-mono text-sm lg:text-base font-bold text-primary"
                  >
                    {step.number}
                  </motion.div>
                  <div className="pt-1 lg:pt-3">
                    <h3 className="font-display text-lg lg:text-xl font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm lg:text-base leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </div>
    </ParallaxSection>
  );
}
