'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Eye, Link as LinkIcon, Check, X, Plus, Users, 
  Calendar, Save, Loader2, GripVertical, Target
} from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { toast } from 'sonner'
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core'
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '@/hooks/useAuth'
import { useProposals } from '@/hooks/useProposals'
import { createClient } from '@/lib/supabase/client'
import { ClayCard } from '@/components/ui/ClayCard'
import { ClayButton } from '@/components/ui/ClayButton'
import { ClayBadge } from '@/components/ui/ClayBadge'

const STAGES = [
  { id: 'draft', name: 'Draft', color: '#64748b' },
  { id: 'sent', name: 'Sent', color: '#3b82f6' },
  { id: 'opened', name: 'Opened', color: '#f59e0b' },
  { id: 'won', name: 'Won', color: '#10b981' },
  { id: 'lost', name: 'Lost', color: '#ef4444' },
]

export default function CRMPage() {
  const { user } = useAuth()
  const { data: proposals = [], isLoading, refetch } = useProposals(user?.id)
  const router = useRouter()
  const supabase = createClient()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const grouped = useMemo(() => {
    const res: Record<string, any[]> = { draft: [], sent: [], opened: [], won: [], lost: [] }
    proposals.forEach((p: any) => {
      if (res[p.status]) res[p.status].push(p)
      else res.draft.push(p)
    })
    return res
  }, [proposals])

  const handleDragStart = (event: any) => setActiveId(event.active.id)

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeProposal = proposals.find((p: any) => p.id === active.id)
    if (!activeProposal) return

    const targetStatus = STAGES.some(s => s.id === over.id) 
      ? (over.id as string) 
      : (proposals.find((p: any) => p.id === over.id)?.status || activeProposal.status)

    if (activeProposal.status !== targetStatus) {
      const { error } = await supabase
        .from('proposals')
        .update({ status: targetStatus })
        .eq('id', active.id)
      
      if (error) {
        toast.error("Failed to move pitch")
      } else {
        toast.success(`Pitch moved to ${targetStatus}`)
        refetch()
      }
    }
  }

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] overflow-hidden">
      <header className="flex items-center justify-between px-10 py-8">
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-black text-slate-900 tracking-tighter">Client Pipeline</h1>
          <p className="text-slate-500 font-medium">Drag and drop pitches to track your winning streak.</p>
        </div>
        <ClayButton onClick={() => router.push('/proposals/new')} className="shadow-glow">
          <Plus className="h-5 w-5 mr-2" /> New Pitch
        </ClayButton>
      </header>

      <div className="flex-1 overflow-x-auto px-10 pb-10">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full min-w-max">
            {STAGES.map((stage) => (
              <Column key={stage.id} stage={stage} proposals={grouped[stage.id]} />
            ))}
          </div>
          
          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: '0.4' } },
            }),
          }}>
            {activeId ? (
              <ProposalCard 
                proposal={proposals.find((p: any) => p.id === activeId)!} 
                stage={STAGES.find(s => s.id === proposals.find((p: any) => p.id === activeId)!.status)!}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}

function Column({ stage, proposals }: any) {
  const { setNodeRef, isOver } = useSortable({
    id: stage.id,
    data: { type: 'Column', stage }
  })

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-[280px] h-full rounded-[2.5rem] bg-slate-50/50 border-2 transition-all p-4",
        isOver ? "border-primary bg-primary/5 shadow-inner" : "border-transparent"
      )}
    >
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">
          {stage.name}
        </h3>
        <div className="h-6 w-6 rounded-full bg-white shadow-sm flex items-center justify-center text-[10px] font-black text-slate-600 border border-slate-100">
          {proposals.length}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 min-h-[400px]">
        <SortableContext items={proposals.map((p: any) => p.id)} strategy={verticalListSortingStrategy}>
          {proposals.map((p: any) => (
            <SortableProposalCard key={p.id} proposal={p} stage={stage} />
          ))}
        </SortableContext>
        
        {proposals.length === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-100 rounded-[2rem] flex items-center justify-center text-center p-6">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Empty Stage</span>
          </div>
        )}
      </div>
    </div>
  )
}

function SortableProposalCard({ proposal, stage }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: proposal.id })
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0 : 1 }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProposalCard proposal={proposal} stage={stage} />
    </div>
  )
}

function ProposalCard({ proposal, stage, isOverlay = false }: any) {
  const router = useRouter()
  return (
    <ClayCard className={cn(
      "p-5 cursor-grab active:cursor-grabbing transition-all hover:shadow-xl",
      isOverlay ? "scale-[1.05] shadow-2xl opacity-90 border-primary" : "border-transparent hover:border-slate-200"
    )}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-black text-slate-800 text-sm leading-tight truncate">{proposal.client_name || 'Untitled Client'}</h4>
          <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
        </div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{proposal.title}</p>
        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
           <span className="text-[10px] font-bold text-slate-400">{format(new Date(proposal.created_at), 'MMM d')}</span>
           <ClayButton variant="ghost" size="sm" onClick={() => router.push(`/proposals/${proposal.id}`)} className="h-8 w-8 p-0">
             <Eye className="h-4 w-4" />
           </ClayButton>
        </div>
      </div>
    </ClayCard>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
