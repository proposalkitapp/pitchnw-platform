import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { AuthLayout } from '@/components/AuthLayout';
import { toast } from 'sonner';
import { Loader2, Briefcase, ChevronRight, Inbox, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  'new': { icon: Inbox, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'reviewing': { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  'passed': { icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-500/10' },
  'meeting': { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' }
};

export default function InvestorDashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (user && profile?.role === 'investor') {
      fetchSubmissions();
    }
  }, [user, profile]);

  const fetchSubmissions = async () => {
    const { data, error } = await (supabase.from as any)('pitch_submissions')
      .select('*')
      .eq('investor_id', user?.id)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setSubmissions(data);
    }
    setLoading(false);
  };

  if (profileLoading || loading) return <AuthLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div></AuthLayout>;

  if (profile?.role !== 'investor') {
    return (
      <AuthLayout>
        <div className="py-20 text-center flex flex-col items-center">
          <Briefcase className="h-12 w-12 text-slate-300 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Investor Access Only</h2>
          <p className="text-slate-500 mb-6">Your account is not configured as an investor profile.</p>
          <button onClick={() => navigate('/dashboard')} className="text-primary font-bold hover:underline">Return to Dashboard</button>
        </div>
      </AuthLayout>
    );
  }

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter);

  return (
    <AuthLayout>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-slate-900 mb-2">Deal Flow Pipeline</h1>
            <p className="text-slate-500">Review and manage incoming pitch submissions.</p>
          </div>
        </div>

        <div className="flex gap-2 mb-8 border-b border-slate-200 pb-4 overflow-x-auto">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All Pitches</button>
          <button onClick={() => setFilter('new')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === 'new' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>New</button>
          <button onClick={() => setFilter('reviewing')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === 'reviewing' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>Reviewing</button>
          <button onClick={() => setFilter('meeting')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === 'meeting' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>Meeting Scheduled</button>
          <button onClick={() => setFilter('passed')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === 'passed' ? 'bg-slate-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Passed</button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
            <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">No pitches found</h3>
            <p className="text-slate-500">Share your investor submission link to start receiving pitches.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(sub => {
              const StatusIcon = STATUS_CONFIG[sub.status as keyof typeof STATUS_CONFIG]?.icon || Inbox;
              const statusColor = STATUS_CONFIG[sub.status as keyof typeof STATUS_CONFIG]?.color || 'text-slate-500';
              const statusBg = STATUS_CONFIG[sub.status as keyof typeof STATUS_CONFIG]?.bg || 'bg-slate-100';

              return (
                <div 
                  key={sub.id} 
                  onClick={() => navigate(`/investor/pitch/${sub.id}`)}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${statusBg}`}>
                      <StatusIcon className={`h-6 w-6 ${statusColor}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors">{sub.company_name}</h3>
                      <div className="flex items-center gap-3 text-sm mt-1">
                        <span className="font-semibold text-slate-700">{sub.ask_amount || 'Amount not specified'}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">{new Date(sub.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${statusBg} ${statusColor}`}>
                      {sub.status}
                    </span>
                    <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
