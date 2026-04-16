import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from "@/integrations/supabase/client";
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, Zap, Brain, Target, BarChart3, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')

  useEffect(() => {
    const verifyAndActivate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          navigate('/auth')
          return
        }

        // Update plan directly in database
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            plan: 'pro',
            subscription_status: 'active',
            proposals_used: 0 // Reset or give unlimited feel
          })
          .eq('user_id', session.user.id)

        if (updateError) {
          console.error('Plan update error:', updateError)
          setStatus('error')
          return
        }

        // Force refresh the session
        await supabase.auth.refreshSession()

        // Celebration!
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0033ff', '#4EEAA0', '#7C6FF7']
        });

        setStatus('success')

        // Redirect to dashboard after 5 seconds to let them read the features
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 5000)

      } catch (err) {
        console.error('Verification error:', err)
        setStatus('error')
      }
    }

    verifyAndActivate()
  }, [navigate]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-[#08080F] flex flex-col items-center justify-center gap-8 font-body">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-16 w-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
        <div className="text-center space-y-2">
          <h2 className="font-display font-black text-3xl text-white tracking-tight">Activating Pro Engine</h2>
          <p className="text-slate-500 font-medium">Provisioning your elite features...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#08080F] flex flex-col items-center justify-center gap-10 font-body text-center p-6">
        <div className="h-20 w-20 bg-red-500/10 rounded-3xl flex items-center justify-center">
           <Zap className="h-10 w-10 text-red-500" />
        </div>
        <div className="space-y-4 max-w-md">
          <h2 className="font-display font-black text-3xl text-white tracking-tight">Activation Delay</h2>
          <p className="text-slate-400 font-medium leading-relaxed">
            Payment confirmed, but we had trouble updating your profile automatically. 
            Don't worry, your Pro status is safe. Contact us at <span className="text-white">hello@pitchnw.app</span> for manual activation.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/dashboard')}
          className="h-14 px-10 rounded-2xl bg-white text-black font-black"
        >
          Go to Dashboard Anyway
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08080F] flex flex-col items-center justify-center font-body p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-2xl w-full bg-[#11111F] border border-white/5 rounded-[48px] p-10 md:p-16 text-center space-y-10 relative z-10 shadow-2xl"
      >
        <div className="inline-flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-full border border-purple-500/30 mb-4">
           <Sparkles className="h-4 w-4 text-purple-400" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">Upgrade Complete</span>
        </div>

        <h1 className="font-display font-black text-4xl md:text-6xl text-white tracking-tighter leading-none">
          Welcome to the <br /> <span className="text-blue-500">Pro Version.</span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl font-medium max-w-lg mx-auto leading-relaxed">
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
              className="bg-white/5 border border-white/5 p-4 rounded-3xl flex flex-col items-center gap-3"
            >
               <feat.icon className="h-5 w-5 text-blue-500" />
               <span className="text-[11px] font-black uppercase tracking-widest text-white/70">{feat.label}</span>
            </motion.div>
          ))}
        </div>

        <div className="pt-10 flex flex-col items-center gap-6">
           <Button 
             onClick={() => navigate('/dashboard')}
             className="h-16 px-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-lg shadow-2xl shadow-blue-600/20 w-full md:w-auto transition-all hover:scale-105 active:scale-95"
           >
             Enter Pro Dashboard <ArrowRight className="h-5 w-5 ml-2" />
           </Button>
           <p className="text-slate-500 text-sm font-medium animate-pulse">
             Redirecting you to the command center in a few seconds...
           </p>
        </div>
      </motion.div>
    </div>
  )
}

