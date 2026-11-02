'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Layers, Plus, Star } from 'lucide-react';
import { useWorkspace } from '@/hooks/use-workspace';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/** Recent docs / boards and starred links — lives in the dock's "Recents" popover. */
export function QuickAccess({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { loading, notes, boards, bookmarks, user } = useWorkspace();

  const favoriteLinks = bookmarks.filter((b) => b.is_favorite).slice(0, 6);
  const recentPages = [...notes]
    .filter((n) => !n.parent_id || n.user_id !== user?.id)
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
    .slice(0, 7);
  const recentBoards = boards.slice(0, 7);

  const row = 'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground/80 transition-colors hover:bg-foreground/[0.06] hover:text-foreground';

  return (
    <Tabs defaultValue="docs" className="gap-2">
      <TabsList className="grid h-9 w-full grid-cols-3">
        <TabsTrigger value="docs" className="text-xs">Docs</TabsTrigger>
        <TabsTrigger value="boards" className="text-xs">Boards</TabsTrigger>
        <TabsTrigger value="links" className="text-xs">Starred</TabsTrigger>
      </TabsList>

      <div className="custom-scrollbar h-60 overflow-y-auto">
        <TabsContent value="docs" className="m-0">
          {loading ? <ListSkeleton /> : recentPages.length ? (
            <ul className="flex flex-col gap-0.5">
              {recentPages.map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/dashboard/docs/${n.id}`}
                    onClick={onNavigate}
                    className={cn(row, pathname === `/dashboard/docs/${n.id}` && 'bg-foreground/[0.07] font-medium text-foreground')}
                  >
                    <span className="text-sm leading-none">{n.icon || '📄'}</span>
                    <span className="truncate">{n.title || 'Untitled'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Empty icon={FileText} label="No pages yet" href="/dashboard/docs" cta="New page" onNavigate={onNavigate} />}
        </TabsContent>

        <TabsContent value="boards" className="m-0">
          {loading ? <ListSkeleton /> : recentBoards.length ? (
            <ul className="flex flex-col gap-0.5">
              {recentBoards.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/dashboard/canvas/${b.id}`}
                    onClick={onNavigate}
                    className={cn(row, pathname === `/dashboard/canvas/${b.id}` && 'bg-foreground/[0.07] font-medium text-foreground')}
                  >
                    <Layers className="size-3.5 shrink-0 text-canvas" />
                    <span className="truncate">{b.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Empty icon={Layers} label="No boards yet" href="/dashboard/canvas" cta="New board" onNavigate={onNavigate} />}
        </TabsContent>

        <TabsContent value="links" className="m-0">
          {loading ? <ListSkeleton /> : favoriteLinks.length ? (
            <ul className="flex flex-col gap-0.5">
              {favoriteLinks.map((b) => (
                <li key={b.id}>
                  <a href={b.url} target="_blank" rel="noreferrer" className={row}>
                    {b.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.logo_url} alt="" className="size-3.5 shrink-0 rounded-sm object-contain" />
                    ) : (
                      <Star className="size-3.5 shrink-0 text-brand" />
                    )}
                    <span className="truncate">{b.title || b.url}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : <Empty icon={Star} label="No starred links" href="/dashboard/bookmarks" cta="Browse links" onNavigate={onNavigate} />}
        </TabsContent>
      </div>
    </Tabs>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-1.5 p-1">
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-7 w-full rounded-lg" />)}
    </div>
  );
}

function Empty({ icon: Icon, label, href, cta, onNavigate }: { icon: React.ComponentType<{ className?: string }>; label: string; href: string; cta: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-56 flex-col items-center justify-center gap-2 text-center">
      <Icon className="size-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <Button size="xs" variant="outline" asChild>
        <Link href={href} onClick={onNavigate}><Plus className="size-3" />{cta}</Link>
      </Button>
    </div>
  );
}
