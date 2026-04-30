'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Check, 
  Loader2, 
  ShieldCheck, 
  Zap, 
  Crown,
  Sparkles,
  ArrowRight,
  Target,
  BarChart3,
  Kanban
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { ClayCard } from '@/components/ui/ClayCard'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayBadge } from '@/components/ui/ClayBadge'

export default function CheckoutPage() {
  const { user } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id)
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const isPro = profile?.plan === 'pro' && profile?.subscription_status === 'active'

  const handleCheckout = async () => {
    setLoading(true)
    const toastId = toast.loading("Preparing your secure checkout...")
    
    try {
      if (!user) {
        router.push('/login?redirect=/checkout')
        return
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            email: user.email,
            name: profile?.display_name
          }
        })
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)

      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        throw new Error("No checkout URL returned")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout", { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  if (profileLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>

  if (isPro) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-8">
         <div className="h-24 w-24 bg-primary rounded-[2.5rem] flex items-center justify-center text-white shadow-glow">
            <Crown className="h-12 w-12" />
         </div>
         <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">You're already a Pro!</h1>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">You have full access to all features. Your subscription is active and secured.</p>
         </div>
         <ClayButton onClick={() => router.push('/dashboard')}>Back to Dashboard</ClayButton>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="text-center mb-12 space-y-4">
           <ClayBadge variant="info">
              <Sparkles className="h-3 w-3 mr-2" /> Upgrade to Freelancer
           </ClayBadge>
           <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Go Unlimited</h1>
           <p className="text-slate-500 font-medium text-lg max-w-md mx-auto">
             Stop settling for basic pitches. Build a professional studio with unlimited AI and analytics.
           </p>
        </div>

        <ClayCard className="p-10 md:p-12 space-y-10 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <Zap className="h-32 w-32 text-primary" />
           </div>

           <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                 <div>
                    <h2 className="text-2xl font-black text-slate-900">Freelancer Pro</h2>
                    <p className="text-sm font-bold text-slate-400">Cancel anytime · Secure payment</p>
                 </div>
                 <div className="text-right">
                    <p className="text-4xl font-black text-slate-900">$12</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Per Month</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {[
                   { icon: Sparkles, text: "Unlimited AI Proposals" },
                   { icon: Kanban, text: "Full CRM Pipeline" },
                   { icon: BarChart3, text: "Advanced Analytics" },
                   { icon: Target, text: "AI Pitch Analysis" },
                   { icon: ShieldCheck, text: "Brand Customization" },
                   { icon: Check, text: "Priority Support" }
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 border border-white">
                      <item.icon className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs font-bold text-slate-700">{item.text}</span>
                   </div>
                 ))}
              </div>

              <div className="pt-6">
                 <ClayButton 
                   className="w-full h-16 text-lg shadow-glow bg-primary hover:bg-primary/90"
                   onClick={handleCheckout}
                   disabled={loading}
                 >
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                      <>
                        Start 3-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                 </ClayButton>
              </div>

              <div className="flex items-center justify-center gap-6 opacity-30">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-3 w-auto" />
                 <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-5 w-auto" />
                 <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-5 w-auto" />
              </div>
           </div>
        </ClayCard>

        <p className="mt-10 text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
           Secured by Dodo Payments & Pitchnw
        </p>
      </motion.div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
