import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Trash2, Clock, Eye, Download, BarChart3, TrendingUp, CalendarDays, Link2, Zap, Lock } from "lucide-react";
import { toast } from "sonner";
import { exportProposalAsPdf } from "@/lib/export-pdf";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingModal } from "@/components/OnboardingModal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ProposalRenderer, type ProposalBranding } from "@/components/ProposalRenderer";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [plan, setPlan] = useState("free");
  const [userBranding, setUserBranding] = useState<ProposalBranding>({});

  useEffect(() => {
    if (user) {
      fetchProposals();
      supabase
        .from("profiles")
        .select("display_name, onboarding_completed, plan, brand_logo_url, brand_name, company_name, portfolio_url")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setDisplayName(data?.display_name?.split(" ")[0] || "there");
          setPlan(data?.plan || "free");
          setUserBranding({
            logoUrl: data?.brand_logo_url,
            headerTitle: data?.brand_name,
            companyName: data?.company_name,
            displayName: data?.display_name,
            portfolioUrl: data?.portfolio_url,
          });
          setPlan(data?.plan || "free");
          if (data && !data.onboarding_completed) {
            setShowOnboarding(true);
          }
        });
    }
  }, [user]);

  const fetchProposals = async () => {
    const { data, error } = await supabase
      .from("proposals")
      .select("id, title, client_name, status, created_at, generated_content, public_slug, proposal_mode")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load proposals");
    } else {
      setProposals(data || []);
    }
    setLoading(false);
  };

  const deleteProposal = async (id: string) => {
    if (plan === "free") {
      toast.error("Free plan users cannot delete proposals. Upgrade to Pro to manage your proposals.");
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

  const stats = [
    { label: "Total Proposals", value: totalProposals.toString(), icon: FileText, color: "text-primary" },
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

  const canCreateProposal = plan !== "free" || totalProposals < 3;

  return (
    <AuthLayout>
      {showOnboarding && (
        <OnboardingModal displayName={displayName} onComplete={() => setShowOnboarding(false)} />
      )}
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold">
            {getGreeting()}, {displayName} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's your proposal overview.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))
            : stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </span>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className="font-display text-2xl font-bold text-card-foreground">
                    {stat.value}
                  </div>
                </motion.div>
              ))}
        </div>

        {/* Free Plan Usage Bar */}
        {plan === "free" && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-card-foreground">Free Plan Usage</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {Math.min(totalProposals, 3)} / 3 proposals
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totalProposals / 3) * 100, 100)}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  totalProposals >= 3 ? "bg-destructive" : "bg-primary"
                }`}
              />
            </div>
            {totalProposals >= 3 ? (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-destructive font-medium">
                  Limit reached — upgrade to continue generating proposals
                </p>
                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => navigate("/settings")}
                  className="gap-1 text-xs"
                >
                  Upgrade to Pro
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                {3 - totalProposals} proposal{3 - totalProposals !== 1 ? "s" : ""} remaining on your free plan
              </p>
            )}
          </motion.div>
        )}

        {/* Quick Action */}
        <Button
          variant="hero"
          size="lg"
          className="w-full mb-8 gap-2"
          onClick={() => {
            if (!canCreateProposal) {
              toast.error("You've used all 3 free proposals. Upgrade to Pro for unlimited access.");
              navigate("/settings");
              return;
            }
            navigate("/generate");
          }}
        >
          <Plus className="h-5 w-5" /> New Proposal
        </Button>

        {selectedProposal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex gap-2 flex-wrap">
              <Button variant="ghost" onClick={() => setSelectedProposal(null)} className="gap-2">
                ← Back to list
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => exportProposalAsPdf(selectedProposal.title, selectedProposal.generated_content)}
              >
                <Download className="h-4 w-4" /> Export PDF
              </Button>
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
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Recent Proposals
              </h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : proposals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 rounded-xl border border-dashed border-border"
              >
                <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="font-display text-xl font-semibold mb-2">No proposals yet</h2>
                <p className="text-muted-foreground mb-6">
                  Generate your first AI proposal in under 60 seconds.
                </p>
                <Button variant="hero" onClick={() => navigate("/generate")} className="gap-2">
                  <Plus className="h-4 w-4" /> Create Your First Proposal
                </Button>
              </motion.div>
            ) : (
              <div className="grid gap-3">
                {proposals.slice(0, 10).map((proposal, i) => (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="rounded-xl border border-border bg-card p-4 flex items-center justify-between hover:border-primary/20 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-card-foreground truncate text-sm">
                        {proposal.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        {proposal.client_name && <span>{proposal.client_name}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(proposal.created_at).toLocaleDateString()}
                        </span>
                        <span className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[proposal.status] || "bg-secondary text-muted-foreground"}`}>
                          {proposal.status}
                        </span>
                        {proposal.proposal_mode && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            proposal.proposal_mode === "sales_pitch"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-muted-foreground"
                          }`}>
                            {proposal.proposal_mode === "sales_pitch" ? "🎯 Sales Pitch" : "📄 Formal"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedProposal(proposal)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {proposal.public_slug && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/p/${proposal.public_slug}`);
                            toast.success("Client link copied! 🔗");
                          }}
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                      )}
                      {plan === "free" ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground/40 cursor-not-allowed"
                              disabled
                            >
                              <Lock className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Upgrade to Pro to delete proposals</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteProposal(proposal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AuthLayout>
  );
}
