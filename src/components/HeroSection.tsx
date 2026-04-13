"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/use-auth";
import dashboardMockup from "@/assets/dashboard-mockup.png";
import proposalPreview from "@/assets/proposal-preview.png";

const badges = [
  "No Credit Card Required",
  "3 Free Proposals",
  "AI-Powered",
];

export function HeroSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    navigate(user ? "/dashboard" : "/auth?mode=signup");
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.08)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.08)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black_20%,transparent_100%)]" />

      <div className="container relative z-10 mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="text-xs font-medium text-primary tracking-wide">Now live — Free to start</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="font-display text-[clamp(2.2rem,6vw,4.5rem)] font-extrabold leading-[1.08] tracking-tight mb-6"
        >
          Turn project briefs
          <br />
          into <span className="text-gradient">winning proposals</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mx-auto max-w-[540px] text-base lg:text-lg text-muted-foreground leading-relaxed mb-10"
        >
          Pitchnw generates professional, branded proposals in 60 seconds — then tracks
          every interaction so you know exactly when to follow up.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
        >
          <Button variant="hero" size="xl" onClick={handleGetStarted} className="text-base">
            Start Free
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button
            variant="hero-outline"
            size="xl"
            onClick={() => navigate(user ? "/marketplace" : "/auth?mode=signup")}
            className="text-base"
          >
            Browse Templates
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {badges.map((badge) => (
            <div key={badge} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-primary" />
              <span>{badge}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-16 max-w-5xl mx-auto relative px-4"
        >
          {/* Main Dashboard Image */}
          <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/40" />
                <div className="w-3 h-3 rounded-full bg-warning/40" />
                <div className="w-3 h-3 rounded-full bg-success/40" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-background text-xs font-mono text-muted-foreground border border-border">
                  pitchnw.app/dashboard
                </div>
              </div>
            </div>
            <img 
              src={dashboardMockup} 
              alt="Dashboard Preview" 
              className="w-full h-auto object-cover aspect-[16/10] sm:aspect-auto"
            />
          </div>

          {/* Overlapping Proposal Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3, duration: 0.8 }}
            className="absolute -bottom-6 -right-2 sm:-right-8 w-48 sm:w-72 rounded-xl border border-border bg-background p-2 shadow-2xl hidden xs:block"
          >
            <div className="rounded-lg overflow-hidden border border-border">
              <img 
                src={proposalPreview} 
                alt="Proposal Template Preview" 
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
