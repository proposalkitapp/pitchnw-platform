"use client";

import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  Zap, 
  Brain, 
  Sparkles, 
  Eye, 
  BarChart3, 
  CheckCircle2, 
  Calendar,
  Lock,
  Search,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { type Profile } from "@/hooks/use-profile";
import { format } from "date-fns";

interface ProDashboardProps {
  profile: Profile;
  proposals: any[];
  isLoading: boolean;
}

export function ProDashboardView({ profile, proposals, isLoading }: ProDashboardProps) {
  const navigate = useNavigate();
  
  const stats = [
    { label: "Active Deals", value: proposals.filter(p => !['won', 'lost'].includes(p.status)).length, icon: BarChart3, trend: "+12%", color: "#0033ff" },
    { label: "Client Views", value: "128", icon: Eye, trend: "+24%", color: "#A855F7" },
    { label: "Win Rate", value: proposals.length > 0 ? `${Math.round((proposals.filter(p => p.status === 'won').length / proposals.length) * 100)}%` : "0%", icon: TrendingUp, trend: "+5%", color: "#22c55e" },
    { label: "Revenue Goal", value: "$45k", icon: ArrowUpRight, trend: "85%", color: "#F59E0B" },
  ];

  const recentProposals = proposals.slice(0, 4);

  return (
    <div className="space-y-10 pb-20 font-body">
      {/* Hero Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 py-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0033ff] bg-[#0033ff]/5 px-3 py-1.5 rounded-full">
              Professional Command Center
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 font-display tracking-tight leading-none mb-3">
             {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, {profile.display_name?.split(' ')[0] || 'Partner'}
          </h1>
          <p className="text-slate-500 font-medium">Your proposal ecosystem is thriving. You have <span className="text-slate-900 font-bold">12 unread client views</span> this week.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex gap-4"
        >
          <Button 
            className="h-14 px-8 rounded-[20px] bg-slate-900 text-white font-bold hover:bg-black transition-all shadow-xl shadow-slate-200 gap-3"
            onClick={() => navigate('/crm')}
          >
            <Users className="h-5 w-5 opacity-70" />
            Manage Sales
          </Button>
          <Button 
            className="h-14 px-8 rounded-[20px] bg-[#0033ff] text-white font-bold hover:bg-[#002be6] transition-all shadow-xl shadow-[#0033ff]/30 gap-3"
            onClick={() => navigate('/generate')}
          >
            <Plus className="h-5 w-5" />
            New Proposal
          </Button>
        </motion.div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] group hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-slate-50 group-hover:scale-110 transition-transform" style={{ color: stat.color }}>
                 <stat.icon className="h-6 w-6" />
              </div>
              <span className="text-[11px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">{stat.trend}</span>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
          </motion.div>
        ))}Stat
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Proposals & Pipeline */}
        <div className="xl:col-span-2 space-y-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 lg:p-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-900 tracking-tight font-display">Active Pipeline</h2>
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-xs font-bold text-[#0033ff] hover:underline uppercase tracking-widest"
              >
                View Archive →
              </button>
            </div>

            <div className="space-y-4">
              {recentProposals.map((prop, i) => (
                <div 
                  key={prop.id}
                  className="flex items-center justify-between p-5 rounded-[24px] border border-slate-50 hover:border-slate-100 hover:bg-slate-50 transition-all cursor-pointer group"
                  onClick={() => navigate('/dashboard')}
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                      <FileText className="h-5 w-5 text-slate-400 group-hover:text-[#0033ff] transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">{prop.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {prop.client_name} • {format(new Date(prop.created_at), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 ml-4">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide
                       ${prop.status === 'won' ? 'bg-emerald-50 text-emerald-600' : 
                         prop.status === 'opened' ? 'bg-amber-50 text-amber-600' :
                         'bg-slate-100 text-slate-500'}`}>
                       {prop.status}
                     </span>
                     <div className="h-8 w-8 rounded-full flex items-center justify-center bg-white border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="h-4 w-4 text-[#0033ff]" />
                     </div>
                  </div>
                </div>
              ))}
              
              {proposals.length === 0 && (
                <div className="text-center py-12">
                   <p className="text-slate-400 font-medium italic">No proposals in your pipeline yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Strategy Coach (Pro Only Feature) */}
          <div className="bg-gradient-to-br from-[#08080F] to-[#1A1A2E] rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Brain className="h-40 w-40" />
            </div>
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="space-y-4 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2">
                   <Sparkles className="h-4 w-4 text-[#4EEAA0]" />
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#4EEAA0]">AI Win-Rate Coach</span>
                </div>
                <h3 className="text-3xl font-black font-display tracking-tight max-w-md">Your proposals are 15% more effective than industry average.</h3>
                <p className="text-slate-400 font-medium max-w-md">Our algorithm has processed your last 5 wins. We've detected you excel in the 'Creative Design' sector. Focus on this for higher conversion.</p>
              </div>
              <Button className="h-16 px-10 rounded-[24px] bg-white text-black font-black text-lg hover:bg-slate-100 transition-all shadow-xl active:scale-95 shrink-0">
                Generate Strategy
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-8">
          {/* Quick Stats Widget */}
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
               <Clock className="h-5 w-5 text-indigo-500" />
               Daily Activity
            </h3>
            <div className="space-y-6">
               {[
                 { label: "Design Blueprint sent", time: "2h ago", icon: CheckCircle2, sub: "to Acme Corp" },
                 { label: "Client opened proposal", time: "5h ago", icon: Eye, sub: "Website Redesign" },
                 { label: "Strategy meeting", time: "Tomorrow", icon: Calendar, sub: "@ 10:00 AM" },
               ].map((act, i) => (
                 <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                       <act.icon className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-tight">{act.label}</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{act.sub} • {act.time}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          {/* Premium Marketplace Preview */}
          <div className="bg-[#0033ff] rounded-[40px] p-8 text-white group cursor-pointer overflow-hidden shadow-xl" onClick={() => navigate('/marketplace')}>
            <div className="flex items-start justify-between mb-8">
               <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
               </div>
               <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
            <h3 className="text-xl font-black mb-2 tracking-tight leading-none">Unlock Premium Templates</h3>
            <p className="text-white/60 text-xs font-medium leading-relaxed mb-6">Access our "High-Conversion" collection designed for 7-figure deals.</p>
            <div className="flex items-center gap-2">
               <div className="h-8 w-8 rounded-full bg-white/20 border border-white/20" />
               <div className="h-8 w-8 rounded-full bg-white/20 border border-white/20 -ml-4" />
               <div className="h-8 w-8 rounded-full bg-white/20 border border-white/20 -ml-4" />
               <span className="text-[10px] font-bold ml-2">50+ Premium Designs</span>
            </div>
          </div>

          {/* Customer Success Widget */}
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 flex flex-col items-center text-center">
             <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-emerald-500" />
             </div>
             <h4 className="font-black text-slate-900 mb-1">Elite Support</h4>
             <p className="text-xs text-slate-500 font-medium mb-4">Your personal strategist is online.</p>
             <Button variant="outline" className="h-10 rounded-xl w-full text-xs font-bold border-slate-100 text-slate-700">
                Chat with Specialist
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
