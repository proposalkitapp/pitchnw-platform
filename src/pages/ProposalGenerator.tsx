import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/AuthLayout";
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
import { Sparkles, FileText, ArrowRight, ArrowLeft, Check, Save, Loader2, Download, X, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exportProposalAsPdf } from "@/lib/export-pdf";
import { getTemplateById, type Template } from "@/lib/templates";
import { currencies, getCurrencyByCode, formatBudget } from "@/lib/currencies";
import { ProposalCustomizer } from "@/components/ProposalCustomizer";
import { defaultAppearance, getThemeById, type AppearanceSettings } from "@/lib/proposal-themes";
import { Badge } from "@/components/ui/badge";

interface FormData {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  industry: string;
  projectType: string;
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
  projectType: "",
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
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template");
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [appearance, setAppearance] = useState<AppearanceSettings>(defaultAppearance);
  const [budgetError, setBudgetError] = useState("");

  useEffect(() => {
    if (templateId) {
      const t = getTemplateById(templateId);
      if (t) setActiveTemplate(t);
    }
  }, [templateId]);

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
    toast.loading("Generating your proposal...", { id: "gen" });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        toast.error("Please sign in to generate proposals", { id: "gen" });
        navigate("/auth");
        return;
      }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-proposal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            formData: {
              ...form,
              budget: form.budgetAmount ? `${getCurrencyByCode(form.budgetCurrency).symbol}${Number(form.budgetAmount).toLocaleString()}` : "",
            },
            proposalMode: form.proposalMode,
            templatePrompt: activeTemplate?.aiPrompt || null,
            templateSections: activeTemplate?.sections || null,
            currencySymbol: getCurrencyByCode(form.budgetCurrency).symbol,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        if (err.code === "LIMIT_REACHED") {
          toast.error("You've used all 3 free proposals. Upgrade to Pro for unlimited access.", { id: "gen" });
          navigate("/settings");
          return;
        }
        throw new Error(err.error || "Failed to generate proposal");
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setGeneratedProposal(fullContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
      toast.success("Proposal created!", { id: "gen" });
    } catch (e: any) {
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
      industry: form.industry || null,
      project_type: form.projectType || null,
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

  return (
    <AuthLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI Proposal Generator</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Create a winning <span className="text-gradient">proposal</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Fill in the details and let AI craft a professional, persuasive proposal in seconds.
          </p>
        </motion.div>

        {/* Template banner */}
        {activeTemplate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center justify-between rounded-lg border px-4 py-3"
            style={{
              borderColor: `hsl(${activeTemplate.accentColor} / 0.3)`,
              backgroundColor: `hsl(${activeTemplate.accentColor} / 0.05)`,
            }}
          >
            <span className="text-sm font-medium text-foreground">
              Using template: <span style={{ color: `hsl(${activeTemplate.accentColor})` }}>{activeTemplate.name}</span>
            </span>
            <button onClick={() => setActiveTemplate(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-10 max-w-lg mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  i < currentStep
                    ? "bg-primary text-primary-foreground"
                    : i === currentStep
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-6 sm:w-10 h-0.5 mx-1 transition-colors ${
                    i < currentStep ? "bg-primary" : "bg-border"
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
            exit={{ opacity: 0, x: -20 }}
            className="rounded-xl border border-border bg-card p-6 sm:p-8"
          >
            <h2 className="font-display text-xl font-semibold mb-1 text-card-foreground">
              {steps[currentStep].title}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {steps[currentStep].description}
            </p>

            {currentStep === 0 && (
              <div className="space-y-5">
                <div>
                  <Label htmlFor="clientName">Client Name <span className="text-destructive">*</span></Label>
                  <Input id="clientName" placeholder="e.g. Acme Corp" value={form.clientName} onChange={(e) => update("clientName", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="clientEmail">Client Email <span className="text-destructive">*</span></Label>
                  <Input id="clientEmail" type="email" placeholder="client@example.com" value={form.clientEmail} onChange={(e) => update("clientEmail", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="industry">Industry <span className="text-destructive">*</span></Label>
                  <Select value={form.industry} onValueChange={(v) => update("industry", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>
                      {["Technology", "Marketing", "Design", "Consulting", "Finance", "Healthcare", "Education", "Other"].map((ind) => (
                        <SelectItem key={ind} value={ind.toLowerCase()}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <Label htmlFor="projectTitle">Project Title <span className="text-destructive">*</span></Label>
                  <Input id="projectTitle" placeholder="e.g. Website Redesign" value={form.projectTitle} onChange={(e) => update("projectTitle", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="projectType">Project Type <span className="text-destructive">*</span></Label>
                  <Select value={form.projectType} onValueChange={(v) => update("projectType", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {["Web Development", "Mobile App", "Brand Identity", "Marketing Campaign", "Consulting", "UI/UX Design", "Other"].map((t) => (
                        <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Project Description <span className="text-destructive">*</span></Label>
                  <Textarea id="description" placeholder="Describe the project goals, requirements, and any special considerations..." rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="deliverables">Key Deliverables <span className="text-destructive">*</span></Label>
                  <Textarea id="deliverables" placeholder="List the main deliverables, one per line..." rows={3} value={form.deliverables} onChange={(e) => update("deliverables", e.target.value)} className="mt-1.5" />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <Label>Currency</Label>
                  <Select value={form.budgetCurrency} onValueChange={(v) => update("budgetCurrency", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.symbol} — {c.label} ({c.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="budgetAmount">Estimated Budget <span className="text-destructive">*</span></Label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">
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
                          setBudgetError(`Minimum budget is ${getCurrencyByCode(form.budgetCurrency).symbol}50`);
                        } else {
                          setBudgetError("");
                        }
                      }}
                      className={`pl-10 ${budgetError ? "border-destructive" : ""}`}
                    />
                  </div>
                  {budgetError && <p className="text-xs text-destructive mt-1">{budgetError}</p>}
                </div>
                <div>
                  <Label htmlFor="timeline">Timeline <span className="text-destructive">*</span></Label>
                  <Select value={form.timeline} onValueChange={(v) => update("timeline", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select timeline" /></SelectTrigger>
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
              <div className="space-y-6">
                <div>
                  <Label htmlFor="tone">Proposal Tone <span className="text-destructive">*</span></Label>
                  <Select value={form.tone} onValueChange={(v) => update("tone", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select tone" /></SelectTrigger>
                    <SelectContent>
                      {[
                        { value: "professional", label: "Professional & Formal" },
                        { value: "friendly", label: "Friendly & Approachable" },
                        { value: "bold", label: "Bold & Confident" },
                        { value: "minimal", label: "Minimal & Direct" },
                      ].map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Proposal Mode Selection */}
                <div>
                  <Label className="text-base font-semibold">How should your proposal read? <span className="text-destructive">*</span></Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">Choose the generation style for your proposal</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Sales Pitch Card */}
                    <button
                      type="button"
                      onClick={() => update("proposalMode", "sales_pitch")}
                      className={`relative text-left rounded-xl border-2 p-5 transition-all duration-200 ${
                        form.proposalMode === "sales_pitch"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl">🎯</span>
                        <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15 text-[10px]">
                          Converts Better
                        </Badge>
                      </div>
                      <h4 className="font-display font-semibold text-card-foreground mb-2">Sales Pitch</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Written like a premium sales document. Speaks directly to the client's fears, positions you as the expert, and makes saying yes feel obvious. Best for competitive pitches and new clients.
                      </p>
                      {form.proposalMode === "sales_pitch" && (
                        <div className="absolute top-3 right-3">
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Traditional Proposal Card */}
                    <button
                      type="button"
                      onClick={() => update("proposalMode", "traditional")}
                      className={`relative text-left rounded-xl border-2 p-5 transition-all duration-200 ${
                        form.proposalMode === "traditional"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="mb-3">
                        <span className="text-3xl">📄</span>
                      </div>
                      <h4 className="font-display font-semibold text-card-foreground mb-2">Formal Proposal</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        A structured, professional document covering scope, timeline, and deliverables in a clear and formal format. Best for corporate clients, tenders, and RFP responses.
                      </p>
                      {form.proposalMode === "traditional" && (
                        <div className="absolute top-3 right-3">
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="font-display text-lg font-semibold text-card-foreground">Review Your Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: "Client", value: form.clientName || "—" },
                    { label: "Email", value: form.clientEmail || "—" },
                    { label: "Project", value: form.projectTitle || "—" },
                    { label: "Industry", value: form.industry || "—" },
                    { label: "Type", value: form.projectType || "—" },
                    { label: "Budget", value: form.budgetAmount ? `${getCurrencyByCode(form.budgetCurrency).symbol}${Number(form.budgetAmount).toLocaleString()}` : "—" },
                    { label: "Timeline", value: form.timeline || "—" },
                    { label: "Tone", value: form.tone || "—" },
                    { label: "Mode", value: form.proposalMode === "sales_pitch" ? "🎯 Sales Pitch" : "📄 Formal Proposal" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-secondary/50 p-3">
                      <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{item.label}</div>
                      <div className="text-sm font-medium text-card-foreground mt-0.5 capitalize">{item.value}</div>
                    </div>
                  ))}
                </div>
                {form.description && (
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Description</div>
                    <div className="text-sm text-card-foreground mt-0.5">{form.description}</div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between mt-8">
              <Button variant="ghost" onClick={prev} disabled={currentStep === 0} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button variant="hero" onClick={next} className="gap-2">
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="hero" onClick={handleGenerate} disabled={isGenerating} className="gap-2">
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isGenerating ? "Generating..." : "Generate Proposal"}
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {isGenerating ? "Crafting your proposal..." : "Your Proposal"}
                {!isGenerating && (
                  <Badge className={form.proposalMode === "sales_pitch" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15" : "bg-secondary text-muted-foreground hover:bg-secondary"}>
                    {form.proposalMode === "sales_pitch" ? "🎯 Sales Pitch" : "📄 Formal Proposal"}
                  </Badge>
                )}
              </h2>
              {!isGenerating && generatedProposal && (
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => { setGeneratedProposal(null); setCurrentStep(0); setForm(initialForm); }}>
                    Start Over
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(generatedProposal).then(() => toast.success("Copied!"))}>
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => exportProposalAsPdf(form.projectTitle || "Proposal", generatedProposal)}>
                    <Download className="h-4 w-4" /> PDF
                  </Button>
                  <Button variant="hero" size="sm" onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isSaving ? "Saving..." : "Save Proposal"}
                  </Button>
                </div>
              )}
            </div>

            {isGenerating && (
              <div className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-primary font-medium">Crafting your proposal...</span>
              </div>
            )}

            <div className="grid lg:grid-cols-4 gap-6">
              {/* Proposal Preview */}
              <div className="lg:col-span-3">
                {(() => {
                  const theme = getThemeById(appearance.theme);
                  return (
                    <div
                      className="rounded-xl border p-6 sm:p-8 transition-colors"
                      style={{
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                        color: theme.bodyText,
                      }}
                    >
                      <pre
                        className="whitespace-pre-wrap text-sm leading-relaxed"
                        style={{
                          fontFamily: appearance.fontStyle === "modern" ? "'Syne', 'DM Sans', sans-serif" :
                            appearance.fontStyle === "classic" ? "'Playfair Display', 'Lora', serif" :
                            appearance.fontStyle === "clean" ? "'DM Sans', sans-serif" :
                            "'Syne', sans-serif",
                          color: theme.bodyText,
                        }}
                      >
                        {generatedProposal || ""}
                        {isGenerating && (
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="inline-block w-2 h-4 ml-0.5 align-middle"
                            style={{ backgroundColor: theme.accent }}
                          />
                        )}
                      </pre>
                    </div>
                  );
                })()}
              </div>

              {/* Customizer Panel */}
              {!isGenerating && generatedProposal && (
                <div className="lg:col-span-1">
                  <div className="rounded-xl border border-border bg-card p-4 sticky top-20">
                    <ProposalCustomizer settings={appearance} onChange={setAppearance} />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </AuthLayout>
  );
}
