'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  FileText, 
  Shield, 
  Search, 
  Loader2, 
  BarChart3,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { ClayCard } from '@/components/ui/ClayCard'
import { ClayBadge } from '@/components/ui/ClayBadge'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayInput } from '@/components/ui/ClayInput'

type Tab = 'overview' | 'users' | 'proposals'

export default function AdminPage() {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [proposals, setProposals] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState({ totalUsers: 0, totalProposals: 0, proUsers: 0 })

  useEffect(() => {
    if (user && profile) {
      if (!profile.is_admin) {
        router.push('/dashboard')
        return
      }
      fetchAll()
    }
  }, [user, profile])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [profRes, propRes] = await Promise.all([
        supabase.from("profiles").select("*").order('created_at', { ascending: false }),
        supabase.from("proposals").select("*").order('created_at', { ascending: false }),
      ])

      if (profRes.error || propRes.error) throw new Error("Failed to load admin data")

      const profs = profRes.data || []
      const props = propRes.data || []

      setUsers(profs)
      setProposals(props)
      setStats({
        totalUsers: profs.length,
        totalProposals: props.length,
        proUsers: profs.filter((p: any) => p.plan === "pro").length,
      })
    } catch (err) {
      toast.error("Admin fetch error")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>

  const filteredUsers = users.filter((u) =>
    (u.display_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const overviewStats = [
    { label: "Total Disruptors", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Pro Engines", value: stats.proUsers, icon: Shield, color: "text-primary", bg: "bg-primary/5" },
    { label: "Active Proposals", value: stats.totalProposals, icon: FileText, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Avg Proposals/User", value: (stats.totalProposals / (stats.totalUsers || 1)).toFixed(1), icon: Activity, color: "text-amber-500", bg: "bg-amber-50" },
  ]

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <ClayBadge variant="warning">
              <Shield className="h-3 w-3 mr-2" /> Global Administration
           </ClayBadge>
           <h1 className="font-display text-5xl font-black text-slate-900 tracking-tighter">Command <span className="text-primary">Center</span></h1>
           <p className="text-slate-500 font-medium text-lg">Real-time oversight of the Pitchnw ecosystem.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-white">
           <div className="px-6 py-3 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-500">
             <Layers className="h-4 w-4" /> System Health: Optimal
           </div>
        </div>
      </header>

      {/* Admin Tabs */}
      <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] w-fit border border-white/20">
        {(['overview', 'users', 'proposals'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-8 py-3 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all",
              activeTab === tab ? "bg-white text-slate-900 shadow-sm scale-[1.02]" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {overviewStats.map((stat) => (
                  <ClayCard key={stat.label} className="p-8 space-y-4 hover:border-primary/20 group transition-all">
                     <div className="flex items-center justify-between">
                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
                           <stat.icon className={cn("h-6 w-6", stat.color)} />
                        </div>
                        <TrendingUp className="h-4 w-4 text-slate-200" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                     </div>
                  </ClayCard>
                ))}
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <ClayCard className="p-0 overflow-hidden">
                   <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                      <h2 className="text-xl font-black text-slate-900">Latest Disruptors</h2>
                      <ClayButton variant="ghost" size="sm" onClick={() => setActiveTab('users')}>View All</ClayButton>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                               <th className="px-8 py-4">Name</th>
                               <th className="px-8 py-4">Plan</th>
                               <th className="px-8 py-4">Joined</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {users.slice(0, 5).map(u => (
                               <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-8 py-5 text-sm font-bold text-slate-700">{u.display_name || u.email || 'Anonymous'}</td>
                                  <td className="px-8 py-5">
                                     <ClayBadge variant={u.plan === 'pro' ? 'success' : 'secondary'}>{u.plan || 'free'}</ClayBadge>
                                  </td>
                                  <td className="px-8 py-5 text-xs text-slate-400 font-medium">{new Date(u.created_at).toLocaleDateString()}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </ClayCard>

                <ClayCard className="p-0 overflow-hidden">
                   <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                      <h2 className="text-xl font-black text-slate-900">Recent Activity</h2>
                      <ClayButton variant="ghost" size="sm" onClick={() => setActiveTab('proposals')}>View All</ClayButton>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                               <th className="px-8 py-4">Proposal</th>
                               <th className="px-8 py-4">Status</th>
                               <th className="px-8 py-4">Date</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {proposals.slice(0, 5).map(p => (
                               <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-8 py-5 text-sm font-bold text-slate-700">{p.title}</td>
                                  <td className="px-8 py-5">
                                     <ClayBadge variant={p.status === 'won' ? 'success' : p.status === 'lost' ? 'error' : 'info'}>
                                        {p.status}
                                     </ClayBadge>
                                  </td>
                                  <td className="px-8 py-5 text-xs text-slate-400 font-medium">{new Date(p.created_at).toLocaleDateString()}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </ClayCard>
             </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
             <div className="flex items-center justify-between">
                <div className="w-full max-w-md">
                   <ClayInput 
                     placeholder="Search database by name or email..." 
                     icon={Search} 
                     value={searchQuery} 
                     onChange={(e) => setSearchQuery(e.target.value)} 
                   />
                </div>
             </div>
             <ClayCard className="p-0 overflow-hidden">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                         <th className="px-8 py-6">Identity</th>
                         <th className="px-8 py-6">Company</th>
                         <th className="px-8 py-6">Plan Status</th>
                         <th className="px-8 py-6">Usage</th>
                         <th className="px-8 py-6">Cohort</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map(u => (
                         <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black group-hover:bg-primary group-hover:text-white transition-all">
                                     {(u.display_name || u.email || 'A')[0].toUpperCase()}
                                  </div>
                                  <div>
                                     <p className="text-sm font-bold text-slate-900 leading-none">{u.display_name || 'Anonymous'}</p>
                                     <p className="text-[10px] text-slate-400 font-medium mt-1">{u.email}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6 text-sm text-slate-500 font-medium">{u.company_name || '—'}</td>
                            <td className="px-8 py-6">
                               <ClayBadge variant={u.plan === 'pro' ? 'success' : 'secondary'}>{u.plan || 'free'}</ClayBadge>
                            </td>
                            <td className="px-8 py-6 text-sm font-black text-slate-700">
                               {proposals.filter(p => p.user_id === u.user_id).length} <span className="text-[10px] text-slate-400 font-black ml-1">UNITS</span>
                            </td>
                            <td className="px-8 py-6 text-xs text-slate-400 font-medium">{new Date(u.created_at).toLocaleDateString()}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </ClayCard>
          </motion.div>
        )}

        {activeTab === 'proposals' && (
          <motion.div key="proposals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
             <ClayCard className="p-0 overflow-hidden">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                         <th className="px-8 py-6">Artifact Title</th>
                         <th className="px-8 py-6">Client Payload</th>
                         <th className="px-8 py-6">Current Phase</th>
                         <th className="px-8 py-6">Timestamp</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {proposals.map(p => (
                         <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-6 text-sm font-bold text-slate-900">{p.title}</td>
                            <td className="px-8 py-6 text-sm text-slate-500 font-medium">{p.client_name || '—'}</td>
                            <td className="px-8 py-6">
                               <ClayBadge variant={p.status === 'won' ? 'success' : p.status === 'lost' ? 'error' : 'info'}>
                                  {p.status}
                               </ClayBadge>
                            </td>
                            <td className="px-8 py-6 text-xs text-slate-400 font-medium">{new Date(p.created_at).toLocaleDateString()}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </ClayCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
