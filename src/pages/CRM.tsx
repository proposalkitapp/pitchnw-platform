import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Eye, Link, Check, X, Plus, Users, 
  Calendar, Save, Loader2 
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface Proposal {
  id: string;
  title: string;
  client_name: string | null;
  project_type: string | null;
  status: string;
  public_slug: string | null;
  created_at: string;
}

interface Followup {
  id: string;
  proposal_id: string;
  user_id: string;
  due_date: string;
  note: string | null;
  is_completed: boolean;
}

const STAGES = [
  { id: 'draft', name: 'Draft', color: '#8888AA' },
  { id: 'sent', name: 'Sent', color: '#4A9EFF' },
  { id: 'opened', name: 'Opened', color: '#FFD166' },
  { id: 'won', name: 'Won', color: '#4EEAA0' },
  { id: 'lost', name: 'Lost', color: '#FF6B8A' },
];

export default function CRM() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Sensors for DND
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch Proposals
  const { data: proposals = [], isLoading: isLoadingProposals } = useQuery({
    queryKey: ['proposals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('id, title, client_name, project_type, status, public_slug, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Proposal[] || [];
    },
    enabled: !!user?.id,
  });

  // Fetch Followups
  const { data: followups = [], isLoading: isLoadingFollowups } = useQuery({
    queryKey: ['followups', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('followups')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false);
      if (error) throw error;
      return data as Followup[] || [];
    },
    enabled: !!user?.id,
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('proposals')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      const clientName = proposals.find(p => p.id === variables.id)?.client_name || 'Pitch';
      const stageName = STAGES.find(s => s.id === variables.status)?.name || variables.status;
      
      if (variables.status === 'won') {
        toast.success(`${clientName} marked as Won 🎉`);
      } else if (variables.status === 'lost') {
        toast(`${clientName} marked as Lost`);
      } else {
        toast(`${clientName} moved to ${stageName}`);
      }
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error('Failed to move proposal');
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    }
  });

  // Grouped Proposals
  const grouped = useMemo(() => {
    const res: Record<string, Proposal[]> = {
      draft: [],
      sent: [],
      opened: [],
      won: [],
      lost: [],
    };
    proposals.forEach(p => {
      if (res[p.status]) res[p.status].push(p);
      else res.draft.push(p); // Default fallback
    });
    return res;
  }, [proposals]);

  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeProposal = proposals.find(p => p.id === active.id);
    if (!activeProposal) return;

    // Logic for sorting and moving between containers is handled by SortableContext
    // But we need to ensure optimistic UI feel if moving between columns
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeProposal = proposals.find(p => p.id === active.id);
    if (!activeProposal) return;

    const newStatus = over.id as string;
    
    // Check if over is a container ID or an item ID
    const overIsContainer = STAGES.some(s => s.id === over.id);
    const targetStatus = overIsContainer ? (over.id as string) : (proposals.find(p => p.id === over.id)?.status || activeProposal.status);

    if (activeProposal.status !== targetStatus) {
      // Optimistic update
      queryClient.setQueryData(['proposals', user?.id], (old: Proposal[] | undefined) => {
        if (!old) return [];
        return old.map(p => p.id === active.id ? { ...p, status: targetStatus } : p);
      });
      
      updateStatusMutation.mutate({ id: active.id as string, status: targetStatus });
    }
  };

  if (isLoadingProposals && proposals.length === 0) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthLayout>
    );
  }

  if (proposals.length === 0 && !isLoadingProposals) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
          <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Users className="h-12 w-12 text-primary" />
          </div>
          <h1 className="font-display font-syne font-[800] text-3xl mb-3">Your client pipeline is empty</h1>
          <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
            Start by creating your first pitch and sending it to a client.
          </p>
          <Button variant="hero" size="lg" onClick={() => navigate('/generate')} className="gap-2">
            <Plus className="h-5 w-5" /> Create Your First Pitch
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden bg-[#08080F]">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-8 md:px-10">
          <h1 className="font-display font-syne font-[800] text-2xl text-white">Client Pipeline</h1>
          <Button variant="hero" className="gap-2" onClick={() => navigate('/generate')}>
            <Plus className="h-4 w-4" /> New Pitch
          </Button>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 md:px-10 pb-10">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 h-full min-w-max">
              {STAGES.map((stage) => (
                <Column 
                  key={stage.id} 
                  stage={stage} 
                  proposals={grouped[stage.id]} 
                  followups={followups}
                />
              ))}
            </div>
            
            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.4',
                  },
                },
              }),
            }}>
              {activeId ? (
                <ProposalCard 
                  proposal={proposals.find(p => p.id === activeId)!} 
                  stage={STAGES.find(s => s.id === proposals.find(p => p.id === activeId)!.status)!}
                  isOverlay
                  followups={followups}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </AuthLayout>
  );
}

function Column({ stage, proposals, followups }: { stage: any, proposals: Proposal[], followups: Followup[] }) {
  const { setNodeRef, isOver } = useSortable({
    id: stage.id,
    data: {
      type: 'Column',
      stage,
    },
  });

  return (
    <div 
      ref={setNodeRef}
      className="flex flex-col w-[240px] flex-shrink-0 h-full rounded-[16px] bg-[#121225] p-3 border-2 transition-colors border-transparent"
      style={{ borderColor: isOver ? stage.color : 'transparent' }}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-sans font-[600] text-[13px] tracking-wider uppercase truncate max-w-[140px]" style={{ color: stage.color }}>
          {stage.name}
        </h3>
        <span 
          className="px-2 py-0.5 rounded-full text-[11px] font-mono font-[700]"
          style={{ backgroundColor: `${stage.color}26`, color: stage.color }}
        >
          {proposals.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 min-h-[400px]">
        <SortableContext
          id={stage.id}
          items={proposals.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {proposals.map((p) => (
            <SortableProposalCard 
              key={p.id} 
              proposal={p} 
              stage={stage} 
              followups={followups}
            />
          ))}
        </SortableContext>
        
        {proposals.length === 0 && (
          <div className="h-32 border-2 border-dashed border-[#2A2A45] rounded-xl flex items-center justify-center text-center p-4">
            <span className="font-sans font-[400] text-[13px] text-[#44445A]">No pitches here yet</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SortableProposalCard({ proposal, stage, followups }: { proposal: Proposal, stage: any, followups: Followup[] }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: proposal.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1, // Completely transparent when dragging since overlay handles it
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProposalCard proposal={proposal} stage={stage} followups={followups} />
    </div>
  );
}

function ProposalCard({ 
  proposal, 
  stage, 
  isOverlay = false,
  followups 
}: { 
  proposal: Proposal, 
  stage: any, 
  isOverlay?: boolean,
  followups: Followup[]
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState<'won' | 'lost' | null>(null);
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [followupDate, setFollowupDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [followupNote, setFollowupNote] = useState('');
  const [isSavingFollowup, setIsSavingFollowup] = useState(false);

  const followup = followups.find(f => f.proposal_id === proposal.id);
  const isOverdue = followup && (isPast(new Date(followup.due_date)) || isToday(new Date(followup.due_date)));

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/p/${proposal.public_slug}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Client link copied!');
    });
  };

  const updateStatus = async (status: string) => {
    const { error } = await supabase
      .from('proposals')
      .update({ status })
      .eq('id', proposal.id);
    
    if (!error) {
      toast.success(`${proposal.client_name || 'Pitch'} marked as ${status === 'won' ? 'Won 🎉' : 'Lost'}`);
      queryClient.invalidateQueries({ queryKey: ['proposals', proposal.id] }); // Invalidate specific and list
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    } else {
      toast.error('Failed to update status');
    }
    setShowConfirm(null);
  };

  const saveFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSavingFollowup(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('followups')
        .upsert({
          proposal_id: proposal.id,
          user_id: session.user.id,
          due_date: followupDate,
          note: followupNote,
          is_completed: false
        });

      if (error) throw error;
      
      toast.success('Follow-up scheduled');
      setShowFollowupForm(false);
      queryClient.invalidateQueries({ queryKey: ['followups'] });
    } catch (err) {
      toast.error('Failed to save follow-up');
    } finally {
      setIsSavingFollowup(false);
    }
  };

  return (
    <div 
      className={`relative group bg-[#1A1A32] border border-[#2A2A45] rounded-[14px] p-4 cursor-grab active:cursor-grabbing transition-all hover:translate-y-[-2px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] ${
        isOverlay ? 'scale-[1.03] shadow-2xl opacity-[0.85]' : ''
      }`}
      style={{ borderColor: isOverlay ? stage.color : undefined }}
      onMouseEnter={(e) => {
        if (!isOverlay) e.currentTarget.style.borderColor = stage.color;
      }}
      onMouseLeave={(e) => {
        if (!isOverlay) e.currentTarget.style.borderColor = '#2A2A45';
      }}
    >
      {/* Overdue Indicator */}
      {isOverdue && !showFollowupForm && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[#FFD166] shadow-[0_0_8px_#FFD16680] cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFollowupForm(true);
                }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Follow-up due: {format(new Date(followup.due_date), 'MMM d, yyyy')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Card Content */}
      <h4 className="font-display font-[700] text-[15px] text-[#EEEEFF] mb-2 truncate max-w-full">
        {proposal.client_name || 'Potential Client'}
      </h4>

      <div 
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-[400]"
        style={{ backgroundColor: `${stage.color}26`, color: stage.color }}
      >
        {proposal.project_type || 'New Project'}
      </div>

      <p className="font-sans font-[400] text-[12px] text-[#8888AA] mb-4">
        {format(new Date(proposal.created_at), 'MMM d, yyyy')}
      </p>

      {/* Followup Form */}
      {showFollowupForm && (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-[#08080F] rounded-xl p-3 mb-4 space-y-3 relative z-10"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          onSubmit={saveFollowup}
        >
          <div className="space-y-1">
            <label className="text-[10px] text-[#8888AA] uppercase font-bold">Reschedule</label>
            <input 
              type="date" 
              value={followupDate}
              onChange={e => setFollowupDate(e.target.value)}
              className="w-full bg-[#1A1A32] border border-[#2A2A45] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-[#8888AA] uppercase font-bold">Notes</label>
            <textarea 
              value={followupNote}
              onChange={e => setFollowupNote(e.target.value)}
              placeholder="Next steps..."
              className="w-full bg-[#1A1A32] border border-[#2A2A45] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary resize-none h-16"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 h-8 text-[11px]" disabled={isSavingFollowup}>
              {isSavingFollowup ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className="px-2 h-8 text-[11px] text-muted-foreground"
              onClick={() => setShowFollowupForm(false)}
            >
              Cancel
            </Button>
          </div>
        </motion.form>
      )}

      {/* Action Row */}
      <div className="flex items-center justify-between gap-1 flex-wrap" onPointerDown={e => e.stopPropagation()}>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#8888AA] hover:text-white"
            onClick={(e) => { e.stopPropagation(); navigate(`/proposals/${proposal.id}`); }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#8888AA] hover:text-white"
            onClick={copyLink}
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-1 relative">
          {(stage.id !== 'won' && stage.id !== 'lost') && !showConfirm && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-lg bg-success/10 hover:bg-success/20 text-success"
                onClick={(e) => { e.stopPropagation(); setShowConfirm('won'); }}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive"
                onClick={(e) => { e.stopPropagation(); setShowConfirm('lost'); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}

          {showConfirm && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 bg-[#2A2A45] px-2 py-1 rounded-lg shadow-xl"
            >
              <span className="text-[10px] font-bold text-white mr-1">Mark {showConfirm}?</span>
              <button 
                className="text-[10px] font-bold text-success hover:underline px-1"
                onClick={(e) => { e.stopPropagation(); updateStatus(showConfirm); }}
              >
                Yes
              </button>
              <button 
                className="text-[10px] font-bold text-muted-foreground hover:underline px-1"
                onClick={(e) => { e.stopPropagation(); setShowConfirm(null); }}
              >
                X
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
