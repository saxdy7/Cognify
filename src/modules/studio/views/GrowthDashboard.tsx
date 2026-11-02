'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowUpRight, BarChart3, Clock3, Download, IndianRupee, Percent, Trophy, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { growthReport, SOURCE_COLORS, type GrowthMonth } from '../analytics';
import { AnimatedNumber, ChartScope, ScrollReveal, SectionNav, useRevealed } from '../StudioMotion';
import { useStudio } from '../StudioProvider';
import { currency, EmptyState, PageIntro } from '../StudioUi';
import { RepPerformanceTable, TopCustomersTable } from './GrowthTables';

type Period = 3 | 6 | 12;
type RevenueMode = 'value' | 'percent';

const compact = (n: number) => currency(n, true);
const full = (n: number) => currency(n);
const percent = (n: number) => `${Math.round(n)}%`;
const chip = 'flex rounded-full bg-foreground/[0.055] p-1 ring-1 ring-foreground/[0.07]';
const SECTIONS = [
  { id: 'growth-revenue', label: 'Revenue' },
  { id: 'growth-sources', label: 'Lead sources' },
  { id: 'growth-customers', label: 'Customers' },
  { id: 'growth-reps', label: 'Team' },
];

export function GrowthDashboard() {
  const { deals } = useStudio();
  const router = useRouter();
  const [period, setPeriod] = React.useState<Period>(6);
  const [mode, setMode] = React.useState<RevenueMode>('value');
  const [hoveredMonth, setHoveredMonth] = React.useState<number | null>(null);
  const report = React.useMemo(() => growthReport(deals, period), [deals, period]);
  const visible = report.months;
  const { revenue } = report;
  const enterprise = visible.reduce((sum, month) => sum + month.enterprise, 0);
  const mid = visible.reduce((sum, month) => sum + month.mid, 0);
  const smb = visible.reduce((sum, month) => sum + month.smb, 0);
  const maxRevenue = Math.max(1, ...visible.map((month) => month.enterprise + month.mid + month.smb));
  const maxCustomers = Math.max(1, ...visible.map((month) => month.customers));

  const exportGrowth = () => {
    const rows = [['Month', 'Enterprise INR', 'Mid-market INR', 'SMB INR', 'New customers', 'Win rate'], ...visible.map((month) => [month.month, month.enterprise, month.mid, month.smb, month.customers, month.winRate ?? ''])];
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `cognify-growth-${period}m.csv`; anchor.click(); URL.revokeObjectURL(url);
    toast.success('Growth CSV exported');
  };

  const legendValue = (amount: number) => mode === 'value' ? compact(amount) : `${revenue ? Math.round(amount / revenue * 100) : 0}%`;

  return (
    <div className="space-y-4 studio-page-enter">
      <section className="flex flex-col gap-5 pt-1 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-9">
          <PageIntro eyebrow="Performance intelligence" first="Growth" second="reports" />
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 pb-0.5">
            <InlineMetric icon={UsersRound} value={<AnimatedNumber value={report.newCustomers} duration={0.5} />} label={`New customers, last ${period} months`} />
            <InlineMetric icon={Trophy} value={<AnimatedNumber value={report.averageWon} format={compact} />} label="Average won deal" />
            <InlineMetric icon={Clock3} value={<AnimatedNumber value={report.averageCycle} duration={0.9} />} label="Average sales cycle, days" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(chip, 'relative')}>{([3, 6, 12] as Period[]).map((item) => <button key={item} onClick={() => { setPeriod(item); setHoveredMonth(null); }} className={cn('relative rounded-full px-3 py-1.5 text-[10px] font-bold transition-colors duration-150 active:scale-[0.97]', period === item ? 'text-background' : 'text-muted-foreground hover:text-foreground')}>{period === item && <motion.span layoutId="growth-period" transition={{ type: 'spring', stiffness: 520, damping: 38 }} className="absolute inset-0 rounded-full bg-foreground" />}<span className="relative">{item}M</span></button>)}</div>
          <Button className="rounded-full" onClick={exportGrowth} disabled={!report.hasData}><Download />Export CSV</Button>
        </div>
      </section>

      {!report.hasData ? (
        <EmptyState icon={BarChart3} title="Growth reports fill in as you close deals" body="Revenue by segment, lead sources, new customers and win rate are all calculated from deals you mark won or lost on the pipeline." actionLabel="Open the pipeline" onAction={() => router.push('/dashboard/studio/pipeline')} className="mt-6" />
      ) : (
        <>
          <SectionNav items={SECTIONS} />

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,.9fr)]">
            <ScrollReveal>
              <ChartScope>
                <article id="growth-revenue" className="studio-spotlight rounded-[1.5rem] bg-card/75 p-5 ring-1 ring-foreground/[0.08]">
                  <div className="relative flex items-start justify-between gap-4">
                    <div><h2 className="text-sm font-bold">Revenue by segment</h2><div className="mt-4 flex items-end gap-2"><p className="text-3xl font-bold tracking-[-0.04em]"><AnimatedNumber value={revenue} format={full} duration={0.8} /></p><p className="pb-1 text-[10px] text-muted-foreground">won, last {period} months</p></div></div>
                    <div className={cn(chip, 'relative')}>{([['value', IndianRupee, 'Show revenue values'], ['percent', Percent, 'Show revenue percentages']] as const).map(([id, Icon, label]) => <button key={id} aria-label={label} aria-pressed={mode === id} onClick={() => setMode(id)} className={cn('relative flex size-8 items-center justify-center rounded-full transition-colors', mode === id ? 'text-foreground' : 'text-muted-foreground')}>{mode === id && <motion.span layoutId="growth-mode" transition={{ type: 'spring', stiffness: 520, damping: 38 }} className="absolute inset-0 rounded-full bg-foreground/15" />}<Icon className="relative size-3.5" /></button>)}</div>
                  </div>
                  <div className="relative mt-4 flex flex-wrap gap-2"><Legend color="bg-lime-300" label="Enterprise" value={legendValue(enterprise)} /><Legend color="bg-[#ff927f]" label="Mid-market" value={legendValue(mid)} /><Legend color="bg-sky-300" label="SMB" value={legendValue(smb)} /></div>
                  <div className="relative mt-5 mb-6 h-60 border-b border-foreground/[0.08] pl-10">
                    <span className="absolute top-0 left-0 text-[9px] text-muted-foreground">{compact(maxRevenue)}</span><span className="absolute top-1/2 left-0 text-[9px] text-muted-foreground">{compact(maxRevenue / 2)}</span><span className="absolute bottom-0 left-4 text-[9px] text-muted-foreground">₹0</span>
                    <div className="absolute inset-x-10 top-0 border-t border-dashed border-foreground/[0.08]" /><div className="absolute inset-x-10 top-1/2 border-t border-dashed border-foreground/[0.08]" />
                    <div data-velocity-skew className="flex h-full origin-bottom items-end gap-3 transition-transform duration-200">{visible.map((month, index) => {
                      const total = month.enterprise + month.mid + month.smb;
                      const active = hoveredMonth === index;
                      return <div key={`${period}-${month.key}`} className="relative flex h-full flex-1 flex-col justify-end" onMouseEnter={() => setHoveredMonth(index)} onMouseLeave={() => setHoveredMonth(null)}>
                        <div className={cn('relative flex w-full flex-col-reverse overflow-hidden rounded-t-xl bg-foreground/[0.035] transition-[filter,translate,height] duration-300 ease-(--ease-out)', active && 'z-10 -translate-y-1 brightness-110', hoveredMonth !== null && !active && 'opacity-60')} style={{ height: `${total ? Math.max(8, total / maxRevenue * 92) : 3}%` }}>{total > 0 && <><div className="studio-bar bg-lime-300" style={{ height: `${month.enterprise / total * 100}%` }} /><div className="studio-bar bg-[#ff927f]" style={{ height: `${month.mid / total * 100}%`, animationDelay: '45ms' }} /><div className="studio-bar bg-sky-300" style={{ height: `${month.smb / total * 100}%`, animationDelay: '90ms' }} /></>}</div>
                        {active && <ChartTooltip month={month} total={total} mode={mode} />}
                      </div>;
                    })}</div>
                    <div className="absolute right-0 -bottom-6 left-10 flex gap-3">{visible.map((month, index) => <span key={month.key} className={cn('flex-1 text-center text-[9px] font-semibold transition-colors', hoveredMonth === index ? 'text-foreground' : 'text-muted-foreground')}>{month.month}</span>)}</div>
                  </div>
                </article>
              </ChartScope>
            </ScrollReveal>

            <ScrollReveal delay={0.08}>
              <article id="growth-sources" className="studio-spotlight rounded-[1.5rem] bg-card/75 p-5 ring-1 ring-foreground/[0.08]">
                <div className="relative flex items-center justify-between"><div><h2 className="text-sm font-bold">Lead sources</h2><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">Where new customers first came from in the selected period.</p></div><ArrowUpRight className="size-4 shrink-0 text-muted-foreground" /></div>
                <DonutChart total={report.newCustomers} sources={report.sources} />
              </article>
            </ScrollReveal>
          </section>

          <section className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
            <ScrollReveal>
              <ChartScope>
                <article className="studio-spotlight rounded-[1.5rem] bg-card/75 p-5 ring-1 ring-foreground/[0.08]">
                  <h2 className="relative text-sm font-bold">New customers per month</h2>
                  <div className="relative mt-4 flex items-end gap-2"><p className="text-3xl font-bold"><AnimatedNumber value={report.newCustomers} duration={0.5} /></p><p className="pb-1 text-[10px] text-muted-foreground">joined in the last {period} months</p></div>
                  <div className="relative mt-6 flex h-52 items-end gap-3">{visible.map((month, index) => <div key={`${period}-${month.key}`} className="group flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[9px] font-bold opacity-0 transition-opacity group-hover:opacity-100">{month.customers}</span><div className={cn('studio-bar w-full rounded-t-xl transition-[filter,translate] duration-200 group-hover:-translate-y-1 group-hover:brightness-125', index === visible.length - 1 ? 'bg-[#ff927f]' : 'bg-stone-400/70')} style={{ height: `${Math.max(4, month.customers / maxCustomers * 100)}%`, animationDelay: `${index * 40}ms` }} /><span className="text-[9px] font-semibold text-muted-foreground">{month.month}</span></div>)}</div>
                </article>
              </ChartScope>
            </ScrollReveal>
            <ScrollReveal delay={0.08}><WinRateChart visible={visible} period={period} winRate={report.winRate} /></ScrollReveal>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
            <ScrollReveal><TopCustomersTable /></ScrollReveal>
            <ScrollReveal delay={0.08}><RepPerformanceTable /></ScrollReveal>
          </section>

          <p className="pt-2 text-center text-[10px] text-muted-foreground">Numbers are calculated from deals you close — <Link href="/dashboard/studio/pipeline" className="underline-offset-2 hover:underline">open the pipeline</Link> to add more.</p>
        </>
      )}
    </div>
  );
}

function InlineMetric({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>; value: React.ReactNode; label: string }) { return <article className="flex items-center gap-2.5"><span className="flex size-10 items-center justify-center rounded-full bg-foreground/[0.055] ring-1 ring-foreground/[0.08]"><Icon className="size-4" /></span><div><p className="text-lg leading-none font-bold">{value}</p><p className="mt-1 max-w-32 text-[10px] leading-tight text-muted-foreground">{label}</p></div></article>; }
function Legend({ color, label, value }: { color: string; label: string; value: string }) { return <span className="flex items-center gap-2 rounded-full bg-foreground/[0.055] px-3 py-1.5 text-[10px]"><span className={cn('size-2 rounded-full', color)} /><span className="font-semibold">{label}</span><span key={value} className="animate-flash text-muted-foreground tabular-nums">{value}</span></span>; }

function ChartTooltip({ month, total, mode }: { month: GrowthMonth; total: number; mode: RevenueMode }) {
  const value = (amount: number) => mode === 'value' ? compact(amount) : `${total ? Math.round(amount / total * 100) : 0}%`;
  return <div className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-30 w-40 -translate-x-1/2 animate-in rounded-xl bg-popover p-3 text-[9px] shadow-2xl ring-1 ring-foreground/[0.12] duration-150 fade-in-0 zoom-in-95"><p className="mb-2 text-[10px] font-bold">{month.month}</p><p className="flex justify-between"><span>Enterprise</span><b>{value(month.enterprise)}</b></p><p className="mt-1 flex justify-between"><span>Mid-market</span><b>{value(month.mid)}</b></p><p className="mt-1 flex justify-between"><span>SMB</span><b>{value(month.smb)}</b></p><p className="mt-2 flex justify-between border-t border-foreground/[0.08] pt-2"><span>Total</span><b>{mode === 'value' ? compact(total) : total ? '100%' : '0%'}</b></p></div>;
}

function WinRateChart({ visible, period, winRate }: { visible: GrowthMonth[]; period: Period; winRate: number }) {
  const [hover, setHover] = React.useState<number | null>(null);
  const [ref, revealed] = useRevealed<HTMLDivElement>(0.3);
  const xOf = (index: number) => visible.length === 1 ? 50 : index / (visible.length - 1) * 100;
  const rated = visible.map((month, index) => ({ month, index })).filter((item) => item.month.winRate !== null);
  const points = rated.map(({ month, index }) => `${xOf(index)},${100 - month.winRate!}`).join(' ');
  const active = hover === null ? null : visible[hover];
  const activeRate = active?.winRate ?? null;
  return (
    <article className="studio-spotlight rounded-[1.5rem] bg-card/75 p-5 ring-1 ring-foreground/[0.08]">
      <h2 className="relative text-sm font-bold">Win rate trend</h2>
      <div className="relative mt-4 flex items-end gap-2"><p className="text-3xl font-bold">{active ? (activeRate === null ? '—' : <AnimatedNumber value={activeRate} format={percent} duration={0.35} />) : <AnimatedNumber value={winRate} format={percent} duration={0.35} />}</p><p className="pb-1 text-[10px] text-muted-foreground">{active ? active.month : 'period average'}</p></div>
      <div className="relative mt-2 flex gap-4 text-[9px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-lime-300" />Win rate per month</span><span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-foreground/50" />Period average</span></div>
      <div ref={ref} className="relative mt-4 h-52 overflow-hidden rounded-2xl bg-foreground/[0.02]" onMouseLeave={() => setHover(null)}>
        <div className="absolute inset-x-6 top-6 bottom-9">
          {rated.length > 0 && <div className="absolute inset-x-0 border-t border-dashed border-foreground/40 transition-[top] duration-500 ease-(--ease-out)" style={{ top: `${100 - winRate}%` }} />}
          {rated.length > 1 && <svg key={period} viewBox="0 0 100 100" preserveAspectRatio="none" className={cn('size-full overflow-visible transition-[clip-path,opacity] duration-[900ms] ease-(--ease-out)', revealed ? '[clip-path:inset(0_0_0_0)] opacity-100' : '[clip-path:inset(0_100%_0_0)] opacity-40')} role="img" aria-label={`Win rate trend averages ${winRate} percent`}>
            <defs><linearGradient id={`win-fill-${period}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".28" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
            <polygon points={`${xOf(rated[0].index)},100 ${points} ${xOf(rated[rated.length - 1].index)},100`} fill={`url(#win-fill-${period})`} className="text-lime-300" />
            <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="text-lime-300" />
          </svg>}
          {rated.map(({ month, index }) => <span key={month.key} className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-300 transition-opacity duration-500" style={{ left: `${xOf(index)}%`, top: `${100 - month.winRate!}%`, opacity: revealed ? 1 : 0, transitionDelay: `${index * 60 + 500}ms` }} />)}
          {hover !== null && <div className="pointer-events-none absolute inset-y-0 w-px bg-foreground/20" style={{ left: `${xOf(hover)}%` }} />}
          {hover !== null && activeRate !== null && <span className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-300 shadow-[0_0_0_4px_rgba(190,242,100,0.25)]" style={{ left: `${xOf(hover)}%`, top: `${100 - activeRate}%` }} />}
          <div className="absolute inset-0 flex">{visible.map((month, index) => <button key={month.key} type="button" aria-label={`${month.month}: ${month.winRate === null ? 'no closed deals' : `${month.winRate}% win rate`}`} onMouseEnter={() => setHover(index)} onFocus={() => setHover(index)} onBlur={() => setHover(null)} className="h-full flex-1 outline-none" />)}</div>
        </div>
        {rated.length === 0 && <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-[11px] text-muted-foreground">No deals were closed in this period.</p>}
        <div className="absolute right-6 bottom-3 left-6 flex justify-between">{visible.map((month, index) => <span key={month.key} className={cn('text-[9px] transition-colors', hover === index ? 'font-bold text-foreground' : 'text-muted-foreground')}>{month.month}</span>)}</div>
      </div>
    </article>
  );
}

function DonutChart({ total, sources }: { total: number; sources: { label: string; value: number }[] }) {
  const [hover, setHover] = React.useState<string | null>(null);
  const [ref, revealed] = useRevealed<HTMLDivElement>(0.4);
  const circumference = 251.2;
  const sourceTotal = sources.reduce((sum, source) => sum + source.value, 0);
  const segments = sources.map((source, index) => ({
    ...source,
    color: SOURCE_COLORS[index % SOURCE_COLORS.length],
    length: source.value / sourceTotal * circumference,
    offset: -sources.slice(0, index).reduce((sum, item) => sum + item.value / sourceTotal * circumference, 0),
    share: Math.round(source.value / sourceTotal * 100),
  }));
  const hovered = segments.find((segment) => segment.label === hover) ?? null;
  if (!segments.length) return <p className="relative mt-6 rounded-2xl border border-dashed border-foreground/[0.12] px-4 py-10 text-center text-xs text-muted-foreground">No new customers in this period yet.</p>;
  return (
    <>
      <div ref={ref} className="relative mx-auto mt-6 size-44" onMouseLeave={() => setHover(null)}>
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label={`${total} new customers by lead source`}>
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeOpacity=".08" strokeWidth="12" />
          {segments.map((segment, index) => {
            const gap = Math.max(0, segment.length - (segments.length > 1 ? 3 : 0));
            return <circle key={segment.label} cx="50" cy="50" r="40" fill="none" stroke={segment.color} strokeWidth={hover === segment.label ? 15 : 12} strokeDasharray={`${revealed ? gap : 0} ${circumference}`} strokeDashoffset={segment.offset} onMouseEnter={() => setHover(segment.label)} style={{ opacity: hover && hover !== segment.label ? 0.35 : 1, transition: `stroke-dasharray 900ms cubic-bezier(0.23,1,0.32,1) ${index * 70}ms, stroke-width 180ms, opacity 180ms`, cursor: 'pointer' }} />;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl"><AnimatedNumber value={hovered ? hovered.value : total} duration={0.35} /></strong><span className="text-[9px] text-muted-foreground">{hovered ? hovered.label : 'new customers'}</span></div>
      </div>
      <div className="relative mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5">{segments.map((segment) => <button key={segment.label} type="button" onMouseEnter={() => setHover(segment.label)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(segment.label)} onBlur={() => setHover(null)} className={cn('flex items-center gap-2 rounded-lg px-1.5 py-1 text-left text-[10px] transition-colors', hover === segment.label && 'bg-foreground/[0.06]')}><span className="size-2 rounded-full" style={{ backgroundColor: segment.color }} /><span className="flex-1 font-semibold">{segment.label}</span><span className="font-bold tabular-nums">{segment.value}</span><span className="w-7 text-right text-muted-foreground tabular-nums">{segment.share}%</span></button>)}</div>
    </>
  );
}
