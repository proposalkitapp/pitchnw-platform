import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { AuthLayout } from '@/components/AuthLayout';
import { toast } from 'sonner';
import { Loader2, Plus, Save, GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RoomProvider, useOthers, ClientSideSuspense } from '@liveblocks/react';

const AVAILABLE_SECTIONS = [
  { id: 'executiveSummary', label: 'Executive Summary' },
  { id: 'problemStatement', label: 'Problem Statement' },
  { id: 'proposedSolution', label: 'Proposed Solution' },
  { id: 'scopeOfWork', label: 'Scope of Work' },
  { id: 'timeline', label: 'Project Timeline' },
  { id: 'pricing', label: 'Pricing & Investment' },
  { id: 'investmentJustification', label: 'Why This Investment Makes Sense' },
  { id: 'urgencyStatement', label: 'A Note on Timing' },
  { id: 'callToAction', label: 'Call to Action' }
];

function EditorCollaborationHeader() {
  const others = useOthers();
  const userCount = others.length;
  
  if (userCount === 0) return <div className="text-xs text-slate-400 font-medium flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500"></div> You are the only one editing</div>;
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {others.map(({ connectionId }) => (
          <div key={connectionId} className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] border-2 border-white font-bold">
            U{connectionId % 10}
          </div>
        ))}
      </div>
      <span className="text-xs text-slate-500 font-medium">
        {userCount} other{userCount === 1 ? '' : 's'} here
      </span>
    </div>
  );
}

function SortableItem(props: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600 focus:outline-none">
            <GripVertical className="h-5 w-5" />
          </div>
          <h4 className="font-bold text-slate-700">{props.section.label}</h4>
        </div>
        <button onClick={() => props.onRemove(props.id)} className="text-slate-400 hover:text-red-500 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <Textarea 
        value={props.section.content} 
        onChange={(e) => props.onChange(props.id, e.target.value)} 
        placeholder={`Enter content for ${props.section.label}...`}
        className="min-h-[100px] resize-y"
      />
    </div>
  );
}

export default function ProposalEditor() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const navigate = useNavigate();
  const [title, setTitle] = useState("Untitled Template");
  const [sections, setSections] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (isLoading) return <AuthLayout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div></AuthLayout>;

  if (profile?.plan !== 'pro') {
    toast.error("The Advanced Editor is a Pro feature.");
    navigate('/proposals');
    return null;
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addSection = (sec: any) => {
    setSections([...sections, { ...sec, id: `${sec.id}-${Date.now()}`, content: '' }]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSection = (id: string, content: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, content } : s));
  };

  const handleSave = async () => {
    if (!title.trim() || sections.length === 0) {
      toast.error("Please add a title and at least one section.");
      return;
    }

    setSaving(true);
    
    const generatedContent: Record<string, string> = {};
    sections.forEach(s => {
      const baseId = s.id.split('-')[0];
      generatedContent[baseId] = s.content;
    });

    const { error } = await supabase.from('proposals').insert({
      user_id: user?.id,
      title: title,
      generated_content: JSON.stringify(generatedContent),
      status: 'draft',
      proposal_mode: 'traditional'
    } as any);

    if (error) {
      toast.error("Failed to save template.");
    } else {
      toast.success("Template saved successfully!");
      navigate('/proposals');
    }
    setSaving(false);
  };

  return (
    <AuthLayout>
      <div className="flex h-[calc(100vh-80px)] overflow-hidden font-body bg-slate-50">
        {/* Sidebar */}
        <div className="w-72 border-r border-slate-200 bg-white p-6 flex flex-col overflow-y-auto">
          <div className="mb-6">
            <h3 className="font-bold text-slate-800 font-display text-lg mb-1">Building Blocks</h3>
            <p className="text-xs text-slate-500">Drag or click to add sections</p>
          </div>
          <div className="flex flex-col gap-3">
            {AVAILABLE_SECTIONS.map(sec => (
              <Button key={sec.id} variant="outline" className="justify-start gap-3 bg-slate-50 hover:bg-primary/5 hover:text-primary hover:border-primary/30 h-12" onClick={() => addSection(sec)}>
                <Plus className="h-4 w-4" /> {sec.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 p-8 overflow-y-auto">
          <RoomProvider id="template-editor-draft" initialPresence={{}}>
            <ClientSideSuspense fallback={<div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>}>
              {() => (
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="flex justify-end">
                    <EditorCollaborationHeader />
                  </div>
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <Input 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-xl font-bold font-display border-none shadow-none bg-transparent hover:bg-slate-50 focus-visible:ring-0 focus-visible:bg-slate-50 h-12 px-4 w-1/2"
                      placeholder="Template Title"
                    />
                    <Button onClick={handleSave} disabled={saving || sections.length === 0} className="bg-primary text-white font-bold px-6 h-12 rounded-xl">
                      {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save to Library
                    </Button>
                  </div>

                  {sections.length === 0 ? (
                    <div className="text-center py-24 border-2 border-dashed border-slate-300 rounded-2xl bg-white/50 flex flex-col items-center justify-center">
                      <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                        <GripVertical className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 font-display mb-2">Canvas is empty</h3>
                      <p className="text-slate-500 max-w-sm">
                        Build your custom proposal structure by selecting blocks from the left panel.
                      </p>
                    </div>
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        {sections.map(sec => (
                          <SortableItem key={sec.id} id={sec.id} section={sec} onRemove={removeSection} onChange={updateSection} />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              )}
            </ClientSideSuspense>
          </RoomProvider>
        </div>
      </div>
    </AuthLayout>
  );
}
