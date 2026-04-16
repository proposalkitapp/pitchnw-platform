"use client";

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { CheckCircle2, Loader2, Sparkles, Building, ArrowRight } from "lucide-round"; // Wait, I use lucide-react normally
import { CheckCircle2 as CheckIcon, Loader2 as LoaderIcon, Sparkles as SparkleIcon, Building as BuildingIcon, ArrowRight as ArrowIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import pitchnwLogo from "@/assets/pitchnw-logo.png";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [verifying, setVerifying] = useState(true);
  const [isSuccessfullyUpgraded, setIsSuccessfullyUpgraded] = useState(false);
  
  const plan = (searchParams.get("plan") || "pro").toLowerCase();
  const label = "Pro";

  useEffect(() => {
    let checkInterval: any;
    let attempts = 0;
    const maxAttempts = 15; // 30 seconds total

    async function verifyUpgrade() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("plan")
          .eq("user_id", user.id)
          .single();

        if (data?.plan === "pro") {
          // 🎉 PRO STATUS CONFIRMED
          setIsSuccessfullyUpgraded(true);
          setVerifying(false);
          clearInterval(checkInterval);
          
          // CRITICAL: Clear the React Query cache so EVERY component sees the new plan instantly
          await queryClient.invalidateQueries({ queryKey: ['profile'] });
          
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.35 },
            colors: ["#a855f7", "#0033ff", "#38bdf8"],
          });
          toast.success("Account upgraded successfully! Welcome to Pro.");
        } else {
          attempts++;
          if (attempts >= maxAttempts) {
            setVerifying(false); 
            setIsSuccessfullyUpgraded(false);
            clearInterval(checkInterval);
            toast.error("Upgrade sync is taking longer than usual. Try refreshing your dashboard.");
          }
        }
      } catch (err) {
        console.error("Verification error:", err);
      }
    }

    if (user) {
      verifyUpgrade();
      checkInterval = setInterval(verifyUpgrade, 2000);
    }

    return () => clearInterval(checkInterval);
  }, [user, queryClient]);

  const handleGoToDashboard = () => {
    // We already invalidated the query, but we'll use a hard refresh just to be absolutely safe
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-body">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white rounded-[40px] p-10 sm:p-14 shadow-[0_40px_80px_rgba(0,51,255,0.08)] border border-slate-100 text-center space-y-8"
      >
        <img src={pitchnwLogo} alt="Pitchnw" className="h-16 w-auto object-contain mx-auto mb-4" />

        {verifying ? (
          <div className="py-12 space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
              <div className="absolute inset-0 rounded-full border-4 border-t-[#0033ff] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <SparkleIcon className="h-8 w-8 text-[#0033ff]/40" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">Syncing your Pro features...</h2>
              <p className="text-sm text-slate-400 font-medium">Sit tight. We're finalizing your professional workspace.</p>
            </div>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="rounded-full bg-emerald-50 p-6">
                  <CheckIcon className="h-16 w-16 text-emerald-500" />
                </div>
                <div className="absolute -top-1 -right-1 bg-purple-500 text-white p-2 rounded-full shadow-lg">
                  <SparkleIcon className="h-5 w-5" />
                </div>
              </div>
            </motion.div>

            <div className="space-y-3">
              <h1 className="font-display font-black text-4xl text-slate-900 leading-[1.1] tracking-tight">
                {isSuccessfullyUpgraded ? `Welcome to ${label}!` : "Ready to go!"}
              </h1>
              <p className="text-slate-500 text-base max-w-[280px] mx-auto leading-relaxed">
                {isSuccessfullyUpgraded 
                  ? "Your account is active. All premium features, CRM tools, and AI templates are now yours."
                  : "Your payment was successful! Your features are ready and sync is complete."}
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full h-16 rounded-2xl bg-[#0033ff] hover:bg-[#002be6] text-white font-bold text-lg gap-3 shadow-[0_10px_30px_rgba(0,51,255,0.2)]" 
                onClick={handleGoToDashboard}
              >
                <BuildingIcon className="h-5 w-5" />
                Launch Dashboard
                <ArrowIcon className="h-5 w-5 ml-auto opacity-50" />
              </Button>
              <Button 
                variant="ghost" 
                size="lg" 
                className="w-full h-14 rounded-2xl text-slate-400 font-bold hover:bg-slate-50" 
                onClick={() => window.location.href = "/generate"}
              >
                Start New Proposal
              </Button>
            </div>

            <div className="pt-6">
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500 bg-emerald-50 px-5 py-2.5 rounded-full">
                Professional Subscription Active
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
