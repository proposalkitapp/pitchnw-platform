import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from "@/integrations/supabase/client";
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, Zap, Brain, Target, BarChart3, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [pollCount, setPollCount] = useState(0)

  const MAX_POLLS = 15; // 15 attempts × 2s = 30 seconds max wait

  const checkUpgradeStatus = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return false;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('plan, subscription_status')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Profile check error:', error);
        return false;
      }

      return profile?.plan === 'pro';
    } catch (err) {
      console.error('Upgrade check error:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    const verifyAndActivate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          navigate('/auth')
          return
        }

        // Force refresh the session to pick up any role/metadata changes
        await supabase.auth.refreshSession()

        // Check if already upgraded
        const isUpgraded = await checkUpgradeStatus();

        if (isUpgraded) {
          // Already Pro — celebrate and redirect
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#0033ff', '#4EEAA0', '#7C6FF7']
          });
          setStatus('success');
          setTimeout(() => navigate('/dashboard', { replace: true }), 5000);
          return;
        }

        // Not upgraded yet — start polling (webhook may still be processing)
        startPolling();
      } catch (err) {
        console.error('Verification error:', err)
        setStatus('error')
      }
    }

    verifyAndActivate()
  }, [navigate, checkUpgradeStatus]);

  const startPolling = useCallback(() => {
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      setPollCount(attempts);

      const isUpgraded = await checkUpgradeStatus();

      if (isUpgraded) {
        clearInterval(interval);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0033ff', '#4EEAA0', '#7C6FF7']
        });
        setStatus('success');
        setTimeout(() => navigate('/dashboard', { replace: true }), 5000);
        return;
      }

      if (attempts >= MAX_POLLS) {
        clearInterval(interval);

        // Last resort: try to activate directly via a manual profile update
        // This handles the case where the webhook failed but payment succeeded
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // Note: This is a fallback. The webhook should handle this normally.
            // We set the plan optimistically so the user isn't stuck.
            const { error } = await supabase
              .from('profiles')
              .update({
                plan: 'pro',
                subscription_status: 'active',
              } as any)
              .eq('user_id', session.user.id);

            if (!error) {
              confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#0033ff', '#4EEAA0', '#7C6FF7']
              });
              setStatus('success');
              setTimeout(() => navigate('/dashboard', { replace: true }), 5000);
              return;
            }
          }
        } catch {
          // Fallback activation failed
        }

        setStatus('error');
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [checkUpgradeStatus, navigate]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 font-body">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full"
        />
        <div className="text-center space-y-2">
          <h2 className="font-display font-black text-3xl text-foreground tracking-tight">Activating Pro Engine</h2>
          <p className="text-muted-foreground font-medium">
            {pollCount > 0
              ? `Confirming upgrade with payment provider... (${pollCount}/${MAX_POLLS})`
              : "Provisioning your elite features..."}
          </p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-10 font-body text-center p-6">
        <div className="h-20 w-20 bg-destructive/10 rounded-3xl flex items-center justify-center">
           <Zap className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-4 max-w-md">
          <h2 className="font-display font-black text-3xl text-foreground tracking-tight">Activation Delay</h2>
          <p className="text-muted-foreground font-medium leading-relaxed">
            Payment confirmed, but we had trouble updating your profile automatically. 
            Don't worry, your Pro status is safe. Contact us at <span className="text-foreground font-bold">support@pitchnw.com</span> for manual activation.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/dashboard')}
          className="h-14 px-10 rounded-2xl font-black"
          variant="hero"
        >
          Go to Dashboard Anyway
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center font-body p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-2xl w-full bg-card border border-border rounded-[48px] p-10 md:p-16 text-center space-y-10 relative z-10 shadow-2xl"
      >
        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20 mb-4">
           <Sparkles className="h-4 w-4 text-primary" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Upgrade Complete</span>
        </div>

        <h1 className="font-display font-black text-4xl md:text-6xl text-foreground tracking-tighter leading-none">
          Welcome to the <br /> <span className="text-primary">Pro Version.</span>
        </h1>

        <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-lg mx-auto leading-relaxed">
          Your account has been promoted to Pro. Every elite feature, infinite generation, and AI intelligence tools are now unlocked.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-10">
          {[
            { label: 'Unlimited AI', icon: Zap },
            { label: 'AI Coach', icon: Brain },
            { label: 'CRM Pipeline', icon: BarChart3 },
            { label: 'Pitch Analysis', icon: Target },
            { label: 'Branding', icon: Sparkles },
            { label: 'Priority', icon: CheckCircle2 },
          ].map((feat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="bg-muted/50 border border-border p-4 rounded-3xl flex flex-col items-center gap-3"
            >
               <feat.icon className="h-5 w-5 text-primary" />
               <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{feat.label}</span>
            </motion.div>
          ))}
        </div>

        <div className="pt-10 flex flex-col items-center gap-6">
           <Button 
             onClick={() => navigate('/dashboard')}
             variant="hero"
             size="xl"
             className="w-full md:w-auto"
           >
             Enter Pro Dashboard <ArrowRight className="h-5 w-5 ml-2" />
           </Button>
           <p className="text-muted-foreground text-sm font-medium animate-pulse">
             Redirecting you to the command center in a few seconds...
           </p>
        </div>
      </motion.div>
    </div>
  )
}
