'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layers, Loader2, MoreHorizontal, Plus, Search, SortAsc, SortDesc, Trash2 } from 'lucide-react';
import type { CanvasBoard } from '@/types';
import { useWorkspace } from '@/hooks/use-workspace';
import { timeAgo } from '@/lib/format';
import { gradientFor } from '@/lib/static';
import { cn } from '@/lib/utils';
import { PageHeader, SectionHeader } from '@/modules/main/PageHeader';
import { TemplateGallery } from '@/modules/canvas/TemplateGallery';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function CanvasBoardsPage() {
  const router = useRouter();
  const { loading, boards, addBoard, deleteBoard } = useWorkspace();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'desc' | 'asc'>('desc');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<CanvasBoard | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...boards]
      .filter((b) => !q || b.name.toLowerCase().includes(q))
      .sort((a, b) => (sort === 'desc' ? 1 : -1) * (+new Date(b.updated_at) - +new Date(a.updated_at)));
  }, [boards, query, sort]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 p-6 md:p-8">
      <PageHeader
        icon={Layers}
        iconClassName="text-canvas"
        title="Canvas"
        description="Infinite boards for moodboards, plans and sketches."
        actions={
          <>
            <div className="relative w-full sm:w-64">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search boards…" className="h-8 pl-8" />
            </div>
            <Button variant="outline" size="icon" onClick={() => setSort((s) => (s === 'desc' ? 'asc' : 'desc'))} title={`Sorted by last edited (${sort === 'desc' ? 'newest' : 'oldest'} first)`}>
              {sort === 'desc' ? <SortDesc /> : <SortAsc />}
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}><Plus />New board</Button>
          </>
        }
      />

      <section className="space-y-4">
        <SectionHeader title={<>Your boards <span className="text-sm font-normal text-muted-foreground">({list.length})</span></>} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <button
            onClick={() => setCreateOpen(true)}
            className="flex h-[180px] items-center justify-center rounded-xl border-2 border-dashed text-sm font-medium text-muted-foreground transition-colors hover:border-canvas/60 hover:bg-canvas/5 hover:text-foreground"
          >
            <Plus className="mr-2 size-4" /> Create new board
          </button>

          {loading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[180px] rounded-xl" />)
            : list.map((b, i) => (
                <Card key={b.id} className={cn('group relative h-[180px] overflow-hidden bg-linear-to-br p-0 transition-transform hover:scale-[1.02]', gradientFor(i))}>
                  <Link href={`/dashboard/canvas/${b.id}`} className="absolute inset-0" aria-label={`Open ${b.name}`} />
                  <CardHeader className="flex-row items-start justify-between p-4">
                    <h3 className="truncate text-base font-semibold">{b.name}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="relative z-10 bg-background/40 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100" aria-label="Board options">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => router.push(`/dashboard/canvas/${b.id}`)}>Open</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(b)}><Trash2 />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <div className="pointer-events-none absolute top-1/2 left-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 blur-2xl dark:bg-white/10" />
                  <CardFooter className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/20 bg-black/5 px-4 py-2.5 text-[11px] font-medium text-foreground/70 backdrop-blur-xs dark:bg-white/5">
                    <span>Edited {timeAgo(b.updated_at)}</span>
                    <Layers className="size-3.5" />
                  </CardFooter>
                </Card>
              ))}
        </div>
        {!loading && boards.length > 0 && list.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No boards match “{query}”.</p>
        )}
      </section>

      <Separator />
      <TemplateGallery />

      <CreateBoardDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={async (name) => { const b = await addBoard(name); if (b) router.push(`/dashboard/canvas/${b.id}`); }} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>All cards and connectors on this board will be removed. This can’t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => { if (deleting) deleteBoard(deleting.id); setDeleting(null); }}>Delete board</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function CreateBoardDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; onCreate: (name: string) => Promise<void> }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try { await onCreate(name.trim()); onOpenChange(false); setName(''); } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New board</DialogTitle>
          <DialogDescription>A blank infinite canvas. You can rename it any time.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="board-name">Board name</Label>
            <Input id="board-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q3 launch plan" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || busy}>{busy && <Loader2 className="animate-spin" />} Create board</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
