'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUp, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { customerRows, repRows } from '../analytics';
import { AnimatedNumber, Sparkline, useRevealed } from '../StudioMotion';
import { useStudio } from '../StudioProvider';
import { currency, PersonBadge } from '../StudioUi';

const SEGMENT_DOT = { Enterprise: 'bg-lime-300', 'Mid-market': 'bg-[#ff927f]', SMB: 'bg-sky-300' } as const;
const AVATAR = ['bg-lime-200 text-lime-950', 'bg-sky-200 text-sky-950', 'bg-rose-200 text-rose-950', 'bg-amber-100 text-amber-950', 'bg-violet-200 text-violet-950'];
const initials = (name: string) => name.split(/[\s&]+/).filter(Boolean).map((word) => word[0]).join('').slice(0, 2).toUpperCase();
const compact = (n: number) => currency(n, true);
const spring = { type: 'spring', stiffness: 480, damping: 40 } as const;

function NoRows({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-foreground/[0.12] px-4 py-8 text-center text-xs text-muted-foreground">{children}</p>;
}

export function TopCustomersTable() {
  const { deals, invoices, projects } = useStudio();
  const reduce = useReducedMotion();
  const rows = React.useMemo(() => customerRows(deals, invoices, projects), [deals, invoices, projects]);
  const [key, setKey] = React.useState<'revenue' | 'deals'>('revenue');
  const [dir, setDir] = React.useState<'desc' | 'asc'>('desc');
  const sorted = [...rows].sort((a, b) => (dir === 'desc' ? 1 : -1) * (b[key] - a[key])).slice(0, 8);
  const sortBy = (next: 'revenue' | 'deals') => { if (key === next) setDir(dir === 'desc' ? 'asc' : 'desc'); else { setKey(next); setDir('desc'); } };

  return (
    <article id="growth-customers" className="studio-spotlight rounded-[1.5rem] bg-card/75 p-5 ring-1 ring-foreground/[0.08]">
      <div className="relative flex items-center justify-between"><h2 className="text-sm font-bold">Top customers by revenue won</h2><ArrowUpRight className="size-4 text-muted-foreground" /></div>
      {!sorted.length ? <div className="relative mt-4"><NoRows>Customers appear here once you mark a deal as won.</NoRows></div> : (
        <div className="relative mt-4 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-xs">
          <thead className="text-[9px] tracking-[0.1em] text-muted-foreground uppercase"><tr>
            <th className="pb-3 font-semibold">Customer</th><th className="pb-3 font-semibold">Segment</th>
            <SortHead label="Deals" active={key === 'deals'} dir={dir} onClick={() => sortBy('deals')} />
            <SortHead label="Revenue" active={key === 'revenue'} dir={dir} onClick={() => sortBy('revenue')} />
            <th className="pb-3 pr-1 text-right font-semibold">Trend</th>
          </tr></thead>
          <tbody>{sorted.map((row, index) => (
            <motion.tr key={row.client} layout={reduce ? false : 'position'} transition={spring} initial={reduce ? false : { opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="group border-t border-foreground/[0.06] transition-colors hover:bg-foreground/[0.03]">
              <td className="py-2.5 pr-3"><div className="flex items-center gap-2.5"><span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', AVATAR[index % AVATAR.length])}>{initials(row.contact)}</span><div className="min-w-0"><p className="truncate font-bold">{row.contact}</p>{row.contact !== row.client && <p className="truncate text-[9px] text-muted-foreground">{row.client}</p>}</div></div></td>
              <td className="pr-3"><span className="flex items-center gap-1.5 text-[10px] font-semibold"><span className={cn('size-1.5 rounded-full', SEGMENT_DOT[row.segment])} />{row.segment}</span></td>
              <td className="pr-3"><AnimatedNumber value={row.deals} duration={0.4} /></td>
              <td className="pr-3 font-bold"><AnimatedNumber value={row.revenue} format={compact} duration={0.6} /></td>
              <td className="pr-1"><div className="flex justify-end"><Sparkline data={row.trend} className="text-lime-300 transition-transform duration-200 group-hover:scale-110" /></div></td>
            </motion.tr>
          ))}</tbody>
        </table></div>
      )}
    </article>
  );
}

function SortHead({ label, active, dir, onClick }: { label: string; active: boolean; dir: 'asc' | 'desc'; onClick: () => void }) {
  const Icon = dir === 'desc' ? ArrowDown : ArrowUp;
  return <th className="pb-3 pr-3 font-semibold" aria-sort={active ? (dir === 'desc' ? 'descending' : 'ascending') : 'none'}><button onClick={onClick} className={cn('flex items-center gap-1 uppercase transition-colors hover:text-foreground', active && 'text-foreground')}>{label}<Icon className={cn('size-3 transition-opacity', active ? 'opacity-100' : 'opacity-0')} /></button></th>;
}

function ShareBar({ share }: { share: number }) {
  const [ref, revealed] = useRevealed<HTMLDivElement>(0.5);
  return <div ref={ref} className="h-1 w-24 overflow-hidden rounded-full bg-foreground/[0.08]"><div className="h-full rounded-full bg-lime-300 transition-[width] duration-[900ms] ease-(--ease-out)" style={{ width: `${revealed ? share : 0}%` }} /></div>;
}

export function RepPerformanceTable() {
  const { deals, team } = useStudio();
  const reduce = useReducedMotion();
  const rows = React.useMemo(() => repRows(deals, team), [deals, team]);
  const hasWins = rows.some((row) => row.wonCount > 0);

  return (
    <article id="growth-reps" className="studio-spotlight rounded-[1.5rem] bg-card/75 p-5 ring-1 ring-foreground/[0.08]">
      <div className="relative flex items-center justify-between"><h2 className="text-sm font-bold">Team performance</h2><ArrowUpRight className="size-4 text-muted-foreground" /></div>
      {!hasWins ? <div className="relative mt-4"><NoRows>Wins by teammate show up here as deals are marked won.</NoRows></div> : (
        <div className="relative mt-4 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs">
          <thead className="text-[9px] tracking-[0.1em] text-muted-foreground uppercase"><tr><th className="pb-3 font-semibold">Teammate</th><th className="pb-3 text-right font-semibold">Won</th><th className="pb-3 text-right font-semibold">Deals</th><th className="pb-3 pr-1 text-right font-semibold">Win rate</th></tr></thead>
          <tbody>{rows.map((row) => (
            <motion.tr key={row.id} layout={reduce ? false : 'position'} transition={spring} className="border-t border-foreground/[0.06] transition-colors hover:bg-foreground/[0.03]">
              <td className="py-2.5 pr-3"><div className="flex items-center gap-2.5"><PersonBadge id={row.id} /><div className="min-w-0 flex-1"><p className="font-bold">{row.name}</p><div className="mt-1.5 flex items-center gap-2"><ShareBar share={row.share} /><span className="text-[9px] text-muted-foreground"><AnimatedNumber value={row.share} format={(n) => `${Math.round(n)}%`} duration={0.8} /> of team revenue</span></div></div></div></td>
              <td className="text-right font-bold"><AnimatedNumber value={row.wonValue} format={compact} duration={0.6} /></td>
              <td className="text-right"><AnimatedNumber value={row.wonCount} duration={0.4} /></td>
              <td className="pr-1 text-right font-semibold">{row.winRate !== null ? <AnimatedNumber value={row.winRate} format={(n) => `${Math.round(n)}%`} duration={0.6} /> : <span className="text-muted-foreground">—</span>}</td>
            </motion.tr>
          ))}</tbody>
        </table></div>
      )}
    </article>
  );
}
