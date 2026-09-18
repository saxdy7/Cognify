'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { ArrowLeft, Layers, Users } from 'lucide-react';
import { ShareDialog } from '@/modules/main/ShareDialog';
import { useWorkspace } from '@/hooks/use-workspace';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

// The canvas is browser-only (pointer math, ResizeObserver) — never SSR it.
const MilanoteCanvas = dynamic(() => import('@/modules/canvas/MilanoteCanvas').then((m) => m.MilanoteCanvas), {
  ssr: false,
  loading: () => <CanvasSkeleton />,
});

export function BoardPage({ boardId }: { boardId: string }) {
  const router = useRouter();
  const { loading, boards, user } = useWorkspace();
  const { resolvedTheme, setTheme } = useTheme();
  const board = boards.find((b) => b.id === boardId);
  const [shareOpen, setShareOpen] = useState(false);

  // The canvas has its own light/dark toggle — drive it from (and write back to) the app theme.
  const canvasTheme: 'light' | 'dark' = resolvedTheme === 'light' ? 'light' : 'dark';

  if (loading) return <div className="p-4 md:p-6"><CanvasSkeleton /></div>;

  if (!board || !user) {
    return (
      <div className="p-6 md:p-8">
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Layers /></EmptyMedia>
            <EmptyTitle>Board not found</EmptyTitle>
            <EmptyDescription>It may have been deleted, or you don’t have access to it.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" asChild><Link href="/dashboard/canvas"><ArrowLeft />Back to boards</Link></Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4">
      <div className="relative h-[calc(100vh-5.5rem)] overflow-hidden rounded-xl border bg-muted/30 shadow-sm">
        {/* Share sits above the canvas' own toolbar, top-right */}
        <Button variant="outline" size="sm" onClick={() => setShareOpen(true)} className="absolute top-3 right-3 z-20 bg-background/80 backdrop-blur">
          <Users />{board.user_id === user.id ? 'Share' : 'Shared'}
        </Button>
        {shareOpen && (
          <ShareDialog
            resource={{ type: 'board', id: board.id, title: board.name }}
            isOwner={board.user_id === user.id}
            onClose={() => setShareOpen(false)}
            onLeft={() => router.push('/dashboard/canvas')}
          />
        )}
        <MilanoteCanvas
          board={board}
          userId={user.id}
          onBackToBoards={() => router.push('/dashboard/canvas')}
          theme={canvasTheme}
          setTheme={(t) => setTheme(t)}
        />
      </div>
    </div>
  );
}

function CanvasSkeleton() {
  return (
    <div className="relative h-[calc(100vh-5.5rem)] overflow-hidden rounded-xl border">
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute top-4 left-4 flex gap-2">
        <Skeleton className="h-9 w-24" /><Skeleton className="h-9 w-9" /><Skeleton className="h-9 w-9" />
      </div>
      <Skeleton className="absolute bottom-6 left-1/2 h-12 w-80 -translate-x-1/2 rounded-full" />
    </div>
  );
}
