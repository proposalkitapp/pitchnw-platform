'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ClayInput } from '@/components/ui/ClayInput'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayCard } from '@/components/ui/ClayCard'

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
    <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
    <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
    <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
  </svg>
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    if (searchParams.get('error') === 'auth_failed') {
      toast.error('Authentication failed. Please try again.')
    }
  }, [searchParams])

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      })
      if (error) throw error
    } catch (err) {
      toast.error('Google sign in failed.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials')
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
            Welcome back
          </h1>
          <p className="text-slate-500 font-medium">Sign in to manage your proposals</p>
        </div>

        <ClayCard className="p-8 space-y-6">
          <ClayButton
            variant="secondary"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full bg-white flex items-center justify-center gap-3 h-14"
          >
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleLogo />}
            Continue with Google
          </ClayButton>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
            />

            <ClayButton className="w-full h-14 shadow-glow" type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Sign In"}
            </ClayButton>
          </form>

          <div className="text-center space-y-4 pt-4">
            <p className="text-sm text-slate-500 font-medium">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary font-bold hover:underline">
                Sign up
              </Link>
            </p>
            <Link href="/forgot-password" className="text-xs text-slate-400 hover:text-primary transition-colors font-bold">
              Forgot password?
            </Link>
          </div>
        </ClayCard>
      </motion.div>
    </div>
  )
}
