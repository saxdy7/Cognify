'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, CheckCircle2, Download, Ellipsis, GripVertical, LayoutGrid, List, Plus, Rows3, Search, Sparkles, Trash2, Trophy, X, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { STAGE_META } from '../data';
import Link from 'next/link';
import { NewDealDialog } from '../StudioDialogs';
import { AnimatedNumber } from '../StudioMotion';
import { useStudio } from '../StudioProvider';
import { currency, EmptyState, PageIntro, PersonBadge, shortDate } from '../StudioUi';
import type { Deal, DealStage, Invoice } from '../types';

const STAGES: DealStage[] = ['lead', 'proposal', 'negotiation', 'won'];
type PipelineView = 'board' | 'list';
type Zone = 'won' | 'lost';

const compact = (n: number) => currency(n, true);

export function PipelineBoard() {
  const { deals, invoices, team, placeDeal, closeDeal, reopenDeal, updateDeal, deleteDeal } = useStudio();
  const [closedView, setClosedView] = React.useState<Zone | null>(null);
  // Mirrors draggingId synchronously so a drop never races the React state update.
  const draggingRef = React.useRef<string | null>(null);
  const reduce = useReducedMotion();
  const [newOpen, setNewOpen] = React.useState(false);
  const [newStage, setNewStage] = React.useState<DealStage>('lead');
  const [query, setQuery] = React.useState('');
  const [owner, setOwner] = React.useState('all');
  const [view, setView] = React.useState<PipelineView>('board');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  // Where the dragged card would land: a column plus the card it would sit above (null = column end).
  const [overStage, setOverStage] = React.useState<DealStage | null>(null);
  const [overBefore, setOverBefore] = React.useState<string | null>(null);
  const [overZone, setOverZone] = React.useState<Zone | null>(null);

  const selected = deals.find((deal) => deal.id === selectedId) ?? null;
  const openDeals = deals.filter((deal) => !deal.outcome || deal.outcome === 'open');
  const wonDeals = deals.filter((deal) => deal.outcome === 'won');
  const lostDeals = deals.filter((deal) => deal.outcome === 'lost');
  const filtered = openDeals.filter((deal) => (owner === 'all' || deal.owner === owner) && `${deal.title} ${deal.client} ${deal.kind}`.toLowerCase().includes(query.toLowerCase()));
  const total = openDeals.reduce((sum, deal) => sum + deal.value, 0);
  const weighted = openDeals.reduce((sum, deal) => sum + deal.value * deal.probability / 100, 0);
  const closingThisMonth = openDeals.filter((deal) => deal.dueDate.startsWith('2026-11'));
  const closingValue = closingThisMonth.reduce((sum, deal) => sum + deal.value, 0);

  const openNewDeal = (stage: DealStage = 'lead') => { setNewStage(stage); setNewOpen(true); };
  const resetDrag = () => { draggingRef.current = null; setDraggingId(null); setOverStage(null); setOverBefore(null); setOverZone(null); };

  /** The deal that follows `id` inside its own stage — used to put a card back exactly where it was. */
  const nextSibling = (id: string) => {
    const index = deals.findIndex((deal) => deal.id === id);
    const stage = deals[index]?.stage;
    return deals.slice(index + 1).find((deal) => deal.stage === stage && (!deal.outcome || deal.outcome === 'open'))?.id ?? null;
  };

  const moveWithUndo = (dealId: string, stage: DealStage, beforeId: string | null = null) => {
    const deal = deals.find((item) => item.id === dealId);
    if (!deal) return;
    const prevStage = deal.stage;
    const prevBefore = nextSibling(dealId);
    if (prevStage === stage && (beforeId === dealId || beforeId === prevBefore)) return;
    placeDeal(dealId, stage, beforeId);
    const sameColumn = prevStage === stage;
    toast.success(sameColumn ? `Reordered in ${STAGE_META[stage].label}` : `Moved to ${STAGE_META[stage].label}`, { action: { label: 'Undo', onClick: () => placeDeal(dealId, prevStage, prevBefore) } });
  };

  const closeWithUndo = (dealId: string, outcome: Zone) => {
    const deal = deals.find((item) => item.id === dealId);
    if (!deal) return;
    const snapshot = { outcome: deal.outcome, probability: deal.probability, stage: deal.stage, closedAt: deal.closedAt };
    closeDeal(dealId, outcome);
    toast.success(outcome === 'won' ? `${deal.title} won — project and invoice created` : `${deal.title} marked lost`, {
      description: outcome === 'won' ? 'Find it in Projects, Finance and the Schedule.' : undefined,
      action: { label: 'Undo', onClick: () => reopenDeal(dealId, snapshot) },
    });
  };

  const exportPipeline = () => {
    const rows = [['Opportunity', 'Client', 'Type', 'Stage', 'Outcome', 'Value INR', 'Probability', 'Owner', 'Close date'], ...deals.map((deal) => [deal.title, deal.client, deal.kind, STAGE_META[deal.stage].label, deal.outcome ?? 'open', String(deal.value), String(deal.probability), deal.owner, deal.dueDate])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'cognify-pipeline.csv'; anchor.click(); URL.revokeObjectURL(url);
    toast.success('Pipeline CSV exported');
  };

  /** Pointer position → the card the dragged one would be dropped above. */
  const slotFor = (event: React.DragEvent<HTMLElement>) => {
    const cards = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[data-deal-id]')).filter((el) => el.dataset.dealId !== draggingId);
    const next = cards.find((el) => { const box = el.getBoundingClientRect(); return event.clientY < box.top + box.height / 2; });
    return next?.dataset.dealId ?? null;
  };

  const dragOverColumn = (stage: DealStage) => (event: React.DragEvent<HTMLElement>) => {
    if (!draggingId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const before = slotFor(event);
    if (overStage !== stage) setOverStage(stage);
    if (overBefore !== before) setOverBefore(before);
    if (overZone) setOverZone(null);
  };

  const leaveColumn = (event: React.DragEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { setOverStage(null); setOverBefore(null); }
  };

  const dropOnColumn = (stage: DealStage) => (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    const id = draggingId ?? event.dataTransfer.getData('text/plain');
    const before = slotFor(event);
    resetDrag();
    if (id) moveWithUndo(id, stage, before);
  };

  const zoneHandlers = (zone: Zone) => ({
    onDragEnter: (event: React.DragEvent<HTMLElement>) => { if (draggingRef.current) event.preventDefault(); },
    onDragOver: (event: React.DragEvent<HTMLElement>) => { if (!draggingRef.current) return; event.preventDefault(); event.dataTransfer.dropEffect = 'move'; if (overZone !== zone) { setOverZone(zone); setOverStage(null); setOverBefore(null); } },
    onDragLeave: (event: React.DragEvent<HTMLElement>) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOverZone(null); },
    onDrop: (event: React.DragEvent<HTMLElement>) => { event.preventDefault(); const id = draggingRef.current ?? draggingId ?? event.dataTransfer.getData('text/plain'); resetDrag(); if (id) closeWithUndo(id, zone); },
  });

  return (
    <div className="space-y-4 studio-page-enter">
      <section className="flex flex-col gap-5 pt-1 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-9">
          <PageIntro eyebrow="Sales workspace" first="Deal" second="pipeline" />
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 pb-0.5">
            <InlineMetric icon={Trophy} value={<AnimatedNumber value={total} format={compact} />} label="Open pipeline" />
            <InlineMetric icon={Sparkles} value={<AnimatedNumber value={weighted} format={compact} />} label="Weighted forecast" />
            <InlineMetric icon={CalendarDays} value={<AnimatedNumber value={closingThisMonth.length} />} label="Deals closing this month" detail={<AnimatedNumber value={closingValue} format={compact} />} />
          </div>
        </div>
        <Button className="w-fit rounded-full px-5" onClick={() => openNewDeal()}><Plus />New deal</Button>
      </section>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <div className="relative w-64 shrink-0"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 rounded-full bg-card/80 pl-9 text-xs" placeholder="Search deals..." /></div>
          <FilterChip active={owner === 'all'} onClick={() => setOwner('all')}>Everyone</FilterChip>
          {team.map((person) => <FilterChip key={person.id} active={owner === person.id} onClick={() => setOwner(person.id)}><PersonBadge id={person.id} size="sm" />{person.name.split(' ')[0]}</FilterChip>)}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex rounded-full bg-foreground/[0.055] p-1 ring-1 ring-foreground/[0.07]">{(['board', 'list'] as PipelineView[]).map((item) => <button key={item} onClick={() => setView(item)} className={cn('relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold capitalize transition-colors duration-150 active:scale-[0.97]', view === item ? 'text-background' : 'text-muted-foreground hover:text-foreground')}>{view === item && <motion.span layoutId="pipeline-view" transition={{ type: 'spring', stiffness: 520, damping: 38 }} className="absolute inset-0 rounded-full bg-foreground" />}<span className="relative flex items-center gap-1.5">{item === 'board' ? <LayoutGrid className="size-3.5" /> : <List className="size-3.5" />}{item}</span></button>)}</div>
          <Button aria-label="Export pipeline CSV" variant="outline" size="icon-sm" className="rounded-full" onClick={exportPipeline}><Download /></Button>
        </div>
      </div>

      {!deals.length && <EmptyState icon={Rows3} title="Your pipeline is empty" body="Add the first opportunity you are chasing. Drag cards between stages as the conversation moves, and drop them on Won or Lost when it closes." actionLabel="Add your first deal" onAction={() => openNewDeal()} />}

      {view === 'board' ? (
        <div className="grid min-h-[600px] gap-3 overflow-x-auto pb-2 xl:grid-cols-[repeat(4,minmax(230px,1fr))_120px]">
          {STAGES.map((stage) => {
            const stageDeals = filtered.filter((deal) => deal.stage === stage);
            const stageTotal = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
            const isOver = overStage === stage;
            return (
              <section key={stage} onDragOver={dragOverColumn(stage)} onDragLeave={leaveColumn} onDrop={dropOnColumn(stage)} className={cn('min-w-[230px] rounded-[1.5rem] border bg-card/40 p-2.5 transition-[border-color,background-color,box-shadow] duration-200', stageBorder(stage), draggingId && 'bg-card/60', isOver && cn('bg-card/80 shadow-[0_0_0_1px_var(--stage-glow),0_18px_40px_-18px_var(--stage-glow)]', stageGlow(stage)))}>
                <div className="flex items-center justify-between gap-2 px-1.5 py-1.5"><div className="flex items-center gap-2"><span className={cn('size-2.5 rounded-full', stageDot(stage))} /><h2 className="text-xs font-bold">{STAGE_META[stage].label}</h2><span className="rounded-full bg-foreground/[0.06] px-1.5 py-0.5 text-[9px] font-bold"><AnimatedNumber value={stageDeals.length} duration={0.35} /></span></div><div className="flex items-center gap-1"><span className="text-[10px] font-bold"><AnimatedNumber value={stageTotal} format={compact} duration={0.5} /></span><Button aria-label={`Add deal to ${STAGE_META[stage].label}`} variant="ghost" size="icon-sm" className="rounded-full" onClick={() => openNewDeal(stage)}><Plus /></Button></div></div>
                <div data-lenis-prevent className="mt-1 max-h-[650px] space-y-2.5 overflow-y-auto pr-0.5 custom-scrollbar">
                  <AnimatePresence initial={false} mode="popLayout">
                    {[
                      ...stageDeals.flatMap((deal) => [
                        ...(isOver && overBefore === deal.id && deal.id !== draggingId ? [dropGap(`gap-${deal.id}`)] : []),
                        <motion.div key={deal.id} data-deal-id={deal.id} layout={!reduce} initial={reduce ? false : { opacity: 0, scale: 0.94, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, scale: 0.92 }} transition={{ type: 'spring', stiffness: 460, damping: 36, mass: 0.7 }}>
                          <DealCard deal={deal} active={selectedId === deal.id} dragging={draggingId === deal.id} onSelect={() => setSelectedId(deal.id)} onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', deal.id); draggingRef.current = deal.id; setDraggingId(deal.id); }} onDragEnd={resetDrag} onMove={(nextStage) => moveWithUndo(deal.id, nextStage)} onClose={(outcome) => closeWithUndo(deal.id, outcome)} onDelete={() => { deleteDeal(deal.id); toast.success("Deal deleted"); }} />
                        </motion.div>,
                      ]),
                      ...(isOver && overBefore === null ? [dropGap('gap-end')] : []),
                    ]}
                  </AnimatePresence>
                  {!stageDeals.length && !isOver && <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-foreground/[0.12] text-[10px] font-semibold text-muted-foreground">Drop a deal here</div>}
                </div>
              </section>
            );
          })}
          <div className="grid min-w-[110px] grid-rows-2 gap-3">
            <OutcomeDropZone type="won" deals={wonDeals} value={wonDeals.reduce((sum, deal) => sum + deal.value, 0)} dragging={Boolean(draggingId)} over={overZone === 'won'} handlers={zoneHandlers('won')} onOpen={() => setClosedView('won')} />
            <OutcomeDropZone type="lost" deals={lostDeals} value={lostDeals.reduce((sum, deal) => sum + deal.value, 0)} dragging={Boolean(draggingId)} over={overZone === 'lost'} handlers={zoneHandlers('lost')} onOpen={() => setClosedView('lost')} />
          </div>
        </div>
      ) : <PipelineList deals={filtered} onSelect={(deal) => setSelectedId(deal.id)} onMove={(id, stage) => moveWithUndo(id, stage)} onClose={closeWithUndo} />}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <SheetContent className="w-[min(92vw,430px)] overflow-y-auto border-foreground/[0.1] bg-popover/95 p-0 sm:max-w-[430px]">
          {selected && <DealInspector deal={selected} onUpdate={(patch) => updateDeal(selected.id, patch)} onMove={(stage) => moveWithUndo(selected.id, stage)} onCloseDeal={(outcome) => closeWithUndo(selected.id, outcome)} />}
        </SheetContent>
      </Sheet>
      <NewDealDialog open={newOpen} onOpenChange={setNewOpen} initialStage={newStage} />
      <ClosedDealsSheet zone={closedView} onClose={() => setClosedView(null)} deals={deals} invoices={invoices} onReopen={(id) => { reopenDeal(id); toast.success('Deal reopened'); }} />
    </div>
  );
}

function InlineMetric({ icon: Icon, value, label, detail }: { icon: React.ComponentType<{ className?: string }>; value: React.ReactNode; label: string; detail?: React.ReactNode }) { return <article className="flex items-center gap-2.5"><span className="flex size-10 items-center justify-center rounded-full bg-foreground/[0.055] ring-1 ring-foreground/[0.08]"><Icon className="size-4" /></span><div><div className="flex items-center gap-2"><p className="text-lg leading-none font-bold">{value}</p>{detail && <span className="rounded-full bg-sky-300 px-2 py-0.5 text-[9px] font-bold text-sky-950">{detail}</span>}</div><p className="mt-1 text-[10px] text-muted-foreground">{label}</p></div></article>; }
function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} className={cn('flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold ring-1 transition-[background-color,color,transform] duration-150 active:scale-[0.97]', active ? 'bg-foreground text-background ring-foreground' : 'bg-card/80 text-muted-foreground ring-foreground/[0.08] hover:text-foreground')}>{children}</button>; }

/** Slot that opens under the pointer while a card is dragged over a column. */
const dropGap = (key: string) => <motion.div key={key} layout initial={{ height: 0, opacity: 0 }} animate={{ height: 96, opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 520, damping: 40 }} className="pointer-events-none rounded-2xl border-2 border-dashed border-foreground/25 bg-foreground/[0.04]" />;

function DealCard({ deal, active, dragging, onSelect, onDragStart, onDragEnd, onMove, onClose, onDelete }: { deal: Deal; active: boolean; dragging: boolean; onSelect: () => void; onDragStart: (event: React.DragEvent<HTMLElement>) => void; onDragEnd: () => void; onMove: (stage: DealStage) => void; onClose: (outcome: Zone) => void; onDelete: () => void }) {
  return <article role="button" tabIndex={0} draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onSelect} onKeyDown={(event) => { if (event.key === 'Enter') onSelect(); }} className={cn('group cursor-grab rounded-2xl p-3.5 text-foreground ring-1 ring-foreground/[0.12] backdrop-blur-xl transition-[transform,opacity,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:brightness-110 active:cursor-grabbing', stageCardTone(deal.stage), active && 'ring-2 ring-foreground/35', dragging && '-rotate-1 scale-[1.02] opacity-40 shadow-xl')}>
    <div className="flex items-start justify-between gap-2"><span className="text-[9px] font-semibold text-muted-foreground">Closes {shortDate(deal.dueDate)}</span><DropdownMenu><DropdownMenuTrigger asChild><button aria-label={`Options for ${deal.title}`} onClick={(event) => event.stopPropagation()} className="flex size-7 items-center justify-center rounded-full border border-foreground/[0.12] text-muted-foreground transition-colors hover:text-foreground"><Ellipsis className="size-3.5" /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuLabel>Move deal</DropdownMenuLabel>{STAGES.filter((stage) => stage !== deal.stage).map((stage) => <DropdownMenuItem key={stage} onSelect={() => onMove(stage)}>{STAGE_META[stage].label}</DropdownMenuItem>)}<DropdownMenuSeparator /><DropdownMenuItem onSelect={() => onClose('won')}><CheckCircle2 />Mark won</DropdownMenuItem><DropdownMenuItem variant="destructive" onSelect={() => onClose('lost')}><XCircle />Mark lost</DropdownMenuItem><DropdownMenuItem variant="destructive" onSelect={() => onDelete()}><Trash2 />Delete deal</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
    <h3 className="mt-2 text-sm font-bold">{deal.title}</h3><p className="mt-0.5 text-[10px] text-muted-foreground">{deal.client}</p>
    <div className="mt-5 flex items-end justify-between gap-3"><div><p className="text-base font-bold tabular-nums">{currency(deal.value, true)}</p><p className="mt-0.5 text-[9px] text-muted-foreground">{deal.probability}% probability</p></div><div className="flex items-center gap-1"><button type="button" aria-label={`Mark ${deal.title} won`} title="Mark won" onClick={(event) => { event.stopPropagation(); onClose('won'); }} className="flex size-6 items-center justify-center rounded-full bg-lime-300/85 text-lime-950 transition-[opacity,transform] hover:scale-110 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"><CheckCircle2 className="size-3.5" /></button><button type="button" aria-label={`Mark ${deal.title} lost`} title="Mark lost" onClick={(event) => { event.stopPropagation(); onClose('lost'); }} className="flex size-6 items-center justify-center rounded-full bg-foreground/10 text-muted-foreground transition-[opacity,transform] hover:scale-110 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"><XCircle className="size-3.5" /></button><PersonBadge id={deal.owner} size="sm" /><GripVertical className="ml-1 size-3.5 text-muted-foreground/35 transition-colors group-hover:text-muted-foreground" /></div></div>
  </article>;
}

function OutcomeDropZone({ type, deals, value, dragging, over, handlers, onOpen }: { type: Zone; deals: Deal[]; value: number; dragging: boolean; over: boolean; onOpen: () => void; handlers: { onDragOver: React.DragEventHandler<HTMLElement>; onDragLeave: React.DragEventHandler<HTMLElement>; onDrop: React.DragEventHandler<HTMLElement> } }) {
  const won = type === 'won';
  return <section {...handlers} role="button" tabIndex={0} aria-label={`Show ${type} deals`} onClick={onOpen} onKeyDown={(event) => { if (event.key === 'Enter') onOpen(); }} className={cn('flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed p-3 text-center transition-[transform,border-color,background-color,box-shadow] duration-200', won ? 'border-lime-400/35' : 'border-rose-400/25', dragging && (won ? 'bg-lime-300/[0.06]' : 'bg-rose-400/[0.05]'), over && 'scale-[1.04] border-solid', over && (won ? 'border-lime-300 bg-lime-300/15 shadow-[0_0_44px_-10px_rgba(190,242,100,0.55)]' : 'border-rose-400 bg-rose-400/15 shadow-[0_0_44px_-10px_rgba(251,113,133,0.5)]'))}>
    <span className={cn('flex size-11 items-center justify-center rounded-full transition-transform duration-300 ease-(--ease-pop)', won ? 'bg-lime-300 text-lime-950' : 'bg-foreground/[0.06] text-muted-foreground', over && 'scale-125', over && !won && 'bg-rose-400 text-white')}>{won ? <Trophy className="size-4" /> : <X className="size-4" />}</span>
    <h3 className="mt-3 text-xs font-bold capitalize">{type}</h3>
    <p className="mt-1 text-[9px] text-muted-foreground"><AnimatedNumber value={deals.length} duration={0.4} /> deals · <AnimatedNumber value={value} format={compact} duration={0.5} /></p>
    <p className={cn('mt-4 text-[9px] font-semibold text-muted-foreground transition-colors', over && 'text-foreground')}>{over ? `Release to mark ${type}` : deals.length ? `View ${deals.length} ${type}` : `Drop to ${won ? 'win' : 'lose'}`}</p>
  </section>;
}

function PipelineList({ deals, onSelect, onMove, onClose }: { deals: Deal[]; onSelect: (deal: Deal) => void; onMove: (id: string, stage: DealStage) => void; onClose: (id: string, outcome: Zone) => void }) { return <div className="overflow-hidden rounded-[1.5rem] bg-card/70 ring-1 ring-foreground/[0.08]"><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-xs"><thead className="border-b border-foreground/[0.08] text-[9px] tracking-[0.12em] text-muted-foreground uppercase"><tr><th className="p-4">Opportunity</th><th>Stage</th><th>Value</th><th>Probability</th><th>Owner</th><th>Close</th><th className="pr-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-foreground/[0.07]">{deals.map((deal) => <tr key={deal.id} className="transition-colors hover:bg-foreground/[0.025]"><td className="p-4"><button onClick={() => onSelect(deal)} className="text-left"><span className="block font-bold">{deal.title}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">{deal.client} · {deal.kind}</span></button></td><td><select aria-label={`Stage for ${deal.title}`} value={deal.stage} onChange={(event) => onMove(deal.id, event.target.value as DealStage)} className="rounded-lg bg-foreground/[0.05] px-2 py-1.5 font-semibold">{STAGES.map((stage) => <option key={stage} value={stage}>{STAGE_META[stage].label}</option>)}</select></td><td className="font-bold tabular-nums">{currency(deal.value, true)}</td><td>{deal.probability}%</td><td><PersonBadge id={deal.owner} size="sm" /></td><td>{shortDate(deal.dueDate)}</td><td className="pr-4 text-right"><Button variant="ghost" size="sm" onClick={() => onClose(deal.id, 'won')}>Won</Button><Button variant="ghost" size="sm" onClick={() => onClose(deal.id, 'lost')}>Lost</Button></td></tr>)}</tbody></table></div></div>; }

function DealInspector({ deal, onUpdate, onMove, onCloseDeal }: { deal: Deal; onUpdate: (patch: Partial<Deal>) => void; onMove: (stage: DealStage) => void; onCloseDeal: (outcome: Zone) => void }) { return <div className="p-5"><SheetHeader className="px-0 pt-1"><SheetTitle className="text-xl font-bold">{deal.title}</SheetTitle><SheetDescription>{deal.client} · {deal.kind}</SheetDescription></SheetHeader><div className="mt-5 grid grid-cols-2 gap-3"><Detail label="Value" value={currency(deal.value)} /><Detail label="Expected close" value={shortDate(deal.dueDate)} /><Detail label="Source" value={deal.source} /><Detail label="Owner" value={deal.owner} /></div><div className="mt-6 space-y-2"><label className="text-xs font-bold">Win probability</label><div className="flex items-center gap-3"><input aria-label="Win probability" type="range" min="5" max="100" step="5" value={deal.probability} onChange={(event) => onUpdate({ probability: Number(event.target.value) })} className="w-full accent-foreground" /><span className="w-10 text-right text-sm font-bold"><AnimatedNumber value={deal.probability} format={(n) => `${Math.round(n)}%`} duration={0.25} /></span></div></div><div className="mt-6 rounded-2xl bg-foreground/[0.04] p-4"><p className="text-[9px] font-bold tracking-[0.14em] text-muted-foreground uppercase">Next action</p><input value={deal.nextAction} onChange={(event) => onUpdate({ nextAction: event.target.value })} className="mt-2 w-full bg-transparent text-sm font-semibold outline-none" /></div><div className="mt-6"><p className="mb-2 text-xs font-bold">Move to stage</p><div className="grid grid-cols-2 gap-2">{STAGES.map((stage) => <button key={stage} onClick={() => onMove(stage)} className={cn('rounded-xl px-2 py-2 text-[11px] font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.97]', deal.stage === stage ? 'bg-foreground text-background' : 'bg-foreground/[0.05] hover:bg-foreground/[0.09]')}>{STAGE_META[stage].label}</button>)}</div></div><div className="mt-6 grid grid-cols-2 gap-2"><Button onClick={() => onCloseDeal('won')} className="rounded-xl"><Trophy />Mark won</Button><Button onClick={() => onCloseDeal('lost')} variant="outline" className="rounded-xl text-destructive"><XCircle />Mark lost</Button></div></div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-foreground/[0.04] p-3"><p className="text-[9px] font-bold tracking-wide text-muted-foreground uppercase">{label}</p><p className="mt-1 truncate text-sm font-bold">{value}</p></div>; }
function stageDot(stage: DealStage) { return { lead: 'bg-sky-300', proposal: 'bg-lime-300', negotiation: 'bg-[#ff8f78]', won: 'bg-stone-200' }[stage]; }
function stageBorder(stage: DealStage) { return { lead: 'border-sky-300/20', proposal: 'border-lime-300/25', negotiation: 'border-[#ff8f78]/25', won: 'border-stone-300/20' }[stage]; }
function stageGlow(stage: DealStage) { return { lead: '[--stage-glow:rgba(125,211,252,0.45)]', proposal: '[--stage-glow:rgba(190,242,100,0.45)]', negotiation: '[--stage-glow:rgba(255,143,120,0.45)]', won: '[--stage-glow:rgba(231,229,228,0.4)]' }[stage]; }
function stageCardTone(stage: DealStage) { return { lead: 'bg-sky-300/15', proposal: 'bg-lime-300/15', negotiation: 'bg-[#ff8f78]/16', won: 'bg-stone-300/15' }[stage]; }

/** Everything already won or lost, with where each win went: its project and its invoice. */
function ClosedDealsSheet({ zone, onClose, deals, invoices, onReopen }: { zone: Zone | null; onClose: () => void; deals: Deal[]; invoices: Invoice[]; onReopen: (id: string) => void }) {
  const list = zone ? deals.filter((deal) => deal.outcome === zone) : [];
  return (
    <Sheet open={Boolean(zone)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-[min(92vw,430px)] overflow-y-auto border-foreground/[0.1] bg-popover/95 p-0 sm:max-w-[430px]">
        <div className="p-5">
          <SheetHeader className="px-0 pt-1"><SheetTitle className="text-xl font-bold capitalize">{zone} deals</SheetTitle><SheetDescription>{zone === 'won' ? 'Each win started a project and raised an invoice. Follow them from here.' : 'Reopen a deal to put it back on the board.'}</SheetDescription></SheetHeader>
          <ul className="mt-5 space-y-2.5">
            {list.length ? list.map((deal) => {
              const invoice = invoices.find((item) => item.dealId === deal.id);
              return (
                <li key={deal.id} className="animate-in rounded-2xl bg-foreground/[0.04] p-4 ring-1 ring-foreground/[0.07] duration-300 fade-in-0 slide-in-from-bottom-1">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{deal.title}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{deal.client} · {deal.kind}</p></div><p className="shrink-0 text-sm font-bold tabular-nums">{currency(deal.value)}</p></div>
                  <p className="mt-2 text-[10px] text-muted-foreground">Closed {deal.closedAt ? shortDate(deal.closedAt) : '—'}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {zone === 'won' && deal.projectId && <Link href="/dashboard/studio/projects" className="rounded-full bg-lime-300/80 px-2.5 py-1 text-[10px] font-bold text-lime-950 transition-transform hover:scale-105">Project →</Link>}
                    {zone === 'won' && invoice && <Link href="/dashboard/studio/finance" className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold transition-transform hover:scale-105', invoice.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300')}>{invoice.id} · {invoice.status === 'Paid' ? 'Paid' : 'Payment due'} →</Link>}
                    {zone === 'lost' && <Button size="xs" variant="outline" className="rounded-full" onClick={() => onReopen(deal.id)}>Reopen deal</Button>}
                  </div>
                </li>
              );
            }) : <li className="rounded-2xl border border-dashed border-foreground/[0.14] px-4 py-10 text-center text-xs text-muted-foreground">No {zone} deals yet.</li>}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
