"use client";

import { FadeInView, ParallaxSection } from "@/components/ParallaxSection";
import { Zap, LayoutTemplate, BarChart3, Brain, Send, Shield } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

function TypingEffect() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [text, setText] = useState("");
  const fullText = "Generating proposal for Acme Corp…";

  useEffect(() => {
    if (!isInView) return;
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) clearInterval(interval);
    }, 45);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <div ref={ref} className="mt-4 rounded-lg bg-muted/50 border border-border p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
        <span className="text-[10px] font-mono text-muted-foreground">AI Engine</span>
      </div>
      <p className="text-xs font-mono text-primary leading-relaxed min-h-[1.25rem]">
        {text}
        {isInView && text.length < fullText.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-[2px] h-3 bg-primary ml-0.5 align-middle"
          />
        )}
      </p>
    </div>
  );
}

function AnimatedBarChart() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const bars = [
    { height: "60%", label: "Mon", delay: 0 },
    { height: "85%", label: "Tue", delay: 0.1 },
    { height: "45%", label: "Wed", delay: 0.2 },
    { height: "95%", label: "Thu", delay: 0.3 },
    { height: "70%", label: "Fri", delay: 0.4 },
  ];

  return (
    <div ref={ref} className="mt-4 rounded-lg bg-muted/50 border border-border p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-muted-foreground">Views this week</span>
        <span className="text-[10px] font-mono text-primary font-semibold">+42%</span>
      </div>
      <div className="flex items-end gap-1.5 h-16">
        {bars.map((bar, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              className="w-full rounded-sm bg-primary/60"
              initial={{ height: 0 }}
              animate={isInView ? { height: bar.height } : { height: 0 }}
              transition={{ duration: 0.6, delay: bar.delay, ease: "easeOut" }}
              style={{ maxHeight: bar.height }}
            />
            <span className="text-[8px] font-mono text-muted-foreground/60">{bar.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const features = [
  {
    icon: Zap,
    title: "AI Proposal Generator",
    description: "Fill a short form, get a complete professional proposal with executive summary, scope, pricing, and timeline.",
    widget: "typing" as const,
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
    widget: "chart" as const,
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
    <ParallaxSection id="features" className="py-20 lg:py-28" speed={0.15}>
      <div className="container mx-auto px-4">
        <FadeInView className="text-center mb-14">
          <span className="inline-block text-xs font-semibold text-primary tracking-widest uppercase bg-primary/5 border border-primary/10 rounded-full px-3 py-1 mb-4">Features</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-2 mb-4">
            Everything you need to{" "}
            <span className="text-gradient">win more deals</span>
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto">
            From AI generation to client tracking — Pitchnw is the all-in-one platform for freelancers who mean business.
          </p>
        </FadeInView>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <FadeInView key={i} delay={i * 0.08}>
              <div className="group relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.03]">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-semibold mb-2 text-card-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                {feature.widget === "typing" && <TypingEffect />}
                {feature.widget === "chart" && <AnimatedBarChart />}
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </ParallaxSection>
  );
}
