"use client";

import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import pitchnwLogo from "@/assets/pitchnw-logo.png";


export default function Checkout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"pro" | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoadingProfile(false);
        return;
      }
      const { data } = await supabase.from("profiles").select("plan, subscription_status").eq("user_id", session.user.id).single();
      if (data) {
        setCurrentPlan(data.plan);
        setSubscriptionStatus(data.subscription_status);
      }
      setLoadingProfile(false);
    }
    load();
  }, []);

  const handleCheckout = async () => {
    try {
      setLoading("pro");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth?mode=signup&redirect=/checkout");
        return;
      }

      const sessionId = crypto.randomUUID();

      const resp = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          customer: {
            email: session.user.email,
            name: (session.user as any)?.user_metadata?.full_name,
          },
        }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        console.error("Checkout API error:", resp.status, text);
        toast.error(`Checkout error: ${resp.status} ${text}`.trim());
        return;
      }

      const data = await resp.json().catch(() => null);
      if (!data?.checkout_url) {
        toast.error("Could not create checkout link.");
        return;
      }

      window.location.href = data.checkout_url as string;
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const busy = loading !== null;
  const isPro = currentPlan === "pro" && subscriptionStatus === "active";

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-[#08080F] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Already on Pro — redirect to settings
  if (isPro) {
    return (
      <div className="min-h-screen bg-[#08080F] font-body text-foreground flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <img src={pitchnwLogo} alt="Pitchnw" className="h-20 w-auto object-contain mx-auto mb-6" />
          <h1 className="font-display font-extrabold text-2xl mb-3">You're already on Pro!</h1>
          <p className="text-muted-foreground mb-6 text-sm">You have full access to all features.</p>
          <Button variant="hero" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080F] font-body text-foreground">
      <div className="mx-auto max-w-md px-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <img src={pitchnwLogo} alt="Pitchnw" className="h-24 w-auto object-contain mx-auto mb-6" />
          <h1 className="font-display font-extrabold text-4xl text-center mb-3">Upgrade to Pro</h1>
          <p className="text-muted-foreground text-center max-w-lg mx-auto">
            Start your 3-day free trial. Cancel anytime.
          </p>
        </motion.div>

        {/* Single Pro plan card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/10 via-card/90 to-card/80 p-8 flex flex-col shadow-[0_0_40px_-12px_hsl(var(--primary))]"
        >
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-1">
            3-DAY FREE TRIAL
          </span>
          <p className="font-display font-bold uppercase tracking-wide text-xl text-card-foreground mt-4">Pro</p>
          <div className="mt-2 mb-4 flex items-baseline gap-1">
            <span className="font-display font-extrabold text-5xl text-card-foreground">$12</span>
            <span className="text-muted-foreground text-sm">/month</span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Unlimited proposals. No limits. Full access.</p>
          <ul className="space-y-3 mb-8 flex-1 text-sm text-muted-foreground">
            {[
              "Unlimited AI proposal generation",
              "High-converting sales copy output",
              "8 professional pitch templates",
              "Branding kit (logo + header)",
              "Client portal with private link",
              "Digital signatures",
              "Proposal analytics",
              "Full CRM pipeline",
              "PDF export",
              "Manage proposals",
            ].map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <Button
            variant="hero"
            size="lg"
            className="w-full text-base"
            disabled={busy}
            onClick={handleCheckout}
          >
            {loading === "pro" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Start Free Trial — 3 Days
          </Button>
        </motion.div>

        <p className="mt-8 text-center font-mono text-[11px] text-muted-foreground space-y-1">
          <span className="block">🔒 Secure instant upgrade</span>
          <span className="block">No card charged during trial · Cancel anytime</span>
        </p>
      </div>
    </div>
  );
}
