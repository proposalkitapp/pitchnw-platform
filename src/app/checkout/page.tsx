"use client";

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from "framer-motion";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import pitchnwLogo from "../../assets/pitchnw-logo.png";


export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<"pro" | "upgrade" | null>(null);
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

  const handleUpgrade = async (plan: "pro") => {
    try {
      setLoading("upgrade");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.functions.invoke("upgrade-subscription", {
        body: { plan },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      toast.success(`Successfully upgraded to Pro plan!`);
      navigate("/settings");
    } catch {
      toast.error("Failed to process the upgrade. Please try again or contact support.");
    } finally {
      setLoading(null);
    }
  };

  const handleCheckout = async () => {
    try {
      setLoading("pro");
      const { data: { session } } = await supabase.auth.getSession();
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
    } catch (e: any) {
      toast.error(e?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  const busy = loading !== null;
  const selectedPlan = searchParams.get("plan") as "pro" | null;
  const isUpgrading = currentPlan && selectedPlan && currentPlan !== selectedPlan && subscriptionStatus === "active";

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-[#08080F] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isUpgrading) {
    return (
      <div className="min-h-screen bg-[#08080F] font-body text-foreground">
        <div className="mx-auto max-w-md px-4 py-16">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <img src={pitchnwLogo} alt="Pitchnw" className="h-24 w-auto object-contain mx-auto mb-6" />
            <h1 className="font-display font-extrabold text-3xl mb-3">Upgrade Your Plan</h1>
            <p className="text-muted-foreground">You are changing your subscription</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border-2 border-primary bg-card/90 p-8 flex flex-col shadow-[var(--clay-shadow-primary)]"
          >
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current</p>
                <p className="font-display font-bold text-lg capitalize">{currentPlan}</p>
              </div>
              <div className="text-primary font-bold">→</div>
              <div className="text-right">
                <p className="text-xs text-success uppercase tracking-wider font-semibold">New</p>
                <p className="font-display font-bold text-lg capitalize">{selectedPlan || "pro"}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8 text-sm text-card-foreground">
              <p>By upgrading, you will immediately gain access to all the features of the <strong>Pro</strong> tier.</p>
              <div className="bg-success/10 text-success px-4 py-3 rounded-xl flex gap-3 text-sm">
                <Check className="h-5 w-5 shrink-0 mt-0.5" />
                Enjoy full access to all premium features.
              </div>
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              disabled={busy}
              onClick={() => handleUpgrade("pro")}
            >
              {loading === "upgrade" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm Upgrade
            </Button>
            <Button
              variant="ghost"
              className="w-full mt-2 text-muted-foreground hover:text-foreground"
              disabled={busy}
              onClick={() => navigate("/settings")}
            >
              Cancel
            </Button>
          </motion.div>

          <p className="mt-8 text-center font-mono text-[11px] text-muted-foreground space-y-1">
            <span className="block">🔒 Secure instant upgrade</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080F] font-body text-foreground">
      <div className="mx-auto max-w-[840px] px-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <img src={pitchnwLogo} alt="Pitchnw" className="h-24 w-auto object-contain mx-auto mb-6" />
          <h1 className="font-display font-syne text-[800] text-4xl text-center mb-3">One plan. Everything included.</h1>
          <p className="text-muted-foreground text-center max-w-lg mx-auto">
            Start your 3-day free trial. <br /> No card required during trial. Cancel anytime.
          </p>
        </motion.div>

        <div className="max-w-[480px] mx-auto">
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
            <p className="font-display font-bold uppercase tracking-wide text-xl text-card-foreground">Pro</p>
            <div className="mt-2 mb-4 flex items-baseline gap-1">
              <span className="font-display font-extrabold text-5xl text-card-foreground">$12</span>
              <span className="text-muted-foreground text-sm">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Everything you need to pitch and win</p>
            <ul className="space-y-2.5 mb-8 flex-1 text-sm text-muted-foreground">
              {[
                "Unlimited AI proposal generation",
                "High-converting sales copy output",
                "8 professional pitch templates",
                "Branding kit (logo + header title)",
                "Client portal with private link",
                "Digital signatures (creator + client)",
                "Proposal analytics",
                "Sophisticated CRM pipeline",
                "PDF export",
                "AI Win-Rate Coach",
                "Follow-up reminders",
                "Priority support"
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
              className="w-full"
              disabled={busy}
              onClick={() => handleCheckout()}
            >
              {loading === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Start Free Trial — 3 Days
            </Button>
          </motion.div>
        </div>

        <p className="mt-10 text-center font-mono text-[11px] text-muted-foreground space-y-1">
          <span className="block">🔒 Secure upgrade</span>
          <span className="block">Cancel anytime from settings</span>
        </p>
      </div>
    </div>
  );
}
