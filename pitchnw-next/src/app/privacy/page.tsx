'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Lock, Eye, Database } from 'lucide-react'
import { ClayCard } from '@/components/ui/ClayCard'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-12"
      >
        <header className="space-y-6">
           <Link 
             href="/"
             className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-all"
           >
             <ArrowLeft className="h-4 w-4" /> Return Home
           </Link>
           <h1 className="text-6xl font-black text-slate-900 tracking-tighter">Privacy <span className="text-primary">Protocol</span></h1>
           <p className="text-slate-500 font-medium text-lg">Last Updated: {new Date().toLocaleDateString()}</p>
        </header>

        <ClayCard className="p-10 md:p-16 space-y-12 prose prose-slate max-w-none shadow-2xl">
           <section className="space-y-4">
              <div className="flex items-center gap-3 text-primary">
                 <ShieldCheck className="h-6 w-6" />
                 <h2 className="text-xl font-black uppercase tracking-widest m-0">Commitment</h2>
              </div>
              <p className="text-slate-600 font-medium leading-relaxed">
                 At Pitchnw, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our application and website.
              </p>
           </section>

           <section className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                 <Database className="h-6 w-6" />
                 <h2 className="text-xl font-black uppercase tracking-widest m-0">1. Data Collection</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                 <div className="p-6 rounded-3xl bg-slate-50 border border-white">
                    <p className="text-sm font-black text-slate-900 mb-2">Personal Data</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Name, email, company brand assets, and authentication identifiers used to secure your workspace.</p>
                 </div>
                 <div className="p-6 rounded-3xl bg-slate-50 border border-white">
                    <p className="text-sm font-black text-slate-900 mb-2">Proposal Intel</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Client data, project scopes, and AI-generated outputs used to provide core platform services.</p>
                 </div>
              </div>
           </section>

           <section className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                 <Lock className="h-6 w-6" />
                 <h2 className="text-xl font-black uppercase tracking-widest m-0">2. Security Ops</h2>
              </div>
              <p className="text-slate-600 font-medium leading-relaxed">
                 We use administrative, technical, and physical security measures to help protect your personal information. All API interactions (including payments and auth) are handled securely using encrypted communication channels.
              </p>
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-center gap-4">
                 <ShieldCheck className="h-6 w-6 text-emerald-500" />
                 <p className="text-xs font-bold text-emerald-900">Your data is encrypted at rest and in transit via Supabase Enterprise Security.</p>
              </div>
           </section>

           <footer className="pt-12 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-500">
                 If you have questions about this protocol, please contact <a href="mailto:support@pitchnw.app" className="text-primary font-black underline">support@pitchnw.app</a>.
              </p>
           </footer>
        </ClayCard>
      </motion.div>
    </div>
  )
}
