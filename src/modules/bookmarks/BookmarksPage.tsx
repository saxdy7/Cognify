'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bookmark as BookmarkIcon, Folder, FolderPlus, LayoutGrid, List, MoreHorizontal, Plus, Search, Trash2, Users } from 'lucide-react';
import type { Bookmark } from '@/types';
import { useWorkspace } from '@/hooks/use-workspace';
import { isToday } from '@/lib/format';
import { BOOKMARK_FILTERS, type BookmarkFilter } from '@/lib/static';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { InViewItem } from '@/components/motion/reveal';
import { PageHeader } from '@/modules/main/PageHeader';
import { BookmarkCard } from '@/modules/bookmarks/BookmarkCard';
import { CreateSpaceDialog, EditLinkDialog, SaveLinkDialog } from '@/modules/bookmarks/BookmarkDialogs';
import { ShareDialog } from '@/modules/main/ShareDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type View = 'grid' | 'list';

/**
 * Bookmarks: spaces rail + quick filters + searchable grid/list.
 * URL state: ?space=<id> ?filter=favorites|today|shortcuts ?new=1
 */
export function BookmarksPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const {
    loading, bookmarks, containers, user,
    addBookmark, updateBookmark, deleteBookmark, toggleFavorite, toggleShortcut, addContainer, deleteContainer,
  } = useWorkspace();

  const space = params.get('space');
  const filter = (params.get('filter') as BookmarkFilter | null) ?? 'all';
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>('grid');
  const [saveOpen, setSaveOpen] = useState(params.get('new') === '1');
  const [spaceOpen, setSpaceOpen] = useState(false);
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [deleting, setDeleting] = useState<Bookmark | null>(null);
  const [deletingSpace, setDeletingSpace] = useState<string | null>(null);
  const [sharingSpace, setSharingSpace] = useState<string | null>(null);

  const changeView = (v: View) => setView(v);

  const setParam = useCallback((key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    next.delete('new');
    router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false });
  }, [params, pathname, router]);

  const spaceName = useMemo(() => Object.fromEntries(containers.map((c) => [c.id, c.name])), [containers]);
  const countBySpace = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of bookmarks) if (b.container_id) m[b.container_id] = (m[b.container_id] ?? 0) + 1;
    return m;
  }, [bookmarks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookmarks.filter((b) => {
      if (space && b.container_id !== space) return false;
      if (filter === 'favorites' && !b.is_favorite) return false;
      if (filter === 'today' && !isToday(b.created_at)) return false;
      if (filter === 'shortcuts' && !b.tags?.includes('shortcut')) return false;
      if (!q) return true;
      return [b.title, b.url, b.description, b.category, ...(b.tags ?? [])].some((v) => v?.toLowerCase().includes(q));
    });
  }, [bookmarks, space, filter, query]);

  const currentSpace = space ? containers.find((c) => c.id === space) : null;
  const ownsSpace = (id: string) => containers.find((c) => c.id === id)?.user_id === user?.id;
  const sharingTarget = sharingSpace ? containers.find((c) => c.id === sharingSpace) : null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6 md:p-8">
      <PageHeader
        icon={BookmarkIcon}
        iconClassName="text-brand"
        title={currentSpace ? currentSpace.name : 'Bookmarks'}
        description={currentSpace ? `${countBySpace[currentSpace.id] ?? 0} links in this space${currentSpace.user_id !== user?.id ? ' · shared with you' : ''}` : 'Every link you’ve saved, organised into spaces.'}
        actions={
          <>
            {currentSpace && (
              <Button variant="outline" size="sm" onClick={() => setSharingSpace(currentSpace.id)}>
                <Users />{currentSpace.user_id === user?.id ? 'Share space' : 'Shared'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setSpaceOpen(true)}><FolderPlus />New space</Button>
            <Button size="sm" onClick={() => setSaveOpen(true)}><Plus />Save link</Button>
          </>
        }
      />

      {/* Spaces rail */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <SpaceChip active={!space} onClick={() => setParam('space', null)} icon={<BookmarkIcon className="size-3.5" />} label="All" count={bookmarks.length} />
        {loading && !containers.length
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-28 rounded-full" />)
          : containers.map((c) => (
              <SpaceChip
                key={c.id}
                active={space === c.id}
                onClick={() => setParam('space', c.id)}
                icon={c.icon ? <span className="text-sm leading-none">{c.icon}</span> : c.user_id !== user?.id ? <Users className="size-3.5 text-brand" /> : <Folder className="size-3.5" />}
                label={c.name}
                count={countBySpace[c.id] ?? 0}
                menu={
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="ml-1 -mr-1 rounded-full p-0.5 opacity-60 hover:bg-foreground/10 hover:opacity-100" aria-label="Space options" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="size-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onSelect={() => setSharingSpace(c.id)}><Users />{ownsSpace(c.id) ? 'Share space' : 'People with access'}</DropdownMenuItem>
                      {ownsSpace(c.id) && (
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeletingSpace(c.id)}><Trash2 />Delete space</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
              />
            ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-full border bg-muted p-1">
          {BOOKMARK_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setParam('filter', f.id === 'all' ? null : f.id)}
              className={cn(
                'relative rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
                filter === f.id && 'text-foreground',
              )}
            >
              {filter === f.id && (
                <motion.span
                  layoutId="bookmark-filter"
                  className="absolute inset-0 rounded-full bg-background shadow-sm"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{f.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search links…" className="pl-10" />
          </div>
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && changeView(v as View)} variant="outline" size="sm">
            <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid /></ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view"><List /></ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className={view === 'grid' ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'flex flex-col gap-2'}>
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className={view === 'grid' ? 'h-[300px] rounded-xl' : 'h-14 rounded-lg'} />)}
        </div>
      ) : filtered.length ? (
        <div className={view === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'flex flex-col gap-2'}>
          {filtered.map((b, i) => (
            <InViewItem key={b.id} index={i} whileHover={{ y: -4, transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] } }}>
              <BookmarkCard
                bookmark={b}
                view={view}
                spaceName={b.container_id ? spaceName[b.container_id] : undefined}
                onEdit={setEditing}
                onDelete={setDeleting}
                onToggleFavorite={toggleFavorite}
                onToggleShortcut={toggleShortcut}
              />
            </InViewItem>
          ))}
        </div>
      ) : (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon"><BookmarkIcon /></EmptyMedia>
            <EmptyTitle>{query ? 'No matches' : 'Nothing here yet'}</EmptyTitle>
            <EmptyDescription>
              {query ? 'Try a different search or clear the filters.' : 'Save a link and it will show up here with its title, icon and a summary.'}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {query ? (
              <Button variant="outline" size="sm" onClick={() => setQuery('')}>Clear search</Button>
            ) : (
              <Button size="sm" onClick={() => setSaveOpen(true)}><Plus />Save your first link</Button>
            )}
          </EmptyContent>
        </Empty>
      )}

      {/* Dialogs */}
      <SaveLinkDialog open={saveOpen} onOpenChange={(o) => { setSaveOpen(o); if (!o && params.get('new')) setParam('new', null); }} containers={containers} defaultContainerId={space} onSave={addBookmark} />
      <EditLinkDialog bookmark={editing} containers={containers} onOpenChange={(o) => !o && setEditing(null)} onSave={updateBookmark} />
      {sharingTarget && (
        <ShareDialog
          resource={{ type: 'container', id: sharingTarget.id, title: sharingTarget.name }}
          isOwner={sharingTarget.user_id === user?.id}
          onClose={() => setSharingSpace(null)}
          onLeft={() => { if (space === sharingTarget.id) setParam('space', null); }}
        />
      )}

      <CreateSpaceDialog open={spaceOpen} onOpenChange={setSpaceOpen} onCreate={async (name) => { const c = await addContainer(name); if (c) setParam('space', c.id); }} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this link?</AlertDialogTitle>
            <AlertDialogDescription>“{deleting?.title || deleting?.url}” will be removed from your hub. This can’t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => { if (deleting) deleteBookmark(deleting.id); setDeleting(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingSpace} onOpenChange={(o) => !o && setDeletingSpace(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this space?</AlertDialogTitle>
            <AlertDialogDescription>Links inside it are kept and become unsorted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => { if (deletingSpace) { deleteContainer(deletingSpace); if (space === deletingSpace) setParam('space', null); } setDeletingSpace(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SpaceChip({ active, onClick, icon, label, count, menu }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number; menu?: React.ReactNode }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className={cn(
        'group flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
        active ? 'border-brand/40 bg-brand/10 text-foreground' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {icon}
      <span className="max-w-[140px] truncate">{label}</span>
      <Badge variant={active ? 'default' : 'secondary'} className={cn('h-4 min-w-4 px-1 text-[10px]', active && 'bg-brand text-brand-foreground')}>{count}</Badge>
      {menu}
    </div>
  );
}
