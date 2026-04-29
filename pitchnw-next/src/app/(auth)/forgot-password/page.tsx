'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Mail, ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ClayCard } from '@/components/ui/ClayCard'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayInput } from '@/components/ui/ClayInput'
import { ClayBadge } from '@/components/ui/ClayBadge'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
      toast.success("Check your email for the reset link!")
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-4">
           <div className="h-16 w-16 bg-primary rounded-[2rem] flex items-center justify-center mx-auto shadow-lg">
             <Mail className="h-8 w-8 text-white" />
           </div>
           <div className="space-y-1">
             <h1 className="font-display text-3xl font-black text-slate-900 tracking-tighter">Reset Password</h1>
             <p className="text-slate-500 font-medium text-sm">
               {sent ? "Check your inbox for instructions." : "Enter your email to receive a secure reset link."}
             </p>
           </div>
        </div>

        {sent ? (
          <ClayCard className="p-10 text-center space-y-6">
             <div className="space-y-2">
                <p className="text-sm text-slate-500 font-medium">
                  We've sent an email to <span className="font-bold text-slate-900">{email}</span>
                </p>
                <p className="text-xs text-slate-400">If you don't see it, check your spam folder.</p>
             </div>
             <div className="flex flex-col gap-3">
                <ClayButton onClick={() => setSent(false)} variant="secondary">Try Different Email</ClayButton>
                <ClayButton onClick={() => router.push('/login')} variant="ghost">Back to Login</ClayButton>
             </div>
          </ClayCard>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <ClayCard className="p-10 space-y-6">
               <ClayInput 
                 label="Email Address" 
                 icon={Mail} 
                 type="email" 
                 placeholder="you@example.com" 
                 value={email} 
                 onChange={(e) => setEmail(e.target.value)} 
                 required 
               />
               <ClayButton type="submit" disabled={loading} className="w-full h-14 shadow-glow">
                 {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
               </ClayButton>
            </ClayCard>
            
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors mx-auto"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
