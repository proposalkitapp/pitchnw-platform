"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Trash2,
  Clock,
  Eye,
  Download,
  BarChart3,
  TrendingUp,
  CalendarDays,
  Link2,
  Zap,
  Lock,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  Target,
  Activity,
  ChevronRight,
  MoreHorizontal,
  CheckCircle2,
  Send,
  Mail,
  Trophy,
  XCircle,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { exportProposalAsPdf } from "@/lib/export-pdf";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingModal } from "@/components/OnboardingModal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ProposalRenderer, type ProposalBranding } from "@/components/ProposalRenderer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const { session } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [plan, setPlan] = useState("free");
  const [userBranding, setUserBranding] = useState<ProposalBranding>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchProposals = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select("id, title, client_name, status, created_at, generated_content, public_slug, proposal_mode")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
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

      supabase
        .from("profiles")
        .select("display_name, onboarding_completed, plan, brand_logo_url, brand_name, company_name, portfolio_url")
        .eq("user_id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setDisplayName(data.display_name?.split(" ")[0] || "there");
            setPlan(data.plan || "free");
            setUserBranding({
              logoUrl: data.brand_logo_url,
              headerTitle: data.brand_name,
              companyName: data.company_name,
              displayName: data.display_name,
              portfolioUrl: data.portfolio_url,
            });
            if (!data.onboarding_completed) {
              setShowOnboarding(true);
            }
          }
        });
    } else if (session === null) {
      setLoading(false);
    }
  }, [session]);

  const deleteProposal = async (id: string) => {
    if (plan === "free") {
      toast.error("Free plan users cannot delete proposals. Upgrade to Standard to manage your proposals.");
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

  const updateProposalStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("proposals")
      .update({ status: newStatus })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update status");
    } else {
      setProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );
      toast.success(`Status updated to "${newStatus}"`);
    }
  };

  // Computed data
  const totalProposals = proposals.length;
  const wonProposals = proposals.filter((p) => p.status === "won").length;
  const sentProposals = proposals.filter((p) => p.status === "sent").length;
  const draftProposals = proposals.filter((p) => p.status === "draft").length;
  const lostProposals = proposals.filter((p) => p.status === "lost").length;
  const openedProposals = proposals.filter((p) => p.status === "opened").length;

  const thisMonthProposals = proposals.filter((p) => {
    const d = new Date(p.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const winRate = totalProposals > 0 ? Math.round((wonProposals / totalProposals) * 100) : 0;

  // Filtered proposals
  const filteredProposals = useMemo(() => {
    let result = proposals;
    if (activeFilter !== "all") {
      result = result.filter((p) => p.status === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.client_name && p.client_name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [proposals, activeFilter, searchQuery]);

  const canCreateProposal = plan !== "free" || totalProposals < 3;

  const stats = [
    {
      label: "Total Proposals",
      value: totalProposals.toString(),
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      change: thisMonthProposals > 0 ? `+${thisMonthProposals} this month` : "No new this month",
    },
    {
      label: "Win Rate",
      value: `${winRate}%`,
      icon: Target,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      change: wonProposals > 0 ? `${wonProposals} won` : "No wins yet",
    },
    {
      label: "Active Pipeline",
      value: (sentProposals + openedProposals).toString(),
      icon: Activity,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      change: `${sentProposals} sent, ${openedProposals} opened`,
    },
    {
      label: "This Month",
      value: thisMonthProposals.toString(),
      icon: CalendarDays,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/20",
      change: new Date().toLocaleString("default", { month: "long" }),
    },
  ];

  const statusPipeline = [
    { label: "Draft", count: draftProposals, color: "bg-secondary", textColor: "text-muted-foreground", icon: FileText },
    { label: "Sent", count: sentProposals, color: "bg-blue-500", textColor: "text-blue-500", icon: Send },
    { label: "Opened", count: openedProposals, color: "bg-amber-500", textColor: "text-amber-500", icon: Mail },
    { label: "Won", count: wonProposals, color: "bg-emerald-500", textColor: "text-emerald-500", icon: Trophy },
    { label: "Lost", count: lostProposals, color: "bg-destructive", textColor: "text-destructive", icon: XCircle },
  ];

  const statusColors: Record<string, string> = {
    draft: "bg-secondary text-muted-foreground",
    sent: "bg-blue-500/10 text-blue-500",
    opened: "bg-amber-500/10 text-amber-500",
    won: "bg-emerald-500/10 text-emerald-500",
    lost: "bg-destructive/10 text-destructive",
  };

  const quickActions = [
    {
      title: "New Proposal",
      description: "Create an AI-powered proposal",
      icon: Sparkles,
      color: "text-primary",
      bgColor: "bg-primary/10",
      onClick: () => {
        if (!canCreateProposal) {
          toast.error("You've used all 3 free proposals. Upgrade to Standard for unlimited access.");
          router.push("/settings");
          return;
        }
        router.push("/generate");
      },
    },
    {
      title: "Browse Templates",
      description: "Start from a proven template",
      icon: Store,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
      onClick: () => router.push("/marketplace"),
    },
    {
      title: "CRM Pipeline",
      description: "Manage your client pipeline",
      icon: BarChart3,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      onClick: () => router.push("/crm"),
    },
  ];

  // Render proposal detail view
  if (selectedProposal) {
    return (
      <AuthLayout>
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex gap-2 flex-wrap items-center">
              <Button variant="ghost" onClick={() => setSelectedProposal(null)} className="gap-2">
                ← Back to Dashboard
              </Button>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => exportProposalAsPdf(selectedProposal.title, selectedProposal.generated_content)}
              >
                <Download className="h-4 w-4" /> Export PDF
              </Button>
              {selectedProposal.public_slug && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/p/${selectedProposal.public_slug}`);
                    toast.success("Client link copied! 🔗");
                  }}
                >
                  <Link2 className="h-4 w-4" /> Copy Link
                </Button>
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
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {showOnboarding && (
        <OnboardingModal displayName={displayName} onComplete={() => setShowOnboarding(false)} />
      )}
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl lg:text-4xl font-bold">
                {getGreeting()}, {displayName} 👋
              </h1>
              <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">
                Here's your proposal command center. Track, manage, and grow.
              </p>
            </div>
            <Button
              id="create-proposal-btn"
              variant="hero"
              size="lg"
              className="gap-2 shrink-0"
              onClick={() => {
                if (!canCreateProposal) {
                  toast.error("You've used all 3 free proposals. Upgrade to Standard for unlimited access.");
                  router.push("/settings");
                  return;
                }
                router.push("/generate");
              }}
            >
              <Plus className="h-5 w-5" /> New Proposal
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] rounded-xl" />
              ))
            : stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-9 w-9 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
                    </div>
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                  </div>
                  <div className="font-display text-2xl lg:text-3xl font-bold text-card-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground/70 mt-1 block">
                    {stat.change}
                  </span>
                </motion.div>
              ))}
        </div>

        {/* Main Content: Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Free Plan Usage Bar */}
            {plan === "free" && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-card-foreground block">Free Plan</span>
                      <span className="text-[11px] text-muted-foreground">
                        {Math.min(totalProposals, 3)} of 3 proposals used
                      </span>
                    </div>
                  </div>
                  {totalProposals >= 3 && (
                    <Button
                      variant="hero"
                      size="sm"
                      onClick={() => router.push("/settings")}
                      className="gap-1 text-xs"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" /> Upgrade
                    </Button>
                  )}
                </div>
                <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((totalProposals / 3) * 100, 100)}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      totalProposals >= 3
                        ? "bg-gradient-to-r from-destructive to-destructive/80"
                        : "bg-gradient-to-r from-primary to-primary/80"
                    }`}
                  />
                </div>
                {totalProposals >= 3 ? (
                  <p className="text-xs text-destructive font-medium mt-2">
                    Limit reached — upgrade to continue generating proposals
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    {3 - totalProposals} proposal{3 - totalProposals !== 1 ? "s" : ""} remaining
                  </p>
                )}
              </motion.div>
            )}

            {/* Status Pipeline */}
            {!loading && totalProposals > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-border bg-card p-5"
              >
                <h3 className="font-display text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Pipeline Overview
                </h3>
                <div className="flex items-stretch gap-2">
                  {statusPipeline.map((stage, i) => {
                    const percentage = totalProposals > 0 ? (stage.count / totalProposals) * 100 : 0;
                    return (
                      <button
                        key={stage.label}
                        onClick={() => setActiveFilter(activeFilter === stage.label.toLowerCase() ? "all" : stage.label.toLowerCase())}
                        className={`flex-1 rounded-xl p-3 text-center transition-all duration-200 border ${
                          activeFilter === stage.label.toLowerCase()
                            ? `${stage.color}/10 border-current ${stage.textColor}`
                            : "border-transparent hover:bg-secondary/50"
                        }`}
                      >
                        <stage.icon className={`h-4 w-4 mx-auto mb-1.5 ${stage.textColor}`} />
                        <div className={`font-display text-xl font-bold ${stage.textColor}`}>
                          {stage.count}
                        </div>
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                          {stage.label}
                        </div>
                        {/* Mini bar */}
                        <div className="w-full h-1 rounded-full bg-secondary mt-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className={`h-full rounded-full ${stage.color}`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Proposals Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {activeFilter === "all" ? "All Proposals" : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Proposals`}
                </h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search-proposals"
                      placeholder="Search proposals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 w-[200px] sm:w-[260px] text-sm"
                    />
                  </div>
                  {activeFilter !== "all" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1"
                      onClick={() => setActiveFilter("all")}
                    >
                      <XCircle className="h-3.5 w-3.5" /> Clear filter
                    </Button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : proposals.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 rounded-xl border border-dashed border-border bg-card"
                >
                  <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <FileText className="h-10 w-10 text-primary/40" />
                  </div>
                  <h2 className="font-display text-xl font-semibold mb-2">No proposals yet</h2>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Generate your first AI-powered proposal in under 60 seconds.
                  </p>
                  <Button variant="hero" onClick={() => router.push("/generate")} className="gap-2">
                    <Sparkles className="h-4 w-4" /> Create Your First Proposal
                  </Button>
                </motion.div>
              ) : filteredProposals.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-border bg-card">
                  <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No proposals match your search or filter.</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  <AnimatePresence mode="popLayout">
                    {filteredProposals.slice(0, 15).map((proposal, i) => (
                      <motion.div
                        key={proposal.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.02 }}
                        className="rounded-xl border border-border bg-card p-4 sm:p-5 flex items-center justify-between hover:border-primary/20 transition-all duration-200 group cursor-pointer"
                        onClick={() => setSelectedProposal(proposal)}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Status indicator dot */}
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                            proposal.status === "won" ? "bg-emerald-500/10" :
                            proposal.status === "sent" ? "bg-blue-500/10" :
                            proposal.status === "opened" ? "bg-amber-500/10" :
                            proposal.status === "lost" ? "bg-destructive/10" :
                            "bg-secondary"
                          }`}>
                            {proposal.proposal_mode === "sales_pitch" ? (
                              <Target className={`h-4.5 w-4.5 ${
                                proposal.status === "won" ? "text-emerald-500" :
                                proposal.status === "sent" ? "text-blue-500" :
                                proposal.status === "opened" ? "text-amber-500" :
                                proposal.status === "lost" ? "text-destructive" :
                                "text-muted-foreground"
                              }`} />
                            ) : (
                              <FileText className={`h-4.5 w-4.5 ${
                                proposal.status === "won" ? "text-emerald-500" :
                                proposal.status === "sent" ? "text-blue-500" :
                                proposal.status === "opened" ? "text-amber-500" :
                                proposal.status === "lost" ? "text-destructive" :
                                "text-muted-foreground"
                              }`} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-display font-semibold text-card-foreground truncate text-sm group-hover:text-primary transition-colors">
                              {proposal.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                              {proposal.client_name && (
                                <span className="font-medium">{proposal.client_name}</span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getRelativeTime(proposal.created_at)}
                              </span>
                              <span className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[proposal.status] || "bg-secondary text-muted-foreground"}`}>
                                {proposal.status}
                              </span>
                              {proposal.proposal_mode && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  proposal.proposal_mode === "sales_pitch"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-secondary text-muted-foreground"
                                }`}>
                                  {proposal.proposal_mode === "sales_pitch" ? "🎯 Pitch" : "📄 Formal"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4 shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedProposal(proposal); }}>
                                <Eye className="h-4 w-4 mr-2" /> View Proposal
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); exportProposalAsPdf(proposal.title, proposal.generated_content); }}>
                                <Download className="h-4 w-4 mr-2" /> Export PDF
                              </DropdownMenuItem>
                              {proposal.public_slug && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(`${window.location.origin}/p/${proposal.public_slug}`);
                                  toast.success("Client link copied! 🔗");
                                }}>
                                  <Link2 className="h-4 w-4 mr-2" /> Copy Link
                                </DropdownMenuItem>
                              )}
                              {/* Status Updates */}
                              {proposal.status === "draft" && (
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateProposalStatus(proposal.id, "sent"); }}>
                                  <Send className="h-4 w-4 mr-2" /> Mark as Sent
                                </DropdownMenuItem>
                              )}
                              {proposal.status === "sent" && (
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateProposalStatus(proposal.id, "opened"); }}>
                                  <Mail className="h-4 w-4 mr-2" /> Mark as Opened
                                </DropdownMenuItem>
                              )}
                              {(proposal.status === "sent" || proposal.status === "opened") && (
                                <>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateProposalStatus(proposal.id, "won"); }}>
                                    <Trophy className="h-4 w-4 mr-2 text-emerald-500" /> Mark as Won
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateProposalStatus(proposal.id, "lost"); }}>
                                    <XCircle className="h-4 w-4 mr-2 text-destructive" /> Mark as Lost
                                  </DropdownMenuItem>
                                </>
                              )}
                              {plan !== "free" && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => { e.stopPropagation(); deleteProposal(proposal.id); }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {filteredProposals.length > 15 && (
                    <p className="text-center text-xs text-muted-foreground py-2">
                      Showing 15 of {filteredProposals.length} proposals
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-border bg-card p-5"
            >
              <h3 className="font-display text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Quick Actions
              </h3>
              <div className="space-y-2.5">
                {quickActions.map((action) => (
                  <button
                    key={action.title}
                    onClick={action.onClick}
                    className="w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all duration-200 hover:bg-secondary/50 group/action"
                  >
                    <div className={`h-9 w-9 rounded-lg ${action.bgColor} flex items-center justify-center shrink-0`}>
                      <action.icon className={`h-4 w-4 ${action.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-card-foreground block">{action.title}</span>
                      <span className="text-[11px] text-muted-foreground">{action.description}</span>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover/action:text-primary transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity Feed */}
            {!loading && proposals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-xl border border-border bg-card p-5"
              >
                <h3 className="font-display text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Recent Activity
                </h3>
                <div className="space-y-0">
                  {proposals.slice(0, 6).map((proposal, i) => (
                    <div
                      key={proposal.id}
                      className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0 cursor-pointer hover:bg-secondary/30 -mx-2 px-2 rounded-lg transition-colors"
                      onClick={() => setSelectedProposal(proposal)}
                    >
                      <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                        proposal.status === "won" ? "bg-emerald-500" :
                        proposal.status === "sent" ? "bg-blue-500" :
                        proposal.status === "opened" ? "bg-amber-500" :
                        proposal.status === "lost" ? "bg-destructive" :
                        "bg-muted-foreground/30"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-card-foreground font-medium truncate">
                          {proposal.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {proposal.status === "draft" && "Draft created"}
                          {proposal.status === "sent" && "Sent to client"}
                          {proposal.status === "opened" && "Opened by client"}
                          {proposal.status === "won" && "Deal won! 🎉"}
                          {proposal.status === "lost" && "Deal lost"}
                          {" · "}
                          {getRelativeTime(proposal.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Performance Insight */}
            {!loading && totalProposals >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-8 translate-x-8" />
                <h3 className="font-display text-sm font-semibold text-card-foreground mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Insight
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {winRate >= 50
                    ? `Great performance! Your ${winRate}% win rate is above average. Keep leveraging your winning strategies.`
                    : winRate > 0
                    ? `Your win rate is ${winRate}%. Try using the Sales Pitch mode — it's been shown to convert better.`
                    : sentProposals > 0
                    ? `You have ${sentProposals} proposal${sentProposals > 1 ? "s" : ""} awaiting response. Follow up to increase your chances.`
                    : `You've created ${totalProposals} proposals. Mark them as sent to start tracking your pipeline.`
                  }
                </p>
              </motion.div>
            )}

            {/* Pro Upgrade Card for Free Users */}
            {plan === "free" && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-violet-500/5 to-primary/10 p-5 relative overflow-hidden"
              >
                <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-primary/10 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-card-foreground mb-1">
                    Unlock Unlimited
                  </h3>
                  <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
                    Unlimited proposals, PDF exports, CRM pipeline, and priority AI generation.
                  </p>
                  <Button
                    variant="hero"
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={() => router.push("/settings")}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" /> Upgrade to Standard
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
