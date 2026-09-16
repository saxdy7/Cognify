'use client';

/** Segmented filters + search + grid/list toggle on one border-b row (stacks on mobile). */
import { LayoutGrid, List, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export interface Filter { id: string; label: string }

export function Toolbar({ filters, active, onFilter, query, onQuery, view, onView, placeholder = 'Search…' }: {
  filters: Filter[]; active: string; onFilter: (id: string) => void;
  query: string; onQuery: (q: string) => void;
  view?: 'grid' | 'list'; onView?: (v: 'grid' | 'list') => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1 rounded-md border bg-muted p-1">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilter(f.id)}
            className={cn(
              'rounded-sm px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
              active === f.id && 'bg-background text-foreground shadow-sm',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => onQuery(e.target.value)} placeholder={placeholder} className="h-8 pl-8" />
        </div>
        {view && onView && (
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && onView(v as 'grid' | 'list')} variant="outline" size="sm">
            <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid /></ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view"><List /></ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>
    </div>
  );
}
