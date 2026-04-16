"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import CountUp from 'react-countup';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  FileText, Plus, Trash2, Eye, Download, 
  BarChart3, TrendingUp, CalendarDays, Link2, 
  Lock, Brain, Sparkles, Zap, ArrowRight, Loader2,
  BarChart2, Target, DollarSign, Clock, CheckCircle2, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { exportProposalAsPdf } from "@/lib/export-pdf";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type ProposalBranding } from "@/components/ProposalRenderer";
import { ProposalRenderer } from "@/components/ProposalRenderer";

interface Proposal {
  id: string;
  title: string;
  client_name: string | null;
  status: string;
  created_at: string;
  generated_content: string;
  public_slug: string | null;
  proposal_mode: string | null;
  budget: string | null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-500",
  sent: "bg-blue-100 text-blue-500",
  opened: "bg-amber-100 text-amber-500 animate-pulse",
  won: "bg-emerald-100 text-emerald-500",
  lost: "bg-red-100 text-red-500",
};

export default function Dashboard() {
  const { session, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
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
        .select("id, title, client_name, status, created_at, generated_content, public_slug, proposal_mode, budget")
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

  const isPro = profile?.plan === 'pro';
  const isFree = !profile?.plan;
  const displayName = profile?.display_name?.split(" ")[0] || profile?.username || "there";
  const usedCount = profile?.proposals_used || 0;

  const totalProposals = proposals.length;
  const wonProposals = proposals.filter((p) => p.status === "won").length;
  const winRate = totalProposals > 0 ? Math.round((wonProposals / totalProposals) * 100) : 0;

  const pipelineValue = useMemo(() => {
    return proposals.reduce((acc, p) => {
      if (!p.budget) return acc;
      const numeric = parseFloat(p.budget.replace(/[^0-9.]/g, ''));
      return isNaN(numeric) ? acc : acc + numeric;
    }, 0);
  }, [proposals]);

  const deleteProposal = async (id: string) => {
    if (!isPro) {
      toast.error('Upgrade to Pro to delete proposals.');
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

  const copyProposalLink = (slug: string | null) => {
    if (!slug) {
      toast.error("No public link available for this pitch.");
      return;
    }
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const winRateData = useMemo(() => {
    const monthlyData: Record<string, { won: number; total: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short' });
      monthlyData[key] = { won: 0, total: 0 };
    }

    proposals.forEach(p => {
      const d = new Date(p.created_at);
      const key = d.toLocaleString('default', { month: 'short' });
      if (monthlyData[key]) {
        monthlyData[key].total++;
        if (p.status === 'won') monthlyData[key].won++;
      }
    });

    return Object.entries(monthlyData).map(([name, data]) => ({
      name,
      rate: data.total > 0 ? Math.round((data.won / data.total) * 100) : 0
    }));
  }, [proposals]);

  const followups = useMemo(() => {
    // In a real app, this would come from a 'reminders' table. 
    // Here we simulate it based on 'sent' status proposals older than 3 days.
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    return proposals.filter(p => p.status === 'sent' && new Date(p.created_at) < threeDaysAgo).slice(0, 3);
  }, [proposals]);

  const pipelineSegments = useMemo(() => {
    if (totalProposals === 0) return [];
    const counts = {
      draft: proposals.filter(p => p.status === 'draft').length,
      sent: proposals.filter(p => p.status === 'sent').length,
      opened: proposals.filter(p => p.status === 'opened').length,
      won: proposals.filter(p => p.status === 'won').length,
      lost: proposals.filter(p => p.status === 'lost').length,
    };
    return [
      { label: 'Draft', count: counts.draft, color: 'bg-slate-300' },
      { label: 'Sent', count: counts.sent, color: 'bg-blue-400' },
      { label: 'Opened', count: counts.opened, color: 'bg-amber-400' },
      { label: 'Won', count: counts.won, color: 'bg-emerald-400' },
      { label: 'Lost', count: counts.lost, color: 'bg-red-400' },
    ].map(s => ({ ...s, width: (s.count / totalProposals) * 100 }));
  }, [proposals, totalProposals]);

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
      <div className="p-6 lg:p-10 max-w-6xl mx-auto min-h-screen font-body space-y-10">
        <AnimatePresence mode="wait">
          {!selectedProposal && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              
              {/* SECTION 1 — HEADER */}
              <header className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h1 className="font-display text-4xl font-black text-slate-900 tracking-tight">
                    {getGreeting()}, {displayName} 👋
                  </h1>
                  {isFree && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3 flex items-center justify-between gap-6">
                      <p className="text-sm font-bold text-amber-700">
                        You are on the Free plan · {3 - Math.min(usedCount, 3)} proposals remaining
                      </p>
                      <button onClick={() => navigate('/checkout')} className="text-sm font-black text-amber-900 hover:underline">
                        Upgrade to Pro →
                      </button>
                    </div>
                  )}
                  {isPro && (
                    <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full border border-purple-100">
                      <Sparkles className="h-3.5 w-3.5 text-purple-600 fill-purple-600" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-purple-700">Pro Plan · Active</span>
                    </div>
                  )}
                </div>
              </header>

              {/* SECTION 2 — STAT CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {isFree ? (
                  <>
                    <Card label="Proposals Used" color={usedCount >= 3 ? "text-red-500" : usedCount > 0 ? "text-amber-500" : "text-emerald-500"}>
                      <div className="space-y-3">
                         <div className="text-4xl font-black text-slate-900">
                            <CountUp end={usedCount} duration={1.5} /> <span className="text-slate-300 text-2xl">/ 3</span>
                         </div>
                         <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${(Math.min(usedCount, 3) / 3) * 100}%` }} 
                              className={`h-full ${usedCount >= 3 ? 'bg-red-500' : usedCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            />
                         </div>
                      </div>
                    </Card>
                    <Card label="Proposals Won" icon={TrendingUp} iconColor="text-emerald-500">
                      <div className="text-4xl font-black text-slate-900">
                         <CountUp end={wonProposals} duration={1.5} />
                      </div>
                    </Card>
                    <Card label="Win Rate" icon={BarChart3} iconColor="text-blue-500">
                      <div className="text-4xl font-black text-slate-900">
                         <CountUp end={winRate} duration={1.5} />%
                      </div>
                    </Card>
                    <div 
                      onClick={() => navigate('/checkout')}
                      className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-[32px] p-8 text-white flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform shadow-xl shadow-purple-200"
                    >
                      <Zap className="h-8 w-8 opacity-40" />
                      <div>
                        <p className="text-sm font-black uppercase tracking-widest opacity-70 mb-1">Unlimited Proposals</p>
                        <h3 className="text-xl font-black leading-tight mb-4">Upgrade for full access</h3>
                        <Button className="w-full h-11 bg-white text-purple-600 hover:bg-slate-50 font-bold border-none shadow-none">
                          Upgrade — $15/mo
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Card label="Total Proposals" icon={FileText} iconColor="text-slate-400">
                      <div className="text-4xl font-black text-slate-900">
                         <CountUp end={totalProposals} duration={1.5} />
                      </div>
                    </Card>
                    <Card label="Proposals Won" icon={CheckCircle2} iconColor="text-emerald-500">
                      <div className="text-4xl font-black text-slate-900">
                         <CountUp end={wonProposals} duration={1.5} />
                      </div>
                    </Card>
                    <Card label="Win Rate" icon={Target} iconColor="text-blue-500">
                      <div className="text-4xl font-black text-slate-900">
                         <CountUp end={winRate} duration={1.5} />%
                      </div>
                    </Card>
                    <Card label="Pipeline Value" icon={DollarSign} iconColor="text-amber-500">
                      <div className="text-4xl font-black text-slate-900">
                         $<CountUp end={pipelineValue} duration={1.5} separator="," />
                      </div>
                    </Card>
                  </>
                )}
              </div>

              {/* SECTION 3 — QUICK ACTIONS */}
              <div className="bg-white border border-slate-100 rounded-[40px] p-10 flex flex-wrap items-center gap-4 shadow-sm">
                <p className="w-full lg:w-auto text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mr-4">Quick Actions</p>
                {isFree ? (
                  <>
                    <Button 
                      className="h-14 px-8 rounded-2xl bg-[#0033ff] text-white font-bold hover:bg-[#002be6] shadow-lg shadow-blue-200 gap-2 active:scale-95 transition-all"
                      disabled={usedCount >= 3}
                      onClick={() => navigate('/generate')}
                    >
                      {usedCount >= 3 ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      + New Pitch
                    </Button>
                    <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-100 font-bold text-slate-600 hover:bg-slate-50" onClick={() => navigate('/marketplace')}>
                      Browse Templates
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="h-14 px-8 rounded-2xl bg-[#0033ff] text-white font-bold hover:bg-[#002be6] shadow-lg shadow-blue-200 gap-2 active:scale-95 transition-all" onClick={() => navigate('/generate')}>
                      <Plus className="h-4 w-4" /> + New Pitch
                    </Button>
                    <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-100 font-bold text-slate-600 hover:bg-slate-50" onClick={() => navigate('/proposals')}>
                      Analyze a Pitch
                    </Button>
                    <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-100 font-bold text-slate-600 hover:bg-slate-50" onClick={() => navigate('/crm')}>
                      View CRM
                    </Button>
                    <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-100 font-bold text-slate-600 hover:bg-slate-50" onClick={() => navigate('/coach')}>
                      Win-Rate Coach
                    </Button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* SECTION 4 — RECENT PITOHES TABLE */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 font-display">Recent Pitches</h3>
                    <Button variant="link" className="text-[#0033ff] font-bold" onClick={() => navigate('/proposals')}>View All</Button>
                  </div>

                  <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                    {proposals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                         <div className="w-20 h-20 rounded-3xl bg-purple-50 flex items-center justify-center">
                            <Plus className="h-10 w-10 text-purple-500" />
                         </div>
                         <div className="space-y-1">
                            <h4 className="text-lg font-bold text-slate-900">No pitches yet</h4>
                            <p className="text-sm text-slate-400">Generate your first AI pitch in 60 seconds</p>
                         </div>
                         <Button className="rounded-xl h-12 px-6 bg-[#0033ff] hover:bg-[#002be6] text-white font-bold" onClick={() => navigate('/generate')}>
                           Create First Pitch →
                         </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-slate-50">
                              <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">Title</th>
                              <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">Client</th>
                              <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">Status</th>
                              <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">Value</th>
                              <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {proposals.slice(0, 5).map((p) => (
                              <tr key={p.id} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-6">
                                  <div className="font-bold text-slate-900 truncate max-w-[180px]">{p.title}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">{new Date(p.created_at).toLocaleDateString()}</div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="text-sm font-semibold text-slate-600">{p.client_name || "Prospect"}</div>
                                </td>
                                <td className="px-8 py-6">
                                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${statusColors[p.status] || statusColors.draft}`}>
                                     {p.status}
                                  </span>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="text-sm font-bold text-slate-900">{p.budget || "—"}</div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex items-center justify-end gap-2">
                                    <ActionButton icon={Eye} onClick={() => navigate(`/proposals/${p.id}`)} tooltip="View Pitch" />
                                    <ActionButton icon={Link2} onClick={() => copyProposalLink(p.public_slug)} tooltip="Copy Public Link" />
                                    {isPro && (
                                      <>
                                        <ActionButton icon={BarChart2} onClick={() => navigate(`/proposals/${p.id}/analysis`)} tooltip="Analyze Results" />
                                        <ActionButton icon={Trash2} onClick={() => deleteProposal(p.id)} tooltip="Delete" color="text-red-400 hover:text-red-500" />
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 5 — PRO FEATURES / WIDGETS */}
                <div className="space-y-10">
                  {isPro ? (
                    <>
                      {/* WIDGET A — FOLLOW-UPS */}
                      {followups.length > 0 && (
                        <div className="bg-white border border-slate-100 border-l-amber-400 border-l-4 rounded-[32px] p-8 shadow-sm space-y-6">
                          <h4 className="flex items-center gap-2 font-black text-slate-900">
                             <Clock className="h-5 w-5 text-amber-500" /> Follow-ups Due Today
                          </h4>
                          <div className="space-y-4">
                            {followups.map(p => (
                              <div key={p.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50">
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-900 truncate">{p.client_name || "Prospect"}</p>
                                  <p className="text-[10px] text-slate-400 truncate">{p.title}</p>
                                </div>
                                <div className="flex gap-2">
                                   <Button variant="ghost" size="icon" className="h-8 w-8 bg-white border border-slate-100 text-emerald-500" onClick={() => toast.success("Marked as done!")}>
                                      <CheckCircle2 className="h-4 w-4" />
                                   </Button>
                                   <Button variant="ghost" size="icon" className="h-8 w-8 bg-white border border-slate-100 text-[#0033ff]" onClick={() => navigate(`/proposals/${p.id}`)}>
                                      <ArrowRight className="h-4 w-4" />
                                   </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* WIDGET B — PIPELINE SNAPSHOT */}
                      <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-6 cursor-pointer" onClick={() => navigate('/crm')}>
                        <h4 className="flex items-center gap-2 font-black text-slate-900">
                           <BarChart2 className="h-5 w-5 text-[#0033ff]" /> Pipeline Health
                        </h4>
                        <div className="space-y-4">
                           <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                             {pipelineSegments.map(s => (
                               <div key={s.label} className={s.color} style={{ width: `${s.width}%` }} />
                             ))}
                           </div>
                           <div className="flex flex-wrap gap-x-4 gap-y-2">
                             {pipelineSegments.map(s => (
                               <div key={s.label} className="flex items-center gap-1.5">
                                  <div className={`w-2 h-2 rounded-full ${s.color}`} />
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{s.label} ({s.count})</span>
                               </div>
                             ))}
                           </div>
                        </div>
                      </div>

                      {/* WIDGET C — WIN RATE TREND */}
                      {winRateData.length >= 3 && (
                        <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-6">
                           <div className="flex items-center justify-between">
                             <h4 className="flex items-center gap-2 font-black text-slate-900">
                                <TrendingUp className="h-5 w-5 text-emerald-500" /> Win Rate Trend
                             </h4>
                             <Button variant="link" size="sm" className="text-[10px] font-black uppercase text-[#0033ff]" onClick={() => navigate('/coach')}>Full Report →</Button>
                           </div>
                           <div className="h-[180px] w-full mt-4">
                             <ResponsiveContainer width="100%" height="100%">
                               <LineChart data={winRateData}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} />
                                 <RechartsTooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#0033ff' }}
                                 />
                                 <Line type="monotone" dataKey="rate" stroke="#0033ff" strokeWidth={3} dot={{ r: 4, fill: '#0033ff', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                               </LineChart>
                             </ResponsiveContainer>
                           </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* SECTION 6 — PRO FEATURES UNLOCK (FREE ONLY) */
                    <div className="bg-slate-50 border border-slate-200 rounded-[40px] p-8 space-y-8">
                       <div className="text-center space-y-2">
                          <h4 className="font-display font-black text-xl text-slate-900">Unlock the full Pitchnw experience</h4>
                          <p className="text-sm text-slate-500 font-medium">Professional results require professional tools.</p>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          {[
                            { icon: Brain, label: "AI Pitch Analysis", desc: "Score your proposals out of 100" },
                            { icon: Kanban, label: "CRM Pipeline", desc: "Track every deal from sent to signed" },
                            { icon: Target, label: "Win-Rate Coach", desc: "AI tells you why you win and lose" },
                            { icon: Zap, label: "Unlimited Proposals", desc: "Generate as many as you need" },
                          ].map(f => (
                            <div key={f.label} className="bg-white border border-slate-100 p-4 rounded-2xl opacity-60">
                               <Lock className="h-5 w-5 text-slate-300 mb-3" />
                               <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-1 leading-tight">{f.label}</h5>
                               <p className="text-[9px] text-slate-400 font-bold leading-relaxed">{f.desc}</p>
                            </div>
                          ))}
                       </div>

                       <div className="space-y-4 pt-2">
                          <Button 
                            className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-purple-200 active:scale-95 transition-all"
                            onClick={() => navigate('/checkout')}
                          >
                            Upgrade to Pro — $15/mo
                          </Button>
                          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">All features. One plan. Cancel anytime.</p>
                       </div>
                    </div>
                  )}
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
                    onClick={() => exportProposalAsPdf(selectedProposal.title, selectedProposal.generated_content, {
                      logoUrl: profile?.brand_logo_url,
                      headerTitle: profile?.brand_name,
                      companyName: profile?.company_name,
                      displayName: profile?.display_name,
                      portfolioUrl: profile?.portfolio_url,
                    })}
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
                  mode={selectedProposal.proposal_mode || 'standard'}
                  branding={{
                    logoUrl: profile?.brand_logo_url,
                    headerTitle: profile?.brand_name,
                    companyName: profile?.company_name,
                    displayName: profile?.display_name,
                    portfolioUrl: profile?.portfolio_url,
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}

function Card({ label, children, icon: Icon, color = "text-slate-900", iconColor = "text-slate-400" }: any) {
  return (
    <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-md transition-shadow">
       <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
          {Icon && <Icon className={`h-5 w-5 ${iconColor} opacity-50`} />}
       </div>
       <div className={color}>
          {children}
       </div>
    </div>
  );
}

function ActionButton({ icon: Icon, onClick, tooltip, color = "text-slate-400 hover:text-[#0033ff]" }: any) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-xl transition-colors ${color}`} onClick={(e) => { e.stopPropagation(); onClick(); }}>
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs font-bold">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
