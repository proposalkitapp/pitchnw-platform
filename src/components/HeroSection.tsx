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
  "3 Basic Proposals",
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
          <span className="text-xs font-medium text-primary tracking-wide">Now live — Basic plan available</span>
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
            Start Basic
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
          className="mt-20 max-w-5xl mx-auto relative px-4 flex items-center justify-center min-h-[400px] lg:min-h-[500px]"
        >
          {/* Background Ambient Glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          </div>

          <div className="relative z-10 w-full max-w-4xl flex items-center justify-center gap-6 flex-wrap">
            {/* Floating Glass Card 1 */}
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [ -2, -4, -2 ] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="w-72 bg-white/10 backdrop-blur-3xl border border-white/20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] rounded-3xl p-6 relative overflow-hidden"
              style={{
                 backgroundImage: "linear-gradient(to bottom right, rgba(255,255,255,0.2), rgba(255,255,255,0.05))"
              }}
            >
              <div className="absolute top-0 right-0 p-4 opacity-30">
                <div className="h-20 w-20 rounded-full bg-blue-400 blur-2xl" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-400 to-primary flex items-center justify-center shadow-lg">
                    <span className="text-white font-black text-xl">S</span>
                  </div>
                  <div>
                    <div className="h-3 w-20 bg-slate-300 rounded-full mb-1" />
                    <div className="h-2 w-12 bg-slate-200 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full bg-slate-200/50 rounded-full" />
                  <div className="h-2 w-[85%] bg-slate-200/40 rounded-full" />
                  <div className="h-2 w-[60%] bg-slate-200/30 rounded-full" />
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between">
                     <div className="h-6 w-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 font-black text-[10px] uppercase text-emerald-500 flex items-center justify-center tracking-widest">
                       Deal Won
                     </div>
                     <span className="font-black text-slate-700">$12,000</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Glass Card 2 (Center highlight) */}
            <motion.div
              animate={{ y: [-10, 10, -10], rotate: [ 0, 2, 0 ] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="w-80 bg-white/20 backdrop-blur-3xl border border-white/40 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] rounded-[40px] p-8 relative overflow-hidden z-20 -mt-10"
              style={{
                 backgroundImage: "linear-gradient(to bottom right, rgba(255,255,255,0.4), rgba(255,255,255,0.1))"
              }}
            >
              <div className="absolute -top-10 -left-10 p-4 opacity-40">
                <div className="h-32 w-32 rounded-full bg-purple-500 blur-3xl" />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                   <div className="px-3 py-1 bg-white/50 border border-white rounded-full text-[9px] font-black uppercase tracking-widest text-slate-800 shadow-sm">
                      Pitch Setup
                   </div>
                   <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                </div>
                <div>
                   <h3 className="text-2xl font-black font-display tracking-tight text-slate-900 leading-none mb-2">Acme Corp Redesign</h3>
                   <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Generating Proposal...</p>
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-[100%] bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
                  <div className="h-2 w-[90%] bg-slate-200/80 rounded-full" />
                  <div className="h-2 w-[70%] bg-slate-200/80 rounded-full" />
                </div>
                <div className="flex gap-2 pt-2">
                   <div className="h-10 flex-1 rounded-2xl bg-white/60 flex items-center justify-center font-black text-xs text-slate-700 shadow-sm backdrop-blur-sm">Edit</div>
                   <div className="h-10 flex-1 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center font-black text-xs text-white shadow-lg">Send</div>
                </div>
              </div>
            </motion.div>

            {/* Floating Glass Card 3 */}
            <motion.div
              animate={{ y: [0, -20, 0], rotate: [ 2, 4, 2 ] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="w-72 bg-white/10 backdrop-blur-3xl border border-white/20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] rounded-3xl p-6 relative overflow-hidden"
              style={{
                 backgroundImage: "linear-gradient(to bottom right, rgba(255,255,255,0.2), rgba(255,255,255,0.05))"
              }}
            >
              <div className="absolute bottom-0 left-0 p-4 opacity-30">
                <div className="h-24 w-24 rounded-full bg-amber-400 blur-2xl" />
              </div>
              <div className="relative z-10 space-y-4">
                 <div className="flex gap-3 items-center">
                    <div className="h-8 w-8 rounded-full border border-amber-200 flex items-center justify-center bg-white/50">
                       <span className="text-[14px]">🔥</span>
                    </div>
                    <div>
                      <div className="h-2 w-16 bg-slate-300 rounded-full mb-1.5" />
                      <div className="h-1.5 w-10 bg-slate-200 rounded-full" />
                    </div>
                 </div>
                 <div className="bg-white/40 border border-white/50 rounded-xl p-4 mt-2">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Client View</span>
                       <span className="text-xs font-bold text-amber-600">Active</span>
                    </div>
                    <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-500 w-[65%]" />
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
