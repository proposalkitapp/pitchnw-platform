import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Plus, MonitorPlay, Save, Presentation, FileText, Image as ImageIcon, Layout, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function PitchDeckBuilder() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const navigate = useNavigate();

  const [title, setTitle] = useState('Untitled Pitch Deck');
  const [slides, setSlides] = useState<any[]>([{ id: '1', content: 'Slide 1' }]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [demoLink, setDemoLink] = useState('');
  const [transcript, setTranscript] = useState('');
  const [saving, setSaving] = useState(false);

  if (isLoading) return <AuthLayout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div></AuthLayout>;

  if (profile?.plan !== 'pro') {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 font-body space-y-6">
          <div className="h-20 w-20 bg-primary/10 text-primary rounded-[32px] flex items-center justify-center">
            <Presentation className="h-10 w-10" />
          </div>
          <h2 className="font-display font-black text-3xl">Pitch Decks are a Pro Feature</h2>
          <p className="text-muted-foreground max-w-md leading-relaxed">
            Create stunning, interactive pitch decks with integrated demo videos and transcripts. Upgrade to access the Pitch Deck Builder.
          </p>
          <Button size="lg" className="h-14 px-8 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white" onClick={() => navigate('/checkout')}>
            Upgrade to Pro
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    const { error } = await (supabase.from as any)('pitch_decks').insert({
      user_id: user?.id,
      title,
      slides,
      demo_link: demoLink,
      transcript,
      status: 'draft'
    } as any);

    if (error) {
      toast.error('Failed to save pitch deck');
    } else {
      toast.success('Pitch deck saved!');
    }
    setSaving(false);
  };

  const addSlide = () => {
    const newSlide = { id: Date.now().toString(), content: `Slide ${slides.length + 1}` };
    setSlides([...slides, newSlide]);
    setActiveSlide(slides.length);
  };

  return (
    <AuthLayout>
      <div className="flex flex-col h-[calc(100vh-80px)] font-body bg-[#0f0f13]">
        {/* Topbar */}
        <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-[#18181b]">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 text-primary p-2 rounded-xl">
              <Presentation className="h-5 w-5" />
            </div>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="bg-transparent border-none text-white font-bold font-display text-lg focus-visible:ring-0 w-[300px] hover:bg-white/5"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-slate-400 hover:text-white"><MonitorPlay className="h-4 w-4 mr-2" /> Preview</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-white text-black hover:bg-slate-200 font-bold px-6 rounded-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save Draft
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Slides */}
          <div className="w-64 border-r border-white/10 bg-[#18181b] flex flex-col">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Slides</span>
              <button onClick={addSlide} className="text-slate-400 hover:text-white"><Plus className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {slides.map((s, i) => (
                <div 
                  key={s.id} 
                  onClick={() => setActiveSlide(i)}
                  className={`aspect-video rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center text-xs font-bold ${activeSlide === i ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 bg-[#0f0f13] text-slate-500 hover:border-white/30'}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 bg-[#0f0f13] flex flex-col items-center overflow-y-auto p-12">
            <div className="w-full max-w-4xl aspect-video bg-white rounded-2xl shadow-2xl overflow-hidden relative group">
               {/* Simplified mock canvas */}
               <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                 <Textarea 
                   value={slides[activeSlide]?.content || ''} 
                   onChange={(e) => {
                     const newSlides = [...slides];
                     newSlides[activeSlide].content = e.target.value;
                     setSlides(newSlides);
                   }}
                   className="text-4xl font-bold font-display text-center border-none resize-none bg-transparent shadow-none focus-visible:ring-0 text-slate-800 w-full h-full"
                 />
               </div>
               
               {/* Canvas Tools overlay */}
               <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-full px-4 py-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10"><FileText className="h-4 w-4" /></button>
                 <button className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10"><ImageIcon className="h-4 w-4" /></button>
                 <button className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10"><Layout className="h-4 w-4" /></button>
               </div>
            </div>

            {/* Bottom Meta */}
            <div className="w-full max-w-4xl mt-8 grid grid-cols-2 gap-6">
               <div className="bg-[#18181b] border border-white/5 p-6 rounded-2xl">
                 <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Demo Video Link</label>
                 <Input 
                   value={demoLink} 
                   onChange={(e) => setDemoLink(e.target.value)} 
                   placeholder="https://loom.com/share/..." 
                   className="bg-[#0f0f13] border-white/10 text-white"
                 />
               </div>
               <div className="bg-[#18181b] border border-white/5 p-6 rounded-2xl">
                 <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Presenter Transcript</label>
                 <Textarea 
                   value={transcript} 
                   onChange={(e) => setTranscript(e.target.value)} 
                   placeholder="What will you say on this slide?" 
                   className="bg-[#0f0f13] border-white/10 text-white resize-none"
                 />
               </div>
            </div>
          </div>

          {/* Right Sidebar - Properties */}
          <div className="w-64 border-l border-white/10 bg-[#18181b] p-6 flex flex-col gap-6">
             <div>
               <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Settings className="h-4 w-4" /> Properties</h3>
               <div className="space-y-4">
                 <div>
                   <label className="text-xs text-slate-500 mb-1 block">Background Color</label>
                   <div className="flex gap-2">
                     {['#ffffff', '#f8fafc', '#0f0f13', '#1e1b4b'].map(c => (
                       <button key={c} className="h-6 w-6 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                     ))}
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
