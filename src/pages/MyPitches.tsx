import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, Search, Plus, Eye, 
  Trash2, Copy, ExternalLink, Filter,
  MoreVertical, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
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
  status: string;
  public_slug: string | null;
  created_at: string;
}

export default function MyPitches() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: proposals = [], isLoading, refetch } = useQuery({
    queryKey: ['proposals-library', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('id, title, client_name, project_type, status, public_slug, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Proposal[];
    },
    enabled: !!user?.id,
  });

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          (p.client_name?.toLowerCase() || "").includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const deleteProposal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pitch?")) return;
    
    const { error } = await supabase.from('proposals').delete().eq('id', id);
    if (error) {
      toast.error("Failed to delete pitch");
    } else {
      toast.success("Pitch deleted");
      refetch();
    }
  };

  const copyPublicLink = (slug: string | null) => {
    if (!slug) {
      toast.error("No public link available");
      return;
    }
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Public link copied!");
  };

  const statusColors: Record<string, string> = {
    draft: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    sent: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    opened: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    won: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    lost: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <AuthLayout>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 min-h-screen bg-[#08080F]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="font-display font-syne font-[800] text-[32px] text-white tracking-tight">My Pitch Library</h1>
            <p className="text-muted-foreground text-[16px]">Manage and access all your generated proposals.</p>
          </div>
          <Button 
            className="h-12 px-6 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2"
            onClick={() => navigate('/generate')}
          >
            <Plus className="h-5 w-5" /> New Pitch
          </Button>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-[#121225] p-4 rounded-2xl border border-white/5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search pitches by title or client..." 
              className="pl-10 h-11 bg-black/20 border-white/5 rounded-xl text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 bg-black/20 border-white/5 rounded-xl text-sm px-4 focus:ring-1 focus:ring-primary outline-none text-white min-w-[140px]"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="opened">Opened</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>

        {/* Library Table/List */}
        <div className="bg-[#121225] rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
          {isLoading ? (
            <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : filteredProposals.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <div className="h-20 w-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-white">No pitches found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {search || statusFilter !== 'all' 
                  ? "Try adjusting your filters to find what you're looking for." 
                  : "Start creating your first high-converting proposal today."}
              </p>
              {!search && statusFilter === 'all' && (
                <Button variant="outline" className="mt-4" onClick={() => navigate('/generate')}>Create First Pitch</Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-500">Proposal Details</th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-500">Industry / Type</th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-500">Status</th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProposals.map((p) => (
                    <tr key={p.id} className="group hover:bg-white/[0.01] transition-colors">
                      <td className="px-8 py-6 max-w-[300px]">
                        <div className="font-bold text-white text-[15px] mb-1 group-hover:text-primary transition-colors cursor-pointer truncate" onClick={() => navigate(`/proposals`)}>
                          {p.title}
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-slate-400">
                          <span className="truncate max-w-[120px]">{p.client_name || "No client specified"}</span>
                          <span className="h-1 w-1 rounded-full bg-white/10" />
                          <span>{format(new Date(p.created_at), "MMM d, yyyy")}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-[13px] text-slate-300 font-medium truncate max-w-[150px]">{p.project_type || "Standard Pitch"}</div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusColors[p.status] || statusColors.draft}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-slate-400 hover:text-white"
                            onClick={() => copyPublicLink(p.public_slug)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-[#1A1A32] border-white/10 text-white">
                              <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-white/5" onClick={() => navigate(`/proposals`)}>
                                <Eye className="h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-white/5" onClick={() => copyPublicLink(p.public_slug)}>
                                <ExternalLink className="h-4 w-4" /> Public Link
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-white/5 text-destructive focus:text-destructive" onClick={() => deleteProposal(p.id)}>
                                <Trash2 className="h-4 w-4" /> Delete Pitch
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
