'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, Check, CheckCircle2, Clock3, ExternalLink, FileCode2, FileText, FolderKanban, MessageCircle, Palette, Play, Plus, Search, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { PROJECT_TONES } from '../data';
import { NewProjectDialog } from '../StudioDialogs';
import { addDaysISO, todayISO } from '../dates';
import { AnimatedNumber } from '../StudioMotion';
import { useStudio } from '../StudioProvider';
import { EmptyState, PageIntro, PersonBadge, RingProgress, shortDate } from '../StudioUi';
import type { ProjectStatus, ProjectStep, StudioProject } from '../types';

const STATUS: Array<'All' | ProjectStatus> = ['All', 'Planning', 'Active', 'Review', 'Complete'];
const STATUS_LABEL: Record<ProjectStatus, string> = { Planning: 'Planning', Active: 'In progress', Review: 'In review', Complete: 'Done' };

export function ProjectsDashboard() {
  const { projects, deliverables, updateProject, updateDeliverable, deleteProject } = useStudio();
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState<(typeof STATUS)[number]>('All');
  const [newOpen, setNewOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const reduce = useReducedMotion();
  const selected = projects.find((project) => project.id === selectedId) ?? null;
  const filtered = projects.filter((project) => (status === 'All' || project.status === status) && `${project.title} ${project.client} ${project.kind}`.toLowerCase().includes(query.toLowerCase()));
  const activeProjects = projects.filter((project) => project.status !== 'Complete');
  const completion = projects.length ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length) : 0;
  const dueSoon = activeProjects.filter((project) => project.dueDate >= todayISO() && project.dueDate <= addDaysISO(todayISO(), 14)).length;

  return (
    <div className="space-y-5 studio-page-enter">
      <section className="flex flex-col gap-5 pt-1 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-9">
          <PageIntro eyebrow="Delivery workspace" first="Client" second="projects" />
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 pb-0.5"><InlineMetric icon={FolderKanban} value={<AnimatedNumber value={activeProjects.length} duration={0.5} />} label="Active projects" /><InlineMetric icon={CheckCircle2} value={<AnimatedNumber value={completion} format={(n) => `${Math.round(n)}%`} />} label="Steps complete overall" /><InlineMetric icon={Clock3} value={<AnimatedNumber value={dueSoon} duration={0.5} />} label="Due in the next 14 days" /></div>
        </div>
        <Button className="w-fit rounded-full px-5" onClick={() => setNewOpen(true)}><Plus />New project</Button>
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-full bg-card/65 p-1 ring-1 ring-foreground/[0.08] no-scrollbar">{STATUS.map((item) => <button key={item} onClick={() => setStatus(item)} className={cn('relative h-8 shrink-0 rounded-full px-3 text-[11px] font-semibold transition-[color,transform] duration-150 active:scale-[0.97]', status === item ? 'text-background' : 'text-muted-foreground hover:text-foreground')}>{status === item && <motion.span layoutId="project-status" transition={{ type: 'spring', stiffness: 520, damping: 38 }} className="absolute inset-0 rounded-full bg-foreground" />}<span className="relative">{item === 'All' ? 'All' : STATUS_LABEL[item]}</span></button>)}</div>
        <div className="relative w-full lg:max-w-xs"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-9 rounded-full bg-card/80 pl-9 text-xs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects..." /></div>
      </div>

      {!projects.length && <EmptyState icon={FolderKanban} title="No projects yet" body="Create a project to get a delivery checklist, a progress ring, a team and client approvals. Winning a deal on the pipeline offers to create one for you." actionLabel="Create your first project" onAction={() => setNewOpen(true)} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        <AnimatePresence initial mode="popLayout">
          {filtered.map((project, index) => <motion.div key={project.id} layout={!reduce} initial={reduce ? false : { opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduce ? undefined : { opacity: 0, scale: 0.94 }} transition={{ type: 'spring', stiffness: 420, damping: 36, delay: Math.min(index, 8) * 0.03 }}><ProjectCard project={project} active={project.id === selectedId} onSelect={() => setSelectedId(project.id)} /></motion.div>)}
        </AnimatePresence>
        {!filtered.length && projects.length > 0 && <div className="col-span-full rounded-[1.5rem] border border-dashed p-12 text-center"><Search className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 text-sm font-semibold">No matching projects</p><button className="mt-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => { setQuery(''); setStatus('All'); }}>Clear the current filters</button></div>}
      </div>

      {deliverables.length > 0 && <section className="rounded-[1.5rem] bg-card/70 p-5 ring-1 ring-foreground/[0.07]"><div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="text-base font-bold">Deliverable approvals</h2><p className="mt-1 text-[11px] text-muted-foreground">Cuts, builds and design packages moving through review</p></div><span className="rounded-full bg-foreground/[0.05] px-3 py-1.5 text-[9px] font-bold">{deliverables.filter((item) => item.status === 'Client review').length} awaiting client</span></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{deliverables.map((deliverable) => { const project = projects.find((item) => item.id === deliverable.projectId); return <ApprovalCard key={deliverable.id} title={deliverable.title} project={project?.client ?? 'Client'} format={deliverable.format} status={deliverable.status} dueDate={deliverable.dueDate} feedback={deliverable.feedback} onAdvance={() => updateDeliverable(deliverable.id, { status: deliverable.status === 'Draft' ? 'Client review' : 'Approved' })} />; })}</div></section>}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <SheetContent className="w-[min(96vw,470px)] overflow-y-auto border-foreground/[0.1] bg-popover/95 p-0 sm:max-w-[470px]">
          {selected && <ProjectInspector project={selected} onUpdate={(patch) => updateProject(selected.id, patch)} onDelete={() => { deleteProject(selected.id); setSelectedId(null); }} />}
        </SheetContent>
      </Sheet>
      <NewProjectDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}

function InlineMetric({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>; value: React.ReactNode; label: string }) { return <article className="flex items-center gap-2.5"><span className="flex size-10 items-center justify-center rounded-full bg-foreground/[0.055] ring-1 ring-foreground/[0.08]"><Icon className="size-4" /></span><div><p className="text-lg leading-none font-bold tabular-nums">{value}</p><p className="mt-1 text-[10px] text-muted-foreground">{label}</p></div></article>; }

function ProjectCard({ project, active, onSelect }: { project: StudioProject; active: boolean; onSelect: () => void }) { return <article role="button" tabIndex={0} onClick={onSelect} onKeyDown={(event) => { if (event.key === 'Enter') onSelect(); }} className={cn('group cursor-pointer rounded-[1.45rem] bg-card/75 p-4 ring-1 ring-foreground/[0.08] transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring', active && 'ring-2 ring-foreground/35')}><div className="flex items-start justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', PROJECT_TONES[project.kind])}>{clientInitials(project.client)}</span><div className="min-w-0"><p className="truncate text-[11px] font-bold">{project.client}</p><p className="truncate text-[9px] text-muted-foreground">{project.contactName ?? project.owner}</p></div></div><span className="shrink-0 rounded-full bg-foreground/[0.055] px-2 py-1 text-[9px] font-bold"><span className={cn('mr-1 inline-block size-1.5 rounded-full', statusDot(project.status))} />{STATUS_LABEL[project.status]}</span></div><h2 className="mt-5 truncate text-base font-bold">{project.title}</h2><div className="mt-3 flex items-center gap-3 rounded-2xl bg-foreground/[0.035] p-3 ring-1 ring-foreground/[0.06]"><RingProgress value={project.progress} size={58} /><div className="min-w-0 flex-1"><p className="text-[11px] font-bold">{project.tasksDone} of {project.tasksTotal} steps</p><p className="mt-1 truncate text-[9px] text-muted-foreground">Next: {nextStep(project)}</p><div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/[0.08]"><div className={cn('studio-meter h-full rounded-full transition-[width,background-color] duration-700 ease-(--ease-out)', project.status === 'Complete' || project.status === 'Review' ? 'bg-lime-300' : 'bg-sky-300')} style={{ width: `${project.progress}%` }} /></div></div></div><div className="mt-4 flex items-end justify-between"><p className="flex items-center gap-1 text-[9px] text-muted-foreground"><CalendarDays className="size-3" />{project.status === 'Complete' ? 'Delivered' : 'Due'} {shortDate(project.dueDate)}</p><div className="flex -space-x-2">{project.team.slice(0, 3).map((member) => <PersonBadge key={member} id={member} size="sm" />)}</div></div></article>; }

function ProjectInspector({ project, onUpdate, onDelete }: { project: StudioProject; onUpdate: (patch: Partial<StudioProject>) => void; onDelete: () => void }) {
  const { team } = useStudio();
  const [newStep, setNewStep] = React.useState('');
  const steps = project.steps?.length ? project.steps : createFallbackSteps(project);
  const updateSteps = (next: ProjectStep[]) => { const done = next.filter((step) => step.completed).length; const progress = next.length ? Math.round(done / next.length * 100) : 0; onUpdate({ steps: next, tasksDone: done, tasksTotal: next.length, progress, status: progress === 100 ? 'Complete' : project.status === 'Complete' ? 'Active' : project.status }); };
  const addStep = () => { if (!newStep.trim()) return; updateSteps([...steps, { id: `${project.id}-step-${Date.now().toString(36)}`, title: newStep.trim(), completed: false }]); setNewStep(''); };
  const toggleMember = (id: string) => onUpdate({ team: project.team.includes(id) ? project.team.filter((member) => member !== id) : [...project.team, id] });
  return <div className="p-6"><SheetHeader className="px-0 pt-0"><SheetTitle className="text-xs font-semibold">Project · {project.client}</SheetTitle><SheetDescription className="sr-only">Edit project status, checklist, team and due date.</SheetDescription></SheetHeader><div className={cn('mt-4 rounded-[1.4rem] p-5 ring-1', PROJECT_TONES[project.kind])}><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold">Due {shortDate(project.dueDate)}</p><h2 className="mt-8 text-xl font-bold">{project.title}</h2><p className="mt-1 text-xs opacity-75">{project.client} · {project.contactName ?? project.owner}</p><p className="mt-8 text-xs font-bold">{project.tasksDone} of {project.tasksTotal} steps done</p></div><div className="text-center"><span className="rounded-full bg-black/10 px-2.5 py-1 text-[9px] font-bold">{STATUS_LABEL[project.status]}</span><div className="mt-3"><RingProgress value={project.progress} size={82} /></div></div></div><div className="mt-3 flex justify-end -space-x-2">{project.team.map((member) => <PersonBadge key={member} id={member} />)}</div></div><div className="mt-5 grid grid-cols-2 gap-3"><label className="space-y-1.5 text-[10px] font-semibold">Status<select value={project.status} onChange={(event) => onUpdate({ status: event.target.value as ProjectStatus, progress: event.target.value === 'Complete' ? 100 : project.progress })} className="h-11 w-full rounded-xl border border-input bg-foreground/[0.04] px-3 text-sm"><option value="Planning">Planning</option><option value="Active">In progress</option><option value="Review">In review</option><option value="Complete">Done</option></select></label><label className="space-y-1.5 text-[10px] font-semibold">Due date<Input type="date" value={project.dueDate} onChange={(event) => onUpdate({ dueDate: event.target.value })} className="h-11 rounded-xl bg-foreground/[0.04]" /></label></div><div className="mt-5"><div className="flex items-center justify-between text-xs font-bold"><span>Checklist</span><span>{project.tasksDone}/{project.tasksTotal}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/[0.07]"><div className="studio-meter h-full rounded-full bg-lime-300 transition-[width] duration-700 ease-(--ease-out)" style={{ width: `${project.progress}%` }} /></div><div className="mt-4 space-y-1">{steps.map((step) => <label key={step.id} className="flex animate-in cursor-pointer items-center gap-3 rounded-xl px-1 py-1.5 text-xs duration-300 fade-in-0 slide-in-from-bottom-1 hover:bg-foreground/[0.04]"><button type="button" aria-label={`${step.completed ? 'Uncheck' : 'Complete'} ${step.title}`} onClick={() => updateSteps(steps.map((item) => item.id === step.id ? { ...item, completed: !item.completed } : item))} className={cn('flex size-5 items-center justify-center rounded-md border transition-[background-color,border-color,transform] duration-200 active:scale-90', step.completed ? 'border-lime-300 bg-lime-300 text-lime-950' : 'border-foreground/20')}>{step.completed && <Check className="size-3.5 animate-in duration-200 zoom-in-50" />}</button><span className={cn('transition-[opacity,color] duration-200', step.completed && 'line-through opacity-55')}>{step.title}</span></label>)}</div><div className="mt-3 flex gap-2"><Input value={newStep} onChange={(event) => setNewStep(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addStep(); } }} className="h-10 rounded-full bg-foreground/[0.04] text-xs" placeholder="Add a step..." /><Button type="button" variant="outline" className="rounded-full" onClick={addStep}><Plus />Add</Button></div></div><div className="mt-5"><p className="text-xs font-bold">Team</p><div className="mt-3 flex flex-wrap gap-2">{team.map((person) => <button key={person.id} onClick={() => toggleMember(person.id)} className={cn('flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-semibold ring-1 transition-colors', project.team.includes(person.id) ? 'bg-foreground/15 ring-foreground/10' : 'text-muted-foreground ring-foreground/[0.08]')}><PersonBadge id={person.id} size="sm" />{person.name.split(' ')[0]}</button>)}</div></div><DeliverablesEditor projectId={project.id} />
<div className="mt-5 flex items-center justify-between rounded-2xl bg-foreground/[0.05] p-3 ring-1 ring-foreground/[0.08]"><div><p className="text-xs font-bold">{project.contactName ?? project.client}</p><p className="mt-0.5 text-[9px] text-muted-foreground">{project.contactRole ?? `Primary contact · ${project.client}`}</p></div><ExternalLink className="size-4 text-muted-foreground" /></div><AlertDialog><AlertDialogTrigger asChild><Button variant="outline" className="mt-5 rounded-full text-destructive"><Trash2 />Delete project</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete {project.title}?</AlertDialogTitle><AlertDialogDescription>This removes the project and its deliverables from this workspace. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-destructive text-white">Delete project</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>;
}

function createFallbackSteps(project: StudioProject): ProjectStep[] { return Array.from({ length: project.tasksTotal }, (_, index) => ({ id: `${project.id}-fallback-${index}`, title: index === project.tasksTotal - 1 ? 'Handover' : `Project step ${index + 1}`, completed: index < project.tasksDone })); }
function nextStep(project: StudioProject) { return project.steps?.find((step) => !step.completed)?.title ?? (project.status === 'Complete' ? 'Every step is done' : 'Next project step'); }
function clientInitials(client: string) { return client.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase(); }
function statusDot(status: ProjectStatus) { return { Planning: 'bg-stone-400', Active: 'bg-sky-300', Review: 'bg-lime-300', Complete: 'bg-lime-400' }[status]; }

const FORMAT_ICONS = { Video: Play, Design: Palette, Build: FileCode2, Document: FileText } as const;
function ApprovalCard({ title, project, format, status, dueDate, feedback, onAdvance }: { title: string; project: string; format: keyof typeof FORMAT_ICONS; status: 'Draft' | 'Client review' | 'Approved'; dueDate: string; feedback: number; onAdvance: () => void }) { const Icon = FORMAT_ICONS[format]; return <article className="rounded-2xl bg-foreground/[0.035] p-4 ring-1 ring-foreground/[0.07]"><div className="flex items-start justify-between gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-background/70"><Icon className="size-4" /></span><span className={cn('rounded-full px-2.5 py-1 text-[9px] font-bold', status === 'Approved' ? 'bg-emerald-500/12 text-emerald-600' : status === 'Client review' ? 'bg-amber-500/12 text-amber-600' : 'bg-sky-500/12 text-sky-600')}>{status}</span></div><h3 className="mt-4 truncate text-sm font-bold">{title}</h3><p className="mt-1 truncate text-[10px] text-muted-foreground">{project} · due {shortDate(dueDate)}</p><div className="mt-4 flex items-center justify-between border-t border-foreground/[0.07] pt-3"><span className="flex items-center gap-1 text-[9px] text-muted-foreground"><MessageCircle className="size-3" />{feedback} notes</span>{status === 'Approved' ? <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600"><Check className="size-3.5" />Approved</span> : <button onClick={onAdvance} className="rounded-full bg-foreground px-3 py-1.5 text-[9px] font-bold text-background active:scale-[0.97]">{status === 'Draft' ? 'Send to review' : 'Approve'}</button>}</div></article>; }

const FORMATS = ['Video', 'Design', 'Build', 'Document'] as const;

/** Per-project deliverables: add, advance through review, remove. Feeds the approvals board on the page. */
function DeliverablesEditor({ projectId }: { projectId: string }) {
  const { deliverables, addDeliverable, updateDeliverable, deleteDeliverable } = useStudio();
  const mine = deliverables.filter((item) => item.projectId === projectId);
  const [title, setTitle] = React.useState('');
  const [format, setFormat] = React.useState<(typeof FORMATS)[number]>('Video');
  const add = () => { if (!title.trim()) return; addDeliverable({ projectId, title: title.trim(), format, status: 'Draft', dueDate: addDaysISO(todayISO(), 7), feedback: 0 }); setTitle(''); };
  return (
    <div className="mt-5">
      <p className="text-xs font-bold">Deliverables</p>
      <ul className="mt-3 space-y-1.5">{mine.map((item) => <li key={item.id} className="group animate-in flex items-center gap-2 rounded-xl bg-foreground/[0.04] px-3 py-2 text-xs duration-300 fade-in-0 slide-in-from-bottom-1"><span className="min-w-0 flex-1 truncate font-semibold">{item.title}</span><button type="button" onClick={() => updateDeliverable(item.id, { status: item.status === 'Draft' ? 'Client review' : item.status === 'Client review' ? 'Approved' : 'Draft' })} className={cn('rounded-full px-2.5 py-1 text-[9px] font-bold transition-colors', item.status === 'Approved' ? 'bg-emerald-500/12 text-emerald-600' : item.status === 'Client review' ? 'bg-amber-500/12 text-amber-600' : 'bg-sky-500/12 text-sky-600')}>{item.status}</button><button type="button" aria-label={`Remove ${item.title}`} onClick={() => deleteDeliverable(item.id)} className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"><Trash2 className="size-3.5" /></button></li>)}</ul>
      <div className="mt-2 flex gap-2"><Input value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} className="h-10 rounded-full bg-foreground/[0.04] text-xs" placeholder="Add a deliverable..." /><select aria-label="Deliverable format" value={format} onChange={(event) => setFormat(event.target.value as (typeof FORMATS)[number])} className="h-10 rounded-full border border-input bg-foreground/[0.04] px-3 text-xs">{FORMATS.map((item) => <option key={item}>{item}</option>)}</select><Button type="button" variant="outline" className="rounded-full" onClick={add}><Plus />Add</Button></div>
    </div>
  );
}
