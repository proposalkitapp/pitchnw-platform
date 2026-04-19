"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { FileText, Sparkles, Send } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Drop your brief",
    description:
      "Paste your notes, scribbles, or a client email. You don't need to be a professional writer — just tell us what the project is about.",
    accent: "#0033ff",
    accentLight: "#0033ff15",
    tag: "Takes 30 seconds",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "AI builds your pitch",
    description:
      "Our engine crafts a full proposal — exec summary, deliverables, pricing, timeline, and closing argument — in under 60 seconds.",
    accent: "#7c3aed",
    accentLight: "#7c3aed15",
    tag: "Instant generation",
  },
  {
    number: "03",
    icon: Send,
    title: "Brand it. Send it. Win it.",
    description:
      "Apply your logo and brand colors, share a private link, and get notified the moment your client opens — or signs.",
    accent: "#059669",
    accentLight: "#05966915",
    tag: "Close the deal",
  },
];

function StepCard({
  step,
  index,
}: {
  step: (typeof steps)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
      className="relative group"
    >
      {/* Connector line (hidden on mobile) */}
      {index < steps.length - 1 && (
        <div className="hidden lg:block absolute top-14 left-[calc(100%+1px)] w-[calc(100%-2px)] h-px z-10">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.8, delay: index * 0.15 + 0.4 }}
            style={{ transformOrigin: "left" }}
            className="h-full bg-gradient-to-r from-border to-transparent"
          />
        </div>
      )}

      <div
        className="relative rounded-[28px] border border-border bg-card p-8 h-full 
                      transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-1
                      overflow-hidden"
      >
        {/* Glow background on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[28px]"
          style={{
            background: `radial-gradient(ellipse at top left, ${step.accentLight}, transparent 70%)`,
          }}
        />

        {/* Step number */}
        <div className="relative z-10 flex items-start justify-between mb-8">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: step.accentLight, border: `1px solid ${step.accent}25` }}
          >
            <step.icon className="h-6 w-6" style={{ color: step.accent }} />
          </div>
          <span
            className="font-mono text-[48px] font-black leading-none select-none"
            style={{ color: `${step.accent}18` }}
          >
            {step.number}
          </span>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4"
            style={{
              backgroundColor: step.accentLight,
              color: step.accent,
            }}
          >
            {step.tag}
          </div>
          <h3 className="font-display text-xl font-bold text-card-foreground mb-3 leading-tight">
            {step.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function HowItWorksSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-60px" });

  return (
    <section id="how-it-works" className="py-24 lg:py-36 relative overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-muted/30" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block text-xs font-semibold text-primary tracking-widest uppercase bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5 mb-5">
            How it works
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mt-3 mb-5 tracking-tight leading-[1.1]">
            From raw idea to{" "}
            <span className="relative inline-block">
              <span className="text-gradient">signed deal</span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 8"
                fill="none"
              >
                <path
                  d="M2 6 Q50 2 100 5 T198 3"
                  stroke="url(#underlineGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="underlineGrad" x1="0" y1="0" x2="200" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg max-w-xl mx-auto">
            Three steps. Zero friction. More closed deals.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} />
          ))}
        </div>

        {/* Bottom social proof strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-center"
        >
          {[
            { stat: "60s", label: "Avg. generation time" },
            { stat: "3×", label: "Higher response rate" },
            { stat: "100%", label: "No writing skills needed" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              {i > 0 && (
                <div className="hidden sm:block h-6 w-px bg-border" />
              )}
              <div>
                <div className="font-display text-3xl font-black text-foreground">
                  {item.stat}
                </div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
