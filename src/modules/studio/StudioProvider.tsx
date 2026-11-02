'use client';

import React from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { emptyStudioData, MEMBER_COLORS, memberId } from './data';
import { todayISO } from './dates';
import type { Deal, DealStage, Deliverable, Expense, Invoice, StudioData, StudioProject, StudioTask } from './types';

const STORAGE_KEY = 'cognify:studio-data:v5-live';
const META_KEY = 'cognify:studio-meta:v1';
/** loading → first sync; saving → write in flight; synced → in the database; local → saved on this device only; setup → database table missing */
export type SyncStatus = 'loading' | 'saving' | 'synced' | 'local' | 'setup';
const TABLE_MISSING = (error: { code?: string } | null) => error?.code === 'PGRST205' || error?.code === '42P01';
const normalize = (raw: Partial<StudioData> | null | undefined): StudioData => { const base = emptyStudioData(); return { ...base, ...(raw ?? {}), team: raw?.team?.length ? raw.team : base.team }; };
const readMeta = (): { dirty?: boolean; synced?: boolean } => { try { return JSON.parse(window.localStorage.getItem(META_KEY) ?? '{}'); } catch { return {}; } };
const writeMeta = (meta: { dirty: boolean; synced?: boolean }) => { try { window.localStorage.setItem(META_KEY, JSON.stringify({ synced: readMeta().synced, ...meta })); } catch { /* storage unavailable */ } };

/** Union by id: nothing on either side is ever dropped when a device meets the account for the first time. */
function mergeStudio(remote: StudioData, local: StudioData): StudioData {
  const union = <T extends { id: string }>(a: T[], b: T[]) => { const seen = new Set(a.map((item) => item.id)); return [...a, ...b.filter((item) => !seen.has(item.id))]; };
  return {
    team: union(remote.team, local.team),
    expenses: union(remote.expenses, local.expenses),
    deals: union(remote.deals, local.deals),
    tasks: union(remote.tasks, local.tasks),
    projects: union(remote.projects, local.projects),
    invoices: union(remote.invoices, local.invoices),
    deliverables: union(remote.deliverables, local.deliverables),
  };
}
const hasContent = (data: StudioData) => data.deals.length + data.tasks.length + data.projects.length + data.invoices.length + data.expenses.length + data.deliverables.length + data.team.length - 1 > 0;
/** Earlier builds shipped sample data under these keys; they are wiped, never migrated. */
const OLD_STORAGE_KEYS = ['cognify:studio-data:v4-studio', 'cognify:studio-data:v3-calendar', 'cognify:studio-data:v2-inr'];

interface StudioContextValue extends StudioData {
  hydrated: boolean;
  sync: SyncStatus;
  addTeamMember: (name: string) => void;
  removeTeamMember: (id: string) => void;
  addDeal: (deal: Omit<Deal, 'id'>) => void;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  moveDeal: (id: string, stage: DealStage) => void;
  /** Move a deal into a stage at a precise slot: before `beforeId`, or at the end of the stage when omitted. */
  placeDeal: (id: string, stage: DealStage, beforeId?: string | null) => void;
  closeDeal: (id: string, outcome: 'won' | 'lost') => void;
  restoreDeal: (id: string) => void;
  addTask: (task: Omit<StudioTask, 'id' | 'completed'>) => void;
  updateTask: (id: string, patch: Partial<StudioTask>) => void;
  addProject: (project: Omit<StudioProject, 'id'>) => void;
  updateProject: (id: string, patch: Partial<StudioProject>) => void;
  deleteProject: (id: string) => void;
  addDeliverable: (deliverable: Omit<Deliverable, 'id'>) => void;
  updateDeliverable: (id: string, patch: Partial<Deliverable>) => void;
  deleteDeliverable: (id: string) => void;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  clearStudio: () => void;
}

const StudioContext = React.createContext<StudioContextValue | null>(null);

const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<StudioData>(emptyStudioData);
  const [hydrated, setHydrated] = React.useState(false);

  const [sync, setSync] = React.useState<SyncStatus>('loading');
  const userId = React.useRef<string | null>(null);
  const ready = React.useRef(false);          // first database sync finished — safe to push edits
  const remoteStamp = React.useRef<string | null>(null);
  const edits = React.useRef(0);              // bumps on every local change so a slow save can't mark newer edits clean
  const skipPush = React.useRef(false);       // set while applying data that just came from the database
  const pushTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = React.useCallback(async (next: StudioData) => {
    if (!userId.current) return;
    const version = edits.current;
    setSync('saving');
    const { data: row, error } = await supabase.from('studio_data').upsert({ user_id: userId.current, data: next }, { onConflict: 'user_id' }).select('updated_at').single();
    if (error) { setSync(TABLE_MISSING(error) ? 'setup' : 'local'); return; }
    remoteStamp.current = row.updated_at;
    if (edits.current === version) { writeMeta({ dirty: false, synced: true }); setSync('synced'); }
  }, []);

  // 1) show this device's copy instantly, 2) reconcile with the database.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      let local: StudioData | null = null;
      try {
        OLD_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) { local = normalize(JSON.parse(saved) as Partial<StudioData>); skipPush.current = true; setData(local); }
      } catch {
        toast.error('Studio data could not be restored');
      }
      setHydrated(true);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) { setSync('local'); return; }
        userId.current = user.id;
        const { data: row, error } = await supabase.from('studio_data').select('data, updated_at').eq('user_id', user.id).maybeSingle();
        if (cancelled) return;
        if (error) { setSync(TABLE_MISSING(error) ? 'setup' : 'local'); return; }
        const remote = row && row.data && Object.keys(row.data).length ? normalize(row.data as Partial<StudioData>) : null;
        const meta = readMeta();
        if (remote && local && hasContent(local) && !meta.synced) {
          // First time this device meets an account that already has data: keep both sides.
          remoteStamp.current = row!.updated_at;
          const merged = mergeStudio(remote, local);
          skipPush.current = true;
          setData(merged);
          ready.current = true;
          await push(merged);
          return;
        }
        if (remote && !(meta.dirty && local)) {
          remoteStamp.current = row!.updated_at;
          skipPush.current = true;
          setData(remote);
          writeMeta({ dirty: false, synced: true });
          setSync('synced');
        } else {
          // First run (or unsynced edits made offline): this device's data goes up to the account.
          if (row) remoteStamp.current = row.updated_at;
          ready.current = true;
          await push(local ?? emptyStudioData());
          return;
        }
        ready.current = true;
      } catch {
        if (!cancelled) setSync('local');
      }
    })();
    return () => { cancelled = true; };
  }, [push]);

  // Every change: write the local copy now, push to the database a moment later.
  React.useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { toast.error('Studio changes could not be saved'); }
    if (skipPush.current) { skipPush.current = false; return; }
    edits.current += 1;
    writeMeta({ dirty: true });
    if (!ready.current) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => { void push(data); }, 700);
    return () => { if (pushTimer.current) clearTimeout(pushTimer.current); };
  }, [data, hydrated, push]);

  // Coming back to the tab: pick up anything saved from another device.
  React.useEffect(() => {
    const onVisible = async () => {
      if (document.visibilityState !== 'visible' || !ready.current || !userId.current || readMeta().dirty) return;
      const { data: row } = await supabase.from('studio_data').select('data, updated_at').eq('user_id', userId.current).maybeSingle();
      if (row && row.updated_at !== remoteStamp.current && row.data && Object.keys(row.data).length && !readMeta().dirty) {
        remoteStamp.current = row.updated_at;
        skipPush.current = true;
        setData(normalize(row.data as Partial<StudioData>));
        writeMeta({ dirty: false, synced: true });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const addTeamMember = React.useCallback((name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setData((current) => ({ ...current, team: [...current.team, { id: memberId(clean, current.team), name: clean, color: MEMBER_COLORS[current.team.length % MEMBER_COLORS.length] }] }));
    toast.success(`${clean} added to the team`);
  }, []);

  const removeTeamMember = React.useCallback((id: string) => {
    setData((current) => {
      if (current.team.length <= 1) return current;
      const fallback = current.team.find((member) => member.id !== id)!.id;
      const reassign = <T extends { owner: string }>(item: T) => item.owner === id ? { ...item, owner: fallback } : item;
      return {
        ...current,
        team: current.team.filter((member) => member.id !== id),
        deals: current.deals.map(reassign),
        tasks: current.tasks.map(reassign),
        projects: current.projects.map((project) => ({ ...reassign(project), team: Array.from(new Set(project.team.map((member) => member === id ? fallback : member))) })),
      };
    });
  }, []);

  const addDeal = React.useCallback((deal: Omit<Deal, 'id'>) => {
    setData((current) => ({ ...current, deals: [...current.deals, { ...deal, id: makeId('deal'), createdAt: deal.createdAt ?? todayISO() }] }));
    toast.success('Deal added to the pipeline');
  }, []);

  const updateDeal = React.useCallback((id: string, patch: Partial<Deal>) => {
    setData((current) => ({ ...current, deals: current.deals.map((deal) => deal.id === id ? { ...deal, ...patch } : deal) }));
  }, []);

  const deleteDeal = React.useCallback((id: string) => {
    setData((current) => ({ ...current, deals: current.deals.filter((deal) => deal.id !== id) }));
  }, []);

  const moveDeal = React.useCallback((id: string, stage: DealStage) => {
    setData((current) => ({ ...current, deals: current.deals.map((deal) => deal.id === id ? { ...deal, stage, outcome: 'open', closedAt: undefined } : deal) }));
  }, []);

  const placeDeal = React.useCallback((id: string, stage: DealStage, beforeId?: string | null) => {
    setData((current) => {
      const moving = current.deals.find((deal) => deal.id === id);
      if (!moving) return current;
      const rest = current.deals.filter((deal) => deal.id !== id);
      const next: Deal = { ...moving, stage, outcome: 'open', closedAt: undefined };
      const at = beforeId ? rest.findIndex((deal) => deal.id === beforeId) : -1;
      if (at === -1) {
        // End of the stage: right after its last card, so it renders at the column bottom.
        let last = -1;
        rest.forEach((deal, index) => { if (deal.stage === stage) last = index; });
        rest.splice(last + 1, 0, next);
      } else {
        rest.splice(at, 0, next);
      }
      return { ...current, deals: rest };
    });
  }, []);

  const closeDeal = React.useCallback((id: string, outcome: 'won' | 'lost') => {
    setData((current) => ({ ...current, deals: current.deals.map((deal) => deal.id === id ? { ...deal, outcome, probability: outcome === 'won' ? 100 : 0, closedAt: todayISO() } : deal) }));
  }, []);

  const restoreDeal = React.useCallback((id: string) => {
    setData((current) => ({ ...current, deals: current.deals.map((deal) => deal.id === id ? { ...deal, outcome: 'open', closedAt: undefined, probability: Math.max(20, deal.probability) } : deal) }));
  }, []);

  const addTask = React.useCallback((task: Omit<StudioTask, 'id' | 'completed'>) => {
    setData((current) => ({ ...current, tasks: [...current.tasks, { ...task, id: makeId('task'), completed: false }] }));
    toast.success('Task scheduled');
  }, []);

  const updateTask = React.useCallback((id: string, patch: Partial<StudioTask>) => {
    setData((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, ...patch } : task) }));
  }, []);

  const addProject = React.useCallback((project: Omit<StudioProject, 'id'>) => {
    setData((current) => ({ ...current, projects: [{ ...project, id: makeId('project') }, ...current.projects] }));
    toast.success('Project created');
  }, []);

  const updateProject = React.useCallback((id: string, patch: Partial<StudioProject>) => {
    setData((current) => ({ ...current, projects: current.projects.map((project) => project.id === id ? { ...project, ...patch } : project) }));
  }, []);

  const deleteProject = React.useCallback((id: string) => {
    setData((current) => ({ ...current, projects: current.projects.filter((project) => project.id !== id), deliverables: current.deliverables.filter((deliverable) => deliverable.projectId !== id) }));
    toast.success('Project deleted');
  }, []);

  const addDeliverable = React.useCallback((deliverable: Omit<Deliverable, 'id'>) => {
    setData((current) => ({ ...current, deliverables: [...current.deliverables, { ...deliverable, id: makeId('deliverable') }] }));
  }, []);

  const updateDeliverable = React.useCallback((id: string, patch: Partial<Deliverable>) => {
    setData((current) => ({ ...current, deliverables: current.deliverables.map((deliverable) => deliverable.id === id ? { ...deliverable, ...patch } : deliverable) }));
    if (patch.status === 'Approved') toast.success('Deliverable approved');
  }, []);

  const deleteDeliverable = React.useCallback((id: string) => {
    setData((current) => ({ ...current, deliverables: current.deliverables.filter((deliverable) => deliverable.id !== id) }));
  }, []);

  const addInvoice = React.useCallback((invoice: Omit<Invoice, 'id'>) => {
    setData((current) => {
      const highest = current.invoices.reduce((max, item) => Math.max(max, Number(item.id.replace(/\D/g, '')) || 0), 1000);
      return { ...current, invoices: [{ ...invoice, id: `INV-${highest + 1}` }, ...current.invoices] };
    });
    toast.success('Invoice created');
  }, []);

  const updateInvoice = React.useCallback((id: string, patch: Partial<Invoice>) => {
    setData((current) => ({ ...current, invoices: current.invoices.map((invoice) => invoice.id === id ? { ...invoice, ...patch, ...(patch.status === 'Paid' && !invoice.paidAt ? { paidAt: todayISO() } : {}), ...(patch.status && patch.status !== 'Paid' ? { paidAt: undefined } : {}) } : invoice) }));
  }, []);

  const deleteInvoice = React.useCallback((id: string) => {
    setData((current) => ({ ...current, invoices: current.invoices.filter((invoice) => invoice.id !== id) }));
  }, []);

  const addExpense = React.useCallback((expense: Omit<Expense, 'id'>) => {
    setData((current) => ({ ...current, expenses: [{ ...expense, id: makeId('expense') }, ...current.expenses] }));
    toast.success('Expense recorded');
  }, []);

  const deleteExpense = React.useCallback((id: string) => {
    setData((current) => ({ ...current, expenses: current.expenses.filter((expense) => expense.id !== id) }));
  }, []);

  const clearStudio = React.useCallback(() => {
    setData(emptyStudioData());
    toast.success('Studio cleared');
  }, []);

  const value = React.useMemo<StudioContextValue>(() => ({
    ...data, hydrated, sync,
    addTeamMember, removeTeamMember,
    addDeal, updateDeal, deleteDeal, moveDeal, placeDeal, closeDeal, restoreDeal,
    addTask, updateTask,
    addProject, updateProject, deleteProject,
    addDeliverable, updateDeliverable, deleteDeliverable,
    addInvoice, updateInvoice, deleteInvoice,
    addExpense, deleteExpense,
    clearStudio,
  }), [data, hydrated, sync, addTeamMember, removeTeamMember, addDeal, updateDeal, deleteDeal, moveDeal, placeDeal, closeDeal, restoreDeal, addTask, updateTask, addProject, updateProject, deleteProject, addDeliverable, updateDeliverable, deleteDeliverable, addInvoice, updateInvoice, deleteInvoice, addExpense, deleteExpense, clearStudio]);

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = React.useContext(StudioContext);
  if (!context) throw new Error('useStudio must be used inside StudioProvider');
  return context;
}
