'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle, Sparkles, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ClayCard } from '@/components/ui/ClayCard'
import { ClayButton } from '@/components/ui/ClayButton'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')

  useEffect(() => {
    const activate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.push('/login')
          return
        }

        // Optimistically update or wait for webhook
        const { error } = await supabase
          .from('profiles')
          .update({ plan: 'pro', subscription_status: 'active' } as any)
          .eq('user_id', session.user.id)

        if (error) {
          console.error('Activation error:', error)
          setStatus('error')
          return
        }

        await supabase.auth.refreshSession()
        setStatus('success')

        setTimeout(() => {
          router.push('/dashboard')
        }, 5000)

      } catch (err) {
        console.error('Activation failed:', err)
        setStatus('error')
      }
    }

    activate()
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg relative z-10"
      >
        <AnimatePresence mode="wait">
          {status === 'verifying' && (
            <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
               <div className="h-24 w-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto border border-white/10 shadow-2xl">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
               </div>
               <div className="space-y-2">
                  <h1 className="text-3xl font-black text-white tracking-tighter">Securing your Pro Plan...</h1>
                  <p className="text-slate-500 font-medium">Please wait while we activate your high-performance tools.</p>
               </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
               <div className="h-32 w-32 bg-emerald-500 rounded-[3rem] flex items-center justify-center mx-auto text-white shadow-glow-success animate-bounce">
                  <CheckCircle className="h-16 w-16" />
               </div>
               <div className="space-y-2">
                  <h1 className="text-5xl font-black text-white tracking-tighter">Welcome to the <span className="text-primary">Elite</span></h1>
                  <p className="text-slate-400 font-medium text-lg max-w-md mx-auto leading-relaxed">
                    Activation complete. Every pro tool, template, and insight is now at your fingertips. Go build something legendary.
                  </p>
               </div>
               
               <div className="flex flex-col gap-4">
                  <ClayButton onClick={() => router.push('/dashboard')} className="h-16 text-lg shadow-glow">
                     Launch Pro Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </ClayButton>
                  <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Auto-redirecting in 5 seconds...</p>
               </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
               <div className="h-24 w-24 bg-rose-500/20 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto border border-rose-500/30">
                  <AlertCircle className="h-12 w-12" />
               </div>
               <div className="space-y-4">
                  <h1 className="text-3xl font-black text-white tracking-tighter">Payment Received!</h1>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto">
                    Your payment was successful, but we hit a small delay in activating your dashboard. Don't worry — our team is on it.
                  </p>
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                     <p className="text-xs text-slate-400">Need immediate help? Email <span className="text-white font-bold">support@pitchnw.app</span></p>
                  </div>
               </div>
               <ClayButton onClick={() => router.push('/dashboard')} variant="secondary" className="w-full h-14">Return to Dashboard</ClayButton>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <footer className="absolute bottom-10 left-0 w-full text-center">
         <div className="flex items-center justify-center gap-2 text-slate-700">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Encrypted Session Secure</span>
         </div>
      </footer>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
