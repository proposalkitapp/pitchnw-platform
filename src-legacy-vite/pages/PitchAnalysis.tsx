import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Brain, Sparkles, CheckCircle2, AlertCircle, 
  HelpCircle, Zap, TrendingUp, ShieldCheck, Info, ChevronRight,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface Analysis {
  id: string;
  overall_score: number;
  grade: string;
  category_scores: {
    clarity: number;
    persuasiveness: number;
    professionalism: number;
    value_proposition: number;
    pricing_presentation: number;
    call_to_action: number;
  };
  strengths: Array<{ point: string; impact: string }>;
  weaknesses: Array<{ point: string; impact: string }>;
  suggestions: Array<{ section: string; issue: string; fix: string; priority: "high" | "medium" | "low" }>;
  summary: string;
}

export default function PitchAnalysis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const { data: proposal } = useQuery({
    queryKey: ['proposal', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', id)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const { data: analysis, refetch: refetchAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['analysis', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('pitch_analyses')
        .select('*')
        .eq('proposal_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as unknown as Analysis | null;
    },
    enabled: !!id,
  });

  const isFreelancer = profile?.plan === 'pro';

  if (profile && !isFreelancer) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md bg-card p-12 rounded-[40px] shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Zap className="h-24 w-24 text-primary" />
            </div>
            <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h2 className="font-display font-black text-3xl text-foreground mb-4 leading-tight">Elite Pitch Intelligence</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed font-medium">
              Pitch Analysis is a <span className="text-primary font-bold">Freelancer</span> exclusive feature. 
              Know exactly what to fix before your client reads your proposal with AI-driven scoring.
            </p>
            <Button 
               className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all"
               onClick={() => navigate('/checkout')}
            >
              Get Freelancer Access
            </Button>
            <Button variant="ghost" className="mt-4 text-muted-foreground font-bold" onClick={() => navigate('/dashboard')}>
                Return to Dashboard
            </Button>
          </motion.div>
        </div>
      </AuthLayout>
    );
  }

  const handleRunAnalysis = async () => {
    if (!proposal) return;
    setIsAnalyzing(true);
    const tid = toast.loading("Analyzing your pitch...");

    try {
      const { data, error } = await supabase.functions.invoke('analyze-pitch', {
        body: {
          proposalId: id,
          proposalText: proposal.generated_content
        }
      });

      if (error) throw error;
      
      toast.success("Analysis complete!", { id: tid });
      refetchAnalysis();
    } catch (err: any) {
      console.error("Analysis Error:", err);
      toast.error(err.message || "Failed to analyze pitch", { id: tid });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#4EEAA0"; // green
    if (score >= 75) return "#7C6FF7"; // blue
    if (score >= 60) return "#FFD166"; // amber
    if (score >= 45) return "#F97B6B"; // orange
    return "#FF6B8A"; // red
  };

  const scoreColor = analysis ? getScoreColor(analysis.overall_score) : "#eee";

  return (
    <AuthLayout>
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-[#0033ff] transition-colors mb-4 text-sm font-medium">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <h1 className="font-syne font-extrabold text-4xl text-slate-900">Pitch Analysis</h1>
            <p className="text-slate-500 mt-1">{proposal?.title || "Loading proposal..."}</p>
          </div>
          {analysis && !isAnalyzing && (
            <Button onClick={handleRunAnalysis} variant="outline" className="rounded-full gap-2 text-slate-600 border-slate-200">
              <Sparkles className="h-4 w-4 text-[#7C6FF7]" /> Re-analyze
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {analysisLoading || isAnalyzing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="h-24 w-24 rounded-full border-4 border-slate-100 border-t-[#7C6FF7]"
                />
                <Brain className="h-10 w-10 text-[#7C6FF7] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{isAnalyzing ? "Analyzing your pitch..." : "Checking for existing analysis..."}</h2>
              <p className="text-slate-500 mt-2">Evaluating persuasiveness and clarity...</p>
            </motion.div>
          ) : !analysis ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-100 rounded-[32px] p-12 text-center shadow-[0_10px_30px_rgba(0,0,0,0.02)]"
            >
              <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="h-10 w-10 text-[#7C6FF7]" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Analyze This Pitch</h2>
              <p className="text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed">
                Our AI will score your proposal out of 100 and tell you exactly what to fix to increase your chances of closing this deal.
              </p>
              <Button 
                onClick={handleRunAnalysis}
                className="h-14 bg-[#0033ff] hover:bg-[#002be6] text-white px-10 rounded-2xl font-bold shadow-[0_10px_20px_rgba(0,51,255,0.2)]"
              >
                Run Analysis →
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-10"
            >
              {/* Score ring */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative h-48 w-48">
                  <svg className="h-48 w-48 -rotate-90">
                    <circle
                      cx="96" cy="96" r="88"
                      fill="none" stroke="#f1f5f9" strokeWidth="12"
                    />
                    <motion.circle
                      cx="96" cy="96" r="88"
                      fill="none" stroke={scoreColor} strokeWidth="12"
                      strokeDasharray="552.92"
                      initial={{ strokeDashoffset: 552.92 }}
                      animate={{ strokeDashoffset: 552.92 - (552.92 * analysis.overall_score) / 100 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-5xl font-black text-slate-900"
                    >
                      {analysis.overall_score}
                    </motion.div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Out of 100</div>
                  </div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, type: "spring" }}
                    className="absolute -top-2 -right-2 h-12 w-12 rounded-full shadow-lg flex items-center justify-center font-black text-xl text-white"
                    style={{ backgroundColor: scoreColor }}
                  >
                    {analysis.grade}
                  </motion.div>
                </div>
                
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="mt-8 text-center text-slate-600 max-w-[600px] text-lg font-medium leading-relaxed italic"
                >
                  "{analysis.summary}"
                </motion.p>
              </div>

              {/* Category scores */}
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 bg-slate-50/50 p-8 rounded-[32px] border border-slate-100">
                {Object.entries(analysis.category_scores).map(([key, value], i) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                      <span>{key.replace(/_/g, ' ')}</span>
                      <span>{value}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: scoreColor }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> What is Working For You
                  </h3>
                  <div className="space-y-4">
                    {analysis.strengths.map((s, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5 + (i * 0.1) }}
                        key={i} 
                        className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl"
                      >
                        <div className="font-bold text-emerald-900 text-[15px]">{s.point}</div>
                        <div className="text-emerald-700/70 text-sm mt-1">{s.impact}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                    <span className="text-rose-500">✗</span> What is Hurting Your Conversion
                  </h3>
                  <div className="space-y-4">
                    {analysis.weaknesses.map((w, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5 + (i * 0.1) }}
                        key={i} 
                        className="bg-rose-50/50 border border-rose-100 p-5 rounded-2xl"
                      >
                        <div className="font-bold text-rose-900 text-[15px]">{w.point}</div>
                        <div className="text-rose-700/70 text-sm mt-1">{w.impact}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="space-y-6">
                <h3 className="font-bold text-xl text-slate-900">How to Improve This Pitch</h3>
                <div className="space-y-4">
                  {analysis.suggestions
                    .sort((a,b) => {
                      const order = { high: 0, medium: 1, low: 2 };
                      return order[a.priority] - order[b.priority];
                    })
                    .map((s, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2 + (i * 0.1) }}
                      key={i} 
                      className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div className={`absolute top-0 left-0 h-full w-1 ${
                        s.priority === 'high' ? 'bg-rose-500' : s.priority === 'medium' ? 'bg-amber-400' : 'bg-slate-300'
                      }`} />
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                            s.priority === 'high' ? 'bg-rose-100 text-rose-600' : s.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {s.priority} Priority
                          </span>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.section}</span>
                        </div>
                      </div>
                      <div className="font-bold text-slate-900 mb-2">{s.issue}</div>
                      <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-[15px] border border-slate-100">
                        <span className="text-[11px] font-black text-slate-400 uppercase block mb-2">Recommended Fix:</span>
                        {s.fix}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="pt-10 flex flex-col items-center">
                <Button 
                  size="lg"
                  className="bg-[#0033ff] hover:bg-[#002be6] text-white px-12 h-14 rounded-2xl font-bold shadow-[0_10px_20px_rgba(0,51,255,0.2)]"
                  onClick={() => navigate(`/generate?edit=${id}`)}
                >
                  Apply These Changes
                </Button>
                <p className="text-slate-400 text-xs mt-4">This will open the proposal generator in edit mode</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}
