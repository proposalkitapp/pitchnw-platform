import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Sparkles, AlertTriangle, HelpCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function PitchReview() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    if (id && user) {
      fetchSubmission();
    }
  }, [id, user]);

  const fetchSubmission = async () => {
    const { data, error } = await (supabase.from as any)('pitch_submissions')
      .select('*, pitch_decks(*)')
      .eq('id', id)
      .single();
      
    if (error || !data) {
      toast.error('Submission not found');
      navigate('/investor');
    } else {
      setSubmission(data);
    }
    setLoading(false);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    toast.loading("Analyzing pitch...", { id: "analyze" });
    try {
      let deckContent = '';
      if (submission.pitch_decks) {
         deckContent = `Title: ${submission.pitch_decks.title}\nTranscript: ${submission.pitch_decks.transcript || 'None'}\nSlides: ${JSON.stringify(submission.pitch_decks.slides)}`;
      } else if (submission.pitch_deck_url) {
         deckContent = `Deck URL: ${submission.pitch_deck_url}`;
      }

      const { data, error } = await supabase.functions.invoke('analyze-pitch', {
        body: { 
          deckContent,
          companyName: submission.company_name,
          askAmount: submission.ask_amount
        }
      });
      
      if (error) throw error;
      
      setAnalysis(data);
      toast.success("Analysis complete!", { id: "analyze" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Analysis failed", { id: "analyze" });
    } finally {
      setAnalyzing(false);
    }
  };

  const updateStatus = async (status: string) => {
    const { error } = await (supabase.from as any)('pitch_submissions').update({ status }).eq('id', submission.id);
    if (!error) {
      setSubmission({ ...submission, status });
      toast.success(`Status updated to ${status}`);
    }
  };

  if (loading) return <AuthLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div></AuthLayout>;

  return (
    <AuthLayout>
      <div className="flex h-[calc(100vh-80px)] font-body bg-slate-50">
        {/* Main Content (Deck Viewer) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/investor')} className="text-slate-400 hover:text-slate-900 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="font-bold font-display text-lg">{submission.company_name}</h1>
                <p className="text-xs text-slate-500 font-mono">Ask: {submission.ask_amount || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {['new', 'reviewing', 'meeting', 'passed'].map(s => (
                <button 
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all ${submission.status === s ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 bg-slate-100 p-8 overflow-y-auto flex items-start justify-center">
             {/* Mock Pitch Viewer */}
             {submission.pitch_deck_url ? (
               <div className="w-full max-w-4xl aspect-video bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-200 overflow-hidden">
                 <iframe src={submission.pitch_deck_url} className="w-full h-full border-none" title="Pitch Deck" />
               </div>
             ) : submission.pitch_decks ? (
               <div className="w-full max-w-4xl aspect-video bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-200 flex-col p-12 text-center">
                 <h2 className="text-4xl font-bold font-display mb-4">{submission.pitch_decks.title}</h2>
                 <p className="text-slate-500 max-w-lg mx-auto">{submission.pitch_decks.transcript || "No transcript provided."}</p>
               </div>
             ) : (
               <div className="text-center py-20 text-slate-400">No deck available</div>
             )}
          </div>
        </div>

        {/* AI Assistant Panel */}
        <div className="w-[400px] border-l border-slate-200 bg-white flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10 shrink-0">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold font-display text-lg flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI Assistant
            </h2>
            <p className="text-xs text-slate-500 mb-4">Let AI review the deck to surface key insights and red flags before your meeting.</p>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {analyzing ? 'Analyzing Deck...' : 'Analyze Pitch'}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!analysis && !analyzing && (
              <div className="text-center py-12">
                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400 font-medium">Run analysis to see insights</p>
              </div>
            )}
            
            {analysis && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Key Strengths
                  </h3>
                  <ul className="space-y-2">
                    {analysis.strengths?.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-slate-700 bg-green-50 p-3 rounded-lg border border-green-100">{s}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Potential Red Flags
                  </h3>
                  <ul className="space-y-2">
                    {analysis.redFlags?.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-slate-700 bg-amber-50 p-3 rounded-lg border border-amber-100">{s}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-blue-500" /> Questions to Ask
                  </h3>
                  <ul className="space-y-2">
                    {analysis.questions?.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-slate-700 bg-blue-50 p-3 rounded-lg border border-blue-100">{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
