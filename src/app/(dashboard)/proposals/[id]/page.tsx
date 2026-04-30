'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  ExternalLink,
  Loader2,
  Trash2,
  MoreVertical,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { ClayCard } from '@/components/ui/ClayCard'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayBadge } from '@/components/ui/ClayBadge'
import { ProposalRenderer } from '@/components/proposal/ProposalRenderer'

export default function ProposalDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const supabase = createClient()

  const [proposal, setProposal] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProposal = async () => {
      if (!id) return
      
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        toast.error("Proposal not found")
        router.push('/proposals')
        return
      }

      setProposal(data)
      setLoading(false)
    }

    fetchProposal()
  }, [id, router, supabase])

  const copyPublicLink = () => {
    if (!proposal?.public_slug) return
    const url = `${window.location.origin}/p/${proposal.public_slug}`
    navigator.clipboard.writeText(url)
    toast.success("Shareable link copied!")
  }

  const deleteProposal = async () => {
    if (!confirm("Are you sure?")) return
    const { error } = await supabase.from('proposals').delete().eq('id', id)
    if (error) {
      toast.error("Failed to delete")
    } else {
      toast.success("Proposal deleted")
      router.push('/proposals')
    }
  }

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Pitch...</p>
      </div>
    )
  }

  const branding = {
    logoUrl: (profile as any)?.brand_logo_url,
    headerTitle: (profile as any)?.brand_name,
    companyName: (profile as any)?.company_name,
    displayName: (profile as any)?.display_name,
    portfolioUrl: (profile as any)?.portfolio_url,
  }

  return (
    <div className="p-6 lg:p-10 max-w-[1000px] mx-auto min-h-screen space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <ClayButton variant="ghost" onClick={() => router.push('/proposals')} className="h-10 w-10 p-0 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </ClayButton>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">{proposal.title}</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              {proposal.client_name || "Untitled Client"} · {new Date(proposal.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ClayBadge variant={proposal.status === 'won' ? 'success' : 'info'}>
            {proposal.status.toUpperCase()}
          </ClayBadge>
          <div className="h-8 w-px bg-slate-100 mx-2" />
          <ClayButton variant="secondary" onClick={copyPublicLink} className="h-11 px-5 border-white/20 bg-white">
            <Share2 className="h-4 w-4 mr-2" /> Share
          </ClayButton>
          <ClayButton onClick={() => {}} className="h-11 px-5 shadow-glow">
            <Download className="h-4 w-4 mr-2" /> Export
          </ClayButton>
          <ClayButton variant="ghost" onClick={deleteProposal} className="h-11 w-11 p-0 text-rose-500 hover:bg-rose-50">
            <Trash2 className="h-4 w-4" />
          </ClayButton>
        </div>
      </header>

      <ClayCard className="p-12 md:p-20 shadow-xl border-white/40">
        <ProposalRenderer 
          content={proposal.generated_content}
          mode={proposal.proposal_mode}
          branding={branding}
        />
      </ClayCard>

      <footer className="pt-10 flex items-center justify-center gap-10 opacity-50">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Verified Content</span>
        </div>
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-blue-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client Portal Ready</span>
        </div>
      </footer>
    </div>
  )
}
