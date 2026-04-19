import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Brain, Upload, FileText, Check, X, 
  ArrowRight, Loader2, Lock, ChevronRight,
  TrendingUp, Award, BarChart3, Info
} from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { cn } from "@/lib/utils";

// Initialize pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface AnalysisResult {
  score: number;
  grade: string;
  summary: string;
  strengths: { point: string; why: string }[];
  weaknesses: { point: string; why: string }[];
  suggestions: {
    section: string;
    issue: string;
    fix: string;
    priority: "high" | "medium" | "low";
  }[];
}

interface WinRateInsights {
  winRate: number;
  totalAnalyzed: number;
  patterns: { title: string; detail: string }[];
  topRecommendation: string;
}

export default function StrategyCoach() {
  const [activeTab, setActiveTab] = useState<"analyze" | "insights">("analyze");
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  
  const isPro = profile?.plan === 'pro';

  return (
    <AuthLayout>
      <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8 font-body min-h-screen bg-[#08080F]">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="font-display font-syne font-[800] text-[28px] text-white tracking-tight">Strategy Coach</h1>
          <p className="text-muted-foreground text-[16px]">Improve your pitches. Close more deals.</p>
        </div>

        {/* Tab Pills */}
        <div className="flex bg-[#121225] p-1 rounded-2xl w-fit border border-white/5">
          <button
            onClick={() => setActiveTab("analyze")}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === "analyze" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
            )}
          >
            Analyze a Pitch
          </button>
          <button
            onClick={() => setActiveTab("insights")}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === "insights" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
            )}
          >
            Win-Rate Insights
          </button>
        </div>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            {!isPro ? (
              <UpgradeWall tab={activeTab} />
            ) : activeTab === "analyze" ? (
              <AnalyzeTab key="analyze" />
            ) : (
              <InsightsTab key="insights" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </AuthLayout>
  );
}

function UpgradeWall({ tab }: { tab: string }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto"
    >
      <div className="h-20 w-20 bg-primary/10 rounded-[32px] flex items-center justify-center mb-8 border border-primary/20">
        <Lock className="h-10 w-10 text-primary" />
      </div>
      <h2 className="font-display font-syne font-[800] text-3xl text-white mb-4">
        {tab === "analyze" ? "Pitch Analysis" : "Win-Rate Insights"} is a Pro Feature
      </h2>
      <p className="text-muted-foreground mb-10 leading-relaxed">
        {tab === "analyze" 
          ? "Upload any proposal and get an instant AI score out of 100 with specific suggestions on how to improve it before sending."
          : "Analyze your patterns of success and failure. Discover what makes you win and get high-impact recommendations based on your data."}
      </p>
      <Button 
        variant="hero" 
        size="lg" 
        className="w-full h-14 rounded-2xl text-lg font-bold"
        onClick={() => navigate('/checkout')}
      >
        Upgrade to Pro — $12/mo
      </Button>
    </motion.div>
  );
}

function AnalyzeTab() {
  const [option, setOption] = useState<"upload" | "paste">("upload");
  const [proposalText, setProposalText] = useState("");
  const [fileName, setFileName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const navigate = useNavigate();

  const loadingMessages = [
    "Reading your proposal...",
    "Analyzing structure and persuasiveness...",
    "Generating suggestions...",
  ];

  // Logic for cycling messages
  useState(() => {
    let interval: any;
    if (analyzing) {
      interval = setInterval(() => {
        setLoadingMessageIdx(prev => (prev + 1) % loadingMessages.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File must be under 10MB.');
      return;
    }

    setFileName(file.name);
    try {
      setExtracting(true);

      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const textValue = await file.text();
        setProposalText(textValue);
        toast.success('File loaded successfully.');
        return;
      }

      if (file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n';
        }

        setProposalText(fullText.trim());
        toast.success('PDF loaded successfully.');
        return;
      }

      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        const mammothModule = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammothModule.extractRawText({ arrayBuffer });
        setProposalText(result.value);
        toast.success('Document loaded successfully.');
        return;
      }

      toast.error('Unsupported file type. Please use PDF, Word, or text files.');

    } catch (err) {
      console.error('File extraction error:', err);
      toast.error('Could not read the file. Try pasting the text instead.');
    } finally {
      setExtracting(false);
    }
  };

  const analyzePitch = async () => {
    if (!proposalText || proposalText.trim().length < 50) {
      toast.error('Please provide a proposal text of at least 50 characters.');
      return;
    }

    try {
      setAnalyzing(true);
      setAnalysisResult(null);
      setAnalysisError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        toast.error('Please sign in to continue.');
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        'analyze-pitch',
        {
          body: {
            proposalText: proposalText.trim()
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      if (error) {
        console.error('Analysis invoke error:', error);
        setAnalysisError(error.message || 'Analysis failed. Please try again.');
        toast.error(error.message || 'Analysis failed. Please try again.');
        return;
      }

      if (!data) {
        setAnalysisError('No response received. Please try again.');
        return;
      }

      if (data.error === 'upgrade_required') {
        toast.error('Upgrade to Pro to use this feature.');
        navigate('/checkout');
        return;
      }

      if (data.error) {
        setAnalysisError(data.message || 'Analysis failed.');
        toast.error(data.message || 'Analysis failed.');
        return;
      }

      if (!data.analysis) {
        setAnalysisError('Analysis result was empty. Please try again.');
        return;
      }

      setAnalysisResult(data.analysis);

      setTimeout(() => {
        document.getElementById('analysis-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      console.error('Analysis exception:', err);
      setAnalysisError('Something went wrong. Please try again.');
      toast.error('Something went wrong. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="space-y-4">
        <h3 className="font-dm font-[600] text-[16px] text-white">Upload or paste your proposal</h3>
        
        {/* Input Option Selection */}
        <div className="flex gap-1 bg-[#121225] p-1 rounded-xl w-fit border border-white/5">
          <button 
            onClick={() => setOption("upload")}
            className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", option === "upload" ? "bg-white/10 text-white" : "text-muted-foreground")}
          >
            Upload File
          </button>
          <button 
            onClick={() => setOption("paste")}
            className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", option === "paste" ? "bg-white/10 text-white" : "text-muted-foreground")}
          >
            Paste Text
          </button>
        </div>

        {option === "upload" ? (
          <div className="relative">
            <label className="flex flex-col items-center justify-center w-full h-[180px] border-2 border-dashed border-[#2A2A45] rounded-[16px] bg-[#141428] cursor-pointer hover:bg-[#1A1A32] transition-all overflow-hidden group">
              {!fileName ? (
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                  <Upload className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-dm font-[400] text-secondary">Drop your proposal here</p>
                    <p className="text-[12px] text-muted-foreground">or click to browse</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 px-6">
                  <FileText className="h-10 w-10 text-primary" />
                  <div className="text-left min-w-0">
                    <p className="text-sm font-bold text-white truncate max-w-[200px]">{fileName}</p>
                    <button onClick={(e) => { e.preventDefault(); setFileName(""); setProposalText(""); }} className="text-[11px] text-destructive font-bold uppercase tracking-wider hover:underline mt-1">Remove</button>
                  </div>
                </div>
              )}
              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} />
            </label>
            <p className="text-[11px] text-muted-foreground mt-2 px-1">Accepted: .pdf, .docx, .txt (Max 10MB)</p>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              className="w-full min-h-[280px] bg-[#0E0E1A] border-1.5 border-[#2A2A45] rounded-[14px] p-4 font-dm text-sm text-[#EEEEFF] placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all resize-none"
              placeholder="Paste your proposal text here... The AI will analyze it and suggest improvements."
              value={proposalText}
              onChange={(e) => setProposalText(e.target.value)}
            />
            <div className="text-right text-[11px] text-muted-foreground font-mono">
              {proposalText.length} characters
            </div>
          </div>
        )}

        <Button 
          variant="hero" 
          size="lg" 
          className="w-full h-14 rounded-2xl text-[16px] font-bold"
          disabled={!proposalText || analyzing || extracting}
          onClick={analyzePitch}
        >
          {analyzing || extracting ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{extracting ? "Extracting text..." : loadingMessages[loadingMessageIdx]}</span>
            </div>
          ) : (
            "Analyze My Pitch →"
          )}
        </Button>
      </div>

      {analysisError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
          {analysisError}
        </div>
      )}

      {analysisResult && <AnalysisResults result={analysisResult} onReset={() => { setAnalysisResult(null); setProposalText(""); setFileName(""); }} />}
    </div>
  );
}

function AnalysisResults({ result, onReset }: { result: AnalysisResult, onReset: () => void }) {
  const gradeColors: Record<string, string> = {
    A: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    B: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    C: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    D: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    F: "text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <motion.div 
      id="analysis-results"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      {/* Score Card */}
      <div className="relative rounded-[40px] bg-gradient-to-br from-primary to-accent p-12 text-center overflow-hidden shadow-2xl shadow-primary/20 clay-style">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-baseline justify-center gap-2">
            <span className="font-display font-syne font-[800] text-[72px] text-white leading-none">{result.score}</span>
            <span className="font-dm font-[400] text-[24px] text-white/70">/ 100</span>
          </div>
          <div className={cn("inline-flex items-center px-6 py-2 rounded-full border text-2xl font-black mx-auto", gradeColors[result.grade] || "text-white")}>
            GRADE {result.grade}
          </div>
          <p className="max-w-[480px] mx-auto text-white/85 font-dm font-[400] text-[15px] leading-relaxed">
            {result.summary}
          </p>
        </div>
      </div>

      {/* Strengths */}
      <div className="space-y-6">
        <h3 className="font-display font-syne font-[700] text-[16px] text-[#4EEAA0]">What is working ✓</h3>
        <div className="grid gap-4">
          {result.strengths.map((s, i) => (
            <div key={i} className="bg-[#4EEAA0]/[0.05] border-l-4 border-[#4EEAA0] rounded-xl p-5 space-y-1">
              <p className="font-dm font-[600] text-[14px] text-[#EEEEFF]">{s.point}</p>
              <p className="font-dm font-[400] text-[13px] text-[#8888AA]">{s.why}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weaknesses */}
      <div className="space-y-6">
        <h3 className="font-display font-syne font-[700] text-[16px] text-[#FF6B8A]">What needs improvement ✗</h3>
        <div className="grid gap-4">
          {result.weaknesses.map((w, i) => (
            <div key={i} className="bg-[#FF6B8A]/[0.05] border-l-4 border-[#FF6B8A] rounded-xl p-5 space-y-1">
              <p className="font-dm font-[600] text-[14px] text-[#EEEEFF]">{w.point}</p>
              <p className="font-dm font-[400] text-[13px] text-[#8888AA]">{w.why}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="space-y-6">
        <h3 className="font-display font-syne font-[700] text-[16px] text-[#EEEEFF]">Specific improvements to make</h3>
        <div className="grid gap-6">
          {result.suggestions.map((s, i) => (
            <div key={i} className="relative bg-[#121225] border border-white/5 rounded-2xl p-6 space-y-3 shadow-xl">
              <div className={cn(
                "absolute top-6 right-6 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                s.priority === 'high' ? "bg-red-500/20 text-red-400" :
                s.priority === 'medium' ? "bg-amber-500/20 text-amber-400" :
                "bg-slate-500/20 text-slate-400"
              )}>
                {s.priority} priority
              </div>
              <div className="font-mono text-[10px] text-primary uppercase font-black">{s.section}</div>
              <div className="font-dm font-[600] text-[14px] text-[#EEEEFF] pr-20">{s.issue}</div>
              <div className="bg-[#1A1A32] border border-white/5 rounded-xl p-4 font-dm font-[400] text-[13px] text-[#8888AA]">
                <span className="text-white font-[500] block mb-1">Recommended Fix:</span>
                {s.fix}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button 
        variant="ghost" 
        className="w-full text-muted-foreground hover:text-white"
        onClick={() => { onReset(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      >
        Analyze Another Proposal
      </Button>
    </motion.div>
  );
}

function InsightsTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch Proposals to check if we have enough data (Won/Lost)
  const { data: proposals = [], isLoading: isLoadingProposals } = useQuery({
    queryKey: ['proposals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('id, title, client_name, project_type, budget, status, created_at')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const outcomes = proposals.filter(p => ['won', 'lost'].includes(p.status));
  const hasEnoughData = outcomes.length >= 5;

  // Fetch or trigger insights
  const { data: insights, isLoading: isFetchingInsights, refetch } = useQuery({
    queryKey: ['win-rate-insights', user?.id],
    queryFn: async () => {
      const won = outcomes.filter(o => o.status === 'won');
      const lost = outcomes.filter(o => o.status === 'lost');

      const { data, error } = await supabase.functions.invoke("win-rate-coach", {
        body: { 
          wonProposals: won.map(p => ({ title: p.title, budget: p.budget, type: p.project_type, date: p.created_at })),
          lostProposals: lost.map(p => ({ title: p.title, budget: p.budget, type: p.project_type, date: p.created_at }))
        },
      });
      if (error) throw error;
      return data as WinRateInsights;
    },
    enabled: hasEnoughData && !!user?.id,
  });

  if (isLoadingProposals) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  if (!hasEnoughData) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
        <div className="h-20 w-20 bg-primary/10 rounded-[32px] flex items-center justify-center mb-8 border border-primary/20">
          <BarChart3 className="h-10 w-10 text-primary" />
        </div>
        <h2 className="font-display font-syne font-[800] text-2xl text-white mb-2">Not enough data yet</h2>
        <p className="text-muted-foreground mb-8 text-sm">
          Mark at least 5 proposals as Won or Lost in your Client Pipeline to activate insights.
        </p>
        
        <div className="w-full space-y-4 mb-10 text-left">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-[#8888AA]">
            <span>Progress</span>
            <span>{outcomes.length} of 5</span>
          </div>
          <div className="h-2 w-full bg-[#121225] rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(outcomes.length / 5) * 100}%` }}
              className="h-full bg-primary" 
            />
          </div>
        </div>

        <Button variant="ghost" className="text-primary font-bold gap-2" onClick={() => navigate('/crm')}>
          Go to Pipeline <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    );
  }

  if (isFetchingInsights) return <div className="py-20 flex flex-col items-center gap-4 text-muted-foreground font-bold"><Loader2 className="h-8 w-8 animate-spin" /><span>Extracting patterns from your history...</span></div>;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-12 pb-20"
    >
      {/* Rate Card */}
      <div className="flex flex-col items-center text-center space-y-2 py-8">
        <div className="font-display font-syne font-[800] text-[64px] text-white leading-none">{insights?.winRate}%</div>
        <div className="text-muted-foreground font-bold uppercase tracking-widest text-[13px]">Win Rate</div>
        <div className="text-[11px] text-muted-foreground opacity-60">Based on your last {insights?.totalAnalyzed} proposals</div>
        
        <div className={cn(
          "mt-4 font-dm font-[600] text-sm",
          insights!.winRate >= 50 ? "text-[#4EEAA0]" :
          insights!.winRate >= 30 ? "text-[#FFD166]" :
          "text-[#FF6B8A]"
        )}>
          {insights!.winRate >= 50 ? "Above average" : insights!.winRate >= 30 ? "Room to improve" : "Needs attention"}
        </div>
      </div>

      {/* Patterns */}
      <div className="space-y-6">
        <h3 className="font-display font-syne font-[700] text-[18px] text-white">What the data shows about your pitches</h3>
        <div className="grid gap-4">
          {insights?.patterns.map((p, i) => (
            <div key={i} className="bg-[#141428] border border-[#2A2A45] border-l-4 border-l-primary rounded-xl p-6 space-y-1">
              <div className="font-dm font-[600] text-[15px] text-[#EEEEFF] leading-tight">{p.title}</div>
              <div className="font-dm font-[400] text-[13px] text-[#8888AA]">{p.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Recommendation */}
      <div className="bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 rounded-2xl p-10 flex flex-col items-center text-center space-y-4">
        <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
          <Award className="h-6 w-6 text-white" />
        </div>
        <div className="space-y-2">
          <h4 className="font-syne font-black text-white text-lg pr-1">Your #1 focus right now</h4>
          <p className="font-dm font-[400] text-[15px] text-[#EEEEFF] max-w-[560px] leading-relaxed mx-auto">
            {insights?.topRecommendation}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button variant="ghost" className="text-muted-foreground hover:text-white" onClick={() => refetch()}>
          Refresh Insights
        </Button>
        <div className="text-[11px] text-muted-foreground opacity-50 flex items-center gap-1.5">
          <Info className="h-3 w-3" />
          Last updated: Just now
        </div>
      </div>
    </motion.div>
  );
}
