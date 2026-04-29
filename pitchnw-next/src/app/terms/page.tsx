'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Scale, Gavel, FileText, CheckCircle2 } from 'lucide-react'
import { ClayCard } from '@/components/ui/ClayCard'

export default function TermsOfServicePage() {
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
           <h1 className="text-6xl font-black text-slate-900 tracking-tighter">Terms of <span className="text-primary">Service</span></h1>
           <p className="text-slate-500 font-medium text-lg">Agreement Version: {new Date().toLocaleDateString()}</p>
        </header>

        <ClayCard className="p-10 md:p-16 space-y-12 prose prose-slate max-w-none shadow-2xl">
           <section className="space-y-4">
              <div className="flex items-center gap-3 text-primary">
                 <Scale className="h-6 w-6" />
                 <h2 className="text-xl font-black uppercase tracking-widest m-0">Agreement</h2>
              </div>
              <p className="text-slate-600 font-medium leading-relaxed">
                 By accessing or using Pitchnw, you agree to be bound by these terms. If you do not agree to these terms, please do not use our services.
              </p>
           </section>

           <section className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                 <Gavel className="h-6 w-6" />
                 <h2 className="text-xl font-black uppercase tracking-widest m-0">1. Proper Use</h2>
              </div>
              <div className="space-y-4">
                 <p className="text-slate-600 font-medium leading-relaxed m-0">
                    You are responsible for the content of your proposals. Pitchnw is a tool for professionals; any misuse for spam, fraudulent activities, or illegal purposes will result in immediate termination.
                 </p>
                 <ul className="grid md:grid-cols-2 gap-4 list-none p-0">
                    {[
                      "No automated scraping",
                      "No impersonation of others",
                      "No reverse engineering",
                      "Compliance with local laws"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-xl border border-white">
                         <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {item}
                      </li>
                    ))}
                 </ul>
              </div>
           </section>

           <section className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                 <FileText className="h-6 w-6" />
                 <h2 className="text-xl font-black uppercase tracking-widest m-0">2. Intellectual Property</h2>
              </div>
              <p className="text-slate-600 font-medium leading-relaxed">
                 You retain all rights to the data you input. Pitchnw retains all rights to the platform architecture, design, and AI-generation algorithms. We grant you a license to use the generated proposals for your business operations.
              </p>
           </section>

           <footer className="pt-12 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-500">
                 Need clarification? Reach out to our legal department at <a href="mailto:legal@pitchnw.app" className="text-primary font-black underline">legal@pitchnw.app</a>.
              </p>
           </footer>
        </ClayCard>
      </motion.div>
    </div>
  )
}
