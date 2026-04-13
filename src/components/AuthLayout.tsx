"use client";

import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      supabase
        .from("profiles")
        .select("display_name, username")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setDisplayName(data?.display_name || data?.username || user.email?.split('@')[0] || "User");
        });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between border-b border-[#E5E7EB] px-6 bg-white sticky top-0 z-40">
            <div className="flex items-center flex-1 gap-4">
              <SidebarTrigger className="text-slate-500 hover:text-[#0033ff]" />
              <div className="hidden sm:flex items-center max-w-md w-full bg-[#0033ff] rounded-full px-4 py-2 border border-[#0033ff]/50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" placeholder="Search" className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-white/70" />
              </div>
            </div>
            <div className="flex items-center gap-4">

              <div 
                className="flex items-center gap-3 bg-[#0033ff] text-white pl-4 pr-1.5 py-1.5 rounded-full ml-2 cursor-pointer hover:bg-[#002be6] transition-colors"
                onClick={() => navigate("/settings")}
                title="Settings"
              >
                <span className="text-sm font-semibold truncate max-w-[120px]">{displayName.toUpperCase()}</span>
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center border border-white/40">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
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
