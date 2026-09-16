'use client';

/**
 * List card + row — the canonical "bordered card with divide-y rows" list.
 * Copy this whole file, rename `Item`, and swap the accent class (`group-hover:text-docs`).
 */
import Link from 'next/link';
import { ArrowRight, MoreHorizontal, Star, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export interface Item {
  id: string;
  icon?: string;
  title: string;
  meta: string;
  badge?: string;
  starred?: boolean;
}

interface ListRowsProps {
  items: Item[];
  hrefFor: (item: Item) => string;
  /** Tailwind hover colour for the title, e.g. "group-hover:text-docs" */
  accentHover?: string;
  onDelete?: (item: Item) => void;
}

export function ListRows({ items, hrefFor, accentHover = 'group-hover:text-foreground', onDelete }: ListRowsProps) {
  return (
    <div className="divide-y overflow-hidden rounded-lg border bg-card">
      {items.map((item) => (
        <div key={item.id} className="group relative flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40">
          {/* Whole row is the link; controls sit above it with z-10 */}
          <Link href={hrefFor(item)} className="absolute inset-0" aria-label={item.title} />
          {item.icon && <span className="w-6 text-center text-lg leading-none">{item.icon}</span>}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={cn('truncate text-sm font-medium', accentHover)}>{item.title}</p>
              {item.badge && <Badge variant="outline" className="text-[10px]">{item.badge}</Badge>}
              {item.starred && <Star className="size-3 fill-amber-400 text-amber-400" />}
            </div>
            <p className="text-xs text-muted-foreground">{item.meta}</p>
          </div>
          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="relative z-10 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100" aria-label="Options">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem variant="destructive" onSelect={() => onDelete(item)}><Trash2 />Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <ArrowRight className="size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
        </div>
      ))}
    </div>
  );
}

/** Matching skeleton — same container, same row height. */
export function ListRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y rounded-lg border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="size-6 rounded" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="ml-auto h-3 w-20" />
        </div>
      ))}
    </div>
  );
}
