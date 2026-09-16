'use client';

import { useState } from 'react';
import { Command, ExternalLink, MoreHorizontal, Pencil, Star, Trash2, Globe } from 'lucide-react';
import type { Bookmark } from '@/types';
import { hostnameOf, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface BookmarkCardProps {
  bookmark: Bookmark;
  spaceName?: string;
  view: 'grid' | 'list';
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onToggleFavorite: (bookmark: Bookmark) => void;
  onToggleShortcut: (bookmark: Bookmark) => void;
}

const previewFor = (url: string) =>
  `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;

export function BookmarkCard({ bookmark, spaceName, view, onEdit, onDelete, onToggleFavorite, onToggleShortcut }: BookmarkCardProps) {
  const domain = hostnameOf(bookmark.url);
  const isShortcut = bookmark.tags?.includes('shortcut');

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="More" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={() => onEdit(bookmark)}><Pencil />Edit details</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onToggleFavorite(bookmark)}>
          <Star className={cn(bookmark.is_favorite && 'fill-amber-400 text-amber-400')} />
          {bookmark.is_favorite ? 'Unstar' : 'Star'}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onToggleShortcut(bookmark)}>
          <Command className={cn(isShortcut && 'text-ai')} />
          {isShortcut ? 'Remove shortcut' : 'Make shortcut'}
        </DropdownMenuItem>
        <DropdownMenuItem asChild><a href={bookmark.url} target="_blank" rel="noreferrer"><ExternalLink />Open link</a></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(bookmark)}><Trash2 />Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (view === 'list') {
    return (
      <div className="group flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-muted/40">
        <Favicon src={bookmark.logo_url} domain={domain} className="size-9" />
        <button type="button" onClick={() => onEdit(bookmark)} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium group-hover:text-brand">{bookmark.title || domain}</p>
            {bookmark.is_favorite && <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />}
            {isShortcut && <Command className="size-3 shrink-0 text-ai" />}
          </div>
          <p className="truncate text-xs text-muted-foreground">{domain}{bookmark.description ? ` — ${bookmark.description}` : ''}</p>
        </button>
        <div className="hidden items-center gap-1.5 md:flex">
          {spaceName && <Badge variant="outline">{spaceName}</Badge>}
          {bookmark.category && <Badge variant="secondary">{bookmark.category}</Badge>}
        </div>
        <span className="hidden w-20 text-right text-xs text-muted-foreground lg:block">{timeAgo(bookmark.created_at)}</span>
        <Button variant="ghost" size="icon-sm" asChild>
          <a href={bookmark.url} target="_blank" rel="noreferrer" aria-label="Open"><ExternalLink /></a>
        </Button>
        {menu}
      </div>
    );
  }

  return (
    <Card className="group flex h-full flex-col overflow-hidden p-0 transition-shadow hover:shadow-md">
      {/* Preview */}
      <a href={bookmark.url} target="_blank" rel="noreferrer" className="relative block aspect-[16/9] overflow-hidden bg-muted">
        <Preview url={bookmark.url} fallback={bookmark.preview_image_url} alt={bookmark.title || domain} />
        {bookmark.category && (
          <Badge className="absolute bottom-2 left-2 bg-background/80 text-foreground backdrop-blur hover:bg-background/80">{bookmark.category}</Badge>
        )}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            size="icon-sm" variant="secondary" aria-label="Star"
            className={cn('bg-background/80 backdrop-blur', bookmark.is_favorite && 'text-amber-500')}
            onClick={(e) => { e.preventDefault(); onToggleFavorite(bookmark); }}
          >
            <Star className={cn(bookmark.is_favorite && 'fill-current')} />
          </Button>
          <Button
            size="icon-sm" variant="secondary" aria-label="Shortcut"
            className={cn('bg-background/80 backdrop-blur', isShortcut && 'text-ai')}
            onClick={(e) => { e.preventDefault(); onToggleShortcut(bookmark); }}
          >
            <Command />
          </Button>
        </div>
      </a>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <Favicon src={bookmark.logo_url} domain={domain} className="size-9" />
          <button type="button" onClick={() => onEdit(bookmark)} className="min-w-0 flex-1 text-left">
            <p className="line-clamp-1 text-sm font-semibold group-hover:text-brand">{bookmark.title || domain}</p>
            <p className="truncate text-xs text-muted-foreground">{domain}</p>
          </button>
          {menu}
        </div>
        {bookmark.description && <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{bookmark.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
          <span className="truncate">{spaceName ?? 'Unsorted'} · {timeAgo(bookmark.created_at)}</span>
          {bookmark.tags && bookmark.tags.filter((t) => t !== 'shortcut').length > 0 && (
            <span className="flex shrink-0 gap-1">
              {bookmark.tags.filter((t) => t !== 'shortcut').slice(0, 2).map((t) => (
                <Badge key={t} variant="outline" className="px-1.5 text-[10px]">{t}</Badge>
              ))}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function Favicon({ src, domain, className }: { src?: string; domain: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const url = !failed && src ? src : `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  return (
    <span className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background', className)}>
      {domain ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="size-[60%] object-contain" onError={() => setFailed(true)} />
      ) : (
        <Globe className="size-4 text-muted-foreground" />
      )}
    </span>
  );
}

function Preview({ url, fallback, alt }: { url: string; fallback?: string; alt: string }) {
  const [stage, setStage] = useState<0 | 1 | 2>(0); // 0 screenshot → 1 og image → 2 placeholder
  if (stage === 2 || (stage === 1 && !fallback)) {
    return (
      <div className="flex size-full items-center justify-center bg-linear-to-br from-muted to-muted/40">
        <Globe className="size-8 text-muted-foreground/40" />
      </div>
    );
  }
  const src = stage === 0 ? previewFor(url) : fallback!;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
      onError={() => setStage((s) => (s === 0 ? 1 : 2))}
    />
  );
}
