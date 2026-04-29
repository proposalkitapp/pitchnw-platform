'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Inbox, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Briefcase, 
  ChevronRight,
  TrendingUp,
  Filter
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { ClayCard } from '@/components/ui/ClayCard'
import { ClayBadge } from '@/components/ui/ClayBadge'
import { ClayButton } from '@/components/ui/ClayButton'

const STATUS_CONFIG = {
  'new': { icon: Inbox, color: 'text-blue-500', bg: 'bg-blue-50', label: 'New Submission' },
  'reviewing': { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'In Review' },
  'passed': { icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-50', label: 'Passed' },
  'meeting': { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Meeting Set' }
}

export default function InvestorDashboardPage() {
  const { user } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id)
  const supabase = createClient()
  const router = useRouter()

  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (user && profile?.role === 'investor') {
      fetchSubmissions()
    }
  }, [user, profile])

  const fetchSubmissions = async () => {
    const { data, error } = await supabase
      .from('pitch_submissions')
      .select('*')
      .eq('investor_id', user?.id)
      .order('created_at', { ascending: false })
      
    if (!error && data) setSubmissions(data)
    setLoading(false)
  }

  if (profileLoading || loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>

  if (profile?.role !== 'investor') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="h-24 w-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center shadow-sm">
          <Briefcase className="h-10 w-10" />
        </div>
        <div className="space-y-2">
           <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Investor Access Only</h2>
           <p className="text-slate-500 font-medium max-w-sm">Your account is not configured as an investor profile. Contact support to change your role.</p>
        </div>
        <ClayButton onClick={() => router.push('/dashboard')} variant="secondary">Return to Dashboard</ClayButton>
      </div>
    )
  }

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter)

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-10 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <ClayBadge variant="info">
             <TrendingUp className="h-3 w-3 mr-2" /> Live Deal Flow
          </ClayBadge>
          <h1 className="font-display text-5xl font-black text-slate-900 tracking-tighter">Deal Flow <span className="text-primary">Pipeline</span></h1>
          <p className="text-slate-500 font-medium text-lg">Review and manage incoming pitch submissions.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-white">
           <div className="px-4 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
             <Inbox className="h-4 w-4" /> {submissions.length} Total
           </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] w-fit border border-white/20 overflow-x-auto max-w-full">
        {['all', 'new', 'reviewing', 'meeting', 'passed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-6 py-2.5 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              filter === f ? "bg-white text-slate-900 shadow-sm scale-[1.02]" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-6">
        {filtered.length === 0 ? (
          <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-4 border-dashed border-white shadow-inner">
            <Briefcase className="h-16 w-16 text-slate-200 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-slate-400 tracking-tighter">No pitches found in this stage</h3>
            <p className="text-slate-400 font-medium mt-2">Share your investor submission link to start receiving pitches.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filtered.map(sub => {
              const config = STATUS_CONFIG[sub.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG['new']
              const StatusIcon = config.icon

              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => router.push(`/investor/pitches/${sub.id}`)}
                >
                  <ClayCard className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between cursor-pointer hover:border-primary/40 group transition-all">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                      <div className={cn("h-16 w-16 rounded-[1.5rem] flex items-center justify-center shadow-sm transition-transform group-hover:scale-110", config.bg)}>
                        <StatusIcon className={cn("h-8 w-8", config.color)} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors">{sub.company_name}</h3>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{sub.ask_amount || 'Equity Only'}</span>
                           <span className="h-1 w-1 rounded-full bg-slate-200" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{new Date(sub.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 mt-6 md:mt-0 w-full md:w-auto justify-between border-t md:border-none pt-6 md:pt-0 border-slate-50">
                       <ClayBadge variant={
                         sub.status === 'meeting' ? 'success' :
                         sub.status === 'new' ? 'info' :
                         sub.status === 'reviewing' ? 'warning' : 'secondary'
                       }>
                         {config.label}
                       </ClayBadge>
                       <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all">
                         <ChevronRight className="h-5 w-5" />
                       </div>
                    </div>
                  </ClayCard>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
