'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ClayInput } from '@/components/ui/ClayInput'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayCard } from '@/components/ui/ClayCard'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName
          },
          emailRedirectTo: window.location.origin + '/auth/callback'
        }
      })
      if (error) throw error
      
      if (data.session) {
        toast.success('Welcome to Pitchnw!')
        router.push('/dashboard')
      } else {
        toast.success('Check your email to verify your account.')
        router.push('/login')
      }
    } catch (err: any) {
      toast.error(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-glass-wave">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="text-center mb-8">
          <img src="/assets/logo.png" alt="Pitchnw" className="h-20 w-auto mx-auto mb-4" />
          <h1 className="font-display text-4xl font-black text-slate-900 tracking-tighter">
            Create account
          </h1>
          <p className="text-slate-500 font-medium">Start generating AI-powered proposals</p>
        </div>

        <ClayCard className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <ClayInput
              label="Full Name"
              placeholder="John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <ClayInput
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <ClayInput
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />

            <ClayButton className="w-full h-14 shadow-glow" type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Create Account"}
            </ClayButton>
          </form>

          <div className="text-center pt-4">
            <p className="text-sm text-slate-500 font-medium">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </ClayCard>
      </motion.div>
    </div>
  )
}
