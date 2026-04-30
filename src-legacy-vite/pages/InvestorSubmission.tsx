import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Briefcase, Link as LinkIcon, DollarSign, Send } from 'lucide-react';

export default function InvestorSubmission() {
  const [companyName, setCompanyName] = useState('');
  const [deckUrl, setDeckUrl] = useState('');
  const [askAmount, setAskAmount] = useState('');
  const [investorEmail, setInvestorEmail] = useState(''); // To lookup investor_id
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || (!deckUrl && !investorEmail)) return;

    setSubmitting(true);
    
    // Lookup investor by email (in a real app, the URL might have an investor slug)
    // For demo, we just find any investor profile or the specific one
    let investorId = null;
    if (investorEmail) {
      // @ts-ignore - email and role columns might not be in generated types yet
      const { data: profiles } = await supabase.from('profiles').select('id, role').eq('email', investorEmail).eq('role', 'investor').single();
      if (profiles) investorId = (profiles as any).id;
    }

    if (!investorId) {
      // Fallback: just insert without investor_id and let an admin assign, or fail.
      toast.error("Investor not found. Please check the email.");
      setSubmitting(false);
      return;
    }

    const { error } = await (supabase.from as any)('pitch_submissions').insert({
      investor_id: investorId,
      company_name: companyName,
      pitch_deck_url: deckUrl,
      ask_amount: askAmount,
      status: 'new'
    });

    if (error) {
      toast.error('Failed to submit pitch.');
    } else {
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center border border-slate-100">
          <div className="h-20 w-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900 mb-2">Pitch Submitted!</h2>
          <p className="text-slate-500 mb-8">The investor has received your deck. They will be in touch if there's a fit.</p>
          <Button className="w-full bg-primary font-bold h-12" onClick={() => setSubmitted(false)}>Submit Another</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-body">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-primary/5 p-8 text-center border-b border-slate-100">
          <div className="h-16 w-16 bg-white text-primary shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Briefcase className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900">Submit Your Pitch</h1>
          <p className="text-sm text-slate-500 mt-2">Send your deck directly to an investor's pipeline.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">Investor Email</label>
            <Input 
              required
              type="email"
              placeholder="investor@fund.com"
              value={investorEmail}
              onChange={(e) => setInvestorEmail(e.target.value)}
              className="bg-slate-50 h-12"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">Company Name</label>
            <Input 
              required
              placeholder="Acme Corp"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="bg-slate-50 h-12"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-slate-400" /> Deck URL
            </label>
            <Input 
              required
              type="url"
              placeholder="https://pitch.com/..."
              value={deckUrl}
              onChange={(e) => setDeckUrl(e.target.value)}
              className="bg-slate-50 h-12"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-400" /> Ask Amount
            </label>
            <Input 
              placeholder="$1.5M Seed"
              value={askAmount}
              onChange={(e) => setAskAmount(e.target.value)}
              className="bg-slate-50 h-12"
            />
          </div>

          <Button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-xl text-lg shadow-lg shadow-primary/20"
          >
            {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Submit Pitch"}
          </Button>
        </form>
      </div>
    </div>
  );
}
