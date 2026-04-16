import { useState, useEffect, useMemo } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, Target, TrendingUp, Sparkles, AlertCircle, CheckCircle2, FileText, ChevronRight, BarChart3, Clock, ArrowUpRight
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
      <div className="p-6 lg:p-10 max-w-6xl mx-auto min-h-screen font-body space-y-10">
        <header className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                Win-Rate Coach <Sparkles className="h-6 w-6 text-purple-500" />
              </h1>
              <p className="text-slate-500 mt-2 font-medium">AI-powered insights analyzing your proposal pipeline</p>
            </div>
            <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full border border-purple-100">
              <Brain className="h-3.5 w-3.5 text-purple-600" />
              <span className="text-[11px] font-black uppercase tracking-widest text-purple-700">Coach Active</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-[300px] rounded-[32px] md:col-span-2" />
            <Skeleton className="h-[300px] rounded-[32px]" />
          </div>
        ) : decidedProposals === 0 ? (
           <div className="bg-white border border-slate-100 rounded-[40px] p-12 text-center shadow-sm">
             <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-10 w-10 text-slate-300" />
             </div>
             <h3 className="text-2xl font-bold text-slate-900 mb-3">Not enough data</h3>
             <p className="text-slate-500 max-w-sm mx-auto mb-8">
               The Coach needs at least one decided proposal (Won or Lost) to generate insights.
             </p>
             <Button onClick={() => navigate('/crm')} variant="outline" className="h-12 px-8 rounded-xl border-slate-200">
               Update Deal Statuses in CRM
             </Button>
           </div>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Win Rate Meter Card */}
                <div className="bg-gradient-to-br from-[#08080F] to-[#1A1A2E] rounded-[40px] p-8 lg:p-10 text-white shadow-2xl relative overflow-hidden lg:col-span-2 flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Target className="h-48 w-48 text-[#4EEAA0]" />
                  </div>
                  
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-2">
                       <Sparkles className="h-4 w-4 text-[#4EEAA0]" />
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#4EEAA0]">Performance Insight</span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2 mb-2">
                         <div className="text-7xl font-display font-black tracking-tighter">
                           <CountUp end={winRate} duration={2} />%
                         </div>
                         <span className="text-xl font-bold opacity-60">Win Rate</span>
                      </div>
                      <p className="text-lg text-slate-300 max-w-md">
                        {winRate > 60 ? "Exceptional closing performance. Your proposals are highly persuasive." 
                          : winRate > 30 ? "Solid performance. Applying AI Pitch Analysis to drafts could lift this further."
                          : "Room for growth. Focus on stronger Value Propositions and using our Pro templates."}
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest opacity-50 font-bold mb-1">Won</p>
                      <p className="text-2xl font-black text-[#4EEAA0]">{wonProposals}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest opacity-50 font-bold mb-1">Lost</p>
                      <p className="text-2xl font-black text-[#FF6B8A]">{lostProposals}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest opacity-50 font-bold mb-1">In Pipeline</p>
                      <p className="text-2xl font-black text-[#FFD166]">{totalProposals - decidedProposals}</p>
                    </div>
                  </div>
                </div>

                {/* Vertical Stats Column */}
                <div className="space-y-6 flex flex-col">
                  {/* Best Sector */}
                  <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-indigo-500" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Best Sector</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2 truncate" title={bestSector}>{bestSector}</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      You convert highest when pitching to this industry. Focus marketing efforts here.
                    </p>
                  </div>

                  {/* Avg Value */}
                  <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-emerald-500" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avg Deal Size</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2">
                      ${avgWonBudget > 0 ? avgWonBudget.toLocaleString() : 'N/A'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Average value of successfully closed proposals.
                    </p>
                  </div>
                </div>
              </div>

              {/* Lower Section Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* AI Strategy Coach Actionables */}
                <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm flex flex-col">
                  <h3 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2 mb-6">
                    <Brain className="h-5 w-5 text-purple-500" /> Strategist Notes
                  </h3>
                  
                  <div className="space-y-4 flex-1">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-emerald-900 text-sm">Double down on {bestSector}</p>
                        <p className="text-emerald-700/80 text-xs mt-1 leading-relaxed">
                          Your win rate in this sector is exceptionally high. Adapt your general templates to target this niche explicitly.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                      <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-900 text-sm">Follow-up Velocity</p>
                        <p className="text-amber-700/80 text-xs mt-1 leading-relaxed">
                          {isHealthyPipeline ? "You have active deals in the pipeline. Make sure you don't let 'Opened' proposals sit without a follow-up." : "Keep feeding the pipeline! More drafts sent equals more data to analyze."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <AlertCircle className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Leverage Pitch Analysis</p>
                        <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                          Ensure you run the AI Analysis on EVERY proposal before sending. It helps catch weak CTAs and pricing presentation issues.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full mt-6 h-12 rounded-xl border-slate-200 font-bold" onClick={() => navigate('/proposals')}>
                    View Proposals
                  </Button>
                </div>

                {/* Trend Chart */}
                <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                       <TrendingUp className="h-5 w-5 text-blue-500" /> Win Rate History
                    </h3>
                  </div>

                  <div className="flex-1 min-h-[200px] w-full">
                    {winRateData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={winRateData}>
                          <defs>
                            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0033ff" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#0033ff" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} tickFormatter={(val) => `${val}%`} />
                          <RechartsTooltip 
                             contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                             itemStyle={{ fontSize: '13px', fontWeight: 'bold', color: '#0033ff' }}
                          />
                          <Area type="monotone" dataKey="rate" stroke="#0033ff" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                         <span className="text-slate-400 font-medium">No history available</span>
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
