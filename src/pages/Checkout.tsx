import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import pitchnwLogo from "@/assets/pitchnw-logo.png";

export default function Checkout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"pro" | "standard" | null>(null);

  const handleCheckout = async (plan: "pro" | "standard") => {
    try {
      setLoading(plan);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth?mode=signup&redirect=/checkout");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error || !data?.checkout_url) {
        toast.error("Could not create checkout. Please try again.");
        return;
      }

      window.location.href = data.checkout_url as string;
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const busy = loading !== null;

  return (
    <div className="min-h-screen bg-[#08080F] font-body text-foreground">
      <div className="mx-auto max-w-[840px] px-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <img src={pitchnwLogo} alt="Pitchnw" className="h-24 w-auto object-contain mx-auto mb-6" />
          <h1 className="font-display font-extrabold text-4xl text-center mb-3">Choose Your Plan</h1>
          <p className="text-muted-foreground text-center max-w-lg mx-auto">
            Start your 3-day free trial. Cancel anytime.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 md:p-8 flex flex-col"
          >
            <span className="inline-flex self-start rounded-full bg-success/15 text-success text-xs font-medium px-3 py-1 mb-4">
              3-day free trial
            </span>
            <p className="font-display font-bold uppercase tracking-wide text-lg text-card-foreground">Pro</p>
            <div className="mt-2 mb-4 flex items-baseline gap-1">
              <span className="font-display font-extrabold text-5xl text-card-foreground">$12</span>
              <span className="text-muted-foreground text-sm">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">For freelancers who pitch regularly</p>
            <ul className="space-y-2.5 mb-8 flex-1 text-sm text-muted-foreground">
              {[
                "Unlimited AI proposal generation",
                "High-converting sales copy output",
                "8 professional pitch templates",
                "Branding kit (logo + header)",
                "Client portal with private link",
                "Digital signatures",
                "Proposal analytics",
                "Sophisticated CRM pipeline",
                "PDF export",
              ].map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
              <li className="flex gap-2 text-muted-foreground/70">
                <X className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                AI Win-Rate Coach
              </li>
            </ul>
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              disabled={busy}
              onClick={() => handleCheckout("pro")}
            >
              {loading === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Start Pro Free Trial
            </Button>
          </motion.div>

          {/* Standard */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/10 via-card/90 to-card/80 p-6 md:p-8 flex flex-col shadow-[0_0_40px_-12px_hsl(var(--primary))]"
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-1">
              MOST POPULAR
            </span>
            <span className="inline-flex self-start rounded-full bg-success/15 text-success text-xs font-medium px-3 py-1 mb-4 mt-2">
              3-day free trial
            </span>
            <p className="font-display font-bold uppercase tracking-wide text-lg text-card-foreground">Standard</p>
            <div className="mt-2 mb-4 flex items-baseline gap-1">
              <span className="font-display font-extrabold text-5xl text-card-foreground">$29</span>
              <span className="text-muted-foreground text-sm">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Everything in Pro, plus power features</p>
            <ul className="space-y-2.5 mb-8 flex-1 text-sm text-muted-foreground">
              {["Everything in Pro", "AI Win-Rate Coach", "Advanced analytics", "Priority support"].map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              disabled={busy}
              onClick={() => handleCheckout("standard")}
            >
              {loading === "standard" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Start Standard Free Trial
            </Button>
          </motion.div>
        </div>

        <p className="mt-10 text-center font-mono text-[11px] text-muted-foreground space-y-1">
          <span className="block">🔒 Secure checkout powered by Dodo Payments</span>
          <span className="block">No card charged during trial · Cancel anytime</span>
        </p>
      </div>
    </div>
  );
}
