'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  Check, 
  X, 
  Loader2, 
  ShieldCheck, 
  Clock, 
  FileCheck,
  MousePointer2,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ProposalRenderer } from '@/components/proposal/ProposalRenderer'
import { SignatureCanvas } from '@/components/proposal/SignatureCanvas'
import { ClayCard } from '@/components/ui/ClayCard'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayInput } from '@/components/ui/ClayInput'

export default function ClientPortalPage() {
  const { slug } = useParams()
  const supabase = createClient()
  
  const [proposal, setProposal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [clientName, setClientName] = useState("")
  const [clientSignature, setClientSignature] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [creatorBranding, setCreatorBranding] = useState<any>({})

  useEffect(() => {
    if (slug) fetchProposal()
  }, [slug])

  const fetchProposal = async () => {
    // Note: RPC call might need to be verified or replaced with direct select if RPC is missing
    const { data, error } = await supabase
      .from('proposals')
      .select('*, profiles(*)')
      .eq('public_slug', slug)
      .single()

    if (error || !data) {
      setNotFound(true)
    } else {
      setProposal(data)
      const profile = data.profiles
      if (profile) {
        setCreatorBranding({
          logoUrl: profile.brand_logo_url,
          headerTitle: profile.brand_name,
          companyName: profile.company_name,
          displayName: profile.display_name,
          portfolioUrl: profile.portfolio_url,
        })
      }
      
      // Track Open
      supabase.from("proposal_events").insert({
        proposal_id: data.id,
        event_type: "open",
        metadata: { userAgent: navigator.userAgent },
      })
    }
    setLoading(false)
  }

  const handleAccept = async () => {
    if (!clientName.trim()) { toast.error("Please enter your full name"); return }
    if (!clientSignature) { toast.error("Please provide your signature"); return }
    setSubmitting(true)

    const { error } = await supabase
      .from("proposals")
      .update({
        status: "won",
        is_locked: true,
        client_signed_name: clientName,
        client_signature_data: clientSignature,
        signed_at: new Date().toISOString(),
      })
      .eq("id", proposal.id)

    if (!error) {
      await supabase.from("proposal_events").insert({
        proposal_id: proposal.id,
        event_type: "accept",
        metadata: { clientName },
      })
      setProposal({ ...proposal, status: "won", is_locked: true, client_signed_name: clientName, client_signature_data: clientSignature })
      setShowAcceptModal(false)
      toast.success("Proposal accepted!")
    } else {
      toast.error("Something went wrong")
    }
    setSubmitting(false)
  }

  const handleDecline = async () => {
    setSubmitting(true)
    await supabase.from("proposals").update({ status: "lost" }).eq("id", proposal.id)
    await supabase.from("proposal_events").insert({
      proposal_id: proposal.id,
      event_type: "decline",
      metadata: { reason: declineReason },
    })
    setProposal({ ...proposal, status: "lost" })
    setShowDeclineModal(false)
    toast.success("Thank you for letting us know.")
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-black text-[10px] uppercase tracking-widest text-slate-400">Loading Proposal...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-center px-4">
        <ClayCard className="p-12 space-y-6 max-w-md">
           <div className="h-20 w-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto text-rose-500">
             <X className="h-10 w-10" />
           </div>
           <div className="space-y-2">
             <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Link Expired</h1>
             <p className="text-slate-500 font-medium">This proposal is no longer available or the link has changed.</p>
           </div>
        </ClayCard>
      </div>
    )
  }

  const isAccepted = proposal.status === "won" && proposal.is_locked
  const isDeclined = proposal.status === "lost"
  const creatorLabel = creatorBranding.headerTitle || creatorBranding.companyName || creatorBranding.displayName || "Proposal Author"

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Dynamic Watermark */}
      {isAccepted && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 overflow-hidden">
          <span className="text-[200px] font-black text-emerald-500/[0.03] -rotate-12 select-none uppercase tracking-tighter whitespace-nowrap">
            Signed & Secured · Signed & Secured · Signed & Secured
          </span>
        </div>
      )}

      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b-4 border-primary/20 shadow-sm">
        <div className="max-w-5xl mx-auto px-10 py-6 flex items-center justify-between">
           <div className="flex items-center gap-6">
              {creatorBranding.logoUrl ? (
                <img src={creatorBranding.logoUrl} alt={creatorLabel} className="max-h-12 w-auto object-contain" />
              ) : (
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-xl">
                  {creatorLabel.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-lg font-black text-slate-900 leading-none">{creatorLabel}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Professional Proposal</p>
              </div>
           </div>
           
           <div className="hidden md:flex items-center gap-4">
             <div className="flex flex-col items-end">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Check</p>
               <div className="flex items-center gap-1.5 text-emerald-500">
                 <ShieldCheck className="h-4 w-4" />
                 <span className="text-[11px] font-black uppercase tracking-widest">Verified Link</span>
               </div>
             </div>
           </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-10 py-12 space-y-10 relative z-10">
        {isAccepted && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-[2rem] bg-emerald-50 border-2 border-emerald-100 flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="font-black text-emerald-900 text-lg leading-none">Proposal Accepted</p>
              <p className="text-emerald-600/80 font-bold text-sm">Signed by {proposal.client_signed_name} on {new Date(proposal.signed_at).toLocaleDateString()}</p>
            </div>
          </motion.div>
        )}

        <ClayCard className="p-12 md:p-20 shadow-2xl border-white/40">
          <header className="mb-16 border-b-2 border-slate-50 pb-12">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                   <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">
                     {proposal.title}
                   </h1>
                   <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                         <MousePointer2 className="h-4 w-4 text-primary" />
                         <span className="text-sm font-bold text-slate-500">Prepared for <span className="text-slate-900">{proposal.client_name}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                         <Calendar className="h-4 w-4 text-primary" />
                         <span className="text-sm font-bold text-slate-500">{new Date(proposal.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                   </div>
                </div>
                {proposal.budget && (
                   <div className="bg-slate-50 p-6 rounded-[2rem] border border-white">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Estimated Investment</p>
                      <p className="text-3xl font-black text-slate-900">{proposal.budget}</p>
                   </div>
                )}
             </div>
          </header>

          <ProposalRenderer
            content={proposal.generated_content}
            mode={proposal.proposal_mode}
            branding={creatorBranding}
          />

          {isAccepted && (
            <div className="mt-20 pt-12 border-t-2 border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Digital Signatures</h3>
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">On Behalf of Provider</p>
                  <div className="border-b-2 border-slate-900 pb-4">
                    <p className="text-2xl font-serif italic font-black text-slate-900">{creatorLabel}</p>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500">{new Date(proposal.created_at).toLocaleDateString()}</p>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accepted by Client</p>
                  {proposal.client_signature_data && (
                    <img src={proposal.client_signature_data} alt="Signature" className="h-20 object-contain" />
                  )}
                  <div className="border-b-2 border-slate-900 pb-4">
                    <p className="text-2xl font-black text-slate-900">{proposal.client_signed_name}</p>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500">{new Date(proposal.signed_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          {!isAccepted && !isDeclined && (
            <div className="mt-20 pt-12 border-t-2 border-slate-100 flex flex-col md:flex-row gap-4">
              <ClayButton
                className="flex-1 h-16 text-lg shadow-glow"
                onClick={() => setShowAcceptModal(true)}
              >
                <Check className="h-6 w-6 mr-3" /> Accept & Sign Proposal
              </ClayButton>
              <ClayButton
                variant="secondary"
                className="h-16 px-10 text-rose-500 hover:bg-rose-50 border-rose-100"
                onClick={() => setShowDeclineModal(true)}
              >
                Decline
              </ClayButton>
            </div>
          )}
        </ClayCard>
      </main>

      <footer className="py-12 text-center opacity-50">
        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">
          Powered by Pitchnw · Secure Client Portal
        </p>
      </footer>

      {/* Accept Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in">
          <ClayCard className="max-w-lg w-full p-10 space-y-8 shadow-2xl scale-in-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Sign Proposal</h2>
              <p className="text-slate-500 font-medium">Please review and provide your digital signature below.</p>
            </div>
            
            <div className="space-y-4">
              <SignatureCanvas onSignatureChange={setClientSignature} lightMode />
              <ClayInput 
                label="Full Name" 
                placeholder="Enter your legal name" 
                value={clientName} 
                onChange={(e) => setClientName(e.target.value)} 
              />
            </div>

            <div className="flex gap-4 pt-4">
              <ClayButton variant="ghost" className="flex-1" onClick={() => setShowAcceptModal(false)}>Cancel</ClayButton>
              <ClayButton className="flex-1 shadow-glow" onClick={handleAccept} disabled={submitting || !clientName.trim() || !clientSignature}>
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Signature"}
              </ClayButton>
            </div>
          </ClayCard>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in">
          <ClayCard className="max-w-md w-full p-10 space-y-6 shadow-2xl">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Decline Proposal</h2>
            <p className="text-slate-500 font-medium">Please let us know why you're declining (optional).</p>
            <textarea
              className="w-full bg-slate-50 border-white/20 rounded-3xl p-6 text-sm min-h-[120px] outline-none focus:ring-4 focus:ring-rose-500/10 transition-all"
              placeholder="Your feedback helps us improve..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
            <div className="flex gap-4">
              <ClayButton variant="ghost" className="flex-1" onClick={() => setShowDeclineModal(false)}>Cancel</ClayButton>
              <ClayButton className="flex-1 bg-rose-500 text-white hover:bg-rose-600" onClick={handleDecline} disabled={submitting}>
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Decline"}
              </ClayButton>
            </div>
          </ClayCard>
        </div>
      )}
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
