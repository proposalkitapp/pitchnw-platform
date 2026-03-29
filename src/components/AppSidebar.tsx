import { LayoutDashboard, FileText, Plus, Settings, LogOut, Store, Kanban, Shield } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import proposalLogo from "@/assets/proposal-logo.png";

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
  const location = useLocation();
  const navigate = useNavigate();
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
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-2 px-2 py-3 mb-2">
            <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
              <img
                src={proposalLogo}
                alt="ProposalKit"
                className={collapsed ? "h-10 w-auto" : "h-24 w-auto"}
              />
            </a>
          </div>

          {!collapsed && displayName && (
            <div className="px-3 py-2 mb-2">
              <p className="text-xs text-muted-foreground">Welcome,</p>
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            </div>
          )}

          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-muted/50"
                        activeClassName="bg-primary/10 text-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            {isAdmin && (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === "/admin"}>
                    <NavLink to="/admin" end className="hover:bg-warning/10" activeClassName="bg-warning/10 text-warning font-medium">
                      <Shield className="h-4 w-4" />
                      {!collapsed && <span>Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {!collapsed && (
          <div className="px-3 py-2 border-t border-border mt-1">
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            <span className={`inline-block mt-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
              plan === "pro" ? "bg-primary/10 text-primary" :
              plan === "standard" ? "bg-warning/10 text-warning" :
              "bg-secondary text-muted-foreground"
            }`}>
              {plan === "free" ? "Free Plan" : plan === "pro" ? "Pro Plan" : "Standard Plan"}
            </span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
