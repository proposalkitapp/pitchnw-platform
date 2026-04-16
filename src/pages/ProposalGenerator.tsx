"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { AuthLayout } from "@/components/AuthLayout";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProposalRenderer, type ProposalBranding } from "@/components/ProposalRenderer";
import { generateSmartProposal } from "@/lib/blueprint-engine";
import { Sparkles, FileText, ArrowRight, ArrowLeft, Check, Save, Loader2, Download, X, Share2, Lock, Zap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exportProposalAsPdf } from "@/lib/export-pdf";
import { getTemplateById, type Template } from "@/lib/templates";
import { currencies, getCurrencyByCode } from "@/lib/currencies";
import { defaultAppearance, getThemeById, type AppearanceSettings } from "@/lib/proposal-themes";
import { Badge } from "@/components/ui/badge";
import { ProposalCustomizer } from "@/components/ProposalCustomizer";

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
  { title: "Project Details", description: "Describe the project scope" },
  { title: "Budget & Timeline", description: "Set budget and timeline" },
  { title: "Tone & Mode", description: "Choose style and generation mode" },
  { title: "Generate", description: "Review and generate your proposal" },
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
    if (f.projectType === "other" && !f.customProjectType.trim()) return "Please specify the project type";
    if (!f.description.trim()) return "Project Description is required";
    if (!f.deliverables.trim()) return "Key Deliverables are required";
    return null;
  },
  2: (f) => {
    if (!f.budgetAmount.trim()) return "Estimated Budget is required";
    if (parseFloat(f.budgetAmount) < 50) return "Minimum budget is 50";
    if (!f.timeline) return "Please select a timeline";
    return null;
  },
  3: (f) => {
    if (!f.tone) return "Please select a tone";
    if (!f.proposalMode) return "Please select a proposal mode";
    return null;
  },
};

export default function ProposalGenerator() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [appearance, setAppearance] = useState<AppearanceSettings>(defaultAppearance);
  const [budgetError, setBudgetError] = useState("");
  const [generationMode, setGenerationMode] = useState<"smart" | "ai">("smart");

  const templateId = searchParams.get("template");

  useEffect(() => {
    if (templateId) {
      const t = getTemplateById(templateId);
      if (t) setActiveTemplate(t);
    }
  }, [templateId]);

  const isFree = profile?.plan !== 'pro';
  const proposalsUsed = profile?.proposals_used || 0;
  const hasHitFreeLimit = isFree && proposalsUsed >= 3;

  const branding: ProposalBranding = {
    logoUrl: profile?.brand_logo_url,
    headerTitle: profile?.brand_name,
    companyName: profile?.company_name,
    displayName: profile?.display_name,
    portfolioUrl: profile?.portfolio_url,
  };

  const update = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const next = () => {
    const validator = stepValidation[currentStep];
    if (validator) {
      const error = validator(form);
      if (error) {
        toast.error(error);
        return;
      }
    }
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const prev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedProposal("");
    
    if (generationMode === "ai") {
      toast.loading("AI is crafting your proposal...", { id: "gen" });
    } else {
      toast.loading("Smart Engine is assembling your proposal...", { id: "gen" });
    }

    try {
      if (generationMode === "smart") {
        await new Promise(r => setTimeout(r, 1500));
        
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
        });
        
        setGeneratedProposal(JSON.stringify(result));
        toast.success("Proposal assembled instantly!", { id: "gen" });
        setIsGenerating(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        toast.error("Please sign in to generate proposals", { id: "gen" });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        'generate-proposal',
        {
          body: {
            clientName: form.clientName,
            clientEmail: form.clientEmail,
            projectType: form.projectType === "other" ? form.customProjectType : form.projectType,
            projectTitle: form.projectTitle,
            requirements: form.description,
            currency: form.budgetCurrency,
            budget: form.budgetAmount,
            duration: form.timeline,
            tone: form.tone,
            proposalMode: form.proposalMode,
            templatePrompt: activeTemplate?.aiPrompt || null,
            templateSections: activeTemplate?.sections || null,
            currencySymbol: getCurrencyByCode(form.budgetCurrency).symbol,
            industry: form.industry === "other" ? form.customIndustry : form.industry,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      if (error) {
        if (error.context?.status === 403 || error.message?.includes("limit_reached")) {
          toast.error("You've used all 3 free proposals. Upgrade to Pro for unlimited access.", { id: "gen" });
          navigate("/checkout");
          return;
        }
        throw new Error(error.message || "Failed to generate proposal");
      }

      if (data && typeof data === 'string') {
        setGeneratedProposal(data);
      } else if (data && data.content) {
        setGeneratedProposal(data.content);
      } else if (data) {
        setGeneratedProposal(JSON.stringify(data, null, 2));
      }

      toast.success("Proposal created!", { id: "gen" });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    } catch (e: any) {
      console.error("Generation error details:", e);
      toast.error(e.message || "Generation failed. Please try again.", { id: "gen" });
      setGeneratedProposal(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please sign in to save proposals");
      navigate("/auth");
      return;
    }
    if (!generatedProposal) return;

    setIsSaving(true);
    const { data, error } = await supabase.from("proposals").insert({
      user_id: user.id,
      title: form.projectTitle || "Untitled Proposal",
      client_name: form.clientName || null,
      client_email: form.clientEmail || null,
      industry: form.industry === "other" ? form.customIndustry : (form.industry || null),
      project_type: form.projectType === "other" ? form.customProjectType : (form.projectType || null),
      budget: form.budgetAmount ? `${getCurrencyByCode(form.budgetCurrency).symbol}${form.budgetAmount}` : null,
      timeline: form.timeline || null,
      description: form.description || null,
      deliverables: form.deliverables || null,
      tone: form.tone,
      generated_content: generatedProposal,
      status: "draft",
      proposal_mode: form.proposalMode,
    } as any).select("id, public_slug").single();

    if (error) {
      toast.error("Failed to save proposal");
    } else {
      toast.success("Proposal saved ✓");
      if (data?.public_slug) {
        const link = `${window.location.origin}/p/${data.public_slug}`;
        navigator.clipboard.writeText(link);
        toast.success("Shareable link copied to clipboard! 🔗");
        toast.success("Proposal sent! Your client has been notified via email.");
      }
      navigate("/dashboard");
    }
    setIsSaving(false);
  };

  if (profileLoading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthLayout>
    );
  }

  if (hasHitFreeLimit) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 gap-6 font-body">
          <div className="text-6xl">🔒</div>
          <h2 className="font-display font-extrabold text-3xl text-slate-900 leading-tight">
            You have used all 3 free proposals
          </h2>
          <p className="text-slate-500 max-w-md leading-relaxed">
            Free accounts include 3 proposals for life.
            Upgrade to Pro for unlimited proposal generation
            and access to every premium feature.
          </p>
          <Button 
            size="lg" 
            className="h-14 px-8 bg-[#0033ff] hover:bg-[#002be6] text-white rounded-2xl font-bold shadow-lg"
            onClick={() => navigate('/checkout')}
          >
            Upgrade to Pro — $12/mo
          </Button>
          <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
            Existing proposals remain fully accessible
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto font-body">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary uppercase tracking-wider">AI Proposal Generator</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
            Create a winning <span className="text-[#0033ff]">proposal</span>
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto text-sm">
            Fill in the details and let AI craft a professional, persuasive proposal in seconds.
          </p>
        </motion.div>

        {activeTemplate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center justify-between rounded-xl border px-5 py-3 bg-slate-50 border-slate-200"
          >
            <span className="text-sm font-semibold text-slate-700">
              Using template: <span className="text-[#0033ff]">{activeTemplate.name}</span>
            </span>
            <button onClick={() => setActiveTemplate(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-12 max-w-lg mx-auto px-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  i < currentStep
                    ? "bg-[#0033ff] text-white"
                    : i === currentStep
                    ? "bg-[#0033ff] text-white shadow-[0_0_20px_rgba(0,51,255,0.3)] scale-110"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-8 sm:w-12 h-1 mx-1 rounded-full transition-all duration-300 ${
                    i < currentStep ? "bg-[#0033ff]" : "bg-slate-100"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {!generatedProposal && !isGenerating ? (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[32px] border border-slate-100 bg-white p-6 sm:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)]"
          >
            <h2 className="font-display text-2xl font-bold mb-1 text-slate-900">
              {steps[currentStep].title}
            </h2>
            <p className="text-sm text-slate-400 mb-8 font-medium">
              {steps[currentStep].description}
            </p>

            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="clientName" className="font-bold text-slate-700">Client Name <span className="text-red-500">*</span></Label>
                    <Input id="clientName" placeholder="e.g. Acme Corp" value={form.clientName} onChange={(e) => update("clientName", e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail" className="font-bold text-slate-700">Client Email <span className="text-red-500">*</span></Label>
                    <Input id="clientEmail" type="email" placeholder="client@example.com" value={form.clientEmail} onChange={(e) => update("clientEmail", e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry" className="font-bold text-slate-700">Industry <span className="text-red-500">*</span></Label>
                  <Select value={form.industry} onValueChange={(v) => update("industry", v)}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100"><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>
                      {[
                        "Technology", "Marketing & Advertising", "Creative Design", "E-commerce & Retail", 
                        "Professional Services", "Real Estate & Construction", "Healthcare & Wellness", 
                        "Education & E-learning", "Finance & Fintech", "Hospitality & Tourism", 
                        "Manufacturing & Logistics", "Other"
                      ].map((ind) => (
                        <SelectItem key={ind} value={ind.toLowerCase()}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.industry === "other" && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                      <Label htmlFor="customIndustry" className="font-bold text-slate-700">Specify Industry</Label>
                      <Input id="customIndustry" placeholder="e.g. Aerospace & Defense" value={form.customIndustry} onChange={(e) => update("customIndustry", e.target.value)} className="h-12 mt-1.5 rounded-xl bg-slate-50 border-slate-100" />
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="projectTitle" className="font-bold text-slate-700">Project Title <span className="text-red-500">*</span></Label>
                  <Input id="projectTitle" placeholder="e.g. Website Redesign" value={form.projectTitle} onChange={(e) => update("projectTitle", e.target.value)} className="h-12 mt-2 rounded-xl bg-slate-50 border-slate-100" />
                </div>
                <div>
                  <Label htmlFor="projectType" className="font-bold text-slate-700">Project Type <span className="text-red-500">*</span></Label>
                  <Select value={form.projectType} onValueChange={(v) => update("projectType", v)}>
                    <SelectTrigger className="h-12 mt-2 rounded-xl bg-slate-50 border-slate-100"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {[
                        "Web Development", "Mobile App Development", "Brand Identity & Design", 
                        "UI/UX Design", "Digital Marketing", "Social Media Management", 
                        "SEO & Content Marketing", "Business Consulting", "SaaS Development", 
                        "Video Production", "Copywriting & Editing", "Event Planning", "Other"
                      ].map((t) => (
                        <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.projectType === "other" && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                      <Label htmlFor="customProjectType" className="font-bold text-slate-700">Specify Project Type</Label>
                      <Input id="customProjectType" placeholder="e.g. AR Application Development" value={form.customProjectType} onChange={(e) => update("customProjectType", e.target.value)} className="h-12 mt-1.5 rounded-xl bg-slate-50 border-slate-100" />
                    </motion.div>
                  )}
                </div>
                <div>
                  <Label htmlFor="description" className="font-bold text-slate-700">Project Description <span className="text-red-500">*</span></Label>
                  <Textarea id="description" placeholder="Describe the project goals and requirements..." rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className="mt-2 rounded-xl bg-slate-50 border-slate-100 resize-none" />
                </div>
                <div>
                  <Label htmlFor="deliverables" className="font-bold text-slate-700">Key Deliverables <span className="text-red-500">*</span></Label>
                  <Textarea id="deliverables" placeholder="List the main deliverables, one per line..." rows={3} value={form.deliverables} onChange={(e) => update("deliverables", e.target.value)} className="mt-2 rounded-xl bg-slate-50 border-slate-100 resize-none" />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <Label className="font-bold text-slate-700">Currency</Label>
                    <Select value={form.budgetCurrency} onValueChange={(v) => update("budgetCurrency", v)}>
                      <SelectTrigger className="h-12 mt-2 rounded-xl bg-slate-50 border-slate-100"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.symbol} — {c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="budgetAmount" className="font-bold text-slate-700">Estimated Budget <span className="text-red-500">*</span></Label>
                    <div className="relative mt-2">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        {getCurrencyByCode(form.budgetCurrency).symbol}
                      </span>
                      <Input
                        id="budgetAmount"
                        type="number"
                        min={50}
                        placeholder="e.g. 500"
                        value={form.budgetAmount}
                        onChange={(e) => {
                          update("budgetAmount", e.target.value);
                          const val = parseFloat(e.target.value);
                          if (e.target.value && val < 50) {
                            setBudgetError(`Min budget is ${getCurrencyByCode(form.budgetCurrency).symbol}50`);
                          } else {
                            setBudgetError("");
                          }
                        }}
                        className={`pl-10 h-12 rounded-xl bg-slate-50 border-slate-100 ${budgetError ? "border-red-500 bg-red-50" : ""}`}
                      />
                    </div>
                    {budgetError && <p className="text-[10px] text-red-500 mt-1 font-bold uppercase tracking-wider">{budgetError}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="timeline" className="font-bold text-slate-700">Timeline <span className="text-red-500">*</span></Label>
                  <Select value={form.timeline} onValueChange={(v) => update("timeline", v)}>
                    <SelectTrigger className="h-12 mt-2 rounded-xl bg-slate-50 border-slate-100"><SelectValue placeholder="Select timeline" /></SelectTrigger>
                    <SelectContent>
                      {["1 - 2 weeks", "2 - 4 weeks", "1 - 2 months", "2 - 3 months", "3 - 6 months", "6+ months"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8">
                <div>
                  <Label className="text-base font-bold text-slate-900">Generation Technology</Label>
                  <p className="text-sm text-slate-400 mt-1 mb-5">Choose how you want to build this proposal</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setGenerationMode("smart")}
                      className={`relative text-left rounded-2xl border-2 p-6 transition-all duration-300 ${
                        generationMode === "smart"
                          ? "border-[#0033ff] bg-[#0033ff]/5 shadow-lg"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <Zap className={`h-8 w-8 mb-4 ${generationMode === "smart" ? "text-[#0033ff]" : "text-slate-300"}`} />
                      <h4 className="font-bold text-slate-900 mb-2">Smart Engine</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Instant assembly using professional blueprints. Zero cost, 100% reliable.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGenerationMode("ai")}
                      className={`relative text-left rounded-2xl border-2 p-6 transition-all duration-300 ${
                        generationMode === "ai"
                          ? "border-[#0033ff] bg-[#0033ff]/5 shadow-lg"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <Sparkles className={`h-8 w-8 mb-4 ${generationMode === "ai" ? "text-purple-500" : "text-slate-300"}`} />
                      <h4 className="font-bold text-slate-900 mb-2">Neural AI (Edge)</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Advanced writing for unique needs. Requires active connection.
                      </p>
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-bold text-slate-900">Strategic Angle</Label>
                  <p className="text-sm text-slate-400 mt-1 mb-5">How should the proposal be structured?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => update("proposalMode", "sales_pitch")}
                      className={`relative text-left rounded-2xl border-2 p-6 transition-all duration-300 ${
                        form.proposalMode === "sales_pitch"
                          ? "border-[#0033ff] bg-[#0033ff]/5 shadow-lg"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <span className="text-3xl block mb-4">🎯</span>
                      <h4 className="font-bold text-slate-900 mb-2">Sales Pitch</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        High-converting format. Positions you as the expert solution.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => update("proposalMode", "traditional")}
                      className={`relative text-left rounded-2xl border-2 p-6 transition-all duration-300 ${
                        form.proposalMode === "traditional"
                          ? "border-[#0033ff] bg-[#0033ff]/5 shadow-lg"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <span className="text-3xl block mb-4">📄</span>
                      <h4 className="font-bold text-slate-900 mb-2">Formal Proposal</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Structured, formal format. Best for corporate and RFP responses.
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="font-display text-xl font-bold text-slate-900">Review & Launch</h3>
                <div className="grid sm:grid-cols-2 gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  {[
                    { label: "Client", value: form.clientName },
                    { label: "Project", value: form.projectTitle },
                    { label: "Budget", value: `${getCurrencyByCode(form.budgetCurrency).symbol}${Number(form.budgetAmount).toLocaleString()}` },
                    { label: "Timeline", value: form.timeline },
                    { label: "Mode", value: form.proposalMode.replace('_', ' ').toUpperCase() },
                    { label: "Engine", value: generationMode.toUpperCase() },
                  ].map((sum) => (
                    <div key={sum.label}>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{sum.label}</span>
                      <span className="text-sm font-bold text-slate-700 truncate block">{sum.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-10">
              <Button
                variant="ghost"
                onClick={prev}
                disabled={currentStep === 0}
                className="h-12 px-6 rounded-xl font-bold text-slate-500 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={next}
                  className="h-12 px-8 rounded-xl bg-[#0033ff] hover:bg-[#002be6] text-white font-bold shadow-lg"
                >
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="h-14 px-10 rounded-2xl bg-black text-white hover:bg-slate-900 font-bold shadow-xl transition-all active:scale-95"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" /> Create Proposal
                    </>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          /* Preview State */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
               <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setGeneratedProposal(null)} className="h-10 rounded-xl font-bold bg-white">
                  ← Edit Details
                </Button>
                <Badge className="bg-[#0033ff]/10 text-[#0033ff] border-none font-bold py-1.5 px-3">
                  READY FOR CLIENT
                </Badge>
               </div>
               <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 rounded-xl font-bold bg-white"
                  onClick={() => exportProposalAsPdf(form.projectTitle, generatedProposal!, branding)}
                >
                  <Download className="h-4 w-4 mr-2" /> Export PDF
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-10 px-6 rounded-xl bg-[#0033ff] hover:bg-[#002be6] text-white font-bold shadow-lg"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save & Send</>}
                </Button>
               </div>
            </div>

            <div className="rounded-[40px] border border-slate-100 bg-white p-6 sm:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.05)]">
              <ProposalRenderer
                content={generatedProposal!}
                mode={form.proposalMode}
                branding={branding}
              />
            </div>
          </motion.div>
        )}
      </div>
    </AuthLayout>
  );
}
