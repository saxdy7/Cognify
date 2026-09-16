'use client';

/** Horizontal filter-chip rail (Bookmarks "spaces"). Active chip uses the workspace accent. */
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface Chip { id: string | null; label: string; count: number; icon?: React.ReactNode; menu?: React.ReactNode }

export function ChipRail({ chips, active, onSelect }: { chips: Chip[]; active: string | null; onSelect: (id: string | null) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {chips.map((c) => {
        const isActive = active === c.id;
        return (
          <div
            key={String(c.id)}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(c.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(c.id); } }}
            className={cn(
              'group flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
              isActive ? 'border-brand/40 bg-brand/10 text-foreground' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {c.icon}
            <span className="max-w-[140px] truncate">{c.label}</span>
            <Badge variant={isActive ? 'default' : 'secondary'} className={cn('h-4 min-w-4 px-1 text-[10px]', isActive && 'bg-brand text-brand-foreground')}>{c.count}</Badge>
            {c.menu}
          </div>
        );
      })}
    </div>
  );
}
