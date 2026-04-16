import { useState, useEffect, useMemo } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, Target, TrendingUp, Sparkles, AlertCircle, CheckCircle2, FileText, ChevronRight, BarChart3, Clock, ArrowUpRight, Zap
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import CountUp from "react-countup";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function WinRateCoach() {
  const { session } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      supabase
        .from("proposals")
        .select("id, status, created_at, budget, industry, title, client_name")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.error(error);
            toast.error("Failed to load proposal data");
          } else {
            setProposals(data || []);
          }
          setLoadingProposals(false);
        });
    } else {
      setLoadingProposals(false);
    }
  }, [session]);

  const isPro = profile?.plan === 'pro';

  const totalProposals = proposals.length;
  const wonProposals = proposals.filter(p => p.status === 'won').length;
  const lostProposals = proposals.filter(p => p.status === 'lost').length;
  const decidedProposals = wonProposals + lostProposals;
  
  const winRate = decidedProposals > 0 ? Math.round((wonProposals / decidedProposals) * 100) : 0;
  const isHealthyPipeline = proposals.filter(p => p.status === 'sent' || p.status === 'opened').length > 0;

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
          if (p.status === 'won' || p.status === 'lost') {
            monthlyData[name].total++;
          }
          if (p.status === 'won') monthlyData[name].won++;
        }
      });

      return Object.entries(monthlyData).map(([name, data]) => ({
        name,
        rate: data.total > 0 ? Math.round((data.won / data.total) * 100) : 0
      }));
    } catch (e) {
      return [];
    }
  }, [proposals]);

  // Determine top sector
  const bestSector = useMemo(() => {
    const sectors: Record<string, { won: number; total: number }> = {};
    proposals.forEach(p => {
      const s = p.industry || "General";
      if (!sectors[s]) sectors[s] = { won: 0, total: 0 };
      if (p.status === 'won' || p.status === 'lost') sectors[s].total++;
      if (p.status === 'won') sectors[s].won++;
    });

    let best = "N/A";
    let highestRate = -1;
    
    Object.entries(sectors).forEach(([sector, data]) => {
      if (data.total >= 1) { // minimum 1 decided proposal
        const rate = data.won / data.total;
        if (rate > highestRate) {
          highestRate = rate;
          best = sector;
        }
      }
    });

    return best;
  }, [proposals]);

  // Determine average budget of won proposals
  const avgWonBudget = useMemo(() => {
    let sum = 0;
    let count = 0;
    proposals.filter(p => p.status === 'won').forEach(p => {
      if (p.budget && typeof p.budget === 'string') {
        const val = parseFloat(p.budget.replace(/[^0-9.]/g, ''));
        if (!isNaN(val) && val > 0) {
          sum += val;
          count++;
        }
      }
    });
    return count > 0 ? Math.round(sum / count) : 0;
  }, [proposals]);

  const loading = profileLoading || loadingProposals;

  if (!isPro && !loading) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md bg-white p-10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100"
          >
            <div className="h-20 w-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="h-10 w-10 text-purple-600" />
            </div>
            <h2 className="font-display font-extrabold text-3xl text-slate-900 mb-4 leading-tight">AI Win-Rate Coach</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Unlock the Coach feature to discover exactly why you win and lose deals, get sector specific insights, and actionable strategies based on your historical performance.
            </p>
            <Button 
              size="lg"
              className="w-full h-14 bg-[#0033ff] hover:bg-[#002be6] text-white rounded-2xl font-bold text-lg shadow-[0_10px_20px_rgba(0,51,255,0.2)]"
              onClick={() => navigate('/checkout')}
            >
              Unlock Features with Pro
            </Button>
          </motion.div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-12 font-body min-h-screen">
        <header className="space-y-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="bg-purple-600 text-[10px] font-black uppercase tracking-[0.3em] text-white px-3 py-1.5 rounded-full shadow-lg shadow-purple-200">
                   Active Intelligence
                 </div>
                 <Brain className="h-5 w-5 text-purple-500" />
              </div>
              <h1 className="font-display text-5xl font-black text-slate-900 tracking-tighter leading-none">
                Strategic <span className="text-purple-600">Coach.</span>
              </h1>
              <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
                AI-driven analysis to maximize your deal conversion rate and strategic probability.
              </p>
            </div>
            <div className="flex items-center gap-3">
               <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm" onClick={() => navigate('/proposals')}>
                 Pitch Library
               </Button>
               <Button className="h-14 px-10 rounded-2xl bg-[#0033ff] hover:bg-[#002be6] text-white font-black shadow-2xl shadow-blue-200 gap-2 active:scale-95 transition-all" onClick={() => navigate("/crm")}>
                 Manage Pipeline
               </Button>
            </div>
          </motion.div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Skeleton className="h-[400px] rounded-[48px] md:col-span-2" />
            <Skeleton className="h-[400px] rounded-[48px]" />
          </div>
        ) : decidedProposals === 0 ? (
           <div className="bg-white border border-slate-100 rounded-[48px] p-20 text-center shadow-[0_20px_60px_rgba(0,0,0,0.03)] group transition-all hover:border-blue-100">
             <div className="h-24 w-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-10 w-10 text-slate-300 group-hover:text-blue-500 transition-colors" />
             </div>
             <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Need More Deal Velocity</h3>
             <p className="text-slate-500 max-w-md mx-auto mb-10 text-lg font-medium leading-relaxed">
               The Strategic Coach requires at least one won or lost deal to analyze patterns and generate intelligence.
             </p>
             <Button onClick={() => navigate('/crm')} className="h-14 px-10 rounded-2xl bg-black text-white font-bold shadow-xl">
               Update CRM Pipeline
             </Button>
           </div>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-20">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Win Rate Meter Card */}
                <div className="bg-[#08080C] rounded-[48px] p-12 text-white shadow-[0_40px_100px_rgba(0,0,0,0.15)] relative overflow-hidden lg:col-span-2 flex flex-col justify-between">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-blue-600/10 blur-[100px] rounded-full" />
                  
                  <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                    <div className="relative h-64 w-64 shrink-0">
                      <svg className="h-full w-full -rotate-90">
                        <circle cx="128" cy="128" r="114" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="20" />
                        <motion.circle
                          cx="128" cy="128" r="114" fill="none" stroke="#4EEAA0" strokeWidth="20"
                          strokeDasharray="716"
                          initial={{ strokeDashoffset: 716 }}
                          animate={{ strokeDashoffset: 716 - (716 * winRate) / 100 }}
                          transition={{ duration: 2.5, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-7xl font-black text-white tracking-tighter">
                           <CountUp end={winRate} duration={2} />%
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#4EEAA0] mt-2">Win Rate</span>
                      </div>
                    </div>
                    
                    <div className="space-y-6 text-center lg:text-left">
                      <div className="inline-flex items-center gap-2 bg-[#4EEAA0]/10 text-[#4EEAA0] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-[#4EEAA0]/20">
                         <TrendingUp className="h-4 w-4" /> Performance Status: Elite
                      </div>
                      <h2 className="text-4xl font-black leading-tight tracking-tight">
                        {winRate > 60 ? "Exceptional closing precision." 
                          : winRate > 30 ? "Strong competitive position."
                          : "High growth potential ahead."}
                      </h2>
                      <p className="text-slate-400 text-lg font-medium leading-relaxed">
                        Your efficiency is {winRate > 50 ? 'outperforming 90% of peers' : 'showing steady acceleration'} this quarter.
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-white/5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-2">Closed Won</p>
                      <p className="text-4xl font-black text-[#4EEAA0] tracking-tighter">{wonProposals}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-2">Closed Lost</p>
                      <p className="text-4xl font-black text-rose-500 tracking-tighter">{lostProposals}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-2">In Market</p>
                      <p className="text-4xl font-black text-blue-500 tracking-tighter">{totalProposals - decidedProposals}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-8">
                  {/* Best Sector */}
                  <div className="bg-white border border-slate-100 rounded-[48px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.03)] flex-1 group hover:border-blue-200 transition-all">
                    <div className="flex items-center justify-between mb-6">
                      <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Target className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Best Sector</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 leading-none mb-3 truncate" title={bestSector}>{bestSector}</h3>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                      Highest efficiency identified in this vertical. Scale marketing here.
                    </p>
                  </div>

                  {/* Avg Value */}
                  <div className="bg-white border border-slate-100 rounded-[48px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.03)] flex-1 group hover:border-emerald-200 transition-all">
                    <div className="flex items-center justify-between mb-6">
                      <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ArrowUpRight className="h-6 w-6 text-emerald-500" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Avg Deal Size</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 leading-none mb-3">
                      ${avgWonBudget > 0 ? avgWonBudget.toLocaleString() : '0'}
                    </h3>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                      Average revenue per successfully closed proposal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actionables & Trends */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* AI Strategist Notes */}
                <div className="bg-white border border-slate-100 rounded-[48px] p-12 shadow-[0_30px_80px_rgba(0,0,0,0.03)] space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <Sparkles className="h-6 w-6 text-purple-500" /> Strategist Notes
                    </h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-5 p-6 rounded-[32px] bg-blue-50/50 border border-blue-100">
                      <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                         <Zap className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-lg uppercase tracking-tight">Focus: {bestSector}</p>
                        <p className="text-slate-600 font-medium mt-1 leading-relaxed">
                          Your historical data confirms extreme efficiency in {bestSector}. Adapt your primary templates to mirror these winning arguments.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-5 p-6 rounded-[32px] bg-slate-50 border border-slate-100">
                      <div className="h-10 w-10 bg-slate-900 rounded-full flex items-center justify-center shrink-0">
                         <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-lg uppercase tracking-tight">Market Velocity</p>
                        <p className="text-slate-600 font-medium mt-1 leading-relaxed">
                          {isHealthyPipeline ? "Pipeline is currently healthy. Avoid following up too late on 'Opened' status deals." : "Activity signal is low. We recommend starting 2-3 new drafts this week."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trend Chart */}
                <div className="bg-white border border-slate-100 rounded-[48px] p-12 shadow-[0_30px_80px_rgba(0,0,0,0.03)] flex flex-col">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                       <BarChart3 className="h-6 w-6 text-blue-500" /> Performance Trend
                    </h3>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trailing 6 Months</div>
                  </div>

                  <div className="flex-1 min-h-[300px] w-full">
                    {winRateData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={winRateData}>
                          <defs>
                            <linearGradient id="colorRatePro" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0033ff" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#0033ff" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#94a3b8' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#94a3b8' }} tickFormatter={(val) => `${val}%`} />
                          <RechartsTooltip 
                             contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px' }}
                             itemStyle={{ fontSize: '13px', fontWeight: '900', color: '#0033ff' }}
                             labelStyle={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '4px' }}
                          />
                          <Area type="monotone" dataKey="rate" stroke="#0033ff" strokeWidth={5} fillOpacity={1} fill="url(#colorRatePro)" animationDuration={2000} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                         <span className="text-slate-300 font-bold uppercase tracking-widest">Analysis Pending</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </AuthLayout>
  );

}
