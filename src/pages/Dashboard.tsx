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
import { useTheme } from "@/hooks/use-theme";
import { 
  FileText, Plus, Trash2, Eye, Download, 
  BarChart3, TrendingUp, Link2, 
  Lock, Brain, Sparkles, Zap, ArrowRight,
  BarChart2, Target, DollarSign, Clock, CheckCircle2,
  Moon, Sun
} from "lucide-react";
import { toast } from "sonner";
import { exportProposalAsPdf } from "@/lib/export-pdf";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ProposalRenderer } from "@/components/ProposalRenderer";
import { LiquidGlassToggle } from "@/components/LiquidGlassToggle";

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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

  const { isDark, toggle: toggleTheme } = useTheme();

  const fetchProposals = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select("id, title, client_name, status, created_at, generated_content, public_slug, proposal_mode, budget")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("fetchProposals error:", error);
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

  const plan = profile?.plan || 'free';
  const isFreelancer = plan === 'pro';
  const isBasic = plan !== 'pro';
  const displayName = profile?.display_name?.split(" ")[0] || profile?.username || "there";
  const usedCount = profile?.proposals_used || 0;

  const totalProposals = proposals.length;
  const wonProposals = proposals.filter((p) => p.status === "won").length;
  const winRate = totalProposals > 0 ? Math.round((wonProposals / totalProposals) * 100) : 0;

  const pipelineValue = useMemo(() => {
    return proposals.reduce((acc, p) => {
      if (!p.budget || typeof p.budget !== 'string') return acc;
      const cleanBudget = p.budget.replace(/[^0-9.]/g, '');
      if (!cleanBudget) return acc;
      const numeric = parseFloat(cleanBudget);
      return isNaN(numeric) ? acc : acc + numeric;
    }, 0);
  }, [proposals]);

  const deleteProposal = async (id: string) => {
    if (!isFreelancer) {
      toast.error('Upgrade to Freelancer to delete proposals.');
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
      toast.error("No public link available.");
      return;
    }
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  const winRateData = useMemo(() => {
    try {
      const monthlyData: Record<string, { won: number; total: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const name = MONTHS[d.getMonth()];
        monthlyData[name] = { won: 0, total: 0 };
      }

      proposals.forEach(p => {
        const d = new Date(p.created_at);
        if (isNaN(d.getTime())) return;
        const name = MONTHS[d.getMonth()];
        if (monthlyData[name]) {
          monthlyData[name].total++;
          if (p.status === 'won') monthlyData[name].won++;
        }
      });

      return Object.entries(monthlyData).map(([name, data]) => ({
        name,
        rate: data.total > 0 ? Math.round((data.won / data.total) * 100) : 0
      }));
    } catch (e) {
      console.error("winRateData error:", e);
      return [];
    }
  }, [proposals]);

  const followups = useMemo(() => {
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
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-[32px]" />)}
          </div>
          <Skeleton className="h-[400px] rounded-[40px]" />
        </div>
      </AuthLayout>
    );
  }

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  // Freelancer Command Center View
  if (isFreelancer) {
    return (
      <AuthLayout>
        <div className="relative min-h-screen overflow-hidden">
          {/* Liquid Waves Background */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <motion.div 
              animate={{ 
                x: [0, 50, 0],
                y: [0, 30, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-400/10 blur-[120px]" 
            />
            <motion.div 
              animate={{ 
                x: [0, -40, 0],
                y: [0, 50, 0],
                scale: [1.1, 1, 1.1]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 blur-[100px]" 
            />
          </div>

          <div className="relative z-10 p-6 lg:p-10 max-w-[1600px] mx-auto space-y-10">
            <AnimatePresence mode="wait">
              {!selectedProposal ? (
              <motion.div 
                key="pro-dashboard"
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="space-y-10"
              >
                {/* Pro Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-purple-600 text-[10px] font-black uppercase tracking-widest text-white px-2.5 py-1 rounded-md shadow-lg shadow-purple-200">
                        Freelancer Hub
                      </div>
                      <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
                    </div>
                    <h1 className="font-display text-5xl font-black text-foreground tracking-tighter">
                      {greeting}, {displayName}
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg">Your pitch engine is running at peak performance.</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <LiquidGlassToggle />
                    <Button variant="outline" className="h-14 px-8 rounded-2xl border-border font-bold text-muted-foreground hover:bg-muted/50 transition-all" onClick={() => navigate('/settings')}>
                      Setup Branding
                    </Button>
                    <Button className="h-14 px-10 rounded-2xl bg-primary text-primary-foreground font-black hover:opacity-90 shadow-2xl shadow-primary/20 gap-2 active:scale-95 transition-all" onClick={() => navigate('/generate')}>
                      <Plus className="h-5 w-5 stroke-[3px]" /> Create New Pitch
                    </Button>
                  </div>
                </header>

                {/* Main Pro Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  
                  {/* Stats & Analytics Column */}
                  <div className="lg:col-span-3 space-y-8">
                    
                    {/* Primary Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-card p-8 group transition-all">
                        <div className="flex items-center justify-between mb-6">
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Total Pipeline</span>
                          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                            <DollarSign className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                        <div className="text-5xl font-black text-slate-900">
                          $<CountUp end={pipelineValue} separator="," />
                        </div>
                        <p className="text-slate-400 text-xs mt-4 font-bold">+12.5% from last month</p>
                      </div>

                      <div className="bg-card/50 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] group hover:border-emerald-200 transition-all">
                        <div className="flex items-center justify-between mb-6">
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Winning Rate</span>
                          <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                            <Target className="h-6 w-6 text-emerald-500 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                        <div className="text-5xl font-black text-slate-900">
                          <CountUp end={winRate} />%
                        </div>
                        <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500" style={{ width: `${winRate}%` }} />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-[#08080F] to-[#25254D] p-8 rounded-[32px] shadow-2xl relative overflow-hidden group cursor-pointer" onClick={() => navigate('/coach')}>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                           <div>
                              <div className="flex items-center gap-2 mb-4">
                                <Brain className="h-5 w-5 text-purple-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-300">AI Win-Rate Coach</span>
                              </div>
                              <p className="text-xl font-black text-white leading-tight">AI says you could increase conversion by 14%</p>
                           </div>
                           <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mt-4">
                              View Analysis <ArrowRight className="h-4 w-4" />
                           </div>
                        </div>
                        <Sparkles className="absolute -bottom-4 -right-4 h-32 w-32 text-purple-500 opacity-20 group-hover:scale-125 transition-transform duration-700" />
                      </div>
                    </div>

                    {/* Chart & Recent Activity Container */}
                    <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden">
                      <div className="p-10 flex flex-wrap items-center justify-between gap-6 border-b border-slate-50">
                        <h3 className="text-2xl font-black text-slate-900">Performance Trends</h3>
                        <div className="flex gap-2">
                          {['Analyze', 'CRM', 'Templates'].map(label => (
                            <Button key={label} variant="ghost" className="rounded-xl font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => navigate(`/${label.toLowerCase()}`)}>
                              {label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="p-10">
                         <div className="h-[300px] w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={winRateData}>
                                <defs>
                                  <linearGradient id="proLineColor" x1="0" y1="y2" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0033ff" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#0033ff" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                <YAxis hide />
                                <RechartsTooltip 
                                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px' }}
                                  itemStyle={{ fontWeight: 900, fontSize: '16px', color: '#0033ff' }}
                                />
                                <Line type="monotone" dataKey="rate" stroke="#0033ff" strokeWidth={5} dot={{ r: 6, fill: '#0033ff', strokeWidth: 4, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                              </LineChart>
                           </ResponsiveContainer>
                         </div>
                      </div>

                      <div className="overflow-x-auto border-t border-slate-50">
                        <table className="w-full">
                           <thead>
                              <tr className="bg-slate-50/50">
                                <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 text-left">Recent Proposals</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 text-left">Value</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 text-left">Stage</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 text-right">Action</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {proposals.slice(0, 4).map(p => (
                                <tr key={p.id} className="group hover:bg-slate-50/30 transition-colors">
                                  <td className="px-10 py-6">
                                     <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{p.title}</div>
                                     <div className="text-xs text-slate-400 font-medium">{p.client_name || "New Client"}</div>
                                  </td>
                                  <td className="px-10 py-6">
                                     <div className="font-black text-slate-900">{p.budget || "—"}</div>
                                  </td>
                                  <td className="px-10 py-6">
                                     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[p.status] || statusColors.draft}`}>
                                        {p.status}
                                     </span>
                                  </td>
                                  <td className="px-10 py-6 text-right">
                                     <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ActionButton icon={Eye} onClick={() => setSelectedProposal(p)} tooltip="View" />
                                        <ActionButton icon={BarChart2} onClick={() => navigate(`/proposals/${p.id}/analysis`)} tooltip="Analyze" />
                                     </div>
                                  </td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Panel */}
                  <div className="space-y-8">
                     {/* Pro Quick Actions Card */}
                     <div className="bg-[#0033ff] p-10 rounded-[32px] text-white shadow-2xl shadow-blue-200 space-y-8 relative overflow-hidden">
                        <Zap className="absolute -top-6 -right-6 h-32 w-32 opacity-10" />
                        <h4 className="text-xl font-black relative z-10">Command Center</h4>
                        <div className="space-y-4 relative z-10">
                           <Button className="w-full h-14 bg-white text-blue-600 hover:bg-blue-50 font-black rounded-2xl shadow-xl shadow-blue-900/20" onClick={() => navigate('/generate')}>
                              <Sparkles className="h-4 w-4 mr-2" /> One-Click Draft
                           </Button>
                           <Button variant="ghost" className="w-full h-14 text-white hover:bg-white/10 font-bold rounded-2xl" onClick={() => navigate('/crm')}>
                              <BarChart2 className="h-4 w-4 mr-2" /> Pipeline Manager
                           </Button>
                           <Button variant="ghost" className="w-full h-14 text-white hover:bg-white/10 font-bold rounded-2xl" onClick={() => navigate('/coach')}>
                              <Target className="h-4 w-4 mr-2" /> Strategy Hub
                           </Button>
                        </div>
                     </div>

                     {/* Intelligence Feed */}
                     <div className="bg-card/50 backdrop-blur-xl border border-white/10 p-10 rounded-[32px] space-y-8">
                        <div className="flex items-center justify-between">
                           <h4 className="text-lg font-black text-slate-900">Intelligence</h4>
                           <Brain className="h-5 w-5 text-purple-500" />
                        </div>
                        <div className="space-y-6">
                           {followups.length > 0 ? followups.map(p => (
                             <div key={p.id} className="group cursor-pointer" onClick={() => navigate(`/proposals/${p.id}/analysis`)}>
                                <div className="flex items-start justify-between gap-4">
                                   <div>
                                      <p className="text-xs font-black text-purple-600 uppercase tracking-widest mb-1">High Priority</p>
                                      <p className="font-black text-slate-900 leading-tight">Follow-up with {p.client_name}</p>
                                      <p className="text-xs text-slate-400 mt-1 font-medium italic">Opened 2 hours ago</p>
                                   </div>
                                   <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                      <ArrowRight className="h-4 w-4" />
                                   </div>
                                </div>
                             </div>
                           )) : (
                             <div className="text-slate-400 font-medium text-sm text-center py-10 italic">
                                No active intelligence alerts. You're all caught up!
                             </div>
                           )}
                        </div>
                        <Button variant="outline" className="w-full rounded-2xl font-bold border-slate-100 text-slate-400 h-12 hover:text-blue-600 hover:bg-blue-50" onClick={() => navigate('/proposals')}>
                           History Log
                        </Button>
                     </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Proposal Preview Logic (Same as before but refined) */
              <motion.div 
                key="proposal-preview"
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 1.02 }}
                className="space-y-6 max-w-5xl mx-auto pb-20"
              >
                 <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => setSelectedProposal(null)} className="font-black text-slate-900 gap-2 hover:bg-slate-100 rounded-xl px-6">
                      <ArrowRight className="h-4 w-4 rotate-180" /> Dashboard
                    </Button>
                    <div className="flex gap-3">
                       <Button variant="outline" className="rounded-xl font-bold border-slate-200" onClick={() => copyProposalLink(selectedProposal.public_slug)}>
                          <Link2 className="h-4 w-4 mr-2" /> Share
                       </Button>
                       <Button className="bg-[#0033ff] text-white rounded-xl font-bold px-8 shadow-lg shadow-blue-200" onClick={() => navigate(`/proposals/${selectedProposal.id}/analysis`)}>
                          Run Analytics
                       </Button>
                    </div>
                 </div>
                 <div className="rounded-[40px] border border-slate-100 bg-white p-12 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                      <Sparkles className="h-64 w-64 text-blue-600" />
                   </div>
                   <div className="relative z-10">
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
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AuthLayout>
    );
  }

  // Basic Version of Dashboard
  return (
    <AuthLayout>
      <div className="relative min-h-screen overflow-hidden">
        {/* Liquid Waves Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <motion.div 
            animate={{ 
              x: [0, 60, 0],
              y: [0, -40, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] rounded-full bg-blue-300/10 blur-[100px]" 
          />
          <motion.div 
            animate={{ 
              x: [0, -70, 0],
              y: [0, 30, 0],
              scale: [1.2, 1, 1.2]
            }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-300/10 blur-[120px]" 
          />
        </div>

        <div className="relative z-10 p-6 lg:p-10 max-w-6xl mx-auto space-y-10">
          <AnimatePresence mode="wait">
            {!selectedProposal ? (
            <motion.div 
              key="free-dashboard"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="space-y-10"
            >
              <header className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h1 className="font-display text-4xl font-black text-foreground tracking-tight">
                    {greeting}, {displayName} 👋
                  </h1>
                  <div className="flex items-center gap-4">
                    <LiquidGlassToggle />
                    <div className="bg-amber-500/10 border border-amber-500/20 backdrop-blur-md rounded-2xl px-5 py-3 flex items-center justify-between gap-6 shadow-sm">
                      <p className="text-sm font-bold text-amber-600 flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5" /> Basic plan · {3 - Math.min(usedCount, 3)} left
                      </p>
                      <button onClick={() => navigate('/checkout')} className="text-sm font-black text-amber-700 hover:scale-105 transition-transform">
                        Get Freelancer Access →
                      </button>
                    </div>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card label="Proposals Used" color={usedCount >= 3 ? "text-red-500" : usedCount > 0 ? "text-amber-500" : "text-emerald-500"}>
                  <div className="space-y-3">
                     <div className="text-4xl font-black text-slate-900">
                        <CountUp end={usedCount} /> <span className="text-slate-300 text-2xl">/ 3</span>
                     </div>
                     <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-700 ${usedCount >= 3 ? 'bg-red-500' : usedCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${(Math.min(usedCount, 3) / 3) * 100}%` }} />
                     </div>
                  </div>
                </Card>
                <Card label="Proposals Won" icon={TrendingUp} iconColor="text-emerald-500">
                  <div className="text-4xl font-black text-slate-900">
                     <CountUp end={wonProposals} />
                  </div>
                </Card>
                <Card label="Win Rate" icon={BarChart3} iconColor="text-blue-500">
                  <div className="text-4xl font-black text-slate-900">
                     <CountUp end={winRate} />%
                  </div>
                </Card>
                <div 
                  onClick={() => navigate('/checkout')}
                  className="bg-gradient-to-br from-[#101010] to-[#252525] rounded-[32px] p-8 text-white flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform shadow-2xl relative overflow-hidden"
                >
                  <Sparkles className="absolute top-4 right-4 h-12 w-12 text-blue-500 opacity-20" />
                  <Zap className="h-8 w-8 opacity-40" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">FREELANCER</p>
                    <h3 className="text-xl font-black mb-4">Elite Engine</h3>
                    <Button className="w-full h-11 bg-white text-black hover:bg-slate-50 font-bold border-none shadow-none">Go Freelancer</Button>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-[40px] p-10 flex flex-wrap items-center gap-4 shadow-sm">
                <p className="w-full lg:w-auto text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mr-4">Actions</p>
                <Button className="h-14 px-8 rounded-2xl bg-[#0033ff] text-white font-bold hover:bg-[#002be6] shadow-lg shadow-blue-200 gap-2 active:scale-95 transition-all" disabled={usedCount >= 3} onClick={() => navigate('/generate')}>
                  <Plus className="h-4 w-4" /> + New Pitch
                </Button>
                <Button variant="outline" disabled className="h-14 px-8 rounded-2xl border-slate-100 font-bold text-slate-400 opacity-50 cursor-not-allowed">Templates (Freelancer only)</Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-black text-slate-900">Your Recent Activity</h3>
                    <Button variant="link" className="text-[#0033ff] font-bold" onClick={() => navigate('/proposals')}>All Logged Items</Button>
                  </div>

                  <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                    {proposals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                         <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center">
                            <Plus className="h-10 w-10 text-slate-300" />
                         </div>
                         <h4 className="text-lg font-bold text-slate-900">No pitches created</h4>
                         <p className="text-slate-400 max-w-[240px]">Start building your first proposal to see it here.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50/50">
                              <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">Project</th>
                              <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">Status</th>
                              <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 text-right">View</th>
                            </tr>
                          </thead>
                          <tbody>
                            {proposals.slice(0, 5).map((p) => (
                              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                                <td className="px-8 py-6">
                                  <div className="font-bold text-slate-700">{p.title}</div>
                                  <div className="text-[10px] text-slate-400">{new Date(p.created_at).toLocaleDateString()}</div>
                                </td>
                                <td className="px-8 py-6">
                                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${statusColors[p.status] || statusColors.draft}`}>
                                     {p.status}
                                  </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                   <Button variant="ghost" size="icon" className="text-slate-300 hover:text-blue-600" onClick={() => setSelectedProposal(p)}>
                                      <Eye className="h-4 w-4" />
                                   </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                   <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl space-y-6">
                      <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                         <Sparkles className="h-6 w-6 text-blue-400" />
                      </div>
                      <h4 className="text-xl font-black leading-tight">Unlock AI Strategy & Marketplace</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        Upgrade to Freelancer to manage your pipeline, get AI closing advice, and see exactly why you're winning deals.
                      </p>
                      <Button className="w-full h-14 bg-white text-black hover:bg-slate-100 font-bold rounded-2xl" onClick={() => navigate('/checkout')}>
                         Unlock Freelancer Plan
                      </Button>
                   </div>
                </div>
              </div>
            </motion.div>
          ) : (
             /* Proposal Preview (Free Version) */
             <motion.div 
               key="proposal-preview-free"
               initial={{ opacity: 0, scale: 0.98 }} 
               animate={{ opacity: 1, scale: 1 }} 
               className="space-y-6 max-w-4xl mx-auto pb-20"
             >
                <Button variant="ghost" onClick={() => setSelectedProposal(null)} className="font-bold">← Back</Button>
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
    </div>
  </AuthLayout>
  );
}


function Card({ label, children, icon: Icon, color = "text-foreground", iconColor = "text-muted-foreground" }: any) {
  return (
    <div className="bg-card p-8 group">
       <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
          {Icon && <Icon className={`h-5 w-5 ${iconColor} opacity-50`} />}
       </div>
       <div className={color}>{children}</div>
    </div>
  );
}

function ActionButton({ icon: Icon, onClick, tooltip, color = "text-slate-400 hover:text-[#0033ff]" }: any) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-xl ${color}`} onClick={(e) => { e.stopPropagation(); onClick(); }}>
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent><p className="text-xs font-bold">{tooltip}</p></TooltipContent>
    </Tooltip>
  );
}
