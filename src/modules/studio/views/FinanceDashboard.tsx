'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Banknote, Check, CircleDollarSign, Clock3, Download, Plus, ReceiptText, Trash2, TriangleAlert, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { lastMonths, monthKey, todayISO } from '../dates';
import { NewExpenseDialog, NewInvoiceDialog } from '../StudioDialogs';
import { AnimatedNumber, ChartScope, ScrollReveal } from '../StudioMotion';
import { useStudio } from '../StudioProvider';
import { currency, EmptyState, MetricCard, shortDate, StudioHeader } from '../StudioUi';
import type { Invoice } from '../types';

const compact = (n: number) => currency(n, true);

export function FinanceDashboard() {
  const { invoices, expenses, deals, projects, updateInvoice, deleteInvoice, deleteExpense } = useStudio();
  const reduce = useReducedMotion();
  const [invoiceOpen, setInvoiceOpen] = React.useState(false);
  const [expenseOpen, setExpenseOpen] = React.useState(false);
  const today = todayISO();

  // "Overdue" is derived: an unpaid invoice past its due date.
  const withStatus = invoices.map((invoice): Invoice => invoice.status === 'Due' && invoice.dueAt < today ? { ...invoice, status: 'Overdue' } : invoice);
  const paid = withStatus.filter((invoice) => invoice.status === 'Paid').reduce((sum, invoice) => sum + invoice.amount, 0);
  const open = withStatus.filter((invoice) => invoice.status !== 'Paid');
  const outstanding = open.reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueList = withStatus.filter((invoice) => invoice.status === 'Overdue');
  const overdue = overdueList.reduce((sum, invoice) => sum + invoice.amount, 0);
  const active = projects.filter((project) => project.status !== 'Complete');
  const contracted = active.reduce((sum, project) => sum + project.budget, 0);

  const months = lastMonths(6).map(({ key, label }) => ({
    key, label,
    revenue: withStatus.filter((invoice) => invoice.status === 'Paid' && monthKey(invoice.paidAt ?? invoice.issuedAt) === key).reduce((sum, invoice) => sum + invoice.amount, 0),
    cost: expenses.filter((expense) => monthKey(expense.date) === key).reduce((sum, expense) => sum + expense.amount, 0),
  }));
  const max = Math.max(1, ...months.flatMap((month) => [month.revenue, month.cost]));
  const hasChart = months.some((month) => month.revenue > 0 || month.cost > 0);
  const net = months.reduce((sum, month) => sum + month.revenue - month.cost, 0);

  const openDeals = deals.filter((deal) => !deal.outcome || deal.outcome === 'open');
  const forecast = openDeals.reduce((sum, deal) => sum + deal.value * deal.probability / 100, 0);
  const stages = (['lead', 'proposal', 'negotiation'] as const).map((stage) => ({ stage, amount: openDeals.filter((deal) => deal.stage === stage).reduce((sum, deal) => sum + deal.value * deal.probability / 100, 0) }));
  const stageMax = Math.max(1, ...stages.map((item) => item.amount));
  const label = { lead: 'Qualified', proposal: 'Proposal', negotiation: 'Negotiation' } as const;

  const exportCsv = () => {
    const rows = [['Invoice', 'Client', 'Project', 'Amount INR', 'Issued', 'Due', 'Status'], ...withStatus.map((invoice) => [invoice.id, invoice.client, invoice.project, invoice.amount, invoice.issuedAt, invoice.dueAt, invoice.status])];
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')], { type: 'text/csv' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'cognify-invoices.csv'; anchor.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-7 studio-page-enter">
      <StudioHeader eyebrow="Finance desk" title="Revenue and cash flow" description="Bill clients, record costs and see what is collected, what is still due, and what the pipeline may add next." action={<div className="flex flex-wrap gap-2"><Button variant="outline" className="rounded-full" onClick={() => setExpenseOpen(true)}><Wallet />Expense</Button><Button variant="outline" className="rounded-full" onClick={exportCsv} disabled={!invoices.length}><Download />Export</Button><Button className="rounded-full" onClick={() => setInvoiceOpen(true)}><Plus />New invoice</Button></div>} />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ScrollReveal><MetricCard label="Cash collected" value={paid} detail="Paid invoices" icon={CircleDollarSign} tone="lime" /></ScrollReveal>
        <ScrollReveal delay={0.06}><MetricCard label="Outstanding" value={outstanding} detail={`${open.length} open invoice${open.length === 1 ? '' : 's'}`} icon={Clock3} tone="sky" /></ScrollReveal>
        <ScrollReveal delay={0.12}><MetricCard label="Overdue" value={overdue} detail={overdueList.length ? `${overdueList.length} need follow-up` : 'Nothing overdue'} icon={TriangleAlert} tone="coral" /></ScrollReveal>
        <ScrollReveal delay={0.18}><MetricCard label="Active contracts" value={contracted} format={compact} detail={`${active.length} project${active.length === 1 ? '' : 's'} in delivery`} icon={Banknote} /></ScrollReveal>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <ScrollReveal>
          <ChartScope>
            <article className="studio-spotlight rounded-[1.75rem] bg-card p-5 ring-1 ring-foreground/[0.07] md:p-6">
              <div className="relative flex items-start justify-between"><div><h2 className="text-lg font-bold">Revenue vs. operating cost</h2><p className="mt-1 text-xs text-muted-foreground">Last six months · net <b className={cn(net < 0 && 'text-rose-500')}><AnimatedNumber value={net} format={compact} /></b></p></div><div className="flex gap-3 text-[10px] font-semibold text-muted-foreground"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-lime-400" />Revenue</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#ff8f7a]" />Cost</span></div></div>
              {hasChart ? (
                <div data-velocity-skew className="relative mt-8 grid h-64 origin-bottom grid-cols-6 items-end gap-3 border-b border-foreground/[0.08] px-2 transition-transform duration-200">
                  {months.map((month, index) => <div key={month.key} className="group flex h-full flex-col items-center justify-end gap-2"><div className="flex h-full w-full items-end justify-center gap-1.5"><div className="studio-bar w-[38%] rounded-t-lg bg-lime-300 transition-[filter,translate] duration-200 group-hover:-translate-y-1 group-hover:brightness-110 dark:bg-lime-500/70" style={{ height: `${Math.max(2, month.revenue / max * 100)}%`, animationDelay: `${index * 35}ms` }} title={`Revenue ${currency(month.revenue)}`} /><div className="studio-bar w-[38%] rounded-t-lg bg-[#ff9a83] transition-[filter,translate] duration-200 group-hover:-translate-y-1 group-hover:brightness-110 dark:bg-[#b45f50]" style={{ height: `${Math.max(2, month.cost / max * 100)}%`, animationDelay: `${index * 35 + 45}ms` }} title={`Costs ${currency(month.cost)}`} /></div><span className="pb-2 text-[10px] font-semibold text-muted-foreground">{month.label}</span></div>)}
                </div>
              ) : <p className="relative mt-8 flex h-64 items-center justify-center rounded-2xl border border-dashed border-foreground/[0.12] px-6 text-center text-xs text-muted-foreground">Mark an invoice paid or record an expense and the monthly bars appear here.</p>}
            </article>
          </ChartScope>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <ChartScope>
            <article className="studio-sheen rounded-[1.75rem] bg-tint-ink p-6 text-tint-ink-foreground ring-1 ring-white/10">
              <p className="text-[10px] font-bold tracking-[0.16em] text-white/50 uppercase">Pipeline forecast</p><p className="mt-4 text-4xl font-bold tracking-[-0.04em]"><AnimatedNumber value={forecast} format={compact} duration={1} /></p><p className="mt-2 text-sm text-white/60">Probability-weighted open deals</p>
              <div className="mt-8 space-y-4">{stages.map(({ stage, amount }) => <div key={stage}><div className="mb-1.5 flex justify-between text-xs"><span className="text-white/60">{label[stage]}</span><span className="font-bold"><AnimatedNumber value={amount} format={compact} /></span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="studio-meter h-full rounded-full bg-lime-300 transition-[width] duration-700 ease-(--ease-out)" style={{ width: `${amount ? Math.max(6, amount / stageMax * 100) : 0}%` }} /></div></div>)}</div>
            </article>
          </ChartScope>
        </ScrollReveal>
      </section>

      <ScrollReveal>
        <article className="overflow-hidden rounded-[1.75rem] bg-card ring-1 ring-foreground/[0.07]">
          <div className="flex items-center justify-between border-b border-foreground/[0.07] p-5"><div><h2 className="text-lg font-bold">Invoices</h2><p className="mt-1 text-xs text-muted-foreground">Billing activity, newest first</p></div><ReceiptText className="size-5 text-muted-foreground" /></div>
          {!invoices.length ? <EmptyState icon={ReceiptText} title="No invoices yet" body="Create your first invoice to start tracking cash collected, what is outstanding and what is overdue." actionLabel="New invoice" onAction={() => setInvoiceOpen(true)} className="m-5 border-0 bg-transparent" /> : (
            <><ul className="divide-y divide-foreground/[0.07] md:hidden"><AnimatePresence initial={false}>{withStatus.map((invoice) => <motion.li key={invoice.id} layout={!reduce} initial={reduce ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, x: 24 }} className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{invoice.client}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{invoice.id} · {invoice.project}</p></div><span key={invoice.status} className={cn('animate-flash shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold', invoice.status === 'Paid' ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300' : invoice.status === 'Overdue' ? 'bg-rose-500/12 text-rose-700 dark:text-rose-300' : 'bg-amber-500/12 text-amber-700 dark:text-amber-300')}>{invoice.status}</span></div><div className="flex items-end justify-between gap-3"><div><p className="text-lg font-bold tabular-nums">{currency(invoice.amount)}</p><p className="mt-0.5 text-[10px] text-muted-foreground">Issued {shortDate(invoice.issuedAt)} · due {shortDate(invoice.dueAt)}</p></div><div className="flex shrink-0 gap-1">{invoice.status !== 'Paid' && <Button size="xs" variant="outline" className="rounded-full" onClick={() => updateInvoice(invoice.id, { status: 'Paid' })}><Check />Paid</Button>}<Button aria-label={`Delete ${invoice.id}`} size="icon-xs" variant="ghost" className="rounded-full text-muted-foreground hover:text-destructive" onClick={() => deleteInvoice(invoice.id)}><Trash2 /></Button></div></div></motion.li>)}</AnimatePresence></ul>
            <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[820px] text-left"><thead><tr className="border-b border-foreground/[0.07] text-[10px] font-bold tracking-wider text-muted-foreground uppercase"><th className="px-5 py-3">Invoice</th><th className="px-5 py-3">Client / project</th><th className="px-5 py-3">Issued</th><th className="px-5 py-3">Due</th><th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3 text-right">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
              <tbody><AnimatePresence initial={false}>{withStatus.map((invoice) => <motion.tr key={invoice.id} layout={!reduce} initial={reduce ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, x: 24 }} transition={{ type: 'spring', stiffness: 460, damping: 38 }} className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.025]"><td className="px-5 py-4 font-mono text-xs font-semibold">{invoice.id}</td><td className="px-5 py-4"><p className="text-sm font-semibold">{invoice.client}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{invoice.project}</p></td><td className="px-5 py-4 text-xs text-muted-foreground">{shortDate(invoice.issuedAt)}</td><td className="px-5 py-4 text-xs text-muted-foreground">{shortDate(invoice.dueAt)}</td><td className="px-5 py-4 text-right text-sm font-bold tabular-nums">{currency(invoice.amount)}</td><td className="px-5 py-4 text-right"><span key={invoice.status} className={cn('animate-flash inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold', invoice.status === 'Paid' ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300' : invoice.status === 'Overdue' ? 'bg-rose-500/12 text-rose-700 dark:text-rose-300' : 'bg-amber-500/12 text-amber-700 dark:text-amber-300')}>{invoice.status}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-1">{invoice.status !== 'Paid' && <Button size="xs" variant="outline" className="rounded-full" onClick={() => updateInvoice(invoice.id, { status: 'Paid' })}><Check />Mark paid</Button>}<Button aria-label={`Delete ${invoice.id}`} size="icon-xs" variant="ghost" className="rounded-full text-muted-foreground hover:text-destructive" onClick={() => deleteInvoice(invoice.id)}><Trash2 /></Button></div></td></motion.tr>)}</AnimatePresence></tbody></table></div></>
          )}
        </article>
      </ScrollReveal>

      {expenses.length > 0 && (
        <ScrollReveal>
          <article className="rounded-[1.75rem] bg-card p-5 ring-1 ring-foreground/[0.07]">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Expenses</h2><span className="text-xs font-semibold text-muted-foreground"><AnimatedNumber value={expenses.reduce((sum, expense) => sum + expense.amount, 0)} format={compact} /> total</span></div>
            <ul className="mt-3 divide-y divide-foreground/[0.07]"><AnimatePresence initial={false}>{expenses.slice(0, 8).map((expense) => <motion.li key={expense.id} layout={!reduce} initial={reduce ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={reduce ? undefined : { opacity: 0, height: 0 }} className="group flex items-center gap-3 overflow-hidden py-2.5 text-sm"><span className="flex-1 truncate font-semibold">{expense.label}</span><span className="text-xs text-muted-foreground">{shortDate(expense.date)}</span><span className="w-24 text-right font-bold tabular-nums">{currency(expense.amount)}</span><button aria-label={`Delete ${expense.label}`} onClick={() => deleteExpense(expense.id)} className="flex size-7 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"><Trash2 className="size-3.5" /></button></motion.li>)}</AnimatePresence></ul>
          </article>
        </ScrollReveal>
      )}

      <NewInvoiceDialog open={invoiceOpen} onOpenChange={setInvoiceOpen} />
      <NewExpenseDialog open={expenseOpen} onOpenChange={setExpenseOpen} />
    </div>
  );
}
