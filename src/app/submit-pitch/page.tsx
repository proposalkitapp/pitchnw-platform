'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Loader2, 
  Briefcase, 
  Link as LinkIcon, 
  DollarSign, 
  Send,
  Sparkles,
  Building2,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ClayCard } from '@/components/ui/ClayCard'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayInput } from '@/components/ui/ClayInput'

export default function SubmitPitchPage() {
  const [companyName, setCompanyName] = useState('')
  const [deckUrl, setDeckUrl] = useState('')
  const [askAmount, setAskAmount] = useState('')
  const [investorEmail, setInvestorEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName || !investorEmail) return

    setSubmitting(true)
    const toastId = toast.loading("Connecting with investor pipeline...")
    
    try {
      // Lookup investor by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', investorEmail)
        .eq('role', 'investor')
        .single()

      if (profileError || !profile) {
        throw new Error("Investor not found. Please check the email address.")
      }

      const { error: submitError } = await supabase
        .from('pitch_submissions')
        .insert({
          investor_id: profile.id,
          company_name: companyName,
          pitch_deck_url: deckUrl,
          ask_amount: askAmount,
          status: 'new'
        } as any)

      if (submitError) throw submitError

      setSubmitted(true)
      toast.success("Pitch delivered!", { id: toastId })
    } catch (err: any) {
      toast.error(err.message || "Failed to submit pitch", { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-accent/10 blur-[100px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <ClayCard className="p-12 text-center space-y-8 bg-white/60 backdrop-blur-xl">
                 <div className="h-24 w-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto text-white shadow-glow-success animate-bounce">
                    <Send className="h-10 w-10" />
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Pitch Delivered!</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Your deck has been securely submitted to the investor's pipeline. You'll be notified if they're interested.
                    </p>
                 </div>
                 <ClayButton className="w-full h-14" onClick={() => setSubmitted(false)}>
                    Submit Another Deck
                 </ClayButton>
              </ClayCard>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                 <div className="h-20 w-20 bg-white rounded-[2rem] shadow-clay flex items-center justify-center mx-auto border border-white">
                   <Briefcase className="h-10 w-10 text-primary" />
                 </div>
                 <div className="space-y-1">
                   <h1 className="font-display text-4xl font-black text-slate-900 tracking-tighter">Submit Your Pitch</h1>
                   <p className="text-slate-500 font-medium">Direct connection to investor deal flow pipelines.</p>
                 </div>
              </div>

              <ClayCard className="p-10 space-y-6 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <ClayInput 
                    label="Investor Email" 
                    icon={Send} 
                    required 
                    type="email" 
                    placeholder="investor@fund.com" 
                    value={investorEmail} 
                    onChange={(e) => setInvestorEmail(e.target.value)} 
                  />
                  <ClayInput 
                    label="Company Name" 
                    icon={Building2} 
                    required 
                    placeholder="Acme Corp" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                  />
                  <ClayInput 
                    label="Pitch Deck URL" 
                    icon={LinkIcon} 
                    required 
                    type="url" 
                    placeholder="https://pitch.com/..." 
                    value={deckUrl} 
                    onChange={(e) => setDeckUrl(e.target.value)} 
                  />
                  <ClayInput 
                    label="Ask Amount" 
                    icon={DollarSign} 
                    placeholder="$1.5M Seed" 
                    value={askAmount} 
                    onChange={(e) => setAskAmount(e.target.value)} 
                  />
                  
                  <div className="pt-4">
                    <ClayButton type="submit" disabled={submitting} className="w-full h-16 text-lg shadow-glow">
                      {submitting ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                        <>
                          Deliver Pitch <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </ClayButton>
                  </div>
                </form>
              </ClayCard>
              
              <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                Powered by Pitchnw Dealflow Engine
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
