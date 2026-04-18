"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/use-auth";

export function HeroSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    navigate(user ? "/dashboard" : "/auth?mode=signup");
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white font-inter">
      {/* Background decoration if any, but the vibe is clean/premium */}
      <div className="container relative z-10 mx-auto px-4 text-center">
        
        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="font-[800] text-[clamp(2.5rem,8vw,4.5rem)] lg:text-[72px] leading-[1.05] tracking-[-0.03em] mb-8 text-center max-w-5xl mx-auto"
        >
          <span className="text-blue-600 block">Your Clients Want Results.</span>
          <span className="text-blue-300 block mt-2">
            Your Proposals <span className="text-black relative inline-block">
              Don't.
              <svg className="absolute -bottom-3 left-0 w-full h-3 text-black" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0,5 Q25,0 50,5 T100,5" fill="none" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            </span>
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mx-auto max-w-2xl text-[16px] lg:text-[18px] text-[#999] leading-relaxed mb-6 text-center"
        >
          Stop losing deals to mediocre layouts. Pitchnw turns your raw ideas into <br className="hidden md:block" />
          stunning, high-converting proposals that actually get signed.
        </motion.p>

        {/* Faint secondary label */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.3, duration: 1 }}
           className="text-[14px] text-gray-300 font-medium mb-10 tracking-tight"
        >
          No writing skills needed. Ready in 60 seconds.
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <Button 
            className="bg-black text-white hover:bg-black/90 px-10 h-14 rounded-full font-bold text-lg shadow-2xl border border-white/10 transition-all active:scale-95 flex items-center gap-2 group"
            onClick={handleGetStarted}
          >
            Generate My Proposal 
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <button 
            onClick={() => {}} // Placeholder for "See Examples"
            className="text-gray-400 hover:text-black font-semibold text-lg transition-colors flex items-center gap-2"
          >
            See Examples
          </button>
        </motion.div>

        {/* Visual Flow Section Integration (can be below or moved to separate component) */}
        <motion.div
           initial={{ opacity: 0, y: 60 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.6, duration: 1 }}
           className="mt-32 max-w-4xl mx-auto py-12 px-6 bg-gray-50/50 rounded-[40px] border border-gray-100/50"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-2">
               <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Input</div>
               <div className="text-xl font-[800] text-gray-900">RAW CLIENT BRIEF</div>
               <div className="text-sm text-gray-400">Scribbles, notes, emails.</div>
            </div>

            <div className="flex flex-col items-center">
               <div className="h-16 w-16 bg-blue-600 rounded-[20px] shadow-2xl shadow-blue-200 flex items-center justify-center rotate-3 scale-110">
                  <span className="text-2xl">✨</span>
               </div>
               <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-blue-600">Magic Step</div>
            </div>

            <div className="space-y-2 md:text-right">
               <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Output</div>
               <div className="text-xl font-[800] text-gray-900">POLISHED PROPOSAL</div>
               <div className="text-sm text-gray-400">Branded, signed, won.</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
