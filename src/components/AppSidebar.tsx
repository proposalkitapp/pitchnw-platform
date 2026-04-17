"use client";

import { LayoutDashboard, FileText, Plus, Settings, LogOut, Store, Kanban, Shield, Brain, Lock, Target } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
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
  { title: "My Pitches", url: "/proposals", icon: FileText },
  { title: "New Pitch", url: "/generate", icon: Plus },
  { title: "Marketplace", url: "/marketplace", icon: Store },
];

const proNavItems = [
  { title: "CRM Pipeline", url: "/crm", icon: Kanban, pro: true },
  { title: "Strategic Coach", url: "/coach", icon: Brain, pro: true },
  { title: "Pitch Analysis", url: "/proposals", icon: Target, pro: true }, // Re-using proposals but can be focused analysis
];


export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation().pathname;
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();

  const isFreelancer = profile?.plan === "pro";
  const displayName = profile?.display_name || profile?.username || user?.email?.split("@")[0] || "User";
  const isAdmin = profile?.is_admin || false;

  return (
    <Sidebar collapsible="icon" className="border-r-0 dark bg-[#08080C] text-slate-200">
      <SidebarContent className="bg-[#08080C]">
        <SidebarGroup>
          <div className="flex items-center gap-2 px-6 py-8 mb-4">
            <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
              <img
                src={pitchnwLogo}
                alt="Pitchnw"
                className={`${collapsed ? "h-10" : "h-14"} w-auto object-contain filter brightness-0 invert`}
              />
            </a>
          </div>

          <SidebarGroupContent className="px-3">
            <SidebarMenu className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} className="px-3 py-6 rounded-xl transition-all duration-200">
                      <NavLink
                        to={item.url}
                        end
                        className="text-slate-400 hover:text-white hover:bg-white/5"
                        activeClassName="bg-[#0033ff] text-white font-medium hover:bg-[#0033ff]/90 shadow-[0_4px_14px_0_rgba(0,51,255,0.39)] hover:text-white"
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        {!collapsed && <span className="text-[15px] font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {/* Freelancer Items with Lock for Basic Users */}
              <div className="pt-4 pb-2">
                 {!collapsed && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-3 mb-2">Freelancer Tools</p>}
                 {proNavItems.map((item) => {
                   const isActive = location === item.url;
                   return (
                     <SidebarMenuItem key={item.title}>
                       <SidebarMenuButton 
                         asChild 
                         isActive={isActive} 
                         className="px-3 py-6 rounded-xl transition-all duration-200"
                         onClick={() => !isFreelancer && navigate('/checkout')}
                       >
                         <div className={`flex items-center w-full cursor-pointer ${isFreelancer ? 'text-slate-400 hover:text-white' : 'text-slate-600'}`}>
                           <NavLink
                             to={isFreelancer ? item.url : "#"}
                             end
                             className="flex items-center w-full"
                             activeClassName={isFreelancer ? "bg-purple-600 text-white font-medium shadow-[0_4px_14px_0_rgba(168,85,247,0.39)]" : ""}
                             onClick={(e) => !isFreelancer && e.preventDefault()}
                           >
                              {isFreelancer ? <item.icon className="h-5 w-5 mr-3" /> : <Lock className="h-5 w-5 mr-3 text-slate-600" />}
                              {!collapsed && (
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-[15px] font-medium">{item.title}</span>
                                  {!isFreelancer && <Lock className="h-3 w-3 opacity-40" />}
                                </div>
                              )}
                           </NavLink>
                         </div>
                       </SidebarMenuButton>
                     </SidebarMenuItem>
                   );
                 })}
              </div>
            </SidebarMenu>

            {isAdmin && (
              <SidebarMenu className="mt-6 border-t border-white/5 pt-4">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/admin"} className="px-3 py-6 rounded-xl transition-all duration-200">
                    <NavLink to="/admin" end className="text-slate-400 hover:text-white hover:bg-white/5" activeClassName="bg-amber-600 text-white font-medium">
                      <Shield className="h-5 w-5 mr-3" />
                      {!collapsed && <span className="text-[15px] font-medium">Admin Access</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-[#08080C] px-3 pb-8 border-t border-white/5 pt-6">
        <div className={`px-4 py-4 mb-4 bg-white/5 rounded-2xl border border-white/5 ${collapsed ? "flex justify-center" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border border-white/10 shrink-0">
               <span className="text-xs font-bold text-white">{displayName.charAt(0).toUpperCase()}</span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{displayName}</p>
                <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                  isFreelancer ? "bg-purple-500/20 text-purple-400" :
                  "bg-slate-500/20 text-slate-400"
                }`}>
                  {isFreelancer ? "Freelancer" : "Basic"}
                </span>
              </div>
            )}
          </div>
          
          {!collapsed && !isFreelancer && (
            <button 
              onClick={() => navigate('/checkout')}
              className="w-full mt-4 py-2.5 rounded-xl bg-purple-600 text-white text-[11px] font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/20"
            >
              Get Freelancer Access
            </button>
          )}
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
             <button
               onClick={() => signOut().then(() => navigate('/'))}
               className={`w-full flex items-center ${collapsed ? 'justify-center py-3' : 'px-4 py-3'} rounded-xl bg-[#0033ff]/10 text-[#0033ff] hover:bg-[#0033ff]/20 transition-all duration-200 font-bold border border-[#0033ff]/20`}
             >
               <LogOut className={`h-5 w-5 ${!collapsed && "mr-3"}`} />
               {!collapsed && <span className="text-sm">Logout</span>}
             </button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
