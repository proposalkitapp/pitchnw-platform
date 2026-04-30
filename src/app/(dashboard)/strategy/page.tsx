'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Brain, Upload, FileText, Check, X, 
  ArrowRight, Loader2, Lock, ChevronRight,
  TrendingUp, Award, BarChart3, Info, Sparkles,
  Target
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useProposals } from '@/hooks/useProposals'
import { createClient } from '@/lib/supabase/client'
import { ClayCard } from '@/components/ui/ClayCard'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayBadge } from '@/components/ui/ClayBadge'

export default function StrategyCoachPage() {
  const [activeTab, setActiveTab] = useState<"analyze" | "insights">("analyze")
  const { user } = useAuth()
  const { data: profile, isPro } = useProfile(user?.id)
  const router = useRouter()

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8 min-h-screen">
      <header className="space-y-4">
        <ClayBadge variant="info">
          <Brain className="h-3 w-3 mr-2" /> Strategic Advisor
        </ClayBadge>
        <h1 className="font-display text-5xl font-black text-slate-900 tracking-tighter">
          Strategy <span className="text-primary">Coach</span>
        </h1>
        <p className="text-slate-500 font-medium max-w-lg">
          Improve your pitches. Close more deals. Get AI-driven insights on your sales performance.
        </p>
      </header>

      {/* Tab Pills */}
      <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] w-fit border border-white/20">
        <button
          onClick={() => setActiveTab("analyze")}
          className={cn(
            "px-8 py-3 rounded-[1.25rem] text-sm font-black transition-all",
            activeTab === "analyze" ? "bg-white text-slate-900 shadow-md scale-[1.02]" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Analyze a Pitch
        </button>
        <button
          onClick={() => setActiveTab("insights")}
          className={cn(
            "px-8 py-3 rounded-[1.25rem] text-sm font-black transition-all",
            activeTab === "insights" ? "bg-white text-slate-900 shadow-md scale-[1.02]" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Win-Rate Insights
        </button>
      </div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          {!isPro ? (
            <UpgradeWall key="upgrade" tab={activeTab} />
          ) : activeTab === "analyze" ? (
            <AnalyzeTab key="analyze" />
          ) : (
            <InsightsTab key="insights" />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function UpgradeWall({ tab }: { tab: string }) {
  const router = useRouter()
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto space-y-10"
    >
      <div className="h-28 w-28 bg-primary/10 rounded-[3rem] flex items-center justify-center border-4 border-white shadow-xl">
        <Lock className="h-12 w-12 text-primary" />
      </div>
      <div className="space-y-4">
        <h2 className="font-display text-4xl font-black text-slate-900 tracking-tighter">
          Pro Feature Locked
        </h2>
        <p className="text-slate-500 font-medium leading-relaxed">
          {tab === "analyze" 
            ? "Upload any proposal and get an instant AI score out of 100 with specific suggestions on how to improve it before sending."
            : "Analyze your patterns of success and failure. Discover what makes you win and get high-impact recommendations based on your data."}
        </p>
      </div>
      <ClayButton 
        size="lg" 
        className="w-full h-16 rounded-[2rem] text-lg shadow-glow"
        onClick={() => router.push('/dashboard')} // Assuming they can upgrade from dashboard or settings
      >
        Upgrade to Pro — $12/mo
      </ClayButton>
    </motion.div>
  )
}

function AnalyzeTab() {
  const [option, setOption] = useState<"upload" | "paste">("upload")
  const [proposalText, setProposalText] = useState("")
  const [fileName, setFileName] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  
  const handleAnalyze = async () => {
    setAnalyzing(true)
    const toastId = toast.loading("AI Advisor is reviewing your pitch...")
    
    try {
      const response = await fetch('/api/analyze-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalText })
      })
      
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      
      setAnalysisResult(data.analysis)
      toast.success("Analysis complete!", { id: toastId })
    } catch (err: any) {
      toast.error(err.message || "Analysis failed", { id: toastId })
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      <ClayCard className="p-10 space-y-8">
        <div className="flex gap-1.5 bg-slate-50 p-1 rounded-2xl w-fit border border-white/20">
          <button onClick={() => setOption("upload")} className={cn("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all", option === "upload" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}>File</button>
          <button onClick={() => setOption("paste")} className={cn("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all", option === "paste" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}>Paste</button>
        </div>

        {option === "upload" ? (
          <label className="flex flex-col items-center justify-center w-full h-64 border-4 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-all group">
             <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-16 w-16 bg-white rounded-3xl shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                   <p className="text-slate-900 font-black tracking-tight">Drop your proposal</p>
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">PDF, Word, or TXT</p>
                </div>
             </div>
             <input type="file" className="hidden" />
          </label>
        ) : (
          <textarea 
            className="w-full h-80 p-6 bg-slate-50/50 border-white/20 rounded-[3rem] font-medium text-slate-800 outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none"
            placeholder="Paste your proposal text here..."
            value={proposalText}
            onChange={(e) => setProposalText(e.target.value)}
          />
        )}

        <ClayButton className="w-full h-16 rounded-[2rem] shadow-glow text-lg" disabled={!proposalText || analyzing} onClick={handleAnalyze}>
          {analyzing ? <Loader2 className="h-6 w-6 animate-spin" /> : "Start Deep Analysis"}
        </ClayButton>
      </ClayCard>

      {analysisResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
           <ClayCard className="p-12 text-center bg-gradient-to-br from-primary to-accent text-white border-none shadow-2xl shadow-primary/20">
              <div className="space-y-4">
                 <div className="flex items-baseline justify-center gap-2">
                    <span className="text-[120px] font-black leading-none tracking-tighter">{analysisResult.score}</span>
                    <span className="text-2xl font-black opacity-50">/100</span>
                 </div>
                 <div className="inline-flex px-8 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 font-black text-2xl uppercase">
                    Grade {analysisResult.grade}
                 </div>
                 <p className="max-w-md mx-auto font-medium text-white/90 text-lg leading-relaxed pt-6">
                    {analysisResult.summary}
                 </p>
              </div>
           </ClayCard>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ClayCard className="p-8 border-l-8 border-l-emerald-500">
                 <h3 className="text-emerald-600 font-black uppercase tracking-widest text-xs mb-6">Strengths</h3>
                 <div className="space-y-6">
                    {analysisResult.strengths.map((s: any, i: number) => (
                       <div key={i} className="space-y-1">
                          <p className="font-black text-slate-900">{s.point}</p>
                          <p className="text-sm text-slate-500 font-medium">{s.why}</p>
                       </div>
                    ))}
                 </div>
              </ClayCard>
              <ClayCard className="p-8 border-l-8 border-l-rose-500">
                 <h3 className="text-rose-600 font-black uppercase tracking-widest text-xs mb-6">Weaknesses</h3>
                 <div className="space-y-6">
                    {analysisResult.weaknesses.map((w: any, i: number) => (
                       <div key={i} className="space-y-1">
                          <p className="font-black text-slate-900">{w.point}</p>
                          <p className="text-sm text-slate-500 font-medium">{w.why}</p>
                       </div>
                    ))}
                 </div>
              </ClayCard>
           </div>

           <div className="space-y-6">
              <h3 className="font-black text-slate-900 text-xl flex items-center gap-3">
                 <Target className="h-6 w-6 text-primary" /> Tactical Improvements
              </h3>
              <div className="grid gap-6">
                 {analysisResult.suggestions.map((s: any, i: number) => (
                    <ClayCard key={i} className="p-8 relative overflow-hidden group">
                       <div className={cn(
                          "absolute top-0 right-0 px-6 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest",
                          s.priority === 'high' ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-500"
                       )}>
                          {s.priority} Priority
                       </div>
                       <div className="space-y-4">
                          <div className="space-y-1">
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{s.section}</p>
                             <p className="text-lg font-black text-slate-900">{s.issue}</p>
                          </div>
                          <div className="bg-slate-50 p-6 rounded-2xl border border-white/20">
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Recommended Fix</p>
                             <p className="text-slate-700 font-medium">{s.fix}</p>
                          </div>
                       </div>
                    </ClayCard>
                 ))}
              </div>
           </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function InsightsTab() {
  const { user } = useAuth()
  const { data: proposals = [] } = useProposals(user?.id)
  const outcomes = proposals.filter((p: any) => ['won', 'lost'].includes(p.status))
  const hasEnoughData = outcomes.length >= 3 // Reduced for testing
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/win-rate-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wonProposals: outcomes.filter((o: any) => o.status === 'won'),
          lostProposals: outcomes.filter((o: any) => o.status === 'lost')
        })
      })
      const data = await response.json()
      setInsights(data)
    } catch (err) {
      toast.error("Failed to fetch insights")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasEnoughData) fetchInsights()
  }, [hasEnoughData])

  if (!hasEnoughData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
        <div className="h-24 w-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border border-white/20">
          <BarChart3 className="h-10 w-10 text-slate-300" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter">More Data Needed</h3>
          <p className="text-slate-500 font-medium max-w-sm">Mark at least 5 proposals as Won or Lost to see patterns in your performance.</p>
        </div>
        <div className="w-full max-w-xs space-y-2">
           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
             <span>Progress</span>
             <span>{outcomes.length} / 5</span>
           </div>
           <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${(outcomes.length/5)*100}%` }} />
           </div>
        </div>
      </div>
    )
  }

  if (loading) return <div className="py-20 flex flex-col items-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="font-black text-xs uppercase tracking-widest text-slate-400">Analyzing patterns...</p></div>

  if (!insights) return null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
       <div className="text-center py-12">
          <div className="text-[120px] font-black leading-none tracking-tighter text-slate-900">{insights.winRate}%</div>
          <p className="font-black text-slate-400 uppercase tracking-[0.3em] text-sm">Winning Percentage</p>
       </div>

       <div className="grid gap-6">
          <h3 className="font-black text-slate-900 text-xl">Success Patterns</h3>
          {insights.patterns.map((p: any, i: number) => (
             <ClayCard key={i} className="p-8 border-l-8 border-l-primary">
                <div className="space-y-1">
                   <p className="text-lg font-black text-slate-900">{p.title}</p>
                   <p className="text-slate-500 font-medium">{p.detail}</p>
                </div>
             </ClayCard>
          ))}
       </div>

       <ClayCard className="p-12 text-center bg-slate-900 text-white border-none shadow-2xl">
          <div className="space-y-6">
             <div className="h-16 w-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto">
                <Award className="h-8 w-8 text-primary" />
             </div>
             <div className="space-y-2">
                <h4 className="text-2xl font-black tracking-tight">The Winning Move</h4>
                <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-lg mx-auto">
                   {insights.topRecommendation}
                </p>
             </div>
          </div>
       </ClayCard>
    </motion.div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
