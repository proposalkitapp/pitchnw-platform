"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { useRouter } from "next/navigation";

const OCCUPATIONS = [
  "Freelance Developer", "Web Designer", "UI/UX Designer", "Graphic Designer",
  "Brand Strategist", "Copywriter", "Content Writer", "SEO Specialist",
  "Digital Marketer", "Social Media Manager", "Video Producer", "Photographer",
  "Videographer", "Motion Designer", "3D Artist", "Illustrator", "Animator",
  "Architect", "Interior Designer", "Product Designer", "Business Consultant",
  "Management Consultant", "Financial Advisor", "Accountant", "Lawyer / Legal Consultant",
  "HR Consultant", "PR & Communications", "Event Planner", "Virtual Assistant",
  "Project Manager", "Software Engineer", "Data Analyst", "Cybersecurity Consultant",
  "IT Consultant", "DevOps Engineer", "Mobile App Developer", "Game Developer",
  "Voiceover Artist", "Podcast Producer", "Music Producer", "Coach / Mentor",
  "Trainer / Educator", "Researcher", "Recruiter", "Real Estate Agent",
  "Insurance Agent", "Healthcare Consultant", "Nutritionist / Dietitian", "Other"
];

const REFERRAL_SOURCES = [
  "Twitter / X", "LinkedIn", "Instagram", "TikTok", "YouTube", "Google Search",
  "Product Hunt", "A friend or colleague", "Reddit", "WhatsApp", "Newsletter", "Other"
];

interface Props {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Form states
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [occupation, setOccupation] = useState("");
  const [referralSource, setReferralSource] = useState("");

  const handleNextStep1 = () => {
    if (username.length < 2) {
      setUsernameError("Username must be at least 2 characters.");
      return;
    }
    if (/\s/.test(username)) {
      setUsernameError("Username cannot contain spaces.");
      return;
    }
    setUsernameError("");
    setStep(1);
  };

  const handleNextStep2 = () => {
    if (!occupation) return;
    setStep(2);
  };

  const handleComplete = async () => {
    if (user) {
      await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          onboarding_completed: true,
          username,
          occupation,
          referral_source: referralSource || null
        }, { onConflict: 'user_id' });
    }
    
    import("sonner").then((mod) => mod.toast.success(`You're all set, ${username}!`));
    
    onComplete();
    // Force a hard refresh to get the updated username in headers/sidebars,
    // or just let Next router refresh the page data
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Background blurred but not clickable to dismiss */}
      <div className="absolute inset-0 bg-background/40 backdrop-blur-xl" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/10 bg-card/90 backdrop-blur-2xl p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]"
      >
        {/* Progress indicator */}
        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i === step ? "bg-primary" : i < step ? "bg-emerald-500" : "bg-secondary"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: USERNAME */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
              <h2 className="font-display text-3xl font-bold mb-2 text-card-foreground">
                What should we call you?
              </h2>
              <p className="text-muted-foreground mb-8 text-base">
                This is how Pitchnw will address you.
              </p>
              
              <div className="text-left max-w-sm mx-auto space-y-2">
                <label className="text-sm font-medium text-card-foreground">Username</label>
                <Input
                  placeholder="e.g. Daniel, Franc, Alex"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (e.target.value.includes(' ')) {
                      setUsernameError("Username cannot contain spaces");
                    } else {
                      setUsernameError("");
                    }
                  }}
                  className={usernameError ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {usernameError && (
                  <p className="text-sm text-destructive font-medium">{usernameError}</p>
                )}
              </div>

              <div className="mt-10 flex justify-center">
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full max-w-sm"
                  onClick={handleNextStep1}
                  disabled={!username || username.length < 2 || /\s/.test(username)}
                >
                  Continue →
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: OCCUPATION */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
              <h2 className="font-display text-2xl font-bold mb-2 text-card-foreground">What do you do?</h2>
              <p className="text-muted-foreground mb-6 text-sm">Help us personalize your experience.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[40vh] overflow-y-auto p-1 text-left hide-scroll-nav">
                {OCCUPATIONS.map((role) => (
                  <button
                    key={role}
                    onClick={() => setOccupation(role)}
                    className={`p-3 rounded-xl text-xs font-medium border text-left transition-all ${
                      occupation === role
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-background border-border text-foreground hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full max-w-sm"
                  onClick={handleNextStep2}
                  disabled={!occupation}
                >
                  Continue →
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: REFERRAL SOURCE */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
              <h2 className="font-display text-2xl font-bold mb-2 text-card-foreground">One last thing — how did you find us?</h2>
              <p className="text-muted-foreground mb-6 text-sm">This helps us reach more people like you.</p>
              
              <div className="flex flex-wrap justify-center gap-2.5 max-w-lg mx-auto">
                {REFERRAL_SOURCES.map((source) => (
                  <button
                    key={source}
                    onClick={() => setReferralSource(source)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${
                      referralSource === source
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-foreground hover:border-primary/40"
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>

              <div className="mt-10 flex flex-col items-center gap-4">
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full max-w-sm"
                  onClick={handleComplete}
                >
                  Finish Setup →
                </Button>
                <button
                  onClick={handleComplete}
                  className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  Skip →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll-nav::-webkit-scrollbar {
          width: 6px;
        }
        .hide-scroll-nav::-webkit-scrollbar-track {
          background: transparent;
        }
        .hide-scroll-nav::-webkit-scrollbar-thumb {
          background-color: var(--border);
          border-radius: 10px;
        }
      `}} />
    </div>
  );
}
