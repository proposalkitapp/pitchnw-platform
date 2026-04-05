import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { ProposalRenderer, type ProposalBranding } from "@/components/ProposalRenderer";

export default function ClientPortal() {
  const { slug } = useParams();
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientSignature, setClientSignature] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [creatorBranding, setCreatorBranding] = useState<ProposalBranding>({});

  useEffect(() => {
    if (slug) fetchProposal();
  }, [slug]);

  useEffect(() => {
    if (proposal) {
      supabase.from("proposal_events").insert({
        proposal_id: proposal.id,
        event_type: "open",
        metadata: { userAgent: navigator.userAgent },
      });
      // Fetch creator's profile for branding
      supabase
        .from("profiles")
        .select("brand_logo_url, brand_name, company_name, display_name, portfolio_url")
        .eq("user_id", proposal.user_id)
        .single()
        .then(({ data }) => {
          if (data) {
            setCreatorBranding({
              logoUrl: data.brand_logo_url,
              headerTitle: data.brand_name,
              companyName: data.company_name,
              displayName: data.display_name,
              portfolioUrl: data.portfolio_url,
            });
          }
        });
    }
  }, [proposal]);

  const fetchProposal = async () => {
    const { data, error } = await supabase
      .rpc("get_proposal_by_slug", { slug_param: slug })
      .single();
    if (error || !data) {
      setNotFound(true);
    } else {
      setProposal(data);
    }
    setLoading(false);
  };

  const handleAccept = async () => {
    if (!clientName.trim()) { toast.error("Please enter your full name"); return; }
    if (!clientSignature) { toast.error("Please provide your signature"); return; }
    setSubmitting(true);
    const { error } = await supabase
      .from("proposals")
      .update({
        status: "won",
        is_locked: true,
        client_signed_name: clientName,
        client_signature_data: clientSignature,
        signed_at: new Date().toISOString(),
      })
      .eq("id", proposal.id);

    if (!error) {
      await supabase.from("proposal_events").insert({
        proposal_id: proposal.id,
        event_type: "accept",
        metadata: { clientName },
      });
      setProposal({ ...proposal, status: "won", is_locked: true, client_signed_name: clientName, client_signature_data: clientSignature });
      setShowAcceptModal(false);
      toast.success("Proposal accepted!");
    } else {
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  const handleDecline = async () => {
    setSubmitting(true);
    await supabase.from("proposals").update({ status: "lost" }).eq("id", proposal.id);
    await supabase.from("proposal_events").insert({
      proposal_id: proposal.id,
      event_type: "decline",
      metadata: { reason: declineReason },
    });
    setProposal({ ...proposal, status: "lost" });
    setShowDeclineModal(false);
    toast.success("Thank you for letting us know.");
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-center px-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">This proposal is no longer available</h1>
          <p className="text-gray-500">The link may have expired or the proposal was removed.</p>
        </div>
      </div>
    );
  }

  const isAccepted = proposal.status === "won" && proposal.is_locked;
  const isDeclined = proposal.status === "lost";

  const creatorLabel = creatorBranding.headerTitle || creatorBranding.companyName || creatorBranding.displayName || "Proposal Author";

  return (
    <div className="min-h-screen bg-white">
      {isAccepted && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-30">
          <span className="text-[120px] font-display font-extrabold text-indigo-500/[0.04] -rotate-45 select-none">SIGNED</span>
        </div>
      )}

      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          {creatorBranding.logoUrl ? (
            <img src={creatorBranding.logoUrl} alt={creatorLabel} className="max-h-16 w-auto object-contain" />
          ) : (
            <span className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>{creatorLabel}</span>
          )}
          <span className="text-xs text-gray-400 font-mono">Proposal</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {isAccepted && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2">
            <Check className="h-5 w-5" />
            <span>This proposal has been accepted by {proposal.client_signed_name}</span>
          </div>
        )}

        {isDeclined && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
            <X className="h-5 w-5" />
            <span>This proposal was declined</span>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            {proposal.title}
          </h1>
          {proposal.client_name && (
            <p className="text-gray-500">Prepared for <span className="font-medium text-gray-700">{proposal.client_name}</span></p>
          )}
          <p className="text-sm text-gray-400 mt-1">
            {new Date(proposal.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        <ProposalRenderer
          content={proposal.generated_content}
          mode={proposal.proposal_mode}
          branding={creatorBranding}
        />

        {isAccepted && (
          <div className="mt-12 border-t-2 border-gray-200 pt-8">
            <h3 className="text-sm font-mono uppercase tracking-wider text-gray-400 mb-6">Signatures</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs text-gray-400 mb-2">Prepared by</p>
                <div className="border-b border-gray-300 pb-2 mb-2">
                  <p className="font-medium text-gray-900">{creatorLabel}</p>
                </div>
                <p className="text-xs text-gray-400">{new Date(proposal.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Accepted by</p>
                {proposal.client_signature_data && (
                  <img src={proposal.client_signature_data} alt="Client signature" className="h-12 object-contain mb-2" />
                )}
                <div className="border-b border-gray-300 pb-2 mb-2">
                  <p className="font-medium text-gray-900">{proposal.client_signed_name}</p>
                </div>
                <p className="text-xs text-gray-400">{proposal.signed_at ? new Date(proposal.signed_at).toLocaleDateString() : ""}</p>
              </div>
            </div>
          </div>
        )}

        {!isAccepted && !isDeclined && (
          <div className="mt-12 pt-8 border-t border-gray-200 space-y-3">
            <Button
              className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold"
              onClick={() => setShowAcceptModal(true)}
            >
              <Check className="h-5 w-5 mr-2" /> Accept This Proposal
            </Button>
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setShowDeclineModal(true)}
            >
              Decline
            </Button>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-100 py-4 text-center">
        <p className="text-[10px] text-gray-400">Powered by Pitchnw</p>
      </footer>

      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Confirm Your Acceptance</h2>
            <p className="text-sm text-gray-500 mb-4">Please sign below to confirm you accept this proposal.</p>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Your Signature</label>
              <SignatureCanvas onSignatureChange={setClientSignature} height={120} lightMode />
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
              <Input placeholder="Your full name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="border-gray-300" />
            </div>
            <p className="text-xs text-gray-400 mb-6">Date: {new Date().toLocaleDateString()}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAcceptModal(false)} className="flex-1">Cancel</Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleAccept} disabled={submitting || !clientName.trim() || !clientSignature}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Sign"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Decline Proposal</h2>
            <p className="text-sm text-gray-500 mb-4">Let us know why (optional)</p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4 resize-none"
              rows={3}
              placeholder="Your feedback helps us improve..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDeclineModal(false)} className="flex-1">Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleDecline} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Decline"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
