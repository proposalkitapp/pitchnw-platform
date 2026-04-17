"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  BarChart2, Users, FileText, Shield, Search, Loader2,
} from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ totalUsers: 0, totalProposals: 0, proUsers: 0, standardUsers: 0 });

  useEffect(() => {
    if (user) checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user!.id)
      .single();

    if (!data?.is_admin) {
      navigate("/dashboard");
      return;
    }
    setIsAdmin(true);
    fetchAll();
  };

  const fetchAll = async () => {
    if (!user?.id) return;
    
    try {
      const [{ data: profileData, error: profError }, { data: proposalData, error: propError }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("proposals").select("id, title, client_name, status, created_at, user_id"),
      ]);

      if ((profError || propError) && user?.id) {
        console.error("Admin fetch error:", profError || propError);
        toast.error("Failed to load admin data");
      } else {
        const profs = profileData || [];
        const props = proposalData || [];

        setUsers(profs);
        setProposals(props);
        setStats({
          totalUsers: profs.length,
          totalProposals: props.length,
          proUsers: profs.filter((p: any) => p.plan === "pro").length,
          standardUsers: profs.filter((p: any) => p.plan === "standard").length,
        });
      }
    } catch (err) {
      console.error("Admin fetch all error:", err);
    } finally {
      setLoading(false);
    }
  };



  if (isAdmin === null) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthLayout>
    );
  }

  const filteredUsers = users.filter((u) =>
    (u.display_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.user_id || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const planBadge = (plan: string) => {
    const colors: Record<string, string> = {
      free: "bg-secondary text-muted-foreground",
      pro: "bg-primary/10 text-primary",
      standard: "bg-warning/10 text-warning",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${colors[plan] || colors.free}`}>
        {plan}
      </span>
    );
  };

  const overviewStats = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Total Proposals", value: stats.totalProposals, icon: FileText, color: "text-success" },
    { label: "Pro Users", value: stats.proUsers, icon: Shield, color: "text-primary" },
    { label: "Standard Users", value: stats.standardUsers, icon: Shield, color: "text-warning" },
  ];

  return (
    <AuthLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning/20">
              Admin
            </span>
          </div>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="proposals">Proposals</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
                : overviewStats.map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-warning/20 bg-card p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                      <div className="font-display text-2xl font-bold text-card-foreground">{stat.value}</div>
                    </motion.div>
                  ))}
            </div>

            {/* Recent Signups */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-display text-lg font-semibold text-card-foreground">Recent Signups</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Proposals</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.slice(0, 10).map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-card-foreground">{u.display_name || "—"}</TableCell>
                      <TableCell>{planBadge(u.plan)}</TableCell>
                      <TableCell>{proposals.filter((p) => p.user_id === u.user_id).length}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Proposals</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-card-foreground">{u.display_name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.company_name || "—"}</TableCell>
                      <TableCell>{planBadge(u.plan)}</TableCell>
                      <TableCell>{proposals.filter((p) => p.user_id === u.user_id).length}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Proposals */}
          <TabsContent value="proposals">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-card-foreground">{p.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.client_name || "—"}</TableCell>
                      <TableCell>
                        <span className={`capitalize px-2.5 py-1 rounded-full text-xs font-medium ${
                          p.status === "won" ? "bg-success/10 text-success" :
                          p.status === "lost" ? "bg-destructive/10 text-destructive" :
                          p.status === "sent" ? "bg-blue-500/10 text-blue-400" :
                          "bg-secondary text-muted-foreground"
                        }`}>{p.status}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthLayout>
  );
}
