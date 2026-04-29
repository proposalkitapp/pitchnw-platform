'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText, 
  Plus, 
  Settings, 
  LogOut, 
  Kanban, 
  Shield, 
  Brain, 
  Lock, 
  Presentation 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Pitches", url: "/proposals", icon: FileText },
  { title: "New Pitch", url: "/proposals/new", icon: Plus },
]

const proNavItems = [
  { title: "CRM Pipeline", url: "/crm", icon: Kanban },
  { title: "Strategy Coach", url: "/strategy", icon: Brain },
  { title: "Pitch Decks", url: "/decks/new", icon: Presentation },
]

export const Sidebar = () => {
  const pathname = usePathname()
  const supabase = createClient()
  const { user } = useAuth()
  const { data: profile, isPro } = useProfile(user?.id)

  const isInvestor = (profile as any)?.role === 'investor'
  const displayName = (profile as any)?.display_name || user?.email?.split('@')[0] || "User"

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <aside className="w-72 h-screen fixed left-0 top-0 bg-sidebar/80 backdrop-blur-xl border-r border-white/20 flex flex-col p-6 z-50">
      <div className="flex items-center gap-2 mb-10 px-2">
        <Link href="/dashboard">
          <img src="/assets/logo.png" alt="Pitchnw" className="h-12 w-auto" />
        </Link>
      </div>

      <nav className="flex-1 space-y-1">
        {isInvestor ? (
          <>
            <NavItem 
              href="/investor/dashboard" 
              icon={LayoutDashboard} 
              title="Pipeline" 
              active={pathname === '/investor/dashboard'} 
            />
            <NavItem 
              href="/settings" 
              icon={Settings} 
              title="Settings" 
              active={pathname === '/settings'} 
            />
          </>
        ) : (
          <>
            {navItems.map((item) => (
              <NavItem 
                key={item.url}
                href={item.url} 
                icon={item.icon} 
                title={item.title} 
                active={pathname === item.url} 
              />
            ))}

            <div className="pt-6 pb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-3 mb-4">
                Freelancer Tools
              </p>
              {proNavItems.map((item) => (
                <NavItem 
                  key={item.url}
                  href={isPro ? item.url : "/checkout"} 
                  icon={isPro ? item.icon : Lock} 
                  title={item.title} 
                  active={pathname === item.url} 
                  locked={!isPro}
                />
              ))}
            </div>
          </>
        )}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="p-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/40 shadow-clay flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold shadow-lg">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{displayName}</p>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
              isInvestor ? "bg-blue-100 text-blue-600" :
              isPro ? "bg-purple-100 text-purple-600" :
              "bg-slate-100 text-slate-600"
            )}>
              {isInvestor ? "Investor" : isPro ? "Pro" : "Basic"}
            </span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center px-4 py-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all font-bold border border-primary/20"
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  )
}

const NavItem = ({ href, icon: Icon, title, active, locked }: any) => (
  <Link 
    href={href}
    className={cn(
      "flex items-center px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-primary text-white shadow-clay-primary font-bold" 
        : "text-slate-500 hover:bg-white/50 hover:text-slate-800",
      locked && "opacity-60"
    )}
  >
    <Icon className={cn("h-5 w-5 mr-3", active ? "text-white" : "text-slate-400 group-hover:text-primary")} />
    <span className="text-[15px]">{title}</span>
    {locked && <Lock className="h-3 w-3 ml-auto opacity-40" />}
  </Link>
)
