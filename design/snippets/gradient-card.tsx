'use client';

/**
 * Tinted card + create tile — used for boards (Canvas page, Overview).
 * Tints come from CARD_GRADIENTS (index-stable) so the same board always has the same colour.
 */
import Link from 'next/link';
import { Layers, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { gradientFor } from '@/lib/static';
import { timeAgo } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function GradientCard({ index, title, href, updatedAt, onDelete }: {
  index: number; title: string; href: string; updatedAt: string; onDelete?: () => void;
}) {
  return (
    <Card className={cn('group relative h-[180px] overflow-hidden bg-linear-to-br p-0 transition-transform hover:scale-[1.02]', gradientFor(index))}>
      <Link href={href} className="absolute inset-0" aria-label={`Open ${title}`} />
      <CardHeader className="flex-row items-start justify-between p-4">
        <h3 className="truncate text-base font-semibold">{title}</h3>
        {onDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="relative z-10 bg-background/40 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100" aria-label="Options">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onSelect={onDelete}><Trash2 />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 blur-2xl dark:bg-white/10" />
      <CardFooter className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/20 bg-black/5 px-4 py-2.5 text-[11px] font-medium text-foreground/70 backdrop-blur-xs dark:bg-white/5">
        <span>Edited {timeAgo(updatedAt)}</span>
        <Layers className="size-3.5" />
      </CardFooter>
    </Card>
  );
}

/** Dashed "create" tile that leads a card grid. `accent` = canvas | brand | docs | ai */
export function CreateTile({ label, onClick, accent = 'canvas' }: { label: string; onClick: () => void; accent?: 'canvas' | 'brand' | 'docs' | 'ai' }) {
  const hover = {
    canvas: 'hover:border-canvas/60 hover:bg-canvas/5',
    brand: 'hover:border-brand/60 hover:bg-brand/5',
    docs: 'hover:border-docs/60 hover:bg-docs/5',
    ai: 'hover:border-ai/60 hover:bg-ai/5',
  }[accent];
  return (
    <button
      onClick={onClick}
      className={cn('flex h-[180px] items-center justify-center rounded-xl border-2 border-dashed text-sm font-medium text-muted-foreground transition-colors hover:text-foreground', hover)}
    >
      <Plus className="mr-2 size-4" /> {label}
    </button>
  );
}
