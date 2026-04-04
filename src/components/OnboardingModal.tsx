import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Rocket, X } from "lucide-react";
import pitchnwLogo from "@/assets/pitchnw-logo.png";

const roles = ["Freelance Developer", "Web Designer", "Marketing Agency", "Copywriter", "Consultant", "Other"];

interface Props {
  displayName: string;
  onComplete: () => void;
}

export function OnboardingModal({ displayName, onComplete }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const handleComplete = async () => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true, company_name: companyName || undefined })
        .eq("user_id", user.id);
    }
    onComplete();
  };

  const firstName = displayName?.split(" ")[0] || "there";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg mx-4 rounded-2xl border border-border bg-card p-8 shadow-2xl"
      >
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`h-2 w-2 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>

        <button onClick={handleComplete} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-5 w-5" />
        </button>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
              <img src={pitchnwLogo} alt="Pitchnw" className="h-24 w-auto object-contain mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold mb-2 text-card-foreground">
                Welcome to Pitchnw, {firstName}!
              </h2>
              <p className="text-muted-foreground mb-6 text-sm">
                Let's get you set up so your proposals look professional.
              </p>
              <div className="space-y-4 text-left">
                <div>
                  <label className="text-sm font-medium text-card-foreground">Company Name (optional)</label>
                  <Input placeholder="Your company or brand" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-2 block">What do you do?</label>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          selectedRole === role
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button variant="hero" className="w-full mt-6 gap-2" onClick={() => setStep(1)}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold mb-2 text-card-foreground">Create your first proposal</h2>
              <p className="text-muted-foreground mb-6 text-sm">Head to the proposal generator to create an AI-powered proposal in seconds.</p>
              <Button variant="hero" className="w-full gap-2" onClick={() => setStep(2)}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
              <button onClick={() => setStep(2)} className="text-sm text-muted-foreground hover:text-primary mt-3 inline-block">Skip for now →</button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-bold mb-2 text-card-foreground">Share with your clients</h2>
              <p className="text-muted-foreground mb-6 text-sm">Every proposal gets a unique client link. Share it and your client can read, review, and accept online.</p>
              <Button variant="hero" className="w-full gap-2" onClick={() => setStep(3)}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
              <Rocket className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold mb-2 text-card-foreground">You're ready to close more deals 🚀</h2>
              <p className="text-muted-foreground mb-6 text-sm">You're on the Free plan — 3 proposals per month. Upgrade anytime for unlimited access.</p>
              <Button variant="hero" className="w-full gap-2" onClick={handleComplete}>
                Start Using Pitchnw
              </Button>
              <button onClick={() => { handleComplete(); navigate("/settings?tab=billing"); }} className="text-sm text-muted-foreground hover:text-primary mt-3 inline-block">
                See upgrade options
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
