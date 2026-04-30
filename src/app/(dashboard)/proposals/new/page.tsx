'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Save, 
  Loader2, 
  Download, 
  X, 
  Zap,
  ChevronRight,
  Brain,
  Target
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { ClayCard } from '@/components/ui/ClayCard'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayInput } from '@/components/ui/ClayInput'
import { ClayBadge } from '@/components/ui/ClayBadge'
import { ProposalRenderer } from '@/components/proposal/ProposalRenderer'
import { generateSmartProposal } from '@/lib/blueprint-engine'
import { currencies, getCurrencyByCode } from '@/lib/currencies'
import { getTemplateById } from '@/lib/templates'

interface FormData {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  industry: string;
  customIndustry: string;
  projectType: string;
  customProjectType: string;
  budgetAmount: string;
  budgetCurrency: string;
  timeline: string;
  description: string;
  deliverables: string;
  tone: string;
  proposalMode: "sales_pitch" | "traditional";
}

const initialForm: FormData = {
  clientName: "",
  clientEmail: "",
  projectTitle: "",
  industry: "",
  customIndustry: "",
  projectType: "",
  customProjectType: "",
  budgetAmount: "",
  budgetCurrency: "USD",
  timeline: "",
  description: "",
  deliverables: "",
  tone: "professional",
  proposalMode: "sales_pitch",
};

const steps = [
  { title: "Client Info", description: "Who is this proposal for?" },
  { title: "Project Details", description: "Describe the scope" },
  { title: "Budget & Timeline", description: "Financials and timing" },
  { title: "Mode & Engine", description: "Choose generation method" },
  { title: "Launch", description: "Review and generate" },
];

const stepValidation: Record<number, (form: FormData) => string | null> = {
  0: (f) => {
    if (!f.clientName.trim()) return "Client Name is required";
    if (!f.clientEmail.trim()) return "Client Email is required";
    if (!f.industry) return "Please select an industry";
    if (f.industry === "other" && !f.customIndustry.trim()) return "Please specify your industry";
    return null;
  },
  1: (f) => {
    if (!f.projectTitle.trim()) return "Project Title is required";
    if (!f.projectType) return "Please select a project type";
    if (!f.description.trim()) return "Project Description is required";
    if (!f.deliverables.trim()) return "Key Deliverables are required";
    return null;
  },
  2: (f) => {
    if (!f.budgetAmount.trim()) return "Estimated Budget is required";
    if (!f.timeline) return "Please select a timeline";
    return null;
  },
  3: (f) => {
    if (!f.proposalMode) return "Please select a mode";
    return null;
  },
};

export default function ProposalGeneratorPage() {
  const { user } = useAuth()
  const { data: profile, isPro } = useProfile(user?.id)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [currentStep, setCurrentStep] = useState(0)
  const [form, setForm] = useState<FormData>(initialForm)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [generatedProposal, setGeneratedProposal] = useState<string | null>(null)
  const [generationMode, setGenerationMode] = useState<"smart" | "ai">("smart")
  const [isSaving, setIsSaving] = useState(false)

  const templateId = searchParams.get('template')

  useEffect(() => {
    if (templateId) {
      const template = getTemplateById(templateId)
      if (template) {
        // Pre-fill form from template if possible (simplified here)
        setForm(prev => ({ ...prev, projectTitle: template.name }))
      }
    }
  }, [templateId])

  const update = (field: keyof FormData, value: string) => 
    setForm(prev => ({ ...prev, [field]: value }))

  const next = () => {
    const validator = stepValidation[currentStep]
    if (validator) {
      const error = validator(form)
      if (error) {
        toast.error(error)
        return
      }
    }
    setCurrentStep(s => Math.min(s + 1, steps.length - 1))
  }

  const prev = () => setCurrentStep(s => Math.max(s - 1, 0))

  const handleSuggestDetails = async () => {
    if (!form.projectTitle || (!form.industry && !form.customIndustry)) {
      toast.error("Please enter a Project Title and Industry first.")
      return
    }
    
    setIsSuggesting(true)
    const toastId = toast.loading("AI is thinking...")
    
    try {
      const response = await fetch('/api/suggest-details', {
        method: 'POST',
        body: JSON.stringify({
          industry: form.industry === 'other' ? form.customIndustry : form.industry,
          projectType: form.projectType === 'other' ? form.customProjectType : form.projectType,
          projectTitle: form.projectTitle
        })
      })
      
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      
      update("description", data.description)
      update("deliverables", data.deliverables)
      toast.success("Details suggested!", { id: toastId })
    } catch (err: any) {
      toast.error(err.message || "Failed to suggest details", { id: toastId })
    } finally {
      setIsSuggesting(false)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    const toastId = toast.loading(generationMode === 'ai' ? "Neural Edge AI crafting your pitch..." : "Smart Engine assembling...")

    try {
      if (generationMode === 'smart') {
        await new Promise(r => setTimeout(r, 1500))
        const result = generateSmartProposal({
          clientName: form.clientName,
          industry: form.industry === "other" ? form.customIndustry : form.industry,
          projectTitle: form.projectTitle,
          projectType: form.projectType === "other" ? form.customProjectType : form.projectType,
          budget: `${getCurrencyByCode(form.budgetCurrency).symbol}${form.budgetAmount}`,
          timeline: form.timeline,
          tone: form.tone,
          deliverables: form.deliverables,
          description: form.description
        })
        setGeneratedProposal(JSON.stringify(result))
        toast.success("Proposal assembled!", { id: toastId })
        setIsGenerating(false)
        return
      }

      // AI Generation via Next.js API
      const response = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: form.clientName,
          clientCompany: form.clientEmail,
          projectType: form.projectType === "other" ? form.customProjectType : form.projectType,
          projectTitle: form.projectTitle,
          requirements: form.description,
          currency: form.budgetCurrency,
          budget: form.budgetAmount,
          duration: form.timeline,
          tone: form.tone,
          preparedBy: (profile as any)?.display_name || "The Team",
          proposalMode: form.proposalMode,
        })
      })

      const data = await response.json()
      if (data.error) throw new Error(data.message || data.error)

      toast.success("Proposal generated!", { id: toastId })
      router.push('/proposals') // Redirect after AI generation since it auto-saves
    } catch (e: any) {
      toast.error(e.message || "Generation failed", { id: toastId })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedProposal) return
    setIsSaving(true)
    
    try {
      const { data, error } = await supabase.from("proposals").insert({
        user_id: user?.id,
        title: form.projectTitle || "Untitled Proposal",
        client_name: form.clientName || null,
        client_email: form.clientEmail || null,
        budget: form.budgetAmount ? `${getCurrencyByCode(form.budgetCurrency).symbol}${form.budgetAmount}` : null,
        timeline: form.timeline || null,
        description: form.description || null,
        deliverables: form.deliverables || null,
        tone: form.tone,
        generated_content: generatedProposal,
        status: "draft",
        proposal_mode: form.proposalMode,
      } as any).select("id, public_slug").single()

      if (error) throw error
      
      toast.success("Proposal saved!")
      router.push('/dashboard')
    } catch (err) {
      toast.error("Failed to save proposal")
    } finally {
      setIsSaving(false)
    }
  }

  const branding = {
    logoUrl: (profile as any)?.brand_logo_url,
    headerTitle: (profile as any)?.brand_name,
    companyName: (profile as any)?.company_name,
    displayName: (profile as any)?.display_name,
    portfolioUrl: (profile as any)?.portfolio_url,
  }

  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto min-h-screen">
      <AnimatePresence mode="wait">
        {!generatedProposal ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            <header className="text-center space-y-4">
              <ClayBadge variant="info" className="mx-auto">
                <Sparkles className="h-3 w-3 mr-2" /> AI Proposal Engine
              </ClayBadge>
              <h1 className="font-display text-5xl font-black text-slate-900 tracking-tighter">
                New <span className="text-primary">Proposal</span>
              </h1>
              <p className="text-slate-500 font-medium max-w-lg mx-auto">
                Fill in the details and let our AI craft a high-converting pitch in seconds.
              </p>
            </header>

            {/* Steps Progress */}
            <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all",
                    i < currentStep ? "bg-primary text-white" :
                    i === currentStep ? "bg-primary text-white shadow-glow scale-110" :
                    "bg-slate-100 text-slate-400"
                  )}>
                    {i < currentStep ? <Check className="h-5 w-5" /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={cn(
                      "w-4 h-1 rounded-full",
                      i < currentStep ? "bg-primary" : "bg-slate-100"
                    )} />
                  )}
                </div>
              ))}
            </div>

            <ClayCard className="p-10 max-w-3xl mx-auto space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Brain className="h-32 w-32" />
               </div>

               <div className="relative z-10">
                 <h2 className="text-2xl font-black text-slate-900 mb-1">{steps[currentStep].title}</h2>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-8">
                   {steps[currentStep].description}
                 </p>

                 <div className="space-y-6">
                    {currentStep === 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ClayInput label="Client Name" placeholder="Acme Corp" value={form.clientName} onChange={(e) => update("clientName", e.target.value)} required />
                        <ClayInput label="Client Email" placeholder="client@example.com" value={form.clientEmail} onChange={(e) => update("clientEmail", e.target.value)} required />
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-sm font-bold text-slate-700">Industry</label>
                          <select 
                            className="w-full h-14 px-4 bg-slate-50 border-white/20 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                            value={form.industry}
                            onChange={(e) => update("industry", e.target.value)}
                          >
                            <option value="">Select Industry</option>
                            <option value="tech">Technology</option>
                            <option value="marketing">Marketing</option>
                            <option value="creative">Creative</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <ClayInput label="Project Title" placeholder="e.g. Website Redesign" value={form.projectTitle} onChange={(e) => update("projectTitle", e.target.value)} required />
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-slate-700">Project Description</label>
                          <ClayButton variant="ghost" size="sm" onClick={handleSuggestDetails} disabled={isSuggesting} className="text-primary h-8">
                            {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                            AI Suggest
                          </ClayButton>
                        </div>
                        <textarea 
                          className="w-full p-4 bg-slate-50 border-white/20 rounded-2xl font-medium text-slate-800 min-h-[120px] outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="What is this project about?"
                          value={form.description}
                          onChange={(e) => update("description", e.target.value)}
                        />
                        <ClayInput label="Key Deliverables" placeholder="Deliverable 1, Deliverable 2..." value={form.deliverables} onChange={(e) => update("deliverables", e.target.value)} />
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Budget Amount</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                            <input 
                              type="number" 
                              className="w-full h-14 pl-8 pr-4 bg-slate-50 border-white/20 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/20"
                              value={form.budgetAmount}
                              onChange={(e) => update("budgetAmount", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Timeline</label>
                          <select 
                            className="w-full h-14 px-4 bg-slate-50 border-white/20 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                            value={form.timeline}
                            onChange={(e) => update("timeline", e.target.value)}
                          >
                            <option value="">Select Timeline</option>
                            <option value="1-2 weeks">1-2 Weeks</option>
                            <option value="1 month">1 Month</option>
                            <option value="3 months">3 Months</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button 
                            onClick={() => setGenerationMode("smart")}
                            className={cn(
                              "p-6 rounded-3xl border-2 transition-all text-left group",
                              generationMode === "smart" ? "border-primary bg-primary/5 shadow-lg" : "border-slate-100 hover:border-primary/20"
                            )}
                          >
                            <Zap className={cn("h-8 w-8 mb-4", generationMode === "smart" ? "text-primary" : "text-slate-300")} />
                            <h4 className="font-black text-slate-900">Smart Engine</h4>
                            <p className="text-xs text-slate-500 font-medium">Instant assembly using proven templates.</p>
                          </button>
                          <button 
                            onClick={() => setGenerationMode("ai")}
                            className={cn(
                              "p-6 rounded-3xl border-2 transition-all text-left group",
                              generationMode === "ai" ? "border-primary bg-primary/5 shadow-lg" : "border-slate-100 hover:border-primary/20"
                            )}
                          >
                            <Brain className={cn("h-8 w-8 mb-4", generationMode === "ai" ? "text-purple-500" : "text-slate-300")} />
                            <h4 className="font-black text-slate-900">Neural AI</h4>
                            <p className="text-xs text-slate-500 font-medium">Deep AI writing for complex projects.</p>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button 
                            onClick={() => update("proposalMode", "sales_pitch")}
                            className={cn(
                              "p-6 rounded-3xl border-2 transition-all text-left group",
                              form.proposalMode === "sales_pitch" ? "border-primary bg-primary/5 shadow-lg" : "border-slate-100 hover:border-primary/20"
                            )}
                          >
                            <Target className={cn("h-8 w-8 mb-4", form.proposalMode === "sales_pitch" ? "text-emerald-500" : "text-slate-300")} />
                            <h4 className="font-black text-slate-900">Sales Pitch</h4>
                            <p className="text-xs text-slate-500 font-medium">High-converting strategy focused.</p>
                          </button>
                          <button 
                            onClick={() => update("proposalMode", "traditional")}
                            className={cn(
                              "p-6 rounded-3xl border-2 transition-all text-left group",
                              form.proposalMode === "traditional" ? "border-primary bg-primary/5 shadow-lg" : "border-slate-100 hover:border-primary/20"
                            )}
                          >
                            <FileText className={cn("h-8 w-8 mb-4", form.proposalMode === "traditional" ? "text-blue-500" : "text-slate-300")} />
                            <h4 className="font-black text-slate-900">Traditional</h4>
                            <p className="text-xs text-slate-500 font-medium">Formal structured proposal format.</p>
                          </button>
                        </div>
                      </div>
                    )}

                    {currentStep === 4 && (
                      <div className="space-y-6 bg-slate-50 p-8 rounded-3xl border border-white/20">
                         <h3 className="font-black text-slate-900">Summary</h3>
                         <div className="grid grid-cols-2 gap-y-4">
                            <div>
                               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Client</p>
                               <p className="font-bold text-slate-800">{form.clientName}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Budget</p>
                               <p className="font-bold text-slate-800">${form.budgetAmount}</p>
                            </div>
                            <div className="col-span-2">
                               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Strategy</p>
                               <p className="font-bold text-slate-800">{form.proposalMode.toUpperCase()} via {generationMode.toUpperCase()}</p>
                            </div>
                         </div>
                      </div>
                    )}
                 </div>

                 <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-100">
                    <ClayButton variant="ghost" onClick={prev} disabled={currentStep === 0}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </ClayButton>
                    
                    {currentStep < steps.length - 1 ? (
                      <ClayButton onClick={next} className="shadow-glow">
                        Continue <ArrowRight className="h-4 w-4 ml-2" />
                      </ClayButton>
                    ) : (
                      <ClayButton onClick={handleGenerate} disabled={isGenerating} className="shadow-glow px-10">
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Now</>}
                      </ClayButton>
                    )}
                 </div>
               </div>
            </ClayCard>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <ClayButton variant="ghost" onClick={() => setGeneratedProposal(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Edit Details
              </ClayButton>
              <div className="flex gap-4">
                <ClayButton variant="secondary" className="bg-white border-white/20">
                  <Download className="h-4 w-4 mr-2" /> Export PDF
                </ClayButton>
                <ClayButton onClick={handleSave} disabled={isSaving} className="shadow-glow">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save Proposal</>}
                </ClayButton>
              </div>
            </div>

            <ClayCard className="p-12">
               <ProposalRenderer 
                 content={generatedProposal}
                 mode={form.proposalMode}
                 branding={branding}
               />
            </ClayCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
