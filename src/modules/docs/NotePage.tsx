'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, FileText, Plus, Star, Trash2, Users } from 'lucide-react';
import { useWorkspace } from '@/hooks/use-workspace';
import { PAGE_ICONS } from '@/lib/static';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { NoteEditor } from '@/modules/docs/NoteEditor';
import { NoteRoom } from '@/modules/docs/NoteRoom';
import { NotionDatabase } from '@/modules/docs/NotionDatabase';
import { ShareDialog } from '@/modules/main/ShareDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** A single doc page: title row · editor (Liveblocks room) · subpages. */
export function NotePage({ noteId }: { noteId: string }) {
  const router = useRouter();
  const { loading, notes, user, addNote, updateNote, deleteNote } = useWorkspace();
  const note = notes.find((n) => n.id === noteId);

  const [title, setTitle] = useState(note?.title ?? '');
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Re-seed the local title when the page switches or is renamed remotely
  // (derived-state-during-render, per React docs — avoids an effect round-trip).
  const [seenTitle, setSeenTitle] = useState(note?.title);
  if (note && note.title !== seenTitle) {
    setSeenTitle(note.title);
    setTitle(note.title);
  }

  if (loading) return <NotePageSkeleton />;

  if (!note || !user) {
    return (
      <div className="p-6 md:p-8">
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon"><FileText /></EmptyMedia>
            <EmptyTitle>Page not found</EmptyTitle>
            <EmptyDescription>It may have been deleted, or you no longer have access.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent><Button variant="outline" size="sm" asChild><Link href="/dashboard/docs"><ArrowLeft />Back to docs</Link></Button></EmptyContent>
        </Empty>
      </div>
    );
  }

  const isOwner = note.user_id === user.id;
  const isDatabase = (note.content as { kind?: string } | null)?.kind === 'database';
  const children = notes.filter((n) => n.parent_id === note.id);

  const commitTitle = () => {
    const next = title.trim() || 'Untitled';
    if (next !== note.title) updateNote(note.id, { title: next });
  };

  return (
    <div className={cn('mx-auto w-full space-y-8 p-6 pb-32 md:p-8', isDatabase ? 'max-w-[1400px]' : 'max-w-3xl')}>
      {/* Title row */}
      <div className="flex items-start gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <button className="shrink-0 text-4xl leading-none transition-transform hover:scale-110 sm:text-5xl" title="Change icon" disabled={!isOwner}>
              {note.icon || '📄'}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-2">
            <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Page icon</p>
            <div className="grid grid-cols-8 gap-1">
              {PAGE_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => updateNote(note.id, { icon })}
                  className={cn('flex size-7 items-center justify-center rounded-md text-lg hover:bg-muted', icon === note.icon && 'bg-docs/15 ring-1 ring-docs/40')}
                >
                  {icon}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          placeholder="Untitled"
          className="min-w-0 flex-1 bg-transparent font-heading text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/50 sm:text-4xl"
        />

        <div className="flex shrink-0 items-center gap-1 pt-1.5">
          {!isDatabase && (
            <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
              <Users />{isOwner ? 'Share' : 'Shared'}
            </Button>
          )}
          {isOwner && (
            <>
              <Button variant="ghost" size="icon" onClick={() => updateNote(note.id, { is_favorite: !note.is_favorite })} aria-label="Favorite">
                <Star className={cn(note.is_favorite && 'fill-amber-400 text-amber-400')} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(true)} aria-label="Delete" className="hover:text-destructive">
                <Trash2 />
              </Button>
            </>
          )}
        </div>
      </div>

      <p className="-mt-6 text-xs text-muted-foreground">
        Edited {timeAgo(note.updated_at)}{!isOwner && ' · shared with you'}
      </p>

      {/* Body */}
      {isDatabase ? (
        <NotionDatabase key={note.id} content={note.content} onChange={(content) => updateNote(note.id, { content })} />
      ) : (
        <NoteRoom noteId={note.id}>
          <NoteEditor noteId={note.id} content={note.content} onSave={(json) => updateNote(note.id, { content: json })} />
        </NoteRoom>
      )}

      {/* Subpages (owner only — sharing applies to a single page) */}
      {isOwner && (
        <section className="space-y-3 border-t pt-6">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Subpages</p>
            <Button variant="outline" size="sm" onClick={async () => { const n = await addNote(note.id, 'page'); if (n) router.push(`/dashboard/docs/${n.id}`); }}>
              <Plus />Add subpage
            </Button>
          </div>
          {children.length ? (
            <div className="divide-y overflow-hidden rounded-lg border bg-card">
              {children.map((c) => (
                <Link key={c.id} href={`/dashboard/docs/${c.id}`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                  <span className="text-lg leading-none">{c.icon || '📄'}</span>
                  <span className="flex-1 truncate text-sm font-medium group-hover:text-docs">{c.title || 'Untitled'}</span>
                  <ArrowRight className="size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">No subpages yet.</p>
          )}
        </section>
      )}

      {shareOpen && (
        <ShareDialog resource={{ type: 'note', id: note.id, title: note.title }} isOwner={isOwner} onClose={() => setShareOpen(false)} onLeft={() => router.push('/dashboard/docs')} />
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{note.title || 'Untitled'}”?</AlertDialogTitle>
            <AlertDialogDescription>This page and all of its subpages will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={async () => { await deleteNote(note.id); router.push(note.parent_id ? `/dashboard/docs/${note.parent_id}` : '/dashboard/docs'); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function NotePageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-6 md:p-8">
      <div className="flex items-center gap-4"><Skeleton className="size-12 rounded-lg" /><Skeleton className="h-10 flex-1" /></div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="space-y-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-2/3" /></div>
    </div>
  );
}
