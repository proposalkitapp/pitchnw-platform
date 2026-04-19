"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

const PERKS = [
  "No credit card needed to start",
  "3 free proposals included",
  "Instant AI generation",
];

export function CTASection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 lg:py-36 relative overflow-hidden">
      {/* Full-width gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#0d0d2e] to-[#1a0a2e]" />

      {/* Animated glow orbs */}
      <motion.div
        animate={{
          x: [0, 40, 0],
          y: [0, -30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[120%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{
          x: [0, -50, 0],
          y: [0, 40, 0],
          scale: [1.1, 1, 1.1],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[100%] rounded-full bg-violet-600/20 blur-[100px] pointer-events-none"
      />

      {/* Noise grain overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-semibold text-white/80 tracking-wide">
              Start for free today
            </span>
          </div>

          {/* Headline */}
          <h2 className="font-display font-black text-[clamp(2.5rem,7vw,5rem)] text-white leading-[1.05] tracking-tight mb-6">
            Ready to close deals{" "}
            <br className="hidden sm:block" />
            <span
              className="relative inline-block"
              style={{
                background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              faster?
            </span>
          </h2>

          {/* Subline */}
          <p className="text-white/50 text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Join thousands of freelancers winning more projects every week.
            Get started in 60 seconds — no writing experience needed.
          </p>

          {/* Perks */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-12">
            {PERKS.map((perk, i) => (
              <div key={i} className="flex items-center gap-2 text-white/60 text-sm font-medium">
                <div className="h-5 w-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-emerald-400" />
                </div>
                {perk}
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate(user ? "/dashboard" : "/auth?mode=signup")}
              className="group relative inline-flex items-center gap-3 px-10 h-16 rounded-[20px] font-black text-lg text-white overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #0033ff 0%, #7c3aed 100%)",
                boxShadow: "0 0 60px rgba(0,51,255,0.4), 0 20px 40px rgba(0,0,0,0.3)",
              }}
            >
              {/* Shine sweep */}
              <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12" />
              <span className="relative">
                {user ? "Go to Dashboard" : "Get Started — It's Free"}
              </span>
              <ArrowRight className="h-5 w-5 relative group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate("/auth?mode=login")}
              className="text-white/40 hover:text-white/70 font-semibold text-sm transition-colors"
            >
              Already have an account? Sign in →
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
