"use client";

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { CheckCircle2, Loader2, Sparkles, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import pitchnwLogo from "@/assets/pitchnw-logo.png";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [isSuccessfullyUpgraded, setIsSuccessfullyUpgraded] = useState(false);
  
  const plan = (searchParams.get("plan") || "pro").toLowerCase();
  const label = "Pro";

  useEffect(() => {
    let checkInterval: any;
    let attempts = 0;
    const maxAttempts = 10; // 20 seconds total

    async function verifyUpgrade() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("plan")
          .eq("user_id", user.id)
          .single();

        if (data?.plan === "pro") {
          setIsSuccessfullyUpgraded(true);
          setVerifying(false);
          clearInterval(checkInterval);
          
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
            setVerifying(false); // Stop waiting, let them click through
            setIsSuccessfullyUpgraded(false);
            clearInterval(checkInterval);
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
  }, [user]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-body">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white rounded-3xl p-10 shadow-[0_20px_50px_rgba(0,51,255,0.08)] border border-slate-100 text-center space-y-6"
      >
        <img src={pitchnwLogo} alt="Pitchnw" className="h-16 w-auto object-contain mx-auto mb-4" />

        {verifying ? (
          <div className="py-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#0033ff] mx-auto" />
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 font-display">Verifying your upgrade...</h2>
              <p className="text-sm text-slate-500">Wait a few seconds while we sync your new features.</p>
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
                <div className="rounded-full bg-success/10 p-5">
                  <CheckCircle2 className="h-16 w-16 text-success" />
                </div>
                <div className="absolute -top-2 -right-2 bg-purple-500 text-white p-1.5 rounded-full shadow-lg">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
            </motion.div>

            <div className="space-y-2">
              <h1 className="font-display font-extrabold text-3xl text-slate-900 leading-tight">
                {isSuccessfullyUpgraded ? `Welcome to Pitchnw ${label}! 🎉` : "Payment Processed!"}
              </h1>
              <p className="text-slate-500 text-base max-w-sm mx-auto">
                {isSuccessfullyUpgraded 
                  ? "Your account has been fully upgraded. All premium features and templates are now unlocked."
                  : "We've received your payment! It might take a moment to sync—feel free to start exploring."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full gap-2" 
                onClick={() => {
                  window.location.href = "/dashboard"; // Use full reload to clear any stale state
                }}
              >
                <Building className="h-4 w-4" />
                Go to Dashboard
              </Button>
              <Button 
                variant="hero-outline" 
                size="lg" 
                className="w-full text-slate-600 border-slate-200" 
                onClick={() => {
                  window.location.href = "/settings";
                }}
              >
                View Pro Settings
              </Button>
            </div>

            <div className="pt-4">
              <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#0033ff]/60 bg-[#0033ff]/5 px-4 py-2 rounded-full">
                Professional Subscription Active
              </span>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
