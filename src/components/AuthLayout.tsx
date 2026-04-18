"use client";

import { useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useTheme } from "@/hooks/use-theme";
import { 
  Search, User as UserIcon, Sparkles, ChevronDown, 
  Settings as SettingsIcon, CreditCard, LogOut 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import pitchnwLogo from "@/assets/pitchnw-logo.png";
import { LiquidGlassToggle } from "@/components/LiquidGlassToggle";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-[#0033ff] border-t-transparent animate-spin" />
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Initialising Pitchnw</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.display_name || profile?.username || user.email?.split('@')[0] || "User";
  const plan = profile?.plan ?? null;
  const isFreelancer = plan === "pro";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/20 font-body">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-24 flex items-center justify-between border-b border-border px-8 bg-background/80 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center gap-6">
              <SidebarTrigger className="text-muted-foreground hover:text-[#0033ff] transition-colors" />
              <img src={pitchnwLogo} alt="Pitchnw" className="h-12 w-auto object-contain md:hidden" />
              <div className="hidden lg:flex items-center max-w-sm w-full bg-muted rounded-2xl px-4 py-2.5 border border-border group focus-within:border-[#0033ff]/30 transition-all">
                <Search className="mr-3 h-4 w-4 text-muted-foreground/50 group-focus-within:text-[#0033ff] transition-colors" />
                <input type="text" placeholder="Search proposals, clients..." className="bg-transparent border-none outline-none text-[13px] w-full text-muted-foreground placeholder:text-muted-foreground" />
              </div>
            </div>
            
            <div className="flex items-center gap-5">
              {/* Toggle removed from here, now in settings */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 bg-background border border-border pl-4 pr-3 py-2 rounded-2xl cursor-pointer hover:bg-muted transition-all hover:shadow-sm group">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        {isFreelancer && <Sparkles className="h-3 w-3 text-purple-500 fill-purple-500" />}
                        <span className="text-[13px] font-bold truncate max-w-[140px] leading-tight text-foreground">{displayName}</span>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">Account Settings</span>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center border border-border shadow-inner group-hover:scale-95 transition-transform overflow-hidden relative">
                      {profile?.brand_logo_url ? (
                        <img src={profile.brand_logo_url} alt={displayName} className="h-full w-full object-cover" />
                      ) : (
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                      {isFreelancer && (
                        <div className="absolute inset-0 border-2 border-purple-500/20 rounded-xl pointer-events-none" />
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground/50 group-hover:text-slate-500 transition-colors" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-border shadow-xl">
                  <DropdownMenuLabel className="px-3 py-2">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Manage Account</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-muted" />
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="rounded-xl py-3 cursor-pointer gap-3 text-muted-foreground focus:bg-muted focus:text-[#0033ff]">
                    <SettingsIcon className="h-4 w-4" />
                    <span className="font-semibold">Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings?tab=billing")} className="rounded-xl py-3 cursor-pointer gap-3 text-muted-foreground focus:bg-muted focus:text-[#0033ff]">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-semibold">Billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-muted" />
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-xl py-3 cursor-pointer gap-3 text-red-500 focus:bg-red-50 focus:text-red-600">
                    <LogOut className="h-4 w-4" />
                    <span className="font-semibold">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-secondary/20">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
