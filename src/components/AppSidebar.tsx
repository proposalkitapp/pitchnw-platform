"use client";

import { LayoutDashboard, FileText, Plus, Settings, LogOut, Store, Kanban, Shield } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import pitchnwLogo from "@/assets/pitchnw-logo.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "New Proposal", url: "/generate", icon: Plus },
  { title: "CRM Pipeline", url: "/crm", icon: Kanban },
  { title: "Marketplace", url: "/marketplace", icon: Store },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("display_name, is_admin, plan")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setDisplayName(data?.display_name || user.email?.split("@")[0] || "User");
          setIsAdmin(data?.is_admin || false);
          setPlan(data?.plan || "free");
        });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0 dark bg-black text-slate-200">
      <SidebarContent className="bg-black">
        <SidebarGroup>
          <div className="flex items-center gap-2 px-6 py-6 mb-4">
            <a href="/" onClick={(e) => { e.preventDefault(); router.push("/"); }}>
              <img
                src={pitchnwLogo.src || pitchnwLogo}
                alt="Pitchnw"
                className={`${collapsed ? "h-10" : "h-14"} w-auto object-contain filter brightness-0 invert`}
              />
            </a>
          </div>

          {!collapsed && displayName && (
            <div className="px-6 py-2 mb-4">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Hello,</p>
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            </div>
          )}

          <SidebarGroupContent className="px-3">
            <SidebarMenu className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} className="px-3 py-5 rounded-xl transition-all duration-200">
                      <NavLink
                        to={item.url}
                        end
                        className="text-slate-400 hover:text-white hover:bg-white/5"
                        activeClassName="bg-[#0033ff] text-white font-medium hover:bg-[#0033ff]/90 shadow-[0_4px_14px_0_rgba(0,51,255,0.39)] hover:text-white"
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            {isAdmin && (
              <SidebarMenu className="mt-6">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/admin"} className="px-3 py-5 rounded-xl transition-all duration-200">
                    <NavLink to="/admin" end className="text-slate-400 hover:text-white hover:bg-white/5" activeClassName="bg-amber-600 text-white font-medium">
                      <Shield className="h-5 w-5 mr-3" />
                      {!collapsed && <span className="text-sm">Admin Access</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-black px-3 pb-6 border-t border-white/10 pt-4">
        {!collapsed && (
          <div className="px-3 py-3 mb-3 bg-white/5 rounded-xl">
            <p className="text-[11px] text-slate-400 truncate mb-1">{user?.email}</p>
            <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
              plan === "standard" ? "bg-purple-500/20 text-purple-400" :
              "bg-amber-500/20 text-amber-500"
            }`}>
              {plan === "standard" ? "Standard Plan" : "Trial"}
            </span>
          </div>
        )}

        <SidebarMenu>
          <SidebarMenuItem>
             <button
               onClick={handleSignOut}
               className={`w-full flex items-center ${collapsed ? 'justify-center p-3' : 'px-4 py-3'} rounded-xl bg-[#0033ff] text-white hover:bg-[#002be6] transition-all duration-200 shadow-[0_4px_14px_0_rgba(0,51,255,0.39)] mt-2 font-medium`}
             >
               <LogOut className={`h-5 w-5 ${!collapsed && "mr-3"}`} />
               {!collapsed && <span>Logout</span>}
             </button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}