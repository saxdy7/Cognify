'use client';

import { ReactNode, useEffect, useState } from 'react';
import { RoomProvider, ClientSideSuspense } from '@liveblocks/react/suspense';
import { Loader2 } from 'lucide-react';

type RoomState = { noteId: string; roomId?: string; error?: string };

// Joins the Liveblocks room for a doc page. Rooms are provisioned server-side
// (ID tokens require explicit permissions), so we ensure it exists first.
export function NoteRoom({ noteId, children }: { noteId: string; children: ReactNode }) {
  // Keyed by noteId so switching pages naturally resets to "loading".
  const [state, setState] = useState<RoomState>({ noteId });
  const current = state.noteId === noteId ? state : { noteId };

  useEffect(() => {
    let cancelled = false;

    fetch('/api/liveblocks-rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not open room');
        return res.json() as Promise<{ roomId: string }>;
      })
      .then(({ roomId }) => { if (!cancelled) setState({ noteId, roomId }); })
      .catch((e: Error) => { if (!cancelled) setState({ noteId, error: e.message }); });

    return () => { cancelled = true; };
  }, [noteId]);

  if (current.error) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-center">
        <span className="text-sm font-medium">Realtime unavailable</span>
        <span className="max-w-sm text-xs text-muted-foreground">{current.error}</span>
      </div>
    );
  }

  if (!current.roomId) return <Spinner />;

  return (
    <RoomProvider id={current.roomId} initialPresence={{ cursor: null }}>
      <ClientSideSuspense fallback={<Spinner />}>{children}</ClientSideSuspense>
    </RoomProvider>
  );
}

function Spinner() {
  return (
    <div className="flex h-[300px] items-center justify-center text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
    </div>
  );
}
