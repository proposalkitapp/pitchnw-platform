'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  Play, 
  Zap, 
  Shield, 
  Star,
  Users,
  BarChart3,
  Target,
  Layers,
  MousePointer2
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ClayCard } from '@/components/ui/ClayCard'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayBadge } from '@/components/ui/ClayBadge'

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-primary/30 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl shadow-glow">P</div>
              <span className="text-xl font-black tracking-tighter">pitchnw</span>
           </div>
           
           <div className="hidden md:flex items-center gap-10">
              {['Features', 'Pricing', 'Pipeline', 'Showcase'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                  {item}
                </a>
              ))}
           </div>

           <div className="flex items-center gap-4">
              <Link href="/login" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors px-6">Login</Link>
              <ClayButton onClick={() => router.push('/signup')} className="bg-white text-slate-900 hover:bg-slate-100 h-10 px-6 rounded-xl shadow-glow">
                 Join the Waitlist
              </ClayButton>
           </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 overflow-hidden">
         {/* Background Orbs */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
            <div className="absolute top-1/4 left-1/4 w-[40%] h-[40%] bg-primary/20 blur-[150px] rounded-full animate-pulse" />
            <div className="absolute top-1/3 right-1/4 w-[30%] h-[30%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
         </div>

         <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
               <ClayBadge variant="info" className="bg-white/5 border-white/10 text-white animate-bounce">
                  <Sparkles className="h-3 w-3 mr-2 text-primary" /> NEW: Claude 3.5 Sonnet Integration
               </ClayBadge>
               <h1 className="text-7xl md:text-8xl lg:text-[120px] font-black tracking-tighter leading-[0.9] text-white">
                  Win the Deal. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-accent">Faster than AI.</span>
               </h1>
               <p className="max-w-2xl mx-auto text-slate-400 font-medium text-lg md:text-xl leading-relaxed">
                  The world's first claymorphic proposal engine. Build cinematic pitch decks, track client intent in real-time, and close high-value deals with AI-driven strategy.
               </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col md:flex-row items-center justify-center gap-6"
            >
               <ClayButton size="lg" className="h-20 px-12 rounded-[2rem] text-xl bg-primary hover:bg-primary/90 shadow-glow group" onClick={() => router.push('/signup')}>
                  Start Building for Free <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
               </ClayButton>
               <ClayButton variant="secondary" size="lg" className="h-20 px-12 rounded-[2rem] text-xl bg-white/5 border-white/10 text-white hover:bg-white/10">
                  <Play className="mr-3 h-5 w-5 fill-current" /> Watch Demo
               </ClayButton>
            </motion.div>

            {/* Hero Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="pt-20 relative group"
            >
               <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-0 group-hover:opacity-40 transition-opacity duration-1000" />
               <div className="relative rounded-[3rem] border-[10px] border-white/5 bg-[#0f0f18] shadow-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9]">
                  <img src="/assets/dashboard-preview.png" alt="Dashboard" className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
                  
                  {/* Floating Elements */}
                  <div className="absolute top-1/4 right-10 md:right-20 animate-float">
                     <ClayCard className="p-6 bg-white/10 backdrop-blur-xl border-white/10 shadow-2xl">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                              <CheckCircle className="h-6 w-6" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase text-slate-400">Status</p>
                              <p className="text-sm font-bold">Proposal Signed</p>
                           </div>
                        </div>
                     </ClayCard>
                  </div>
               </div>
            </motion.div>
         </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-32 relative">
         <div className="max-w-7xl mx-auto px-6 space-y-20">
            <div className="text-center space-y-4">
               <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Everything to <span className="text-primary">Scale</span></h2>
               <p className="text-slate-400 font-medium text-lg">Four specialized engines in one unified workspace.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {[
                 { title: "AI Generator", desc: "Build complete proposals from a single prompt.", icon: Sparkles, color: "text-blue-400" },
                 { title: "CRM Pipeline", desc: "Drag-and-drop deals through custom stages.", icon: Layers, color: "text-indigo-400" },
                 { title: "Strategy Coach", desc: "Get AI feedback on your pitch win-rate.", icon: Target, color: "text-primary" },
                 { title: "Analytics", desc: "Track exactly when clients open your link.", icon: BarChart3, color: "text-accent" }
               ].map((feat, i) => (
                 <motion.div
                   key={feat.title}
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.1 }}
                   viewport={{ once: true }}
                 >
                   <ClayCard className="p-10 h-full bg-white/5 border-white/10 hover:border-primary/50 group transition-all">
                      <div className={cn("h-16 w-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6 transition-transform group-hover:scale-110", feat.color)}>
                         <feat.icon className="h-8 w-8" />
                      </div>
                      <h3 className="text-2xl font-black mb-3">{feat.title}</h3>
                      <p className="text-slate-400 font-medium leading-relaxed">{feat.desc}</p>
                   </ClayCard>
                 </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* Interactive Pipeline Showcase */}
      <section className="py-32 bg-white/5 relative">
         <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 space-y-8">
               <ClayBadge variant="info" className="bg-primary/20 text-primary border-primary/20">The Workflow</ClayBadge>
               <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                  A Deal Pipeline <br />
                  <span className="text-slate-500">That Lives.</span>
               </h2>
               <p className="text-slate-400 font-medium text-xl leading-relaxed">
                  Most CRM tools are static databases. Pitchnw is a living organism. When a client scrolls to your pricing section, your dashboard updates. When they sign, your legal assets are locked.
               </p>
               <div className="space-y-4">
                  {[
                    "Intent Tracking: Know what they read",
                    "Automated Follow-ups",
                    "Legal Grade Signatures",
                    "Zero-Latency Dashboard"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <CheckCircle className="h-5 w-5 text-emerald-500" />
                       <span className="font-bold text-slate-300">{item}</span>
                    </div>
                  ))}
               </div>
            </div>
            
            <div className="flex-1 relative">
               <ClayCard className="p-10 bg-slate-900 border-white/10 shadow-3xl rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="space-y-6">
                     <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black">Deal Pipeline</h3>
                        <Users className="h-5 w-5 text-slate-500" />
                     </div>
                     <div className="space-y-4">
                        {[
                          { name: "Acme Branding", amount: "$12,000", stage: "sent" },
                          { name: "Tesla Re-design", amount: "$45,000", stage: "viewed" },
                          { name: "Nike Campaign", amount: "$30,000", stage: "signed" }
                        ].map((deal, i) => (
                          <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-[10px] font-black">
                                   {deal.name[0]}
                                </div>
                                <div>
                                   <p className="text-xs font-bold">{deal.name}</p>
                                   <p className="text-[10px] font-black text-slate-500 uppercase">{deal.amount}</p>
                                </div>
                             </div>
                             <ClayBadge variant={deal.stage === 'signed' ? 'success' : deal.stage === 'viewed' ? 'info' : 'secondary'}>
                                {deal.stage}
                             </ClayBadge>
                          </div>
                        ))}
                     </div>
                  </div>
               </ClayCard>
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="py-48 text-center relative overflow-hidden">
         <div className="absolute inset-0 bg-primary/5 -z-10" />
         <div className="max-w-4xl mx-auto px-6 space-y-12">
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
               Stop Pitching. <br />
               <span className="text-primary">Start Winning.</span>
            </h2>
            <p className="text-slate-400 font-medium text-xl">
               Join 2,000+ top freelancers and agencies who have switched to the future of sales.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
               <ClayButton size="lg" className="h-20 px-12 rounded-[2rem] text-xl shadow-glow" onClick={() => router.push('/signup')}>
                  Create Your Studio Free
               </ClayButton>
               <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-12 w-12 rounded-full border-4 border-[#0a0a0f] bg-slate-800 overflow-hidden">
                       <img src={`https://i.pravatar.cc/150?u=${i}`} alt="User" />
                    </div>
                  ))}
                  <div className="h-12 w-12 rounded-full border-4 border-[#0a0a0f] bg-primary flex items-center justify-center text-[10px] font-black">
                     +2K
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-4">
               <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-black">P</div>
                  <span className="text-lg font-black tracking-tighter">pitchnw</span>
               </div>
               <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  The cinematic sales platform for the next generation of creative entrepreneurs.
               </p>
            </div>
            
            {[
              { title: "Product", links: ["Features", "Pipeline", "Analytics", "Pricing"] },
              { title: "Company", links: ["About", "Careers", "Contact", "Media Kit"] },
              { title: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] }
            ].map(col => (
              <div key={col.title} className="space-y-6">
                 <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">{col.title}</h4>
                 <ul className="space-y-3">
                    {col.links.map(link => (
                      <li key={link}>
                         <Link href={`/${link.toLowerCase()}`} className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">{link}</Link>
                      </li>
                    ))}
                 </ul>
              </div>
            ))}
         </div>
         <div className="max-w-7xl mx-auto px-6 pt-20 flex flex-col md:flex-row items-center justify-between gap-6 opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">© 2026 Pitchnw Technologies Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
               <Shield className="h-4 w-4" />
               <MousePointer2 className="h-4 w-4" />
               <Zap className="h-4 w-4" />
            </div>
         </div>
      </footer>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
