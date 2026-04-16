"use client";

import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Search, User as UserIcon, Sparkles } from "lucide-react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const [displayName, setDisplayName] = useState<string>("");
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      supabase
        .from("profiles")
        .select("display_name, username, plan")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setDisplayName(data?.display_name || data?.username || user.email?.split('@')[0] || "User");
          setPlan(data?.plan ?? null);
        });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-[#0033ff] border-t-transparent animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Initialising Pitchnw</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#F8FAFC] font-body">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-20 flex items-center justify-between border-b border-slate-100 px-8 bg-white/80 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center flex-1 gap-6">
              <SidebarTrigger className="text-slate-400 hover:text-[#0033ff] transition-colors" />
              <div className="hidden lg:flex items-center max-w-sm w-full bg-slate-50 rounded-2xl px-4 py-2.5 border border-slate-100 group focus-within:border-[#0033ff]/30 transition-all">
                <Search className="mr-3 h-4 w-4 text-slate-300 group-focus-within:text-[#0033ff] transition-colors" />
                <input type="text" placeholder="Search proposals, clients..." className="bg-transparent border-none outline-none text-[13px] w-full text-slate-600 placeholder:text-slate-400" />
              </div>
            </div>
            
            <div className="flex items-center gap-5">
              <div 
                className="flex items-center gap-3 bg-[#08080F] text-white pl-5 pr-2 py-2 rounded-[20px] cursor-pointer hover:bg-black transition-all hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)] group"
                onClick={() => navigate("/settings")}
              >
                <div className="flex flex-col items-end">
                  <span className="text-[13px] font-bold truncate max-w-[140px] leading-tight">{displayName.toUpperCase()}</span>
                  <div className="flex items-center gap-1.5">
                    {plan === 'pro' && (
                      <span className="text-[9px] font-black text-[#A855F7] bg-[#A855F7]/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                         <Sparkles className="h-2.5 w-2.5" /> PRO
                      </span>
                    )}
                    <span className="text-[10px] font-medium text-slate-500 group-hover:text-slate-300 transition-colors">Settings</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-95 transition-transform">
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-[#F8FAFC]">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
