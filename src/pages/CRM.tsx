import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye, CheckCircle2, XCircle, Trash2, Plus, BarChart3, TrendingUp, DollarSign, Brain, Sparkles, Filter
} from "lucide-react";

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

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-500 border-slate-200",
  sent: "bg-blue-50 text-[#0033ff] border-blue-100",
  opened: "bg-amber-50 text-amber-600 border-amber-100",
  won: "bg-emerald-50 text-emerald-600 border-emerald-100",
  lost: "bg-rose-50 text-rose-600 border-rose-100",
};

const kanbanColumns = ["draft", "sent", "opened", "won", "lost"];

const getDealScore = (status: string) => {
  switch (status.toLowerCase()) {
    case 'draft': return 20;
    case 'sent': return 45;
    case 'opened': return 75;
    case 'won': return 100;
    case 'lost': return 0;
    default: return 0;
  }
};

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

  const isFree = profile?.plan !== 'pro';

  const updateStatus = async (id: string, status: string) => {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    const { error } = await supabase.from("proposals").update({ status }).eq("id", id);
    if (error) {
      toast.error("Failed to update status");
      fetchProposals();
    } else {
      toast.success(status === "won" ? "Marked as Won! 🎉" : status === "lost" ? "Marked as Lost." : `Status updated to ${status}`);
    }
  };

  const deleteProposal = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFree) {
      toast.error('Free accounts cannot delete proposals. Upgrade to Pro to manage your proposals freely.');
      return;
    }
    setProposals((prev) => prev.filter((p) => p.id !== id));
    const { error } = await supabase.from("proposals").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else toast.success("Proposal deleted.");
  };

  const totalActive = proposals.filter((p) => !["won", "lost"].includes(p.status)).length;
  const winRate = proposals.length > 0
    ? Math.round((proposals.filter((p) => p.status === "won").length / proposals.length) * 100)
    : 0;

  const pipelineValue = proposals.reduce((acc, p) => {
    if (!["won", "lost"].includes(p.status) && p.budget && typeof p.budget === "string") {
      const numeric = parseFloat(p.budget.replace(/[^0-9.]/g, ''));
      return isNaN(numeric) ? acc : acc + numeric;
    }
    return acc;
  }, 0);

  const loading = profileLoading || loadingProposals;

  if (isFree && !loading) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 font-body">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md bg-white p-12 rounded-[40px] shadow-2xl border border-slate-100"
          >
            <div className="h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
              <BarChart3 className="h-12 w-12 text-[#0033ff]" />
            </div>
            <h2 className="font-display font-black text-3xl text-slate-900 mb-4 leading-tight">Master Your Pipeline</h2>
            <p className="text-slate-500 mb-8 leading-relaxed font-medium">
              The CRM Pipeline Dashboard is a Pro feature. 
              Track deals, see probability scores, and manage your sales flow with ease.
            </p>
            <Button 
               className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl font-bold text-lg shadow-[0_10px_20px_rgba(0,51,255,0.2)] active:scale-95 transition-all"
               onClick={() => navigate('/checkout')}
            >
              Unlock CRM with Pro
            </Button>
          </motion.div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto font-body space-y-10 min-h-screen">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="font-display text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              CRM Pipeline
            </h1>
            <p className="text-slate-500 font-medium mt-2">Manage your active deals and track conversions.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-4">
             <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 font-bold text-slate-600" onClick={() => navigate('/coach')}>
               <Brain className="h-4 w-4 mr-2 text-purple-500" /> AI Coach
             </Button>
             <Button className="h-12 px-6 rounded-xl bg-[#0033ff] hover:bg-[#002be6] text-white font-bold shadow-lg shadow-blue-200 gap-2" onClick={() => navigate("/generate")}>
               <Plus className="h-4 w-4" /> New Pitch
             </Button>
          </motion.div>
        </header>

        {/* Premium Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-[32px]" />)
          ) : (
            <>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Active Deals</span>
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-[#0033ff]" />
                  </div>
                </div>
                <div className="text-4xl font-black text-slate-900">{totalActive}</div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Win Rate</span>
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
                <div className="text-4xl font-black text-slate-900">{winRate}%</div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Active Pipeline Value</span>
                  <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
                <div className="text-4xl font-black text-slate-900">${pipelineValue.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-[#08080F] to-[#1A1A2E] text-white p-8 rounded-[32px] shadow-xl relative overflow-hidden flex flex-col justify-center items-start cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => navigate('/coach')}>
                <Sparkles className="absolute top-4 right-4 h-24 w-24 text-purple-500 opacity-20" />
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-purple-400 mb-2">Strategy</span>
                <span className="text-xl font-black leading-tight max-w-[80%]">Run AI Analysis on pipeline</span>
                <ArrowRightIcon className="mt-4 h-5 w-5 text-white/50" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {kanbanColumns.map((col) => {
              const items = proposals.filter((p) => p.status === col);
              return (
                <div key={col} className="bg-slate-50/50 rounded-[32px] border border-slate-100 p-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2 pt-2">
                    <h3 className="font-black text-sm uppercase tracking-wider text-slate-700">{col}</h3>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${statusColors[col]}`}>
                      {items.length}
                    </span>
                  </div>
                  
                  <div className="flex-1 space-y-4 min-h-[200px]">
                    {items.map((p) => (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer hover:border-[#0033ff]/30 hover:shadow-[0_8px_30px_rgba(0,51,255,0.08)] transition-all group relative"
                        onClick={() => navigate(`/proposals/${p.id}`)}
                      >
                        <p className="font-bold text-slate-900 text-sm leading-tight mb-1 truncate pr-8">{p.client_name || "Prospect"}</p>
                        <p className="text-[11px] font-medium text-slate-400 truncate mb-3">{p.project_type || p.title}</p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-black text-slate-900">{p.budget || "TBD"}</span>
                          <span className="text-[10px] font-bold text-slate-400">{new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span>
                        </div>
                        
                        {/* Probability Score */}
                        <div className="flex items-center justify-between">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden mr-3">
                              <div className={`h-full ${getDealScore(col) >= 75 ? 'bg-emerald-500' : 'bg-[#0033ff]'}`} style={{ width: `${getDealScore(col)}%` }} />
                            </div>
                            <span className="text-[10px] font-black tracking-widest text-[#0033ff]">{getDealScore(col)}%</span>
                        </div>

                        {/* Quick Actions overlay */}
                        <div className="absolute top-4 right-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                           {col !== "won" && (
                             <button onClick={() => updateStatus(p.id, "won")} className="h-7 w-7 bg-white border border-emerald-100 rounded-lg flex items-center justify-center hover:bg-emerald-50 text-emerald-500 shadow-sm transition-colors" title="Mark Won">
                               <CheckCircle2 className="h-3.5 w-3.5" />
                             </button>
                           )}
                           {col !== "lost" && (
                             <button onClick={() => updateStatus(p.id, "lost")} className="h-7 w-7 bg-white border border-rose-100 rounded-lg flex items-center justify-center hover:bg-rose-50 text-rose-500 shadow-sm transition-colors" title="Mark Lost">
                               <XCircle className="h-3.5 w-3.5" />
                             </button>
                           )}
                           <button onClick={(e) => deleteProposal(p.id, e)} className="h-7 w-7 bg-white border border-slate-100 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-500 shadow-sm transition-colors" title="Delete">
                             <Trash2 className="h-3.5 w-3.5" />
                           </button>
                        </div>
                      </motion.div>
                    ))}
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

function ArrowRightIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  )
}
