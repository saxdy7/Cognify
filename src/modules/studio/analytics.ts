import { segmentFor, type Segment } from './data';
import { lastMonths, monthKey } from './dates';
import type { Deal, StudioProject } from './types';

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

const diffDays = (from: string, to: string) => Math.round((new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()) / 86400000);

/** Lifetime won revenue per client — decides each client's segment. */
export function clientRevenue(deals: Deal[]) {
  const totals = new Map<string, number>();
  deals.filter((deal) => deal.outcome === 'won').forEach((deal) => totals.set(deal.client, (totals.get(deal.client) ?? 0) + deal.value));
  return totals;
}

/** Everything the Growth page shows, computed from closed deals only. */
export function growthReport(deals: Deal[], period: number) {
  const months = lastMonths(period);
  const totals = clientRevenue(deals);
  const won = deals.filter((deal) => deal.outcome === 'won' && deal.closedAt);
  const lost = deals.filter((deal) => deal.outcome === 'lost' && deal.closedAt);

  // A "new customer" is a client in the month of their first won deal.
  const firstWin = new Map<string, Deal>();
  [...won].sort((a, b) => a.closedAt!.localeCompare(b.closedAt!)).forEach((deal) => { if (!firstWin.has(deal.client)) firstWin.set(deal.client, deal); });

  const rows: GrowthMonth[] = months.map(({ key, label }) => {
    const wonIn = won.filter((deal) => monthKey(deal.closedAt!) === key);
    const lostIn = lost.filter((deal) => monthKey(deal.closedAt!) === key);
    const by = (segment: Segment) => wonIn.filter((deal) => segmentFor(totals.get(deal.client) ?? 0) === segment).reduce((sum, deal) => sum + deal.value, 0);
    const closed = wonIn.length + lostIn.length;
    return {
      key,
      month: label,
      enterprise: by('Enterprise'),
      mid: by('Mid-market'),
      smb: by('SMB'),
      customers: Array.from(firstWin.values()).filter((deal) => monthKey(deal.closedAt!) === key).length,
      winRate: closed ? Math.round(wonIn.length / closed * 100) : null,
    };
  });

  const inPeriod = new Set(months.map((month) => month.key));
  const newCustomerDeals = Array.from(firstWin.values()).filter((deal) => inPeriod.has(monthKey(deal.closedAt!)));
  const sources = new Map<string, number>();
  newCustomerDeals.forEach((deal) => sources.set(deal.source || 'Other', (sources.get(deal.source || 'Other') ?? 0) + 1));

  const wonInPeriod = won.filter((deal) => inPeriod.has(monthKey(deal.closedAt!)));
  const cycles = wonInPeriod.filter((deal) => deal.createdAt).map((deal) => Math.max(0, diffDays(deal.createdAt!, deal.closedAt!)));
  const rated = rows.filter((row) => row.winRate !== null);

  return {
    months: rows,
    hasData: won.length + lost.length > 0,
    newCustomers: newCustomerDeals.length,
    revenue: rows.reduce((sum, row) => sum + row.enterprise + row.mid + row.smb, 0),
    averageWon: wonInPeriod.length ? wonInPeriod.reduce((sum, deal) => sum + deal.value, 0) / wonInPeriod.length : 0,
    averageCycle: cycles.length ? Math.round(cycles.reduce((sum, days) => sum + days, 0) / cycles.length) : 0,
    winRate: rated.length ? Math.round(rated.reduce((sum, row) => sum + row.winRate!, 0) / rated.length) : 0,
    sources: Array.from(sources, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
  };
}

export function customerRows(deals: Deal[], projects: StudioProject[]) {
  const totals = clientRevenue(deals);
  const months = lastMonths(6);
  return Array.from(totals, ([client, revenue]) => {
    const won = deals.filter((deal) => deal.client === client && deal.outcome === 'won');
    const contact = projects.find((project) => project.client === client && project.contactName)?.contactName ?? client;
    return {
      client,
      contact,
      revenue,
      deals: won.length,
      segment: segmentFor(revenue),
      trend: months.map(({ key }) => won.filter((deal) => deal.closedAt && monthKey(deal.closedAt) === key).reduce((sum, deal) => sum + deal.value, 0)),
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
