"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye, Check, X, Trash2, Plus, BarChart3, TrendingUp,
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
  draft: "bg-secondary text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-400",
  opened: "bg-warning/10 text-warning",
  won: "bg-success/10 text-success",
  lost: "bg-destructive/10 text-destructive",
};

const kanbanColumns = ["sent", "opened", "draft", "won", "lost"];

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
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "kanban">("table");
  // null = free plan, 'pro' = paid
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user?.id) return;
    
    try {
      const [{ data: profs, error: profError }, { data: props, error: propError }] = await Promise.all([
        supabase.from("profiles").select("plan").eq("user_id", user.id).single(),
        supabase.from("proposals").select("id, title, client_name, project_type, budget, status, created_at, public_slug").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      
      if ((profError || propError) && user?.id) {
        console.error("CRM fetch error:", profError || propError);
        toast.error("Failed to load pipeline data");
      } else {
        // null = free; 'pro' = paid
        setPlan(profs?.plan ?? null);
        setProposals(props || []);
      }
    } catch (err) {
      console.error("CRM fetch data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const isFree = !plan;

  const updateStatus = async (id: string, status: string) => {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    const { error } = await supabase.from("proposals").update({ status }).eq("id", id);
    if (error) {
      toast.error("Failed to update status");
      fetchData();
    } else {
      toast.success(status === "won" ? "Marked as Won! 🎉" : status === "lost" ? "Marked as Lost." : `Status updated to ${status}`);
    }
  };

  const deleteProposal = async (id: string) => {
    // Free users cannot delete proposals — prevents limit bypass
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

  if (isFree && !loading) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md bg-white p-10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100"
          >
            <div className="text-6xl mb-6">📊</div>
            <h2 className="font-syne font-extrabold text-3xl text-slate-900 mb-4">Master Your Pipeline</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              The CRM Pipeline Dashboard is a Pro feature. 
              Track deals, see probability scores, and manage your sales flow with ease.
            </p>
            <Button 
              size="lg"
              className="w-full h-14 bg-[#0033ff] hover:bg-[#002be6] text-white rounded-2xl font-bold text-lg shadow-[0_10px_20px_rgba(0,51,255,0.2)]"
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
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="font-display text-3xl font-bold">CRM Pipeline</h1>
            <Button variant="hero" className="gap-2" onClick={() => navigate("/generate")}>
              <Plus className="h-4 w-4" /> Add to Pipeline
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : (
            [
              { label: "Active Deals", value: totalActive, icon: BarChart3, color: "text-primary" },
              { label: "Win Rate", value: `${winRate}%`, icon: TrendingUp, color: "text-success" },
              { label: "Total Won", value: proposals.filter((p) => p.status === "won").length, icon: Check, color: "text-success" },
              { label: "Total Lost", value: proposals.filter((p) => p.status === "lost").length, icon: X, color: "text-destructive" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="font-display text-2xl font-bold text-card-foreground">{stat.value}</div>
              </motion.div>
            ))
          )}
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 w-fit mb-6">
          {(["table", "kanban"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {v}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : proposals.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 rounded-xl border border-dashed border-border">
            <BarChart3 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">Your pipeline is empty</h2>
            <p className="text-muted-foreground mb-6">Proposals you send appear here automatically.</p>
            <Button variant="hero" onClick={() => navigate("/generate")} className="gap-2">
              <Plus className="h-4 w-4" /> Create a Proposal
            </Button>
          </motion.div>
        ) : view === "table" ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Budget</TableHead>
                  {!isFree && <TableHead>Score</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-card-foreground">{p.client_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.project_type || "—"}</TableCell>
                    <TableCell className="text-sm">{p.budget || "TBD"}</TableCell>
                    {!isFree && (
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${getDealScore(p.status) >= 75 ? 'bg-success' : 'bg-primary'}`} 
                              style={{ width: `${getDealScore(p.status)}%` }} 
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{getDealScore(p.status)}%</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <span className={`capitalize px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[p.status] || statusColors.draft}`}>
                        {p.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/dashboard")}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {p.status !== "won" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success" onClick={() => updateStatus(p.id, "won")}>
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {p.status !== "lost" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => updateStatus(p.id, "lost")}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        {/* Only show delete for Pro users */}
                        {!isFree && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteProposal(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Kanban View */
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {kanbanColumns.map((col) => {
              const items = proposals.filter((p) => p.status === col);
              return (
                <div key={col} className="rounded-xl border border-border bg-card/50 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-sm font-semibold capitalize text-card-foreground">{col}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[col]}`}>
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-2 min-h-[100px]">
                    {items.map((p) => (
                      <motion.div
                        key={p.id}
                        layout
                        className="rounded-lg border border-border bg-card p-3 cursor-pointer hover:border-primary/30 transition-colors"
                        onClick={() => navigate("/dashboard")}
                      >
                        <p className="font-display text-sm font-semibold text-card-foreground truncate">{p.client_name || "No client"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.project_type || p.title}</p>
                        {p.budget && (
                          <span className="text-xs font-medium text-primary mt-1 inline-block">{p.budget}</span>
                        )}
                        {!isFree && (
                          <div className="flex items-center justify-between mt-2">
                             <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden mr-2">
                                <div className="h-full bg-[#7C6FF7]" style={{ width: `${getDealScore(p.status)}%` }} />
                             </div>
                             <span className="text-[9px] font-black text-slate-400">{getDealScore(p.status)}%</span>
                          </div>
                        )}
                        <div className="flex gap-1 mt-2">
                          {col !== "won" && (
                            <button onClick={(e) => { e.stopPropagation(); updateStatus(p.id, "won"); }} className="text-xs text-success hover:underline">Won</button>
                          )}
                          {col !== "lost" && (
                            <button onClick={(e) => { e.stopPropagation(); updateStatus(p.id, "lost"); }} className="text-xs text-destructive hover:underline">Lost</button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {items.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No items</p>
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
