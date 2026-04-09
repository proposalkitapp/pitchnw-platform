"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye, Check, X, Trash2, Plus, Lock, BarChart3, DollarSign, TrendingUp, ArrowRight,
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

export default function CRM() {
  const { user } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "kanban">("table");
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const [{ data: profs }, { data: props }] = await Promise.all([
      supabase.from("profiles").select("plan").eq("user_id", user!.id).single(),
      supabase.from("proposals").select("id, title, client_name, project_type, budget, status, created_at, public_slug").order("created_at", { ascending: false }),
    ]);
    setPlan(profs?.plan || "free");
    setProposals(props || []);
    setLoading(false);
  };

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
    setProposals((prev) => prev.filter((p) => p.id !== id));
    const { error } = await supabase.from("proposals").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else toast.success("Proposal deleted.");
  };

  const totalActive = proposals.filter((p) => !["won", "lost"].includes(p.status)).length;
  const winRate = proposals.length > 0
    ? Math.round((proposals.filter((p) => p.status === "won").length / proposals.length) * 100)
    : 0;

  if (plan === "free" && !loading) {
    return (
      <AuthLayout>
        <div className="relative min-h-[80vh]">
          {/* Blurred preview */}
          <div className="blur-sm opacity-40 pointer-events-none p-6 lg:p-8 max-w-6xl mx-auto">
            <h1 className="font-display text-3xl font-bold mb-6">CRM Pipeline</h1>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center max-w-md mx-4 shadow-2xl"
            >
              <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold mb-2">CRM Pipeline is a Pro feature</h2>
              <p className="text-muted-foreground mb-6 text-sm">
                Track proposals, manage follow-ups, and close more deals with your CRM pipeline.
              </p>
              <ul className="text-left space-y-2 mb-6 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Unlimited proposals</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Pipeline tracking & kanban</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Follow-up reminders</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Full proposal analytics</li>
              </ul>
              <Button variant="hero" size="lg" className="w-full" onClick={() => router.push("/settings?tab=billing")}>
                Upgrade to Standard — $12/mo
              </Button>
            </motion.div>
          </div>
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
            <Button variant="hero" className="gap-2" onClick={() => router.push("/generate")}>
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
            <Button variant="hero" onClick={() => router.push("/generate")} className="gap-2">
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/dashboard")}>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteProposal(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                        onClick={() => router.push("/dashboard")}
                      >
                        <p className="font-display text-sm font-semibold text-card-foreground truncate">{p.client_name || "No client"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.project_type || p.title}</p>
                        {p.budget && (
                          <span className="text-xs font-medium text-primary mt-1 inline-block">{p.budget}</span>
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
