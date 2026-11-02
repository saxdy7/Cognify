/** Local-time ISO date helpers (yyyy-MM-dd) so the Studio never depends on a hard-coded "today". */
const pad = (n: number) => String(n).padStart(2, '0');

export const toISO = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const todayISO = () => toISO(new Date());
export const addDaysISO = (iso: string, days: number) => { const date = new Date(`${iso}T12:00:00`); date.setDate(date.getDate() + days); return toISO(date); };
export const monthKey = (iso: string) => iso.slice(0, 7);

/** The last `count` calendar months ending with the current one, oldest first. */
export function lastMonths(count: number, now = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return { key: `${date.getFullYear()}-${pad(date.getMonth() + 1)}`, label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date) };
  });
}
