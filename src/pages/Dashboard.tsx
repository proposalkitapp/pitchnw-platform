import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Trash2, Clock, Eye } from "lucide-react";
import { toast } from "sonner";

interface Proposal {
  id: string;
  title: string;
  client_name: string | null;
  status: string;
  created_at: string;
  generated_content: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchProposals();
  }, [user]);

  const fetchProposals = async () => {
    const { data, error } = await supabase
      .from("proposals")
      .select("id, title, client_name, status, created_at, generated_content")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load proposals");
    } else {
      setProposals(data || []);
    }
    setLoading(false);
  };

  const deleteProposal = async (id: string) => {
    const { error } = await supabase.from("proposals").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete proposal");
    } else {
      setProposals((prev) => prev.filter((p) => p.id !== id));
      if (selectedProposal?.id === id) setSelectedProposal(null);
      toast.success("Proposal deleted");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="font-display text-3xl font-bold">My Proposals</h1>
              <p className="text-muted-foreground mt-1">
                {proposals.length} proposal{proposals.length !== 1 ? "s" : ""} saved
              </p>
            </div>
            <Button variant="hero" onClick={() => navigate("/generate")} className="gap-2">
              <Plus className="h-4 w-4" /> New Proposal
            </Button>
          </motion.div>

          {selectedProposal ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <Button variant="ghost" onClick={() => setSelectedProposal(null)} className="gap-2">
                ← Back to list
              </Button>
              <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
                <h2 className="font-display text-xl font-semibold mb-4 text-card-foreground">
                  {selectedProposal.title}
                </h2>
                <pre className="whitespace-pre-wrap font-body text-sm text-card-foreground leading-relaxed">
                  {selectedProposal.generated_content}
                </pre>
              </div>
            </motion.div>
          ) : proposals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="font-display text-xl font-semibold mb-2">No proposals yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first AI-generated proposal to get started.
              </p>
              <Button variant="hero" onClick={() => navigate("/generate")} className="gap-2">
                <Plus className="h-4 w-4" /> Create Proposal
              </Button>
            </motion.div>
          ) : (
            <div className="grid gap-4">
              {proposals.map((proposal, i) => (
                <motion.div
                  key={proposal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card p-5 flex items-center justify-between hover:border-primary/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-card-foreground truncate">
                      {proposal.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                      {proposal.client_name && <span>{proposal.client_name}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(proposal.created_at).toLocaleDateString()}
                      </span>
                      <span className="capitalize px-2 py-0.5 rounded-full bg-secondary text-xs">
                        {proposal.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedProposal(proposal)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteProposal(proposal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
