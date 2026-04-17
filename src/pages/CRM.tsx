import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2, Plus, BarChart3, TrendingUp, DollarSign, Brain, Sparkles, Kanban, 
  MoreHorizontal, ArrowRight, Check, X, Search, Filter, ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Proposal {
  id: string;
  title: string;
  client_name: string | null;
  project_type: string | null;
  budget: string | null;
  status: string;
  created_at: string;
  public_slug: string | null;
}

const stages = [
  { id: 'draft', name: 'Drafts', color: 'bg-slate-400', prob: 0.2 },
  { id: 'sent', name: 'Outbound', color: 'bg-blue-500', prob: 0.45 },
  { id: 'opened', name: 'Engagement', color: 'bg-amber-500', prob: 0.75 },
  { id: 'won', name: 'Closed Won', color: 'bg-emerald-500', prob: 1.0 },
  { id: 'lost', name: 'Closed Lost', color: 'bg-rose-500', prob: 0.0 },
];

export default function CRM() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProposals();
    }
  }, [user]);

  const fetchProposals = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select("id, title, client_name, project_type, budget, status, created_at, public_slug")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("CRM fetch error:", error);
      } else {
        setProposals(data || []);
      }
    } catch (err) {
      console.error("CRM fetch data error:", err);
    } finally {
      setLoadingProposals(false);
    }
  };

  const isFreelancer = profile?.plan === 'pro';

  const updateStatus = async (id: string, status: string) => {
    const originalProposals = [...proposals];
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    const { error } = await supabase.from("proposals").update({ status }).eq("id", id);
    if (error) {
      toast.error("Failed to update status");
      setProposals(originalProposals);
    } else {
      toast.success(status === "won" ? "Marked as Won! 🎉" : status === "lost" ? "Marked as Lost." : `Status updated to ${status}`);
    }
  };

  const totalActive = proposals.filter((p) => !["won", "lost"].includes(p.status)).length;
  const winRate = proposals.length > 0
    ? Math.round((proposals.filter((p) => p.status === "won").length / proposals.filter(p => ['won', 'lost'].includes(p.status)).length || 1) * 100)
    : 0;

  const pipelineValue = proposals.reduce((acc, p) => {
    if (!["won", "lost"].includes(p.status) && p.budget && typeof p.budget === "string") {
      const numeric = parseFloat(p.budget.replace(/[^0-9.]/g, ''));
      return isNaN(numeric) ? acc : acc + numeric;
    }
    return acc;
  }, 0);

  const loading = profileLoading || loadingProposals;

  if (!isFreelancer && !loading) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 font-body">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md bg-card p-12 rounded-[40px] shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <BarChart3 className="h-24 w-24 text-primary" />
            </div>
            <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <BarChart3 className="h-10 w-10 text-primary" />
            </div>
            <h2 className="font-display font-black text-3xl text-foreground mb-4">Master Your Pipeline</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed font-medium">
              The CRM Pipeline Dashboard is a <span className="text-primary font-bold">Freelancer</span> feature. 
              Track deals, see probability scores, and manage your sales flow with ease.
            </p>
            <Button 
               className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all"
               onClick={() => navigate('/checkout')}
            >
              Get Freelancer Access
            </Button>
            <Button variant="ghost" className="mt-4 text-muted-foreground font-bold" onClick={() => navigate('/dashboard')}>
                Return to Dashboard
            </Button>
          </motion.div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto font-body space-y-10 min-h-screen">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
             <div className="flex items-center gap-2 mb-2">
                <div className="bg-blue-600 text-[10px] font-black uppercase tracking-widest text-white px-2 py-1 rounded-md shadow-lg shadow-blue-200">
                  Elite Pipeline
                </div>
                <Kanban className="h-4 w-4 text-blue-500" />
             </div>
            <h1 className="font-display text-4xl font-black text-slate-900 tracking-tight">
              CRM Engine
            </h1>
            <p className="text-slate-500 font-medium text-lg mt-1">Real-time tracking of your active deal flow.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-4">
             <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm" onClick={() => navigate('/coach')}>
               <Brain className="h-4 w-4 mr-2 text-purple-500" /> AI Coach
             </Button>
             <Button className="h-14 px-10 rounded-2xl bg-[#0033ff] hover:bg-[#002be6] text-white font-black shadow-2xl shadow-blue-200 gap-2 active:scale-95 transition-all" onClick={() => navigate("/generate")}>
               <Plus className="h-5 w-5" /> New Pitch
             </Button>
          </motion.div>
        </header>

        {/* Premium Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-[40px]" />)
          ) : (
            <>
              <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.03)] group hover:border-blue-100 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400">Live Deals</span>
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-[#0033ff]" />
                  </div>
                </div>
                <div className="text-5xl font-black text-slate-900">{totalActive}</div>
                <p className="text-slate-400 text-[10px] mt-4 font-bold uppercase tracking-widest">Active currently</p>
              </div>

              <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.03)] group hover:border-emerald-100 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400">Global Rate</span>
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-emerald-500" />
                  </div>
                </div>
                <div className="text-5xl font-black text-slate-900">{winRate}%</div>
                <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500" style={{ width: `${winRate}%` }} />
                </div>
              </div>

              <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.03)] group hover:border-amber-100 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400">Total Value</span>
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-amber-500" />
                  </div>
                </div>
                <div className="text-5xl font-black text-slate-900">${pipelineValue.toLocaleString()}</div>
                <p className="text-slate-400 text-[10px] mt-4 font-bold uppercase tracking-widest">Projected revenue</p>
              </div>

              <div className="bg-gradient-to-br from-[#08080F] to-[#2A2A45] text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col justify-center items-start cursor-pointer group hover:scale-[1.02] transition-all" onClick={() => navigate('/coach')}>
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-4 -right-4 h-32 w-32 bg-purple-600/20 blur-2xl rounded-full"
                />
                <Sparkles className="h-8 w-8 text-purple-400 mb-6 relative z-10" />
                <span className="text-[11px] uppercase font-black tracking-[0.2em] text-purple-400 mb-2 relative z-10">AI Strategist</span>
                <span className="text-2xl font-black leading-tight relative z-10">Get Win Rate Insights →</span>
              </div>
            </>
          )}
        </div>

        {/* Premium Kanban Board */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full rounded-[40px]" />
          </div>
        ) : proposals.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border-2 border-dashed border-slate-200 text-center py-32 rounded-[40px]">
             <BarChart3 className="h-20 w-20 text-slate-300 mx-auto mb-6" />
             <h2 className="font-display text-2xl font-black text-slate-900 mb-3">Your pipeline is empty</h2>
             <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">Generate a pitch to start tracking it automatically across your sales stages.</p>
             <Button className="h-14 bg-[#0033ff] text-white px-8 rounded-2xl font-bold shadow-lg shadow-blue-200" onClick={() => navigate("/generate")}>
                Create First Pitch
             </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {stages.map((stage) => {
              const stageProposals = proposals.filter((p) => p.status === stage.id);
              return (
                <div 
                  key={stage.id} 
                  className="flex flex-col h-full bg-slate-50/50 rounded-[40px] border border-slate-100/50 overflow-hidden"
                >
                  <div className="p-6 pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display font-black text-slate-900 tracking-tight text-xs uppercase">{stage.name}</h3>
                      <Badge className="bg-white text-slate-400 border-slate-100 rounded-lg text-[10px] h-6 px-2">
                        {stageProposals.length}
                      </Badge>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div className={`h-full ${stage.color}`} style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[300px]">
                    {stageProposals.map((p) => (
                      <motion.div
                        layoutId={p.id}
                        key={p.id}
                        className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-grab active:cursor-grabbing group relative"
                        onClick={() => navigate(`/proposals/${p.id}`)}
                      >
                        <div className="flex items-start justify-between mb-4">
                           <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-500 transition-colors">
                             {p.client_name || "Unknown"}
                           </div>
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                 <button className="h-6 w-6 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-300">
                                    <MoreHorizontal className="h-4 w-4" />
                                 </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl p-2">
                                 <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/p/${p.public_slug}`); }} className="rounded-lg gap-2">
                                    <ArrowRight className="h-3 w-3" /> View Live
                                 </DropdownMenuItem>
                                 <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatus(p.id, 'won'); }} className="rounded-lg gap-2 text-emerald-600">
                                    <Check className="h-3 w-3" /> Mark Won
                                 </DropdownMenuItem>
                                 <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatus(p.id, 'lost'); }} className="rounded-lg gap-2 text-rose-600">
                                    <X className="h-3 w-3" /> Mark Lost
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mb-4 leading-tight">{p.title}</h4>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <div className="flex items-center gap-1.5">
                             <DollarSign className="h-3 w-3 text-slate-300" />
                             <span className="text-xs font-black text-slate-500">{p.budget || "$-"}</span>
                          </div>
                          <div className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                            stage.id === 'won' ? 'bg-emerald-50 text-emerald-600' :
                            stage.id === 'lost' ? 'bg-rose-50 text-rose-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {Math.round(stage.prob * 100)}% Win Chance
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {stageProposals.length === 0 && (
                      <div className="h-32 border-2 border-dashed border-slate-100 rounded-[24px] flex flex-col items-center justify-center text-slate-300 gap-2">
                         <Kanban className="h-6 w-6 opacity-20" />
                         <span className="text-[10px] font-bold uppercase tracking-widest opacity-20 whitespace-nowrap">Column Empty</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
