'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Loader2, 
  ArrowLeft, 
  Sparkles, 
  AlertTriangle, 
  HelpCircle, 
  CheckCircle,
  ExternalLink,
  Target,
  BarChart3,
  MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ClayCard } from '@/components/ui/ClayCard'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayBadge } from '@/components/ui/ClayBadge'

export default function PitchReviewPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)

  useEffect(() => {
    if (id) fetchSubmission()
  }, [id])

  const fetchSubmission = async () => {
    const { data, error } = await supabase
      .from('pitch_submissions')
      .select('*, pitch_decks(*)')
      .eq('id', id)
      .single()
      
    if (error || !data) {
      toast.error('Submission not found')
      router.push('/investor/dashboard')
    } else {
      setSubmission(data)
    }
    setLoading(false)
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    const toastId = toast.loading("AI Reviewer is analyzing the pitch...")
    try {
      let deckContent = ''
      if (submission.pitch_decks) {
         deckContent = `Title: ${submission.pitch_decks.title}\nTranscript: ${submission.pitch_decks.transcript || 'None'}\nSlides: ${JSON.stringify(submission.pitch_decks.slides)}`
      } else if (submission.pitch_deck_url) {
         deckContent = `Deck URL: ${submission.pitch_deck_url}`
      }

      const response = await fetch('/api/analyze-pitch-investor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deckContent,
          companyName: submission.company_name,
          askAmount: submission.ask_amount
        })
      })
      
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      
      setAnalysis(data)
      toast.success("Analysis complete!", { id: toastId })
    } catch (err: any) {
      toast.error(err.message || "Analysis failed", { id: toastId })
    } finally {
      setAnalyzing(false)
    }
  }

  const updateStatus = async (status: string) => {
    const { error } = await supabase
      .from('pitch_submissions')
      .update({ status } as any)
      .eq('id', submission.id)

    if (!error) {
      setSubmission({ ...submission, status })
      toast.success(`Status updated to ${status}`)
    }
  }

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar: Navigation & Controls */}
      <div className="w-80 border-r-4 border-slate-100 bg-white flex flex-col shadow-xl z-20">
         <div className="p-8 border-b border-slate-50">
            <button 
              onClick={() => router.push('/investor/dashboard')}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-all mb-8"
            >
               <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </button>
            
            <div className="space-y-4">
               <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{submission.company_name}</h1>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-2">Ask: {submission.ask_amount || 'Not Specified'}</p>
               </div>
               
               <div className="flex flex-wrap gap-2">
                  {['new', 'reviewing', 'meeting', 'passed'].map(s => (
                    <button 
                      key={s}
                      onClick={() => updateStatus(s)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                        submission.status === s 
                          ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                          : "bg-white text-slate-400 border-slate-50 hover:bg-slate-50"
                      )}
                    >
                      {s}
                    </button>
                  ))}
               </div>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-8 space-y-10">
            <div className="space-y-6">
               <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">AI Analysis</h2>
               </div>
               
               <ClayButton 
                 onClick={handleAnalyze} 
                 disabled={analyzing} 
                 className="w-full h-14 shadow-glow"
               >
                 {analyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 mr-2" />}
                 {analyzing ? "Thinking..." : "Run AI Review"}
               </ClayButton>

               <AnimatePresence mode="wait">
                 {analysis ? (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                      <div className="space-y-4">
                         <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                           <CheckCircle className="h-4 w-4" /> Strengths
                         </h3>
                         <ul className="space-y-3">
                           {analysis.strengths?.map((s: string, i: number) => (
                             <li key={i} className="text-xs font-bold text-slate-700 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">{s}</li>
                           ))}
                         </ul>
                      </div>

                      <div className="space-y-4">
                         <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500">
                           <AlertTriangle className="h-4 w-4" /> Red Flags
                         </h3>
                         <ul className="space-y-3">
                           {analysis.redFlags?.map((s: string, i: number) => (
                             <li key={i} className="text-xs font-bold text-slate-700 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">{s}</li>
                           ))}
                         </ul>
                      </div>

                      <div className="space-y-4">
                         <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                           <MessageSquare className="h-4 w-4" /> Questions
                         </h3>
                         <ul className="space-y-3">
                           {analysis.questions?.map((s: string, i: number) => (
                             <li key={i} className="text-xs font-bold text-slate-700 bg-primary/5 p-4 rounded-2xl border border-primary/10 italic">"{s}"</li>
                           ))}
                         </ul>
                      </div>
                   </motion.div>
                 ) : (
                   <div className="text-center py-12 space-y-4 opacity-40">
                      <BarChart3 className="h-12 w-12 mx-auto text-slate-300" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No analysis available</p>
                   </div>
                 )}
               </AnimatePresence>
            </div>
         </div>
      </div>

      {/* Main Viewport: Deck Viewer */}
      <div className="flex-1 flex flex-col relative">
         <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-3xl -z-10" />
         
         <div className="flex-1 p-10 flex items-center justify-center">
            {submission.pitch_deck_url ? (
               <div className="w-full max-w-5xl h-full rounded-[3rem] bg-white shadow-2xl border-8 border-white overflow-hidden relative group">
                  <iframe src={submission.pitch_deck_url} className="w-full h-full border-none" />
                  <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                     <ClayButton 
                       variant="secondary" 
                       onClick={() => window.open(submission.pitch_deck_url, '_blank')}
                       className="bg-white/90 backdrop-blur-md shadow-xl"
                     >
                        <ExternalLink className="h-4 w-4 mr-2" /> Open Original
                     </ClayButton>
                  </div>
               </div>
            ) : (
               <div className="text-center space-y-6">
                  <div className="h-32 w-32 bg-slate-100 rounded-[3rem] flex items-center justify-center mx-auto text-slate-300">
                     <Target className="h-16 w-16" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-400 tracking-tighter">No live deck preview available</h2>
               </div>
            )}
         </div>

         {/* Stats Bar */}
         <div className="h-24 bg-white/60 backdrop-blur-xl border-t border-white/20 px-10 flex items-center gap-12 shrink-0">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Submission Date</p>
               <p className="text-sm font-bold text-slate-900">{new Date(submission.created_at).toLocaleDateString()}</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Content Model</p>
               <div className="flex items-center gap-2 mt-1">
                  <ClayBadge variant="info">Next.js Pitch 2.0</ClayBadge>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
