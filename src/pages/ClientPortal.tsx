import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, X, Download, Loader2 } from "lucide-react";
import proposalLogo from "@/assets/proposal-logo.png";

export default function ClientPortal() {
  const { slug } = useParams();
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (slug) fetchProposal();
  }, [slug]);

  useEffect(() => {
    if (proposal) {
      // Track view
      supabase.from("proposal_events").insert({
        proposal_id: proposal.id,
        event_type: "open",
        metadata: { userAgent: navigator.userAgent },
      });
    }
  }, [proposal]);

  const fetchProposal = async () => {
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("public_slug", slug)
      .single();

    if (error || !data) {
      setNotFound(true);
    } else {
      setProposal(data);
    }
    setLoading(false);
  };

  const handleAccept = async () => {
    if (!clientName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("proposals")
      .update({
        status: "won",
        is_locked: true,
        client_signed_name: clientName,
        signed_at: new Date().toISOString(),
      })
      .eq("id", proposal.id);

    if (!error) {
      await supabase.from("proposal_events").insert({
        proposal_id: proposal.id,
        event_type: "accept",
        metadata: { clientName },
      });
      setProposal({ ...proposal, status: "won", is_locked: true, client_signed_name: clientName });
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src={proposalLogo} alt="ProposalKit" className="h-8 w-auto" />
          <span className="text-xs text-gray-400 font-mono">Proposal</span>
        </div>
      </header>

      {/* Content */}
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

        {/* Proposal Content */}
        <div className="prose prose-gray max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-base" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {proposal.generated_content}
          </div>
        </div>

        {/* Signature Block */}
        {isAccepted && (
          <div className="mt-12 border-t-2 border-gray-200 pt-8">
            <h3 className="text-sm font-mono uppercase tracking-wider text-gray-400 mb-4">Signatures</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs text-gray-400 mb-2">Prepared by</p>
                <div className="border-b border-gray-300 pb-2 mb-2">
                  <p className="font-medium text-gray-900">Proposal Author</p>
                </div>
                <p className="text-xs text-gray-400">{new Date(proposal.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Accepted by</p>
                <div className="border-b border-gray-300 pb-2 mb-2">
                  <p className="font-medium text-gray-900">{proposal.client_signed_name}</p>
                </div>
                <p className="text-xs text-gray-400">{proposal.signed_at ? new Date(proposal.signed_at).toLocaleDateString() : ""}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
              <Check className="h-3 w-3" /> Digitally signed via ProposalKit AI
            </p>
          </div>
        )}

        {/* Action Buttons */}
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

      {/* Accept Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              Confirm Your Acceptance
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Type your full name to confirm you accept this proposal and its terms.
            </p>
            <Input
              placeholder="Your full name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="mb-4 border-gray-300"
            />
            <p className="text-xs text-gray-400 mb-6">Date: {new Date().toLocaleDateString()}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAcceptModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleAccept} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Acceptance"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              Decline Proposal
            </h2>
            <p className="text-sm text-gray-500 mb-4">Let us know why (optional)</p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4 resize-none"
              rows={3}
              placeholder="Your feedback helps us improve..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDeclineModal(false)} className="flex-1">
                Cancel
              </Button>
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
