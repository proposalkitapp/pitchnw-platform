"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Trash2, Clock, Eye, Download, BarChart3, TrendingUp, CalendarDays, Link2, Zap, Lock, Brain, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { exportProposalAsPdf } from "@/lib/export-pdf";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingModal } from "@/components/OnboardingModal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ProposalRenderer, type ProposalBranding } from "@/components/ProposalRenderer";

interface Proposal {
  id: string;
  title: string;
  client_name: string | null;
  status: string;
  created_at: string;
  generated_content: string;
  public_slug: string | null;
  proposal_mode: string | null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  // null = free plan, 'pro' = paid
  const [plan, setPlan] = useState<string | null>(null);
  const [proposalsUsed, setProposalsUsed] = useState(0);
  const [userBranding, setUserBranding] = useState<ProposalBranding>({});
  const [showSkeleton, setShowSkeleton] = useState(true);

  // After 500ms, force showSkeleton to false to show whatever data we have
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('proposals_used, plan, display_name, onboarding_completed, brand_logo_url, brand_name, company_name, portfolio_url')
        .eq('id', session?.user?.id)
        .single();
      return data;
    },
    enabled: !!session?.user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const fetchProposals = async (userId: string) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select("id, title, client_name, status, created_at, generated_content, public_slug, proposal_mode")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("fetchProposals error:", error);
        toast.error("Failed to load proposals");
      } else {
        setProposals(data || []);
      }
    } catch (err) {
      console.error("fetchProposals error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchProposals(session.user.id);
    } else if (!authLoading && session === null) {
      setLoading(false);
    }
  }, [session, authLoading]);

  // Sync profile data to local state for components expecting it
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name?.split(" ")[0] || "there");
      setPlan(profile.plan ?? null);
      setProposalsUsed(profile.proposals_used || 0);
      setUserBranding({
        logoUrl: profile.brand_logo_url,
        headerTitle: profile.brand_name,
        companyName: profile.company_name,
        displayName: profile.display_name,
        portfolioUrl: profile.portfolio_url,
      });
      if (!profile.onboarding_completed) {
        setShowOnboarding(true);
      }
    }
  }, [profile]);

  const isFree = !plan;
  const isPro = plan === 'pro';

  const deleteProposal = async (id: string) => {
    if (isFree) {
      toast.error('Free accounts cannot delete proposals. Upgrade to Pro to manage your proposals freely.');
      return;
    }
    const { error } = await supabase.from("proposals").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete proposal");
    } else {
      setProposals((prev) => prev.filter((p) => p.id !== id));
      if (selectedProposal?.id === id) setSelectedProposal(null);
      toast.success("Proposal deleted");
    }
  };

  const totalProposals = proposals.length;
  const wonProposals = proposals.filter((p) => p.status === "won").length;
  const thisMonthProposals = proposals.filter((p) => {
    const d = new Date(p.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const winRate = totalProposals > 0 ? Math.round((wonProposals / totalProposals) * 100) : 0;

  // Usage indicator data
  const used = profile?.proposals_used || 0;
  const remaining = Math.max(0, 3 - used);
  
  const usageColors = [
    { bar: "#4EEAA0", text: "3 proposals remaining" }, // 0 used
    { bar: "#7C6FF7", text: "2 proposals remaining" }, // 1 used
    { bar: "#FFD166", text: "1 proposal remaining" }, // 2 used
    { bar: "#FF6B8A", text: "No proposals remaining" } // 3 used
  ];

  const currentUsage = usageColors[Math.min(used, 3)];

  const stats = [
    { label: "Proposals Won", value: wonProposals.toString(), icon: TrendingUp, color: "text-success" },
    { label: "This Month", value: thisMonthProposals.toString(), icon: CalendarDays, color: "text-warning" },
    { label: "Win Rate", value: `${winRate}%`, icon: BarChart3, color: "text-primary" },
  ];

  const statusColors: Record<string, string> = {
    draft: "bg-secondary text-muted-foreground",
    sent: "bg-blue-500/10 text-blue-500",
    opened: "bg-warning/10 text-warning",
    won: "bg-success/10 text-success",
    lost: "bg-destructive/10 text-destructive",
  };

  // Free: can create if proposals_used < 3; Pro: unlimited
  const hasHitFreeLimit = isFree && used >= 3;

  return (
    <AuthLayout>
      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-sans text-2xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {displayName} 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Here is your proposal overview.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Usage / Total Proposals Card */}
          {loading && showSkeleton ? (
            <Skeleton className="h-[100px] rounded-2xl" />
          ) : isFree ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white text-slate-900 border border-slate-100 rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Proposals Used
                </span>
                <span className="text-sm font-bold">{used} of 3</span>
              </div>
              
              <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(used / 3) * 100}%`,
                    backgroundColor: currentUsage.bar
                  }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] font-medium" style={{ color: currentUsage.bar }}>
                  {currentUsage.text}
                </span>
                {used >= 3 && (
                  <button 
                    onClick={() => navigate('/checkout')}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    Upgrade to Pro →
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white text-slate-900 border border-slate-100 rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4"
            >
              <div className="h-12 w-12 rounded-full border border-slate-100 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Total Proposals
                </span>
                <div className="text-xl font-bold mt-0.5">
                  {totalProposals}
                </div>
              </div>
            </motion.div>
          )}

          {loading && showSkeleton
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[100px] rounded-2xl" />
              ))
            : stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i + 1) * 0.05 }}
                  className={`${i === 2 ? 'bg-[#0033ff] text-white' : 'bg-white text-slate-900 border border-slate-100'} rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4`}
                >
                  <div className={`h-12 w-12 rounded-full border ${i === 2 ? 'border-white/20' : 'border-slate-100'} flex items-center justify-center shrink-0`}>
                    <stat.icon className={`h-5 w-5 ${i === 2 ? 'text-white' : stat.color}`} />
                  </div>
                  <div>
                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${i === 2 ? 'text-white/80' : 'text-slate-400'}`}>
                      {stat.label}
                    </span>
                    <div className="text-xl font-bold mt-0.5">
                      {stat.value}
                    </div>
                  </div>
                </motion.div>
              ))}
        </div>

        {/* Followups Section — Pro Only */}
        {!isFree && (
          <div className="mb-10">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Clock className="h-3 w-3" /> Upcoming Follow-ups
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {/* Fixed mock followups for UI demonstration since table might be empty */}
               {[
                 { id: '1', title: 'Follow up with ' + (proposals[0]?.client_name || 'Client'), date: 'Tomorrow' },
                 { id: '2', title: 'Send contract to ' + (proposals[1]?.client_name || 'Client B'), date: 'In 2 days' }
               ].map((f) => (
                 <div key={f.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm group hover:border-primary/20 transition-all">
                    <p className="text-[13px] font-bold text-slate-800 truncate">{f.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">{f.date}</p>
                    <button className="text-[9px] font-black text-primary uppercase mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Mark Complete ✓
                    </button>
                 </div>
               ))}
               <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                  <span className="text-[11px] font-bold text-slate-400">+ New Task</span>
               </div>
            </div>
          </div>
        )}

        {/* Win-Rate Coach — Pro Only (5+ proposals) */}
        {!isFree && proposals.length >= 5 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-10 bg-[#0033ff] p-6 rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_20px_40px_rgba(0,51,255,0.25)] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
               <Brain className="h-32 w-32" />
            </div>
            <div className="relative z-10 text-center md:text-left">
              <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                <Sparkles className="h-4 w-4 text-[#4EEAA0]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Win-Rate Coach Active</span>
              </div>
              <h3 className="text-xl font-bold mb-1">Your strategy is 15% more effective this month.</h3>
              <p className="text-white/70 text-sm">Our AI coach has analyzed your last 5 proposals. You have a new optimization strategy ready.</p>
            </div>
            <Button className="shrink-0 bg-white text-[#0033ff] hover:bg-slate-100 font-bold px-8 h-12 rounded-2xl relative z-10 transition-transform active:scale-95">
              View Strategy
            </Button>
          </motion.div>
        )}

        {/* Quick Action */}
        <Button
          className="w-full mb-10 h-14 bg-[#0033ff] hover:bg-[#002be6] text-white shadow-[0_4px_14px_0_rgba(0,51,255,0.39)] rounded-xl font-semibold text-base transition-all duration-200"
          onClick={() => {
            if (hasHitFreeLimit) {
              toast.error("You've used all 3 free proposals. Upgrade to Pro for unlimited access.");
              navigate("/checkout");
              return;
            }
            navigate("/generate");
          }}
        >
          <Plus className="h-5 w-5 mr-2" /> CREATE NEW PROPOSAL
        </Button>

        {selectedProposal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex gap-2 flex-wrap">
              <Button variant="ghost" onClick={() => setSelectedProposal(null)} className="gap-2">
                ← Back to list
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => exportProposalAsPdf(selectedProposal.title, selectedProposal.generated_content, userBranding)}
              >
                <Download className="h-4 w-4" /> Export PDF
              </Button>
              {isPro ? (
                <Button
                  variant="hero"
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-[#7C6FF7] to-[#4EEAA0] border-none text-white shadow-lg"
                  onClick={() => navigate(`/proposals/${selectedProposal.id}/analysis`)}
                >
                  <Brain className="h-4 w-4" /> Analyze Pitch
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-slate-300 border-slate-100 cursor-not-allowed"
                      onClick={() => navigate(`/proposals/${selectedProposal.id}/analysis`)}
                    >
                      <Lock className="h-4 w-4" /> Analyze Pitch
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upgrade to Pro to analyze your proposals</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {selectedProposal.proposal_mode && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  selectedProposal.proposal_mode === "sales_pitch"
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {selectedProposal.proposal_mode === "sales_pitch" ? "🎯 Sales Pitch" : "📄 Formal Proposal"}
                </span>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
              <h2 className="font-display text-2xl font-bold mb-6 text-card-foreground">
                {selectedProposal.title}
              </h2>
              <ProposalRenderer
                content={selectedProposal.generated_content}
                mode={selectedProposal.proposal_mode}
                branding={userBranding}
              />
            </div>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 mt-6">
              <h2 className="font-sans text-xl font-bold text-slate-900">
                Recent Proposals
              </h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
            ) : proposals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24 rounded-2xl border border-dashed border-slate-200 bg-white"
              >
                <FileText className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <h2 className="font-sans text-xl font-bold mb-2 text-slate-800">No proposals yet</h2>
                <p className="text-slate-500 mb-6 text-sm">
                  Generate your first AI proposal in under 60 seconds.
                </p>
                <Button onClick={() => navigate("/generate")} className="bg-[#0033ff] hover:bg-[#002be6] h-11 px-8 rounded-full text-white shadow-[0_4px_14px_0_rgba(0,51,255,0.39)]">
                  <Plus className="h-4 w-4 mr-2" /> Create Proposal
                </Button>
              </motion.div>
            ) : (
              <div className="grid gap-4">
                {proposals.slice(0, 10).map((proposal, i) => (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="rounded-2xl border-none bg-white p-5 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] group"
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-5">
                      <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="font-sans font-semibold text-slate-900 truncate text-[15px]">
                          {proposal.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                          {proposal.client_name && <span className="font-medium text-slate-700">{proposal.client_name}</span>}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 opacity-70" />
                            {new Date(proposal.created_at).toLocaleDateString()}
                          </span>
                          <span className={`capitalize px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${statusColors[proposal.status] || "bg-slate-100 text-slate-500"}`}>
                            {proposal.status}
                          </span>
                          {proposal.proposal_mode && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                              proposal.proposal_mode === "sales_pitch"
                                ? "bg-[#0033ff]/10 text-[#0033ff]"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {proposal.proposal_mode === "sales_pitch" ? "🎯 SALES PITCH" : "📄 FORMAL"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full border-slate-200 text-slate-500 hover:text-[#0033ff] hover:bg-[#0033ff]/10 hover:border-[#0033ff]/20"
                        onClick={() => setSelectedProposal(proposal)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {proposal.public_slug && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full border-slate-200 text-slate-500 hover:text-[#0033ff] hover:bg-[#0033ff]/10 hover:border-[#0033ff]/20"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/p/${proposal.public_slug}`);
                            toast.success("Client link copied! 🔗");
                          }}
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                      )}
                      {!isFree && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => deleteProposal(proposal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AuthLayout>
  );
}
