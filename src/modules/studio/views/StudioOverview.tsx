'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarClock, Check, CircleDollarSign, FolderKanban, Plus, ReceiptText, Rows3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Magnetic } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';
import { STAGE_META, TASK_TONES } from '../data';
import { todayISO } from '../dates';
import { AnimatedNumber, ChartScope, ScrollReveal } from '../StudioMotion';
import { useStudio } from '../StudioProvider';
import { currency, MetricCard, PersonBadge, RingProgress, shortDate, StudioHeader } from '../StudioUi';

const compact = (n: number) => currency(n, true);

export function StudioOverview() {
  const { deals, tasks, projects, invoices, expenses, team } = useStudio();
  const today = todayISO();
  const openDeals = deals.filter((deal) => !deal.outcome || deal.outcome === 'open');
  const pipeline = openDeals.reduce((sum, deal) => sum + deal.value, 0);
  const weighted = openDeals.reduce((sum, deal) => sum + deal.value * deal.probability / 100, 0);
  const revenue = invoices.filter((invoice) => invoice.status === 'Paid').reduce((sum, invoice) => sum + invoice.amount, 0);
  const activeProjects = projects.filter((project) => project.status !== 'Complete');
  const remaining = activeProjects.reduce((sum, project) => sum + project.tasksTotal - project.tasksDone, 0);
  const upcoming = [...tasks].filter((task) => !task.completed && task.date >= today).sort((a, b) => `${a.date}-${String(a.startMinutes).padStart(4, '0')}`.localeCompare(`${b.date}-${String(b.startMinutes).padStart(4, '0')}`)).slice(0, 5);

  const steps = [
    { id: 'deal', label: 'Add your first deal', hint: 'Track an opportunity on the pipeline', href: '/dashboard/studio/pipeline', icon: Rows3, done: deals.length > 0 },
    { id: 'project', label: 'Create a project', hint: 'Start a delivery checklist', href: '/dashboard/studio/projects', icon: FolderKanban, done: projects.length > 0 },
    { id: 'task', label: 'Schedule a task', hint: 'Put a call or meeting on the calendar', href: '/dashboard/studio/schedule', icon: CalendarClock, done: tasks.length > 0 },
    { id: 'invoice', label: 'Send an invoice', hint: 'Record what you billed', href: '/dashboard/studio/finance', icon: ReceiptText, done: invoices.length > 0 || expenses.length > 0 },
    { id: 'team', label: 'Invite a teammate', hint: 'Assign work to more than one person', href: '/dashboard/studio', icon: Sparkles, done: team.length > 1 },
  ];
  const doneCount = steps.filter((step) => step.done).length;
  const started = doneCount === steps.length;

  return (
    <div className="space-y-7 studio-page-enter">
      <StudioHeader eyebrow="Client studio" title="The work, money and momentum in one view." description="Track opportunities from first call to delivery, then see what is scheduled, invoiced, and likely to close next." action={<Magnetic strength={0.2}><Button className="rounded-full" asChild><Link href="/dashboard/studio/pipeline"><Plus />Add opportunity</Link></Button></Magnetic>} />

      {!started && (
        <ScrollReveal>
          <section className="studio-sheen rounded-[1.75rem] bg-tint-lime p-5 text-tint-lime-foreground ring-1 ring-foreground/[0.06] md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-bold">Set up your studio</h2><p className="mt-1 text-xs opacity-70">Nothing here is sample data — every number fills in as you add real work.</p></div><div className="flex items-center gap-3"><RingProgress value={Math.round(doneCount / steps.length * 100)} size={52} /><span className="text-xs font-bold">{doneCount} of {steps.length}</span></div></div>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
              {steps.map((step, index) => (
                <motion.li key={step.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06, duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}>
                  <Link href={step.href} className={cn('group flex h-full items-start gap-3 rounded-2xl bg-white/45 p-3.5 ring-1 ring-black/[0.06] transition-[translate,background-color,box-shadow] duration-200 hover:-translate-y-1 hover:bg-white/65 hover:shadow-lg dark:bg-black/15 dark:hover:bg-black/25', step.done && 'opacity-60')}>
                    <span className={cn('mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-current/30 transition-colors', step.done && 'border-transparent bg-foreground text-background')}>{step.done ? <Check className="size-3.5 animate-in zoom-in-50" /> : <step.icon className="size-3.5" />}</span>
                    <span className="min-w-0"><span className={cn('block text-xs font-bold', step.done && 'line-through')}>{step.label}</span><span className="mt-0.5 block text-[10px] opacity-70">{step.hint}</span></span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </section>
        </ScrollReveal>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ScrollReveal><MetricCard label="Open pipeline" value={pipeline} format={compact} detail={`${openDeals.length} live opportunit${openDeals.length === 1 ? 'y' : 'ies'}`} icon={Rows3} tone="sky" /></ScrollReveal>
        <ScrollReveal delay={0.06}><MetricCard label="Weighted forecast" value={weighted} format={compact} detail="Probability-adjusted value" icon={Sparkles} tone="lime" /></ScrollReveal>
        <ScrollReveal delay={0.12}><MetricCard label="Collected revenue" value={revenue} format={compact} detail="Paid invoices" icon={CircleDollarSign} tone="coral" /></ScrollReveal>
        <ScrollReveal delay={0.18}><MetricCard label="Active projects" value={activeProjects.length} format={(n) => String(Math.round(n))} detail={`${remaining} step${remaining === 1 ? '' : 's'} remaining`} icon={FolderKanban} /></ScrollReveal>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <ScrollReveal>
          <ChartScope>
            <article className="studio-spotlight h-full rounded-[1.75rem] bg-card p-5 ring-1 ring-foreground/[0.07] backdrop-blur-xl md:p-6">
              <div className="relative mb-5 flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold">Pipeline shape</h2><p className="mt-1 text-xs text-muted-foreground">Value and conversion pressure by stage</p></div><Button variant="ghost" size="sm" className="rounded-full" asChild><Link href="/dashboard/studio/pipeline">Open board <ArrowRight /></Link></Button></div>
              <div className="relative grid gap-3 sm:grid-cols-2">
                {(Object.keys(STAGE_META) as Array<keyof typeof STAGE_META>).map((stage) => {
                  const stageDeals = openDeals.filter((deal) => deal.stage === stage);
                  const total = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
                  const max = Math.max(1, ...(Object.keys(STAGE_META) as Array<keyof typeof STAGE_META>).map((key) => openDeals.filter((deal) => deal.stage === key).reduce((sum, deal) => sum + deal.value, 0)));
                  return <div key={stage} className={cn('rounded-2xl p-4 transition-[translate] duration-300 hover:-translate-y-0.5', STAGE_META[stage].tint)}><div className="flex items-center justify-between"><p className="text-xs font-bold">{STAGE_META[stage].label}</p><span className="text-[10px] font-semibold opacity-60">{stageDeals.length} deal{stageDeals.length === 1 ? '' : 's'}</span></div><p className="mt-4 text-2xl font-bold"><AnimatedNumber value={total} format={compact} /></p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-current/10"><div className="studio-meter h-full rounded-full bg-current/65 transition-[width] duration-700 ease-(--ease-out)" style={{ width: `${total ? Math.max(8, total / max * 100) : 0}%` }} /></div></div>;
                })}
              </div>
            </article>
          </ChartScope>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <article className="studio-spotlight h-full rounded-[1.75rem] bg-card p-5 ring-1 ring-foreground/[0.07] backdrop-blur-xl md:p-6">
            <div className="relative mb-5 flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold">Next on the schedule</h2><p className="mt-1 text-xs text-muted-foreground">Your nearest client commitments</p></div><CalendarClock className="size-5 text-muted-foreground" /></div>
            {upcoming.length ? <div className="relative divide-y divide-foreground/[0.07]">{upcoming.map((task, index) => <motion.div key={task.id} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05, duration: 0.4 }} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className={cn('size-2.5 shrink-0 rounded-full', TASK_TONES[task.type].split(' ')[0])} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{task.title}</p><p className="truncate text-[11px] text-muted-foreground">{task.date === today ? 'Today' : shortDate(task.date)} · {task.client}</p></div><PersonBadge id={task.owner} size="sm" /></motion.div>)}</div> : <div className="relative flex flex-col items-center gap-3 rounded-2xl border border-dashed border-foreground/[0.12] px-4 py-10 text-center"><CalendarClock className="studio-float size-6 text-muted-foreground" /><p className="text-xs text-muted-foreground">Nothing scheduled yet.</p><Button size="sm" variant="outline" className="rounded-full" asChild><Link href="/dashboard/studio/schedule">Schedule a task</Link></Button></div>}
          </article>
        </ScrollReveal>
      </section>

      <section>
        <ScrollReveal><div className="mb-4 flex items-end justify-between"><div><h2 className="text-lg font-bold">Project delivery</h2><p className="mt-1 text-xs text-muted-foreground">Live work across video, web, apps and brand</p></div><Button variant="outline" size="sm" className="rounded-full" asChild><Link href="/dashboard/studio/projects">All projects <ArrowRight /></Link></Button></div></ScrollReveal>
        {activeProjects.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeProjects.slice(0, 6).map((project, index) => <ScrollReveal key={project.id} delay={(index % 3) * 0.06}><article className="studio-spotlight flex items-center gap-4 rounded-3xl bg-card p-4 ring-1 ring-foreground/[0.07] transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl"><RingProgress value={project.progress} /><div className="relative min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate font-bold">{project.title}</p><PersonBadge id={project.owner} size="sm" /></div><p className="mt-1 truncate text-xs text-muted-foreground">{project.client} · due {shortDate(project.dueDate)}</p><p className="mt-2 text-[11px] font-semibold text-muted-foreground">{project.tasksDone}/{project.tasksTotal} steps · {compact(project.budget)}</p></div></article></ScrollReveal>)}
          </div>
        ) : <div className="flex flex-col items-center gap-3 rounded-[1.5rem] border border-dashed border-foreground/[0.14] bg-card/40 px-6 py-10 text-center"><FolderKanban className="studio-float size-6 text-muted-foreground" /><p className="text-xs text-muted-foreground">No active projects. Win a deal or start one from scratch.</p><Button size="sm" variant="outline" className="rounded-full" asChild><Link href="/dashboard/studio/projects">New project</Link></Button></div>}
      </section>
    </div>
  );
}
