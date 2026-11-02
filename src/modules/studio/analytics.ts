import { segmentFor, type Segment } from './data';
import { lastMonths, monthKey } from './dates';
import type { Deal, Invoice, StudioProject } from './types';

export interface GrowthMonth {
  key: string;
  month: string;
  enterprise: number;
  mid: number;
  smb: number;
  customers: number;
  /** null when no deal was closed that month */
  winRate: number | null;
}

interface RevenueEvent { client: string; value: number; date: string; source: string }

const diffDays = (from: string, to: string) => Math.round((new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()) / 86400000);

/**
 * Every rupee won: closed deals, plus money paid on invoices that are not tied to a deal
 * (so a payment entered straight into Finance still reaches Growth).
 */
function revenueEvents(deals: Deal[], invoices: Invoice[]): RevenueEvent[] {
  const fromDeals = deals.filter((deal) => deal.outcome === 'won' && deal.closedAt).map((deal) => ({ client: deal.client, value: deal.value, date: deal.closedAt!, source: deal.source || 'Other' }));
  const direct = invoices.filter((invoice) => invoice.status === 'Paid' && !invoice.dealId).map((invoice) => ({ client: invoice.client, value: invoice.amount, date: invoice.paidAt ?? invoice.issuedAt, source: 'Direct' }));
  return [...fromDeals, ...direct];
}

function lifetimeByClient(events: RevenueEvent[]) {
  const totals = new Map<string, number>();
  events.forEach((event) => totals.set(event.client, (totals.get(event.client) ?? 0) + event.value));
  return totals;
}

/** Everything the Growth page shows, computed from closed deals and paid invoices only. */
export function growthReport(deals: Deal[], invoices: Invoice[], period: number) {
  const months = lastMonths(period);
  const events = revenueEvents(deals, invoices);
  const totals = lifetimeByClient(events);
  const lost = deals.filter((deal) => deal.outcome === 'lost' && deal.closedAt);

  // A "new customer" is a client in the month of their first win.
  const firstWin = new Map<string, RevenueEvent>();
  [...events].sort((a, b) => a.date.localeCompare(b.date)).forEach((event) => { if (!firstWin.has(event.client)) firstWin.set(event.client, event); });

  const rows: GrowthMonth[] = months.map(({ key, label }) => {
    const wonIn = events.filter((event) => monthKey(event.date) === key);
    const lostIn = lost.filter((deal) => monthKey(deal.closedAt!) === key);
    const by = (segment: Segment) => wonIn.filter((event) => segmentFor(totals.get(event.client) ?? 0) === segment).reduce((sum, event) => sum + event.value, 0);
    const closed = wonIn.length + lostIn.length;
    return {
      key,
      month: label,
      enterprise: by('Enterprise'),
      mid: by('Mid-market'),
      smb: by('SMB'),
      customers: Array.from(firstWin.values()).filter((event) => monthKey(event.date) === key).length,
      winRate: closed ? Math.round(wonIn.length / closed * 100) : null,
    };
  });

  const inPeriod = new Set(months.map((month) => month.key));
  const newCustomers = Array.from(firstWin.values()).filter((event) => inPeriod.has(monthKey(event.date)));
  const sources = new Map<string, number>();
  newCustomers.forEach((event) => sources.set(event.source, (sources.get(event.source) ?? 0) + 1));

  const wonInPeriod = events.filter((event) => inPeriod.has(monthKey(event.date)));
  const wonDealsInPeriod = deals.filter((deal) => deal.outcome === 'won' && deal.closedAt && deal.createdAt && inPeriod.has(monthKey(deal.closedAt)));
  const cycles = wonDealsInPeriod.map((deal) => Math.max(0, diffDays(deal.createdAt!, deal.closedAt!)));
  const rated = rows.filter((row) => row.winRate !== null);

  return {
    months: rows,
    hasData: events.length + lost.length > 0,
    newCustomers: newCustomers.length,
    revenue: rows.reduce((sum, row) => sum + row.enterprise + row.mid + row.smb, 0),
    averageWon: wonInPeriod.length ? wonInPeriod.reduce((sum, event) => sum + event.value, 0) / wonInPeriod.length : 0,
    averageCycle: cycles.length ? Math.round(cycles.reduce((sum, days) => sum + days, 0) / cycles.length) : 0,
    winRate: rated.length ? Math.round(rated.reduce((sum, row) => sum + row.winRate!, 0) / rated.length) : 0,
    sources: Array.from(sources, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
  };
}

export function customerRows(deals: Deal[], invoices: Invoice[], projects: StudioProject[]) {
  const events = revenueEvents(deals, invoices);
  const totals = lifetimeByClient(events);
  const months = lastMonths(6);
  return Array.from(totals, ([client, revenue]) => {
    const mine = events.filter((event) => event.client === client);
    const contact = projects.find((project) => project.client === client && project.contactName)?.contactName ?? client;
    return {
      client,
      contact,
      revenue,
      deals: mine.length,
      segment: segmentFor(revenue),
      trend: months.map(({ key }) => mine.filter((event) => monthKey(event.date) === key).reduce((sum, event) => sum + event.value, 0)),
    };
  });
}

export function repRows(deals: Deal[], team: { id: string; name: string }[]) {
  const totalWon = deals.filter((deal) => deal.outcome === 'won').reduce((sum, deal) => sum + deal.value, 0);
  return team.map((person) => {
    const won = deals.filter((deal) => deal.owner === person.id && deal.outcome === 'won');
    const lost = deals.filter((deal) => deal.owner === person.id && deal.outcome === 'lost');
    const value = won.reduce((sum, deal) => sum + deal.value, 0);
    const closed = won.length + lost.length;
    return { id: person.id, name: person.name, wonValue: value, wonCount: won.length, share: totalWon ? Math.round(value / totalWon * 100) : 0, winRate: closed ? Math.round(won.length / closed * 100) : null };
  }).sort((a, b) => b.wonValue - a.wonValue);
}

export const SOURCE_COLORS = ['#bef264', '#7dd3a7', '#e879a7', '#88bdf2', '#70aee9', '#ff927f', '#f5c26b', '#b7a4f5', '#9ca3af'];

/**
 * Schedule entries generated from the rest of the Studio, so a payment, a delivery or a closing
 * date shows up on its day without anyone entering it twice. Edit them at the source.
 */
export function autoScheduleEvents(deals: Deal[], projects: StudioProject[], invoices: Invoice[], fallbackOwner: string) {
  const inr = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  const ownerOf = (projectId?: string) => projects.find((project) => project.id === projectId)?.owner ?? fallbackOwner;
  const events: import('./types').StudioTask[] = [];
  invoices.forEach((invoice) => {
    const paid = invoice.status === 'Paid';
    events.push({
      id: `auto-invoice-${invoice.id}`, auto: true, type: 'Payment', completed: paid,
      title: paid ? `Payment received · ${inr(invoice.amount)}` : `Payment due · ${inr(invoice.amount)}`,
      client: `${invoice.client} · ${invoice.project}`,
      date: paid ? (invoice.paidAt ?? invoice.issuedAt) : invoice.dueAt,
      startMinutes: 600, duration: 30, owner: ownerOf(invoice.projectId),
      notes: `${invoice.id} for ${invoice.project}. ${paid ? 'Marked paid in Finance.' : `Issued ${invoice.issuedAt}.`}`,
    });
  });
  projects.forEach((project) => events.push({
    id: `auto-project-${project.id}`, auto: true, type: 'Delivery', completed: project.status === 'Complete',
    title: project.status === 'Complete' ? `Delivered · ${project.title}` : `Delivery due · ${project.title}`,
    client: project.client, date: project.dueDate, startMinutes: 1020, duration: 30, owner: project.owner,
    notes: `${project.tasksDone} of ${project.tasksTotal} steps done.`,
  }));
  deals.filter((deal) => !deal.outcome || deal.outcome === 'open').forEach((deal) => events.push({
    id: `auto-deal-${deal.id}`, auto: true, type: 'Deal', completed: false,
    title: `Deal expected to close · ${inr(deal.value)}`, client: `${deal.client} · ${deal.title}`,
    date: deal.dueDate, startMinutes: 720, duration: 30, owner: deal.owner,
  }));
  return events;
}
