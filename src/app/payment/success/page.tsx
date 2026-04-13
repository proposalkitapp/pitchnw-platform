"use client";

import { useEffect } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import pitchnwLogo from "@/assets/pitchnw-logo.png";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const plan = (searchParams.get("plan") || "pro").toLowerCase();
  const label = "Pro";

  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.35 },
      colors: ["#a855f7", "#22c55e", "#38bdf8"],
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="w-full max-w-lg text-center space-y-6"
      >
        <img src={pitchnwLogo} alt="Pitchnw" className="h-24 w-auto object-contain mx-auto" />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 15 }}
          className="flex justify-center"
        >
          <div className="rounded-full bg-success/15 p-3">
            <CheckCircle2 className="h-14 w-14 text-success" />
          </div>
        </motion.div>

        <h1 className="font-display font-extrabold text-4xl text-foreground">
          You&apos;re on {label}! 🎉
        </h1>
        <p className="text-muted-foreground text-base">
          Your {plan} plan is now active.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button variant="hero" size="lg" className="w-full sm:w-auto" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
          <Button variant="hero-outline" size="lg" className="w-full sm:w-auto" onClick={() => navigate("/settings")}>
            Complete Your Profile
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
