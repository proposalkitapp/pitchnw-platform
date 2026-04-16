"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { 
  FileText, Plus, Trash2, Clock, Eye, Download, 
  BarChart3, TrendingUp, CalendarDays, Link2, 
  Lock, Brain, Sparkles, Zap, ArrowRight, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { exportProposalAsPdf } from "@/lib/export-pdf";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingModal } from "@/components/OnboardingModal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type ProposalBranding } from "@/components/ProposalRenderer";
import { ProposalRenderer } from "@/components/ProposalRenderer";
import { ProDashboardView } from "@/components/ProDashboardView";

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
  const { data: profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const fetchProposals = async (userId: string) => {
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
      setLoadingProposals(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchProposals(session.user.id);
    } else if (!authLoading && session === null) {
      setLoadingProposals(false);
    }
  }, [session, authLoading]);

  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      setShowOnboarding(true);
    }
  }, [profile]);

  const isFree = profile?.plan !== 'pro';
  const isPro = profile?.plan === 'pro';
  const displayName = profile?.display_name?.split(" ")[0] || "there";
  const proposalsUsed = profile?.proposals_used || 0;

  const userBranding: ProposalBranding = {
    logoUrl: profile?.brand_logo_url,
    headerTitle: profile?.brand_name,
    companyName: profile?.company_name,
    displayName: profile?.display_name,
    portfolioUrl: profile?.portfolio_url,
  };

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

  const used = proposalsUsed;
  const usageColors = [
    { bar: "#4EEAA0", text: "3 proposals remaining" },
    { bar: "#7C6FF7", text: "2 proposals remaining" },
    { bar: "#FFD166", text: "1 proposal remaining" },
    { bar: "#FF6B8A", text: "No proposals remaining" }
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

  const loading = profileLoading || loadingProposals;

  if (loading && showSkeleton) {
    return (
      <AuthLayout>
        <div className="p-8 max-w-6xl mx-auto space-y-8">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Skeleton className="h-24 rounded-[24px]" />
            <Skeleton className="h-24 rounded-[24px]" />
            <Skeleton className="h-24 rounded-[24px]" />
            <Skeleton className="h-24 rounded-[24px]" />
          </div>
          <Skeleton className="h-[400px] rounded-[32px]" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
      
      <div className="p-6 lg:p-10 max-w-6xl mx-auto min-h-screen">
        <AnimatePresence mode="wait">
          {/* PRO VIEW */}
          {isPro && !selectedProposal && (
            <motion.div
              key="pro-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ProDashboardView 
                profile={profile!} 
                proposals={proposals} 
                isLoading={loading} 
              />
            </motion.div>
          )}

          {/* FREE VIEW */}
          {isFree && !selectedProposal && (
            <motion.div
              key="free-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div>
                  <h1 className="font-display text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    {getGreeting()}, {displayName} 👋
                  </h1>
                  <p className="text-slate-500 mt-2 font-medium">Capture every lead with professional proposals.</p>
                </div>
                <Button 
                  className="h-14 px-8 rounded-2xl bg-[#0033ff] text-white font-bold hover:bg-[#002be6] flex items-center gap-2 shadow-xl shadow-[#0033ff]/20 active:scale-95 transition-all"
                  onClick={() => navigate('/generate')}
                >
                  <Plus className="h-5 w-5" />
                  CREATE PROPOSAL
                </Button>
              </header>

              {/* Stats & Usage */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {/* Usage Card */}
                 <div className="bg-white border border-slate-100 rounded-[32px] p-7 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Basic Plan Usage</span>
                       <span className="text-sm font-bold">{used}/3</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
                       <div className="h-full transition-all duration-700" style={{ width: `${(used/3)*100}%`, backgroundColor: currentUsage.bar }} />
                    </div>
                    <button 
                      onClick={() => navigate('/checkout')}
                      className="w-full h-11 rounded-xl bg-[#0033ff]/5 text-[#0033ff] text-xs font-black uppercase tracking-widest hover:bg-[#0033ff]/10 transition-colors"
                    >
                      Unlimited Access →
                    </button>
                 </div>

                 {stats.map((stat, i) => (
                   <div key={stat.label} className="bg-white border border-slate-100 rounded-[32px] p-7 shadow-sm">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center mb-6">
                         <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                      <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
                   </div>
                 ))}
              </div>

              {/* Proposals List */}
              <section className="bg-white rounded-[40px] border border-slate-100 p-8 lg:p-10 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xl font-bold font-display text-slate-900">Recent Proposals</h3>
                </div>

                {proposals.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <FileText className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Build your first pitch to see it here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {proposals.map((prop) => (
                      <div 
                        key={prop.id}
                        className="flex items-center justify-between p-5 rounded-2xl border border-white hover:border-slate-100 hover:bg-slate-50 cursor-pointer group transition-all"
                        onClick={() => setSelectedProposal(prop)}
                      >
                         <div className="flex items-center gap-5 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                               <FileText className="h-4 w-4 text-slate-400 group-hover:text-[#0033ff] transition-colors" />
                            </div>
                            <div className="truncate">
                               <h4 className="font-bold text-slate-900 truncate">{prop.title}</h4>
                               <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                                 {prop.client_name || 'Prospect'} • {new Date(prop.created_at).toLocaleDateString()}
                               </p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${statusColors[prop.status]}`}>
                               {prop.status}
                            </span>
                            <div className="h-8 w-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-100">
                               <ArrowRight className="h-4 w-4 text-[#0033ff]" />
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Upgrade Banner for Free Users */}
              <div className="bg-gradient-to-r from-[#A855F7] to-[#0033ff] rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 p-10 opacity-10">
                    <Zap className="h-32 w-32" />
                 </div>
                 <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2">
                       <Sparkles className="h-4 w-4" />
                       <span className="text-[10px] font-black uppercase tracking-[0.3em]">Unlock Mastery</span>
                    </div>
                    <h3 className="text-3xl font-black font-display max-w-lg leading-tight">Professional results require professional tools.</h3>
                    <p className="text-white/70 max-w-md font-medium">Get unlimited AI generations, custom branding, and real-time CRM tracking with Pitchnw Pro.</p>
                    <Button 
                      className="h-14 px-10 rounded-2xl bg-white text-[#0033ff] font-black text-lg hover:bg-slate-50 transition-all shadow-xl active:scale-95 mt-4"
                      onClick={() => navigate('/checkout')}
                    >
                      UPGRADE NOW
                    </Button>
                 </div>
              </div>
            </motion.div>
          )}

          {/* SHARED PROPOSAL PREVIEW MODAL/VIEW */}
          {selectedProposal && (
            <motion.div
              key="proposal-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              <div className="flex gap-4 flex-wrap items-center justify-between pb-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedProposal(null)} 
                  className="gap-2 font-bold hover:bg-white text-slate-500"
                >
                  ← Back to Dashboard
                </Button>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="gap-2 h-11 px-5 rounded-xl font-bold border-slate-200 bg-white"
                    onClick={() => exportProposalAsPdf(selectedProposal.title, selectedProposal.generated_content, userBranding)}
                  >
                    <Download className="h-4 w-4 text-slate-400" /> Export PDF
                  </Button>
                  
                  {isPro ? (
                    <Button
                      className="gap-2 h-11 px-5 rounded-xl font-black bg-[#A855F7] text-white hover:bg-[#9333ea] border-none shadow-lg shadow-purple-200"
                      onClick={() => navigate(`/proposals/${selectedProposal.id}/analysis`)}
                    >
                      <Brain className="h-4 w-4" /> ANALYZE PITCH
                    </Button>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="gap-2 h-11 px-5 rounded-xl font-bold bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                        >
                          <Lock className="h-4 w-4" /> ANALYZE PITCH
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Upgrade to Pro to unlock AI analysis</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-xl text-red-500 hover:bg-red-50"
                    onClick={() => deleteProposal(selectedProposal.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="rounded-[40px] border border-slate-100 bg-white p-8 sm:p-12 shadow-2xl">
                <ProposalRenderer
                  content={selectedProposal.generated_content}
                  mode={selectedProposal.proposal_mode}
                  branding={userBranding}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}
