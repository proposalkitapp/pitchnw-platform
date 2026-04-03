import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

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
      {/* Subtle gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.08)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.08)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black_20%,transparent_100%)]" />

      <div className="container relative z-10 mx-auto px-4 text-center">
        {/* Badge */}
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

        {/* Headline */}
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

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mx-auto max-w-[540px] text-base lg:text-lg text-muted-foreground leading-relaxed mb-10"
        >
          ProposalKit generates professional, branded proposals in 60 seconds — then tracks
          every interaction so you know exactly when to follow up.
        </motion.p>

        {/* CTA */}
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

        {/* Trust badges */}
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

        {/* Product mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl shadow-primary/[0.04]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/40" />
                <div className="w-3 h-3 rounded-full bg-warning/40" />
                <div className="w-3 h-3 rounded-full bg-success/40" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-background text-xs font-mono text-muted-foreground border border-border">
                  proposalkit.app/dashboard
                </div>
              </div>
            </div>
            {/* Dashboard mockup */}
            <div className="p-6 grid grid-cols-4 gap-4">
              <div className="col-span-1 space-y-3 hidden sm:block">
                <div className="h-4 rounded bg-primary/15 w-3/4" />
                <div className="h-3 rounded bg-muted w-full" />
                <div className="h-3 rounded bg-muted w-5/6" />
                <div className="h-3 rounded bg-muted w-4/5" />
                <div className="h-3 rounded bg-muted w-full mt-6" />
                <div className="h-3 rounded bg-muted w-3/4" />
              </div>
              <div className="col-span-4 sm:col-span-3 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                      <div className="h-3 rounded bg-muted w-1/2" />
                      <div className="h-6 rounded bg-primary/10 w-2/3" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-muted/10 p-3">
                      <div className="w-2 h-2 rounded-full bg-success/60" />
                      <div className="h-3 rounded bg-muted flex-1" />
                      <div className="h-3 rounded bg-primary/10 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
