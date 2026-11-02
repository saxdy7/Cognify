import type { StudioData, TeamMember, WorkKind } from './types';

/** Studio starts empty — every number on screen comes from what you add. */
export const emptyStudioData = (): StudioData => ({
  team: [{ id: 'ME', name: 'You', color: 'bg-lime-200 text-lime-950' }],
  expenses: [],
  deals: [],
  tasks: [],
  projects: [],
  invoices: [],
  deliverables: [],
});

export const MEMBER_COLORS = [
  'bg-sky-200 text-sky-950',
  'bg-amber-100 text-amber-950',
  'bg-rose-200 text-rose-950',
  'bg-orange-200 text-orange-950',
  'bg-violet-200 text-violet-950',
  'bg-teal-200 text-teal-950',
] as const;

/** Initials for a new teammate, made unique against the existing roster. */
export function memberId(name: string, team: TeamMember[]) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const base = (words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0] ?? 'T').slice(0, 2)).toUpperCase();
  let id = base;
  let n = 2;
  while (team.some((member) => member.id === id)) id = `${base}${n++}`;
  return id;
}

export const STAGE_META = {
  lead: { label: 'Qualified', tint: 'bg-sky-200/80 text-sky-950 dark:bg-sky-900/55 dark:text-sky-100' },
  proposal: { label: 'Proposal', tint: 'bg-lime-200/80 text-lime-950 dark:bg-lime-900/55 dark:text-lime-100' },
  negotiation: { label: 'Negotiation', tint: 'bg-rose-200/80 text-rose-950 dark:bg-rose-900/55 dark:text-rose-100' },
  won: { label: 'Closing', tint: 'bg-stone-200/80 text-stone-950 dark:bg-white/10 dark:text-white' },
} as const;

export const TASK_TONES = {
  Call: 'bg-lime-300 text-lime-950 dark:bg-lime-500/70 dark:text-lime-950',
  Meeting: 'bg-[#ff9a83] text-[#35140d] dark:bg-[#b45f50] dark:text-white',
  Task: 'bg-stone-200 text-stone-950 dark:bg-stone-600 dark:text-white',
  Email: 'bg-sky-300 text-sky-950 dark:bg-sky-600 dark:text-white',
  Payment: 'bg-emerald-300 text-emerald-950 dark:bg-emerald-600 dark:text-white',
  Delivery: 'bg-violet-300 text-violet-950 dark:bg-violet-600 dark:text-white',
  Deal: 'bg-amber-200 text-amber-950 dark:bg-amber-600 dark:text-white',
} as const;

export const PROJECT_TONES = {
  'Video production': 'bg-[#ffd0c5] text-[#3b1711]',
  'Full-stack development': 'bg-[#d8f59c] text-[#1e310c]',
  'Mobile app': 'bg-[#bfe4ff] text-[#10293a]',
  'Brand design': 'bg-[#dfd0ff] text-[#24163d]',
  'Content system': 'bg-[#ffe6a7] text-[#3a2a0b]',
} as const;

export const WORK_KINDS: WorkKind[] = ['Video production', 'Full-stack development', 'Mobile app', 'Brand design', 'Content system'];

/** Starting checklist for a new project — a template you can edit, not sample data. */
export const DEFAULT_STEPS: Record<WorkKind, string[]> = {
  'Video production': ['Brief and references', 'Script and storyboard', 'Shoot', 'Edit', 'Client review', 'Final delivery'],
  'Full-stack development': ['Requirements', 'Architecture', 'Build', 'QA', 'Client review', 'Launch'],
  'Mobile app': ['Requirements', 'UX flows', 'Build', 'Testing', 'Store submission', 'Launch'],
  'Brand design': ['Discovery', 'Concepts', 'Refinement', 'Guidelines', 'Client review', 'Handover'],
  'Content system': ['Content audit', 'Strategy', 'Templates', 'Production', 'Review', 'Handover'],
};

export const DEAL_SOURCES = ['Referral', 'Website', 'Instagram', 'LinkedIn', 'WhatsApp', 'Returning client', 'Outbound', 'Event', 'Direct', 'Other'] as const;

/** Segment by deal size so Growth can split revenue the way the reference does. */
export type Segment = 'Enterprise' | 'Mid-market' | 'SMB';
export const segmentFor = (clientRevenue: number): Segment => clientRevenue >= 1000000 ? 'Enterprise' : clientRevenue >= 300000 ? 'Mid-market' : 'SMB';
