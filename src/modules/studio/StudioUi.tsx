'use client';

import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SplitReveal } from '@/components/motion/reveal';
import { Button } from '@/components/ui/button';
import { AnimatedNumber, useRevealed } from './StudioMotion';
import { useStudio } from './StudioProvider';

export const currency = (value: number, compact = false) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
  notation: compact ? 'compact' : 'standard',
}).format(value);

export const shortDate = (value: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`));

export function PersonBadge({ id, size = 'md' }: { id: string; size?: 'sm' | 'md' }) {
  const { team } = useStudio();
  const person = team.find((item) => item.id === id) ?? team[0];
  if (!person) return null;
  return <span title={person.name} className={cn('inline-flex shrink-0 items-center justify-center rounded-full border-2 border-background font-bold tracking-tight', person.color, size === 'sm' ? 'size-6 text-[9px]' : 'size-8 text-[10px]')}>{person.id.slice(0, 2)}</span>;
}

/** Big two-line page title that rises word by word, with a slow parallax glow behind it. */
export function PageIntro({ eyebrow, first, second }: { eyebrow: string; first: string; second: string }) {
  return (
    <div className="relative">
      <span aria-hidden data-parallax="0.16" className="pointer-events-none absolute -top-10 -left-10 size-40 rounded-full bg-lime-300/25 blur-3xl" />
      <p className="relative mb-1.5 text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p>
      <h1 className="relative text-4xl leading-[0.95] font-bold tracking-[-0.05em] sm:text-5xl"><SplitReveal text={first} /><br className="hidden xl:block" /> <SplitReveal text={second} delay={0.12} /></h1>
    </div>
  );
}

export function StudioHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <header className="relative flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
      <span aria-hidden data-parallax="0.16" className="pointer-events-none absolute -top-12 -left-12 size-44 rounded-full bg-lime-300/20 blur-3xl" />
      <div className="relative">
        <p className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p>
        <h1 className="text-4xl leading-none font-bold tracking-[-0.045em] text-balance sm:text-5xl"><SplitReveal text={title} /></h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">{description}</p>
      </div>
      {action && <div className="relative shrink-0">{action}</div>}
    </header>
  );
}

export function MetricCard({ label, value, format = currency, detail, icon: Icon, tone = 'neutral' }: { label: string; value: number; format?: (n: number) => string; detail: string; icon: LucideIcon; tone?: 'neutral' | 'lime' | 'coral' | 'sky' }) {
  const tones = {
    neutral: 'bg-card text-foreground',
    lime: 'bg-tint-lime text-tint-lime-foreground',
    coral: 'bg-tint-coral text-tint-coral-foreground',
    sky: 'bg-tint-sky text-tint-sky-foreground',
  };
  return (
    <article className={cn('studio-spotlight group relative min-h-32 overflow-hidden rounded-3xl p-5 ring-1 ring-foreground/[0.06] transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl', tones[tone])}>
      <div className="relative flex items-start justify-between gap-3"><p className="text-xs font-semibold opacity-70">{label}</p><Icon className="size-4 opacity-60 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" /></div>
      <div className="relative mt-5"><p className="text-3xl font-bold tracking-[-0.04em]"><AnimatedNumber value={value} format={format} duration={0.9} /></p><p className="mt-1 text-[11px] font-medium opacity-65">{detail}</p></div>
    </article>
  );
}

export function RingProgress({ value, size = 56, className }: { value: number; size?: number; className?: string }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  // Empty until it scrolls into view, then sweeps to the value; later changes ease between values.
  const [ref, revealed] = useRevealed<HTMLSpanElement>(0.5);
  const shown = revealed ? value : 0;
  return (
    <span ref={ref} className={cn('relative inline-flex shrink-0 items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" className="size-full -rotate-90" aria-hidden><circle cx="24" cy="24" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="4" /><circle cx="24" cy="24" r={radius} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - shown / 100)} style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.23,1,0.32,1)' }} /></svg>
      <span className="absolute text-[11px] font-bold"><AnimatedNumber value={value} format={(n) => `${Math.round(n)}%`} duration={0.9} /></span>
    </span>
  );
}

/** Friendly zero-state: a floating icon, one sentence on what goes here, and the action that fills it. */
export function EmptyState({ icon: Icon, title, body, actionLabel, onAction, className }: { icon: LucideIcon; title: string; body: string; actionLabel?: string; onAction?: () => void; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }} className={cn('flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-foreground/[0.14] bg-card/40 px-6 py-12 text-center', className)}>
      <span className="studio-float flex size-14 items-center justify-center rounded-full bg-lime-300 text-lime-950 shadow-[0_14px_34px_-12px_rgba(190,242,100,0.7)]"><Icon className="size-6" /></span>
      <h3 className="mt-5 text-base font-bold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">{body}</p>
      {actionLabel && onAction && <Button className="mt-5 rounded-full px-5" onClick={onAction}>{actionLabel}</Button>}
    </motion.div>
  );
}
