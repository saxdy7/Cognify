'use client';

import React from 'react';
import { CalendarDays, ChevronDown, CircleDollarSign, FolderKanban, Plus, ReceiptText, UserRound, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { DEAL_SOURCES, DEFAULT_STEPS, WORK_KINDS } from './data';
import { addDaysISO, todayISO } from './dates';
import { useStudio } from './StudioProvider';
import type { DealStage, Invoice, ProjectStatus, TaskType, WorkKind } from './types';

const inputClass = 'h-11 rounded-xl bg-foreground/[0.04]';
const selectClass = 'h-11 w-full rounded-xl border border-input bg-foreground/[0.04] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function OwnerSelect({ value, onChange, className }: { value: string; onChange: (id: string) => void; className?: string }) {
  const { team } = useStudio();
  return <select className={cn(selectClass, className)} value={value || team[0]?.id} onChange={(e) => onChange(e.target.value)}>{team.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select>;
}

/** Client names already used anywhere in the Studio, for type-ahead. */
function useClientNames() {
  const { deals, projects, invoices } = useStudio();
  return React.useMemo(() => Array.from(new Set([...projects.map((p) => p.client), ...deals.map((d) => d.client), ...invoices.map((i) => i.client)])).filter(Boolean), [deals, projects, invoices]);
}

export function NewDealDialog({ open, onOpenChange, initialStage = 'lead' }: { open: boolean; onOpenChange: (open: boolean) => void; initialStage?: DealStage }) {
  const { addDeal, team } = useStudio();
  const clients = useClientNames();
  const [title, setTitle] = React.useState('');
  const [client, setClient] = React.useState('');
  const [kind, setKind] = React.useState<WorkKind>('Video production');
  const [stage, setStage] = React.useState<DealStage>('lead');
  const [value, setValue] = React.useState('');
  const [owner, setOwner] = React.useState('');
  const [source, setSource] = React.useState<string>('Referral');
  const [dueDate, setDueDate] = React.useState(() => addDaysISO(todayISO(), 14));

  React.useEffect(() => {
    if (open) { setStage(initialStage); setDueDate(addDaysISO(todayISO(), 14)); }
  }, [initialStage, open]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !client.trim() || Number(value) <= 0) return;
    addDeal({ title: title.trim(), client: client.trim(), kind, stage, value: Number(value), probability: stage === 'lead' ? 30 : stage === 'proposal' ? 55 : stage === 'negotiation' ? 75 : 85, owner: owner || team[0].id, dueDate, source, nextAction: 'Schedule next step', outcome: 'open' });
    setTitle(''); setClient(''); setValue(''); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={submit}>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><CircleDollarSign className="size-5 text-brand" />Add deal</DialogTitle><DialogDescription>Capture the opportunity, value, and next owner action.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-6 sm:grid-cols-2">
            <Field label="Opportunity"><Input autoFocus className={inputClass} required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Launch film and landing page" /></Field>
            <Field label="Client"><Input list="studio-deal-clients" className={inputClass} required value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client or company" /><datalist id="studio-deal-clients">{clients.map((name) => <option key={name} value={name} />)}</datalist></Field>
            <Field label="Project type"><select className={selectClass} value={kind} onChange={(e) => setKind(e.target.value as WorkKind)}>{WORK_KINDS.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Pipeline stage"><select className={selectClass} value={stage} onChange={(e) => setStage(e.target.value as DealStage)}><option value="lead">Qualification</option><option value="proposal">Proposal</option><option value="negotiation">Negotiation</option><option value="won">Closing</option></select></Field>
            <Field label="Deal value (₹)"><Input className={inputClass} required type="number" min="1" value={value} onChange={(e) => setValue(e.target.value)} placeholder="120000" /></Field>
            <Field label="Lead source"><select className={selectClass} value={source} onChange={(e) => setSource(e.target.value)}>{DEAL_SOURCES.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Owner"><OwnerSelect value={owner} onChange={setOwner} /></Field>
            <Field label="Expected close"><Input className={inputClass} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
          </div>
          <DialogFooter><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit"><Plus />Add to pipeline</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewTaskDialog({ open, onOpenChange, initialDate }: { open: boolean; onOpenChange: (open: boolean) => void; initialDate: string }) {
  const { addTask, team } = useStudio();
  const clients = useClientNames();
  const [title, setTitle] = React.useState('');
  const [client, setClient] = React.useState('');
  const [date, setDate] = React.useState(initialDate);
  const [time, setTime] = React.useState('10:00');
  const [duration, setDuration] = React.useState('60');
  const [type, setType] = React.useState<TaskType>('Meeting');
  const [owner, setOwner] = React.useState('');
  const [priority, setPriority] = React.useState<'Normal' | 'High'>('Normal');
  const [reminderMinutes, setReminderMinutes] = React.useState('30');
  const [notes, setNotes] = React.useState('');
  const [moreOpen, setMoreOpen] = React.useState(false);

  React.useEffect(() => {
    if (open) setDate(initialDate);
    else setMoreOpen(false);
  }, [initialDate, open]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !client.trim()) return;
    const [hour, minute] = time.split(':').map(Number);
    addTask({ title: title.trim(), client: client.trim(), date, startMinutes: hour * 60 + minute, duration: Number(duration), type, owner: owner || team[0].id, priority, reminderMinutes: Number(reminderMinutes), notes: notes.trim() });
    setTitle(''); setClient(''); setNotes(''); setMoreOpen(false); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
        <form onSubmit={submit}>
          <div className="border-b border-foreground/[0.07] px-6 pt-6 pb-5">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><CalendarDays className="size-5 text-brand" />New task</DialogTitle><DialogDescription>Lands on the team schedule and keeps the client commitment visible.</DialogDescription></DialogHeader>
          </div>
          <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="Title"><Input autoFocus className={inputClass} required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Send revised proposal" /></Field></div>
            <div className="sm:col-span-2"><Field label="Customer"><Input list="studio-customers" className={inputClass} required value={client} onChange={(e) => setClient(e.target.value)} placeholder="Choose a client or type Internal" /><datalist id="studio-customers">{[...clients, 'Internal'].map((customer) => <option key={customer} value={customer} />)}</datalist></Field></div>
            <Field label="Date"><Input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Time"><Input className={inputClass} type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
            <Field label="Type"><select className={selectClass} value={type} onChange={(e) => setType(e.target.value as TaskType)}><option>Call</option><option>Meeting</option><option>Task</option><option>Email</option></select></Field>
            <Field label="Owner"><OwnerSelect value={owner} onChange={setOwner} /></Field>
            <button type="button" onClick={() => setMoreOpen((current) => !current)} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground sm:col-span-2">More options <ChevronDown className={cn('size-3.5 transition-transform', moreOpen && 'rotate-180')} /></button>
            {moreOpen && <div className="animate-in grid gap-4 rounded-2xl bg-foreground/[0.03] p-4 ring-1 ring-foreground/[0.07] duration-300 fade-in-0 slide-in-from-top-2 sm:col-span-2 sm:grid-cols-2">
              <Field label="Duration"><select className={selectClass} value={duration} onChange={(e) => setDuration(e.target.value)}><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option></select></Field>
              <Field label="Priority"><select className={selectClass} value={priority} onChange={(e) => setPriority(e.target.value as 'Normal' | 'High')}><option>Normal</option><option>High</option></select></Field>
              <Field label="Reminder"><select className={selectClass} value={reminderMinutes} onChange={(e) => setReminderMinutes(e.target.value)}><option value="0">No reminder</option><option value="10">10 minutes before</option><option value="30">30 minutes before</option><option value="60">1 hour before</option><option value="1440">1 day before</option></select></Field>
              <div className="sm:col-span-2"><Field label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add context, links, or the next step" className="min-h-20 rounded-xl bg-foreground/[0.04]" /></Field></div>
            </div>}
          </div>
          <DialogFooter className="border-t border-foreground/[0.07] px-6 py-4"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" className="rounded-full"><Plus />Add task</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export interface ProjectPrefill { title: string; client: string; kind: WorkKind; budget: number; owner: string }

export function NewProjectDialog({ open, onOpenChange, prefill }: { open: boolean; onOpenChange: (open: boolean) => void; prefill?: ProjectPrefill | null }) {
  const { addProject, team } = useStudio();
  const clients = useClientNames();
  const [title, setTitle] = React.useState('');
  const [client, setClient] = React.useState('');
  const [kind, setKind] = React.useState<WorkKind>('Full-stack development');
  const [status, setStatus] = React.useState<ProjectStatus>('Planning');
  const [budget, setBudget] = React.useState('');
  const [owner, setOwner] = React.useState('');
  const [contact, setContact] = React.useState('');
  const [dueDate, setDueDate] = React.useState(() => addDaysISO(todayISO(), 30));

  React.useEffect(() => {
    if (!open) return;
    setDueDate(addDaysISO(todayISO(), 30));
    if (prefill) { setTitle(prefill.title); setClient(prefill.client); setKind(prefill.kind); setBudget(String(prefill.budget)); setOwner(prefill.owner); }
  }, [open, prefill]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !client.trim() || Number(budget) <= 0) return;
    const steps = DEFAULT_STEPS[kind].map((step, index) => ({ id: `step-${Date.now().toString(36)}-${index}`, title: step, completed: false }));
    addProject({ title: title.trim(), client: client.trim(), kind, status, progress: 0, budget: Number(budget), dueDate, owner: owner || team[0].id, team: [owner || team[0].id], tasksDone: 0, tasksTotal: steps.length, steps, contactName: contact.trim() || undefined, contactRole: contact.trim() ? `Primary contact · ${client.trim()}` : undefined });
    setTitle(''); setClient(''); setBudget(''); setContact(''); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={submit}>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FolderKanban className="size-5 text-brand" />New project</DialogTitle><DialogDescription>Starts with a checklist for the project type — edit it any time from the project sheet.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-6 sm:grid-cols-2">
            <Field label="Project"><Input autoFocus className={inputClass} required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mobile ordering app" /></Field>
            <Field label="Client"><Input list="studio-project-clients" className={inputClass} required value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client or company" /><datalist id="studio-project-clients">{clients.map((name) => <option key={name} value={name} />)}</datalist></Field>
            <Field label="Project type"><select className={selectClass} value={kind} onChange={(e) => setKind(e.target.value as WorkKind)}>{WORK_KINDS.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Status"><select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}><option value="Planning">Planning</option><option value="Active">In progress</option><option value="Review">In review</option></select></Field>
            <Field label="Budget (₹)"><Input className={inputClass} required type="number" min="1" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="180000" /></Field>
            <Field label="Due date"><Input className={inputClass} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
            <Field label="Client contact (optional)"><Input className={inputClass} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Who you deal with" /></Field>
            <Field label="Project lead"><div className="relative"><UserRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><OwnerSelect value={owner} onChange={setOwner} className="pl-9" /></div></Field>
          </div>
          <DialogFooter><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit"><Plus />Create project</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewInvoiceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { addInvoice, projects } = useStudio();
  const clients = useClientNames();
  const [client, setClient] = React.useState('');
  const [project, setProject] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [issuedAt, setIssuedAt] = React.useState(todayISO);
  const [dueAt, setDueAt] = React.useState(() => addDaysISO(todayISO(), 14));
  const [status, setStatus] = React.useState<Invoice['status']>('Due');

  React.useEffect(() => { if (open) { setIssuedAt(todayISO()); setDueAt(addDaysISO(todayISO(), 14)); } }, [open]);
  const projectOptions = projects.filter((item) => !client || item.client.toLowerCase() === client.toLowerCase()).map((item) => item.title);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!client.trim() || Number(amount) <= 0) return;
    addInvoice({ client: client.trim(), project: project.trim() || 'General services', amount: Number(amount), issuedAt, dueAt, status, paidAt: status === 'Paid' ? issuedAt : undefined });
    setClient(''); setProject(''); setAmount(''); setStatus('Due'); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={submit}>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ReceiptText className="size-5 text-brand" />New invoice</DialogTitle><DialogDescription>Record what you billed. Paid invoices count as collected revenue.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-6 sm:grid-cols-2">
            <Field label="Client"><Input autoFocus list="studio-invoice-clients" className={inputClass} required value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client or company" /><datalist id="studio-invoice-clients">{clients.map((name) => <option key={name} value={name} />)}</datalist></Field>
            <Field label="Project"><Input list="studio-invoice-projects" className={inputClass} value={project} onChange={(e) => setProject(e.target.value)} placeholder="Optional" /><datalist id="studio-invoice-projects">{projectOptions.map((name) => <option key={name} value={name} />)}</datalist></Field>
            <Field label="Amount (₹)"><Input className={inputClass} required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" /></Field>
            <Field label="Status"><select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as Invoice['status'])}><option value="Due">Due</option><option value="Paid">Paid</option></select></Field>
            <Field label="Issued"><Input className={inputClass} type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} /></Field>
            <Field label="Due"><Input className={inputClass} type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} /></Field>
          </div>
          <DialogFooter><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit"><Plus />Create invoice</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewExpenseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { addExpense } = useStudio();
  const [label, setLabel] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [date, setDate] = React.useState(todayISO);

  React.useEffect(() => { if (open) setDate(todayISO()); }, [open]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!label.trim() || Number(amount) <= 0) return;
    addExpense({ label: label.trim(), amount: Number(amount), date });
    setLabel(''); setAmount(''); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Wallet className="size-5 text-brand" />Record expense</DialogTitle><DialogDescription>Software, equipment, freelancers — anything that costs the studio money.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-6">
            <Field label="What was it for?"><Input autoFocus className={inputClass} required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Adobe subscription" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount (₹)"><Input className={inputClass} required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="4200" /></Field>
              <Field label="Date"><Input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            </div>
          </div>
          <DialogFooter><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit"><Plus />Save expense</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
