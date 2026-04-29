'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  FileText, Search, Plus, Eye, 
  Trash2, Copy, ExternalLink,
  MoreVertical, Download
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useProposals } from '@/hooks/useProposals'
import { createClient } from '@/lib/supabase/client'
import { ClayCard } from '@/components/ui/ClayCard'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayInput } from '@/components/ui/ClayInput'
import { ClayBadge } from '@/components/ui/ClayBadge'

const statusVariants: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
  draft: 'info',
  sent: 'info',
  opened: 'warning',
  won: 'success',
  lost: 'error',
}

export default function ProposalsPage() {
  const { user } = useAuth()
  const { data: proposals = [], isLoading, refetch } = useProposals(user?.id)
  const router = useRouter()
  const supabase = createClient()
  
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredProposals = proposals.filter((p: any) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          (p.client_name?.toLowerCase() || "").includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const deleteProposal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pitch?")) return
    
    const { error } = await supabase.from('proposals').delete().eq('id', id)
    if (error) {
      toast.error("Failed to delete pitch")
    } else {
      toast.success("Pitch deleted")
      refetch()
    }
  }

  const copyPublicLink = (slug: string | null) => {
    if (!slug) {
      toast.error("No public link available")
      return
    }
    const url = `${window.location.origin}/p/${slug}`
    navigator.clipboard.writeText(url)
    toast.success("Public link copied!")
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-black text-slate-900 tracking-tighter">My Pitch Library</h1>
          <p className="text-slate-500 font-medium">Manage and access all your generated proposals.</p>
        </div>
        <ClayButton 
          onClick={() => router.push('/proposals/new')}
          className="shadow-glow gap-2"
        >
          <Plus className="h-5 w-5" /> New Pitch
        </ClayButton>
      </header>

      <ClayCard className="p-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by title or client..." 
            className="w-full pl-12 h-14 bg-slate-50 border-white/20 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-14 bg-slate-50 border-white/20 rounded-2xl font-bold text-slate-800 px-6 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none min-w-[160px]"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="opened">Opened</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
      </ClayCard>

      <ClayCard className="overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredProposals.length === 0 ? (
          <div className="p-20 text-center space-y-6">
            <div className="h-24 w-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto">
              <FileText className="h-12 w-12 text-slate-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800">No pitches found</h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto">
                {search || statusFilter !== 'all' 
                  ? "Try adjusting your filters to find what you're looking for." 
                  : "Start creating your first high-converting proposal today."}
              </p>
            </div>
            {!search && statusFilter === 'all' && (
              <ClayButton variant="secondary" onClick={() => router.push('/proposals/new')}>Create First Pitch</ClayButton>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Proposal Details</th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Client / Industry</th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredProposals.map((p: any) => (
                  <tr key={p.id} className="group hover:bg-white/30 transition-colors">
                    <td className="px-8 py-6 max-w-[300px]">
                      <div 
                        className="font-black text-slate-900 text-[15px] group-hover:text-primary transition-colors cursor-pointer truncate"
                        onClick={() => router.push(`/proposals/${p.id}`)}
                      >
                        {p.title}
                      </div>
                      <div className="text-[12px] text-slate-400 font-bold mt-1">
                        {format(new Date(p.created_at), "MMM d, yyyy")}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[13px] text-slate-700 font-black truncate">{p.client_name || "Private Client"}</div>
                      <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{p.project_type || "Standard"}</div>
                    </td>
                    <td className="px-8 py-6">
                      <ClayBadge variant={statusVariants[p.status] || 'info'}>
                        {p.status}
                      </ClayBadge>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ClayButton 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => router.push(`/proposals/${p.id}`)}
                          className="h-10 w-10 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </ClayButton>
                        <ClayButton 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyPublicLink(p.public_slug)}
                          className="h-10 w-10 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </ClayButton>
                        <ClayButton 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteProposal(p.id)}
                          className="h-10 w-10 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </ClayButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ClayCard>
    </div>
  )
}
