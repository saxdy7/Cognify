'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, CalendarDays, Check, CircleDollarSign, CloudOff, DatabaseZap, FolderKanban, Gauge, LoaderCircle, Plus, Rows3, Trash2, UsersRound, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { BackToTop, ScrollProgress, StudioScroller } from './StudioMotion';
import { StudioProvider, useStudio } from './StudioProvider';
import { PersonBadge } from './StudioUi';
import { FinanceDashboard } from './views/FinanceDashboard';
import { GrowthDashboard } from './views/GrowthDashboard';
import { PipelineBoard } from './views/PipelineBoard';
import { ProjectsDashboard } from './views/ProjectsDashboard';
import { ScheduleBoard } from './views/ScheduleBoard';
import { StudioOverview } from './views/StudioOverview';

export type StudioView = 'overview' | 'pipeline' | 'schedule' | 'finance' | 'growth' | 'projects';

const VIEWS = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'pipeline', label: 'Pipeline', icon: Rows3 },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'finance', label: 'Finance', icon: CircleDollarSign },
  { id: 'growth', label: 'Growth', icon: BarChart3 },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
] as const;

function TeamMenu() {
  const { team, addTeamMember, removeTeamMember } = useStudio();
  const [name, setName] = React.useState('');
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (!name.trim()) return; addTeamMember(name); setName(''); };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="shrink-0 rounded-xl" aria-label="Manage team"><UsersRound className="size-4" /><span className="hidden sm:inline">Team</span><span className="rounded-full bg-foreground/10 px-1.5 text-[10px] font-bold">{team.length}</span></Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <p className="px-1 text-xs font-bold">Studio team</p>
        <p className="mt-0.5 px-1 text-[10px] text-muted-foreground">People you can assign deals, tasks and projects to.</p>
        <ul className="mt-3 space-y-1">
          {team.map((member) => (
            <motion.li layout key={member.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="group flex items-center gap-2.5 rounded-xl px-1.5 py-1.5 hover:bg-foreground/[0.05]">
              <PersonBadge id={member.id} /><span className="flex-1 truncate text-xs font-semibold">{member.name}</span>
              {team.length > 1 && <button aria-label={`Remove ${member.name}`} onClick={() => removeTeamMember(member.id)} className="flex size-6 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"><X className="size-3.5" /></button>}
            </motion.li>
          ))}
        </ul>
        <form onSubmit={submit} className="mt-3 flex gap-2"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Add a teammate..." className="h-9 rounded-full text-xs" /><Button type="submit" size="sm" className="rounded-full"><Plus />Add</Button></form>
        <ClearStudio inMenu />
      </PopoverContent>
    </Popover>
  );
}

function ClearStudio({ inMenu = false }: { inMenu?: boolean }) {
  const { clearStudio } = useStudio();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{inMenu ? <Button variant="ghost" size="sm" className="mt-3 w-full justify-start rounded-xl text-destructive sm:hidden"><Trash2 />Clear all Studio data</Button> : <Button variant="ghost" size="icon" className="hidden shrink-0 rounded-xl sm:inline-flex" title="Clear all Studio data" aria-label="Clear all Studio data"><Trash2 className="size-4" /></Button>}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Clear all Studio data?</AlertDialogTitle><AlertDialogDescription>This removes every deal, project, task, invoice, expense and teammate saved in this browser. It cannot be undone.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={clearStudio} className="bg-destructive text-white">Clear everything</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SyncBadge() {
  const { sync } = useStudio();
  const map = {
    loading: { icon: LoaderCircle, text: 'Connecting', tone: 'text-muted-foreground', spin: true },
    saving: { icon: LoaderCircle, text: 'Saving', tone: 'text-muted-foreground', spin: true },
    synced: { icon: Check, text: 'Saved to your account', tone: 'text-emerald-600 dark:text-emerald-400', spin: false },
    local: { icon: CloudOff, text: 'Saved on this device', tone: 'text-amber-600 dark:text-amber-400', spin: false },
    setup: { icon: DatabaseZap, text: 'Saved on this device', tone: 'text-amber-600 dark:text-amber-400', spin: false },
  }[sync];
  const Icon = map.icon;
  return <span role="status" title={map.text} className={cn('mr-1 flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold', map.tone)}><Icon className={cn('size-3.5', map.spin && 'animate-spin')} /><span className="hidden lg:inline">{map.text}</span></span>;
}

function SetupBanner() {
  const { sync } = useStudio();
  if (sync !== 'setup') return null;
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 rounded-2xl bg-amber-400/15 p-4 text-xs ring-1 ring-amber-500/30">
      <DatabaseZap className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="leading-relaxed"><b>One step left to save to your account.</b> Right now your Studio is stored only in this browser. Open Supabase → SQL Editor, run the file <code className="rounded bg-foreground/10 px-1 py-0.5 font-mono">supabase-studio-schema.sql</code> from the project folder, then reload. Everything you have entered will be uploaded automatically.</p>
    </motion.div>
  );
}

function StudioContent({ view }: { view: StudioView }) {
  const pathname = usePathname();
  const screens: Record<StudioView, React.ReactNode> = {
    overview: <StudioOverview />,
    pipeline: <PipelineBoard />,
    schedule: <ScheduleBoard />,
    finance: <FinanceDashboard />,
    growth: <GrowthDashboard />,
    projects: <ProjectsDashboard />,
  };

  return (
    <StudioScroller>
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 pb-10 md:px-6">
        <div className="sticky top-0 z-30 -mx-2 px-2 pt-3 pb-1">
          <div className="overflow-hidden rounded-2xl bg-card/80 ring-1 ring-foreground/[0.07] backdrop-blur-xl">
            <div className="flex items-center gap-1 overflow-x-auto p-1.5 no-scrollbar">
              {VIEWS.map((item) => {
                const href = item.id === 'overview' ? '/dashboard/studio' : `/dashboard/studio/${item.id}`;
                const active = item.id === view || (item.id === 'overview' && pathname === '/dashboard/studio');
                return (
                  <Link key={item.id} href={href} aria-label={item.label} aria-current={active ? 'page' : undefined} className={cn('relative flex h-9 shrink-0 items-center gap-2 rounded-xl px-2.5 text-sm font-semibold transition-colors duration-200 sm:px-3.5 focus-visible:ring-2 focus-visible:ring-ring/60', active ? 'text-background' : 'text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground')}>
                    {active && <motion.span layoutId="studio-nav-pill" transition={{ type: 'spring', stiffness: 480, damping: 38 }} className="absolute inset-0 rounded-xl bg-foreground shadow-sm" />}
                    <item.icon className="relative size-4" /><span className={cn('relative', !active && 'hidden sm:inline')}>{item.label}</span>
                  </Link>
                );
              })}
              <div className="ml-auto flex shrink-0 items-center gap-1"><SyncBadge /><TeamMenu /><ClearStudio /></div>
            </div>
            <ScrollProgress />
          </div>
        </div>
        <SetupBanner />
        {screens[view]}
      </div>
      <BackToTop />
    </StudioScroller>
  );
}

export function StudioPage({ view = 'overview' }: { view?: StudioView }) {
  return <StudioProvider><StudioContent view={view} /></StudioProvider>;
}
