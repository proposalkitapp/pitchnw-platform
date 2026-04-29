'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Lock, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ClayCard } from '@/components/ui/ClayCard'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayInput } from '@/components/ui/ClayInput'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isRecovery, setIsRecovery] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if we have the recovery token in hash or if event fires
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      setIsRecovery(true)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      toast.success("Password updated!")
    } catch (err: any) {
      toast.error(err.message || "Failed to update password")
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
           <div className={cn(
             "h-16 w-16 rounded-[2rem] flex items-center justify-center mx-auto shadow-lg",
             success ? "bg-emerald-500" : "bg-primary"
           )}>
             {success ? <CheckCircle className="h-8 w-8 text-white" /> : <Lock className="h-8 w-8 text-white" />}
           </div>
           <div className="space-y-1">
             <h1 className="font-display text-3xl font-black text-slate-900 tracking-tighter">
               {success ? "Success!" : "New Password"}
             </h1>
             <p className="text-slate-500 font-medium text-sm">
               {success ? "Your account is secured. Ready to jump back in?" : "Choose a strong password to secure your account."}
             </p>
           </div>
        </div>

        {success ? (
          <ClayCard className="p-10 space-y-6">
             <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span className="text-emerald-900 font-bold text-sm">Password updated successfully</span>
             </div>
             <ClayButton onClick={() => router.push('/dashboard')} className="w-full h-14 shadow-glow">
                Go to Dashboard
             </ClayButton>
          </ClayCard>
        ) : !isRecovery ? (
          <ClayCard className="p-10 space-y-6 text-center">
             <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-500 mb-2">
                <AlertTriangle className="h-6 w-6" />
             </div>
             <p className="text-sm text-slate-500 font-medium">This reset link appears to be invalid or expired.</p>
             <ClayButton onClick={() => router.push('/forgot-password')} variant="secondary" className="w-full">Request New Link</ClayButton>
          </ClayCard>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <ClayCard className="p-10 space-y-6">
               <ClayInput 
                 label="New Password" 
                 icon={Lock} 
                 type="password" 
                 placeholder="••••••••" 
                 value={password} 
                 onChange={(e) => setPassword(e.target.value)} 
                 required 
               />
               <ClayInput 
                 label="Confirm New Password" 
                 icon={Lock} 
                 type="password" 
                 placeholder="••••••••" 
                 value={confirmPassword} 
                 onChange={(e) => setConfirmPassword(e.target.value)} 
                 required 
               />
               <ClayButton type="submit" disabled={loading} className="w-full h-14 shadow-glow">
                 {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update Password"}
               </ClayButton>
            </ClayCard>
          </form>
        )}
      </motion.div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
