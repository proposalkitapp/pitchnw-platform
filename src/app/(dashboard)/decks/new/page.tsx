'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Loader2, 
  Plus, 
  MonitorPlay, 
  Save, 
  Presentation, 
  FileText, 
  Image as ImageIcon, 
  Layout, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Video,
  Mic,
  Palette
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { ClayCard } from '@/components/ui/ClayCard'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayInput } from '@/components/ui/ClayInput'
import { ClayBadge } from '@/components/ui/ClayBadge'

export default function PitchDeckBuilderPage() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile(user?.id)
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('My Visionary Pitch')
  const [slides, setSlides] = useState<any[]>([{ id: '1', content: 'Double click to edit your first big idea.' }])
  const [activeSlide, setActiveSlide] = useState(0)
  const [demoLink, setDemoLink] = useState('')
  const [transcript, setTranscript] = useState('')
  const [saving, setSaving] = useState(false)

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>

  if (profile?.plan !== 'pro') {
    return (
      <div className="p-6 lg:p-20 flex flex-col items-center justify-center min-h-[80vh] text-center space-y-10">
         <div className="h-32 w-32 bg-primary/10 rounded-[3rem] flex items-center justify-center border-4 border-white shadow-xl animate-pulse">
            <Presentation className="h-16 w-16 text-primary" />
         </div>
         <div className="space-y-4 max-w-lg">
            <h1 className="font-display text-4xl font-black text-slate-900 tracking-tighter">Pitch Decks are a Pro Feature</h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed">
               Create stunning, interactive pitch decks with integrated demo videos and real-time transcripts. Deliver a presentation that closes the deal.
            </p>
         </div>
         <ClayButton size="lg" className="h-16 px-10 rounded-full shadow-glow text-lg" onClick={() => router.push('/dashboard')}>
            Upgrade to Pro — $12/mo
         </ClayButton>
      </div>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    const toastId = toast.loading("Preserving your vision...")
    try {
      const { error } = await supabase.from('pitch_decks').insert({
        user_id: user?.id,
        title,
        slides,
        demo_link: demoLink,
        transcript,
        status: 'draft'
      } as any)

      if (error) throw error
      toast.success("Deck saved to library!", { id: toastId })
    } catch (err: any) {
      toast.error("Failed to save", { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  const addSlide = () => {
    const newSlide = { id: Date.now().toString(), content: `Slide ${slides.length + 1} Content` }
    setSlides([...slides, newSlide])
    setActiveSlide(slides.length)
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Editor Top Bar */}
      <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-[#0f0f18]/80 backdrop-blur-xl shrink-0 z-30">
         <div className="flex items-center gap-6">
            <button onClick={() => router.back()} className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
               <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
               <Presentation className="h-5 w-5 text-primary" />
               <input 
                 value={title} 
                 onChange={(e) => setTitle(e.target.value)} 
                 className="bg-transparent border-none text-xl font-black tracking-tighter focus:ring-0 w-64 hover:bg-white/5 rounded-lg px-2 py-1 transition-all"
               />
            </div>
         </div>

         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4 bg-white/5 px-4 py-2 rounded-xl">
               <ClayBadge variant="success" className="animate-pulse">Live Editing</ClayBadge>
            </div>
            <ClayButton variant="secondary" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
               <MonitorPlay className="h-4 w-4 mr-2" /> Preview
            </ClayButton>
            <ClayButton onClick={handleSave} disabled={saving} className="bg-white text-slate-900 hover:bg-slate-100 shadow-glow">
               {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} 
               Save Deck
            </ClayButton>
         </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
         {/* Slide Navigator */}
         <aside className="w-72 border-r border-white/5 bg-[#0f0f18]/50 flex flex-col shrink-0">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Storyline</span>
               <button onClick={addSlide} className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                  <Plus className="h-5 w-5" />
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               {slides.map((slide, i) => (
                 <motion.div 
                   key={slide.id}
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => setActiveSlide(i)}
                   className={cn(
                     "aspect-video rounded-2xl border-4 cursor-pointer relative overflow-hidden transition-all shadow-xl group",
                     activeSlide === i ? "border-primary bg-primary/20" : "border-white/5 bg-slate-900/50 hover:border-white/20"
                   )}
                 >
                    <div className="absolute top-3 left-3 h-6 w-6 rounded-lg bg-black/40 backdrop-blur-md flex items-center justify-center text-[10px] font-black">
                       {i + 1}
                    </div>
                    <div className="p-4 pt-10 text-[8px] text-white/40 line-clamp-3">
                       {slide.content}
                    </div>
                 </motion.div>
               ))}
            </div>
         </aside>

         {/* Canvas Area */}
         <main className="flex-1 bg-black relative flex flex-col overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent opacity-50" />
            
            <div className="flex-1 p-20 flex items-center justify-center">
               <motion.div 
                 layoutId="activeSlide"
                 className="w-full max-w-5xl aspect-video bg-white rounded-[3rem] shadow-[0_0_100px_-20px_rgba(255,255,255,0.1)] relative overflow-hidden group"
               >
                  <div className="absolute inset-0 p-24 flex flex-col items-center justify-center text-center">
                     <textarea 
                        value={slides[activeSlide]?.content || ''} 
                        onChange={(e) => {
                           const newSlides = [...slides]
                           newSlides[activeSlide].content = e.target.value
                           setSlides(newSlides)
                        }}
                        className="w-full h-full text-5xl font-black text-slate-900 bg-transparent border-none focus:ring-0 resize-none text-center leading-tight tracking-tighter"
                        placeholder="Define your mission..."
                     />
                  </div>

                  {/* Canvas HUD */}
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex gap-6 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                     <button className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"><FileText className="h-5 w-5" /></button>
                     <button className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"><ImageIcon className="h-5 w-5" /></button>
                     <button className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"><Layout className="h-5 w-5" /></button>
                     <div className="w-px h-8 bg-white/10" />
                     <button className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"><Palette className="h-5 w-5" /></button>
                  </div>
               </motion.div>
            </div>

            {/* Bottom Meta Tray */}
            <div className="px-20 pb-20 grid grid-cols-1 md:grid-cols-2 gap-10">
               <ClayCard className="p-10 bg-[#181825] border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-primary">
                        <Video className="h-5 w-5" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Demo Recording</h3>
                     </div>
                     <ClayBadge variant="secondary">Loom / YouTube</ClayBadge>
                  </div>
                  <input 
                     value={demoLink} 
                     onChange={(e) => setDemoLink(e.target.value)} 
                     className="w-full bg-black/40 border-white/10 rounded-2xl p-4 text-sm text-slate-300 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                     placeholder="Paste demo link..."
                  />
               </ClayCard>

               <ClayCard className="p-10 bg-[#181825] border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-indigo-400">
                        <Mic className="h-5 w-5" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Presenter Notes</h3>
                     </div>
                  </div>
                  <textarea 
                     value={transcript} 
                     onChange={(e) => setTranscript(e.target.value)} 
                     className="w-full bg-black/40 border-white/10 rounded-2xl p-4 text-sm text-slate-300 min-h-[100px] outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                     placeholder="What's the script for this slide?"
                  />
               </ClayCard>
            </div>
         </main>

         {/* Right Control Panel */}
         <aside className="w-16 border-l border-white/5 bg-[#0f0f18]/50 flex flex-col items-center py-8 gap-10 shrink-0">
            <button className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all">
               <Settings className="h-5 w-5" />
            </button>
            <div className="flex-1 flex flex-col gap-6">
               <div className="h-8 w-8 bg-rose-500 rounded-full cursor-pointer ring-4 ring-rose-500/20" />
               <div className="h-8 w-8 bg-indigo-500 rounded-full cursor-pointer hover:ring-4 hover:ring-indigo-500/20 transition-all" />
               <div className="h-8 w-8 bg-emerald-500 rounded-full cursor-pointer hover:ring-4 hover:ring-emerald-500/20 transition-all" />
            </div>
         </aside>
      </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
