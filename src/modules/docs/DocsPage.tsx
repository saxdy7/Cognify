'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Clock, Database, FileText, MoreHorizontal, Plus, Search, Star, Trash2, Users } from 'lucide-react';
import type { Note } from '@/types';
import { useWorkspace } from '@/hooks/use-workspace';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/modules/main/PageHeader';
import { Stagger, StaggerItem } from '@/components/motion/reveal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Tab = 'all' | 'favorites' | 'recent' | 'shared';

export function DocsPage() {
  const router = useRouter();
  const { loading, notes, user, addNote, updateNote, deleteNote } = useWorkspace();
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [deleting, setDeleting] = useState<Note | null>(null);

  const own = useMemo(() => notes.filter((n) => n.user_id === user?.id), [notes, user]);
  const shared = useMemo(() => notes.filter((n) => n.user_id !== user?.id), [notes, user]);
  const childCount = useMemo(() => {
    const m: Record<string, number> = {};
    for (const n of notes) if (n.parent_id) m[n.parent_id] = (m[n.parent_id] ?? 0) + 1;
    return m;
  }, [notes]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base: Note[];
    switch (tab) {
      case 'favorites': base = own.filter((n) => n.is_favorite); break;
      case 'recent': base = [...notes].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)).slice(0, 20); break;
      case 'shared': base = shared; break;
      default: base = own.filter((n) => !n.parent_id);
    }
    if (q) base = notes.filter((n) => n.title.toLowerCase().includes(q));
    return base;
  }, [tab, query, own, shared, notes]);

  const create = async (kind: 'page' | 'database') => {
    const n = await addNote(null, kind);
    if (n) router.push(`/dashboard/docs/${n.id}`);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 md:p-8">
      <PageHeader
        icon={FileText}
        iconClassName="text-docs"
        title="Docs"
        description="Block-based pages with nested subpages, realtime editing and comments."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => create('database')}><Database />New database</Button>
            <Button size="sm" onClick={() => create('page')}><Plus />New page</Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            <TabsTrigger value="all"><FileText />All pages</TabsTrigger>
            <TabsTrigger value="favorites"><Star />Favorites</TabsTrigger>
            <TabsTrigger value="recent"><Clock />Recent</TabsTrigger>
            <TabsTrigger value="shared">
              <Users />Shared with me
              {shared.length > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{shared.length}</Badge>}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pages…" className="pl-10" />
        </div>
      </div>

      {loading ? (
        <div className="divide-y rounded-lg border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3"><Skeleton className="size-6 rounded" /><Skeleton className="h-4 w-1/3" /><Skeleton className="ml-auto h-3 w-20" /></div>
          ))}
        </div>
      ) : list.length ? (
        <Stagger className="divide-y divide-foreground/[0.06] overflow-hidden rounded-2xl border bg-card backdrop-blur-xl" gap={0.04}>
          {list.map((n) => {
            const isOwner = n.user_id === user?.id;
            const isDb = (n.content as { kind?: string } | null)?.kind === 'database';
            return (
              <StaggerItem key={n.id} className="group relative flex items-center gap-4 px-4 py-3 transition-colors hover:bg-foreground/[0.04]">
                <Link href={`/dashboard/docs/${n.id}`} className="absolute inset-0" aria-label={n.title || 'Untitled'} />
                <span className="w-6 text-center text-lg leading-none">{n.icon || (isDb ? '🗃️' : '📄')}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium group-hover:text-docs">{n.title || 'Untitled'}</p>
                    {isDb && <Badge variant="outline" className="text-[10px]">Database</Badge>}
                    {!isOwner && <Badge variant="secondary" className="text-[10px]"><Users className="size-3" />Shared</Badge>}
                    {n.is_favorite && <Star className="size-3 fill-amber-400 text-amber-400" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Edited {timeAgo(n.updated_at)}
                    {childCount[n.id] ? ` · ${childCount[n.id]} subpage${childCount[n.id] > 1 ? 's' : ''}` : ''}
                  </p>
                </div>
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="relative z-10 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100" aria-label="Page options">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => updateNote(n.id, { is_favorite: !n.is_favorite })}>
                        <Star className={cn(n.is_favorite && 'fill-amber-400 text-amber-400')} />{n.is_favorite ? 'Unfavorite' : 'Favorite'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => router.push(`/dashboard/docs/${n.id}`)}><ArrowRight />Open</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(n)}><Trash2 />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <ArrowRight className="size-4 text-muted-foreground/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-docs" />
              </StaggerItem>
            );
          })}
        </Stagger>
      ) : (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon"><FileText /></EmptyMedia>
            <EmptyTitle>{query ? 'No matching pages' : tab === 'shared' ? 'Nothing shared with you yet' : 'No pages yet'}</EmptyTitle>
            <EmptyDescription>
              {query ? 'Try another search term.' : tab === 'shared' ? 'When someone invites you to a page it will appear here.' : 'Create a page to start writing. Press “/” inside a page for blocks.'}
            </EmptyDescription>
          </EmptyHeader>
          {!query && tab !== 'shared' && (
            <EmptyContent><Button size="sm" onClick={() => create('page')}><Plus />Create a page</Button></EmptyContent>
          )}
        </Empty>
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.title || 'Untitled'}”?</AlertDialogTitle>
            <AlertDialogDescription>This page and all of its subpages will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => { if (deleting) deleteNote(deleting.id); setDeleting(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
