'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import CountUp from 'react-countup'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts'
import { 
  Plus, Eye, BarChart3, TrendingUp, 
  Brain, Sparkles, Zap, ArrowRight,
  BarChart2, Target, DollarSign, Clock, Lock
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useProposals } from '@/hooks/useProposals'
import { ClayCard } from '@/components/ui/ClayCard'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayBadge } from '@/components/ui/ClayBadge'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const statusVariants: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
  draft: 'info',
  sent: 'info',
  opened: 'warning',
  won: 'success',
  lost: 'error',
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data: profile, isPro } = useProfile(user?.id)
  const { data: proposals = [], isLoading: loadingProposals } = useProposals(user?.id)
  const router = useRouter()
  
  const [selectedProposal, setSelectedProposal] = useState<any>(null)

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"
  const displayName = (profile as any)?.display_name?.split(" ")[0] || user?.email?.split("@")[0] || "User"
  const usedCount = (profile as any)?.proposals_used || 0

  const pipelineValue = useMemo(() => {
    return proposals.reduce((acc: number, p: any) => {
      if (!p.budget || typeof p.budget !== 'string') return acc
      const cleanBudget = p.budget.replace(/[^0-9.]/g, '')
      const numeric = parseFloat(cleanBudget)
      return isNaN(numeric) ? acc : acc + numeric
    }, 0)
  }, [proposals])

  const wonCount = proposals.filter((p: any) => p.status === 'won').length
  const winRate = proposals.length > 0 ? Math.round((wonCount / proposals.length) * 100) : 0

  const chartData = useMemo(() => {
    const monthlyData: Record<string, { won: number; total: number }> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const name = MONTHS[d.getMonth()]
      monthlyData[name] = { won: 0, total: 0 }
    }

    proposals.forEach((p: any) => {
      const d = new Date(p.created_at)
      const name = MONTHS[d.getMonth()]
      if (monthlyData[name]) {
        monthlyData[name].total++
        if (p.status === 'won') monthlyData[name].won++
      }
    })

    return Object.entries(monthlyData).map(([name, data]) => ({
      name,
      rate: data.total > 0 ? Math.round((data.won / data.total) * 100) : 0
    }))
  }, [proposals])

  if (loadingProposals) {
    return (
      <div className="p-10 space-y-8">
        <div className="h-12 w-64 bg-slate-200 animate-pulse rounded-xl" />
        <div className="grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-[2rem]" />)}
        </div>
        <div className="h-[400px] bg-slate-50 animate-pulse rounded-[3rem]" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen p-6 lg:p-10 max-w-[1600px] mx-auto space-y-10 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" 
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[100px]" 
        />
      </div>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <ClayBadge variant={isPro ? "success" : "info"}>
              {isPro ? "Pro Hub" : "Basic Hub"}
            </ClayBadge>
            {isPro && <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />}
          </div>
          <h1 className="font-display text-5xl font-black text-slate-900 tracking-tighter">
            {greeting}, {displayName}
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            {isPro ? "Your pitch engine is running at peak performance." : "Ready to win your next big client?"}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {!isPro && (
            <ClayButton variant="secondary" onClick={() => router.push('/checkout')} className="bg-amber-100 text-amber-700 hover:bg-amber-200">
              Upgrade to Pro
            </ClayButton>
          )}
          <ClayButton onClick={() => router.push('/proposals/new')} className="gap-2 shadow-glow">
            <Plus className="h-5 w-5 stroke-[3px]" /> Create New Pitch
          </ClayButton>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ClayCard className="p-8 group">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Total Pipeline</span>
                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <DollarSign className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
              </div>
              <div className="text-4xl md:text-5xl font-black text-slate-900 truncate">
                $<CountUp end={pipelineValue} separator="," />
              </div>
              <p className="text-slate-400 text-xs mt-4 font-bold">+12.5% from last month</p>
            </ClayCard>

            <ClayCard className="p-8 group">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Winning Rate</span>
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                  <Target className="h-6 w-6 text-emerald-500 group-hover:text-white transition-colors" />
                </div>
              </div>
              <div className="text-4xl md:text-5xl font-black text-slate-900 truncate">
                <CountUp end={winRate} />%
              </div>
              <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500" style={{ width: `${winRate}%` }} />
              </div>
            </ClayCard>

            <ClayCard className={cn(
              "p-8 relative overflow-hidden group cursor-pointer",
              isPro ? "bg-slate-900 text-white" : "bg-white/40"
            )} onClick={() => isPro ? router.push('/coach') : router.push('/checkout')}>
              <div className="relative z-10 h-full flex flex-col justify-between">
                 <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className={cn("h-5 w-5", isPro ? "text-purple-400" : "text-slate-400")} />
                      <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", isPro ? "text-purple-300" : "text-slate-400")}>
                        AI Strategy Coach
                      </span>
                    </div>
                    <p className={cn("text-xl font-black leading-tight", isPro ? "text-white" : "text-slate-600")}>
                      {isPro ? "AI says you could increase conversion by 14%" : "Unlock AI strategy to win more deals"}
                    </p>
                 </div>
                 <div className={cn("flex items-center gap-2 font-bold text-sm mt-4", isPro ? "text-purple-400" : "text-primary")}>
                    {isPro ? "View Analysis" : "Upgrade to Pro"} <ArrowRight className="h-4 w-4" />
                 </div>
              </div>
              {isPro && <Sparkles className="absolute -bottom-4 -right-4 h-32 w-32 text-purple-500 opacity-20 group-hover:scale-125 transition-transform duration-700" />}
            </ClayCard>
          </div>

          <ClayCard className="overflow-hidden">
            <div className="p-10 flex flex-wrap items-center justify-between gap-6 border-b border-white/20">
              <h3 className="text-2xl font-black text-slate-900">Performance Trends</h3>
              <div className="flex gap-2">
                {['Analytics', 'CRM', 'Templates'].map(label => (
                  <ClayButton key={label} variant="ghost" size="sm" className="text-slate-500 hover:text-primary">
                    {label}
                  </ClayButton>
                ))}
              </div>
            </div>
            
            <div className="p-10">
               <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                      <YAxis hide />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px' }}
                        itemStyle={{ fontWeight: 900, fontSize: '16px', color: '#6366f1' }}
                      />
                      <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={5} dot={{ r: 6, fill: '#6366f1', strokeWidth: 4, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                    </LineChart>
                 </ResponsiveContainer>
               </div>
            </div>

            <div className="overflow-x-auto border-t border-white/20">
              <table className="w-full">
                 <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 text-left">Recent Proposals</th>
                      <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 text-left">Value</th>
                      <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 text-left">Stage</th>
                      <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/10">
                    {proposals.slice(0, 5).map((p: any) => (
                      <tr key={p.id} className="group hover:bg-white/30 transition-colors">
                        <td className="px-10 py-6">
                           <div className="font-bold text-slate-900 group-hover:text-primary transition-colors truncate">{p.title}</div>
                           <div className="text-xs text-slate-400 font-medium">{p.client_name || "Untitled Client"}</div>
                        </td>
                        <td className="px-10 py-6">
                           <div className="font-black text-slate-900">{p.budget || "—"}</div>
                        </td>
                        <td className="px-10 py-6">
                           <ClayBadge variant={statusVariants[p.status] || 'info'}>
                              {p.status}
                           </ClayBadge>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ClayButton variant="ghost" size="sm" onClick={() => router.push(`/proposals/${p.id}`)}>
                                <Eye className="h-4 w-4" />
                              </ClayButton>
                              <ClayButton variant="ghost" size="sm" onClick={() => router.push(`/proposals/${p.id}/analytics`)}>
                                <BarChart2 className="h-4 w-4" />
                              </ClayButton>
                           </div>
                        </td>
                      </tr>
                    ))}
                    {proposals.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="h-20 w-20 rounded-[2rem] bg-slate-50 flex items-center justify-center">
                              <Plus className="h-10 w-10 text-slate-300" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800">No proposals yet</h4>
                            <p className="text-slate-400">Generate your first AI proposal to see it here.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
            </div>
          </ClayCard>
        </div>

        <div className="space-y-8">
          <ClayCard className="bg-primary p-10 text-white shadow-glow space-y-8 relative overflow-hidden">
            <Zap className="absolute -top-6 -right-6 h-32 w-32 opacity-10" />
            <h4 className="text-xl font-black relative z-10">Command Center</h4>
            <div className="space-y-4 relative z-10">
               <ClayButton className="w-full bg-white text-primary hover:bg-slate-50" onClick={() => router.push('/proposals/new')}>
                  <Sparkles className="h-4 w-4 mr-2" /> One-Click Draft
               </ClayButton>
               <ClayButton variant="secondary" className="w-full border-white/20 text-white hover:bg-white/10" onClick={() => isPro ? router.push('/crm') : router.push('/checkout')}>
                  <BarChart2 className="h-4 w-4 mr-2" /> Pipeline Manager {!isPro && <Lock className="h-3 w-3 ml-2" />}
               </ClayButton>
               <ClayButton variant="secondary" className="w-full border-white/20 text-white hover:bg-white/10" onClick={() => isPro ? router.push('/coach') : router.push('/checkout')}>
                  <Target className="h-4 w-4 mr-2" /> Strategy Hub {!isPro && <Lock className="h-3 w-3 ml-2" />}
               </ClayButton>
            </div>
          </ClayCard>

          <ClayCard className="p-10 space-y-8">
            <div className="flex items-center justify-between">
               <h4 className="text-lg font-black text-slate-900">Intelligence</h4>
               <Brain className="h-5 w-5 text-purple-500" />
            </div>
            <div className="space-y-6">
              {proposals.filter((p: any) => p.status === 'sent').slice(0, 3).map((p: any) => (
                <div key={p.id} className="group cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                     <div>
                        <p className="text-xs font-black text-purple-600 uppercase tracking-widest mb-1">Update</p>
                        <p className="font-black text-slate-900 leading-tight">Follow up with {p.client_name}</p>
                        <p className="text-xs text-slate-400 mt-1 font-medium">Sent 3 days ago</p>
                     </div>
                     <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <ArrowRight className="h-4 w-4" />
                     </div>
                  </div>
                </div>
              ))}
              {proposals.filter((p: any) => p.status === 'sent').length === 0 && (
                <p className="text-slate-400 text-sm italic py-4">No active follow-up alerts.</p>
              )}
            </div>
            <ClayButton variant="outline" className="w-full border-slate-100 text-slate-400 h-12" onClick={() => router.push('/proposals')}>
               View Full History
            </ClayButton>
          </ClayCard>
        </div>
      </div>
    </div>
  )
}
