import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Grid3X3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export function HeroSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    navigate(user ? "/dashboard" : "/auth?mode=signup");
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.15)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.15)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black_20%,transparent_100%)]" />

      {/* Mesh orbs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] left-[20%] w-[500px] h-[500px] rounded-full blur-[140px]"
        style={{ background: "hsl(239 84% 67% / 0.15)" }}
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] rounded-full blur-[120px]"
        style={{ background: "hsl(270 80% 65% / 0.12)" }}
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.2, 0.08] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[50%] left-[55%] w-[350px] h-[350px] rounded-full blur-[100px]"
        style={{ background: "hsl(160 84% 39% / 0.08)" }}
      />

      <div className="container relative z-10 mx-auto px-4 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/5 px-5 py-2.5 mb-10"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <span className="text-sm font-mono font-medium text-primary tracking-wide">Now live — Free to start</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="font-display text-[clamp(2.5rem,7vw,5rem)] font-extrabold leading-[1.05] tracking-tight mb-6"
        >
          Stop writing proposals.
          <br />
          <span className="text-gradient">Start closing deals.</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mx-auto max-w-[520px] text-lg text-muted-foreground leading-relaxed mb-10"
        >
          ProposalKit generates professional, branded proposals in 60 seconds — then tracks
          every interaction so you know exactly when to follow up.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button variant="hero" size="xl" onClick={handleGetStarted}>
            Generate Your First Proposal
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button
            variant="hero-outline"
            size="xl"
            onClick={() => navigate(user ? "/marketplace" : "/auth?mode=signup")}
          >
            <Grid3X3 className="h-5 w-5" />
            Browse Templates
          </Button>
        </motion.div>

        {/* Caption */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="mt-6 text-xs text-muted-foreground/60 font-mono tracking-wide"
        >
          No credit card required · Free plan available
        </motion.p>

        {/* Hero mockup - dark browser frame */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-primary/5">
            {/* Browser top bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-card/80">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-secondary/50 text-xs font-mono text-muted-foreground">
                  proposalkits.lovable.app/dashboard
                </div>
              </div>
            </div>
            {/* Dashboard mockup content */}
            <div className="p-6 grid grid-cols-4 gap-4">
              {/* Sidebar mockup */}
              <div className="col-span-1 space-y-3 hidden sm:block">
                <div className="h-4 rounded bg-primary/20 w-3/4" />
                <div className="h-3 rounded bg-muted/50 w-full" />
                <div className="h-3 rounded bg-muted/50 w-5/6" />
                <div className="h-3 rounded bg-muted/50 w-4/5" />
                <div className="h-3 rounded bg-muted/50 w-full mt-6" />
                <div className="h-3 rounded bg-muted/50 w-3/4" />
              </div>
              {/* Main content mockup */}
              <div className="col-span-4 sm:col-span-3 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg border border-border/30 bg-secondary/20 p-4 space-y-2">
                      <div className="h-3 rounded bg-muted-foreground/10 w-1/2" />
                      <div className="h-6 rounded bg-primary/15 w-2/3 font-display" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border/30 bg-secondary/10 p-3">
                      <div className="w-2 h-2 rounded-full bg-success/60" />
                      <div className="h-3 rounded bg-muted-foreground/10 flex-1" />
                      <div className="h-3 rounded bg-primary/15 w-16" />
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
