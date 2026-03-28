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
import { Sparkles, FileText, ArrowRight, ArrowLeft, Check, Save, Loader2, Download, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exportProposalAsPdf } from "@/lib/export-pdf";
import { getTemplateById, type Template } from "@/lib/templates";
interface FormData {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  industry: string;
  projectType: string;
  budget: string;
  timeline: string;
  description: string;
  deliverables: string;
  tone: string;
}

const initialForm: FormData = {
  clientName: "",
  clientEmail: "",
  projectTitle: "",
  industry: "",
  projectType: "",
  budget: "",
  timeline: "",
  description: "",
  deliverables: "",
  tone: "professional",
};

const steps = [
  { title: "Client Info", description: "Who is this proposal for?" },
  { title: "Project Details", description: "Describe the project scope" },
  { title: "Preferences", description: "Customize your proposal style" },
  { title: "Generate", description: "Review and generate your proposal" },
];

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

  useEffect(() => {
    if (templateId) {
      const t = getTemplateById(templateId);
      if (t) setActiveTemplate(t);
    }
  }, [templateId]);

  const update = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const next = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedProposal("");
    toast.loading("Generating your proposal...", { id: "gen" });

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-proposal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            formData: form,
            templatePrompt: activeTemplate?.aiPrompt || null,
            templateSections: activeTemplate?.sections || null,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
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
    const { error } = await supabase.from("proposals").insert({
      user_id: user.id,
      title: form.projectTitle || "Untitled Proposal",
      client_name: form.clientName || null,
      client_email: form.clientEmail || null,
      industry: form.industry || null,
      project_type: form.projectType || null,
      budget: form.budget || null,
      timeline: form.timeline || null,
      description: form.description || null,
      deliverables: form.deliverables || null,
      tone: form.tone,
      generated_content: generatedProposal,
      status: "draft",
    });

    if (error) {
      toast.error("Failed to save proposal");
    } else {
      toast.success("Proposal saved ✓");
      navigate("/dashboard");
    }
    setIsSaving(false);
  };

  return (
    <AuthLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
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
        )

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-10 max-w-md mx-auto">
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
                  className={`w-8 sm:w-12 h-0.5 mx-1 transition-colors ${
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
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input id="clientName" placeholder="e.g. Acme Corp" value={form.clientName} onChange={(e) => update("clientName", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input id="clientEmail" type="email" placeholder="client@example.com" value={form.clientEmail} onChange={(e) => update("clientEmail", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
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
                  <Label htmlFor="projectTitle">Project Title</Label>
                  <Input id="projectTitle" placeholder="e.g. Website Redesign" value={form.projectTitle} onChange={(e) => update("projectTitle", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="projectType">Project Type</Label>
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
                  <Label htmlFor="description">Project Description</Label>
                  <Textarea id="description" placeholder="Describe the project goals, requirements, and any special considerations..." rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="deliverables">Key Deliverables</Label>
                  <Textarea id="deliverables" placeholder="List the main deliverables, one per line..." rows={3} value={form.deliverables} onChange={(e) => update("deliverables", e.target.value)} className="mt-1.5" />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <Label htmlFor="budget">Budget Range</Label>
                  <Select value={form.budget} onValueChange={(v) => update("budget", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select budget range" /></SelectTrigger>
                    <SelectContent>
                      {["$500 - $1,000", "$1,000 - $5,000", "$5,000 - $10,000", "$10,000 - $25,000", "$25,000 - $50,000", "$50,000+"].map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeline">Timeline</Label>
                  <Select value={form.timeline} onValueChange={(v) => update("timeline", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select timeline" /></SelectTrigger>
                    <SelectContent>
                      {["1 - 2 weeks", "2 - 4 weeks", "1 - 2 months", "2 - 3 months", "3 - 6 months", "6+ months"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tone">Proposal Tone</Label>
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
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-display text-lg font-semibold text-card-foreground">Review Your Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: "Client", value: form.clientName || "—" },
                    { label: "Email", value: form.clientEmail || "—" },
                    { label: "Project", value: form.projectTitle || "—" },
                    { label: "Industry", value: form.industry || "—" },
                    { label: "Type", value: form.projectType || "—" },
                    { label: "Budget", value: form.budget || "—" },
                    { label: "Timeline", value: form.timeline || "—" },
                    { label: "Tone", value: form.tone || "—" },
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
              </h2>
              {!isGenerating && generatedProposal && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setGeneratedProposal(null);
                      setCurrentStep(0);
                      setForm(initialForm);
                    }}
                  >
                    Start Over
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(generatedProposal).then(() => toast.success("Copied!"))}
                  >
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => exportProposalAsPdf(form.projectTitle || "Proposal", generatedProposal)}
                  >
                    <Download className="h-4 w-4" /> PDF
                  </Button>
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2"
                  >
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

            <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
              <pre className="whitespace-pre-wrap font-body text-sm text-card-foreground leading-relaxed">
                {generatedProposal || ""}
                {isGenerating && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-2 h-4 bg-primary ml-0.5 align-middle"
                  />
                )}
              </pre>
            </div>
          </motion.div>
        )}
      </div>
    </AuthLayout>
  );
}
