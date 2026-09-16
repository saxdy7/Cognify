import type { SupabaseClient } from '@supabase/supabase-js';
import { getLiveblocks, noteRoomId } from '@/lib/liveblocks';

export type ShareRole = 'view' | 'edit';
export type NoteAccess = 'owner' | ShareRole | null;

export interface NoteShareRow {
  note_id: string;
  user_id: string;
  role: ShareRole;
  invited_by: string | null;
  created_at: string;
}

interface NoteRow {
  id: string;
  user_id: string;
  title: string | null;
}

// Liveblocks permissions for each collaborator role. Viewers can't edit the
// document but can still see presence and leave comments.
type RoomAccess = ['room:write'] | ['room:read', 'room:presence:write', 'comments:write'];
const ROOM_ACCESS: Record<ShareRole, RoomAccess> = {
  edit: ['room:write'],
  view: ['room:read', 'room:presence:write', 'comments:write'],
};

// Loads a note (bypassing RLS — pass the admin client) and its share rows.
export async function loadNoteWithShares(admin: SupabaseClient, noteId: string) {
  const { data: note } = await admin
    .from('notes')
    .select('id, user_id, title')
    .eq('id', noteId)
    .maybeSingle<NoteRow>();
  if (!note) return null;

  const { data: shares } = await admin
    .from('note_shares')
    .select('note_id, user_id, role, invited_by, created_at')
    .eq('note_id', noteId)
    .returns<NoteShareRow[]>();

  return { note, shares: shares ?? [] };
}

export function accessFor(note: NoteRow, shares: NoteShareRow[], userId: string): NoteAccess {
  if (note.user_id === userId) return 'owner';
  return shares.find((s) => s.user_id === userId)?.role ?? null;
}

// Rebuilds the Liveblocks room for a note from the DB (owner + note_shares).
// `removedUserIds` are explicitly nulled so revoked users lose access.
export async function syncNoteRoom(
  note: NoteRow,
  shares: NoteShareRow[],
  removedUserIds: string[] = [],
) {
  const liveblocks = getLiveblocks();
  const roomId = noteRoomId(note.id);

  const usersAccesses: Record<string, RoomAccess | null> = {
    [note.user_id]: ROOM_ACCESS.edit,
  };
  for (const s of shares) usersAccesses[s.user_id] = ROOM_ACCESS[s.role];
  for (const id of removedUserIds) if (!(id in usersAccesses)) usersAccesses[id] = null;

  const options = {
    defaultAccesses: [] as [],
    usersAccesses,
    metadata: { noteId: note.id, title: note.title ?? '' },
  };

  try {
    await liveblocks.getRoom(roomId);
    await liveblocks.updateRoom(roomId, options);
  } catch {
    // Room doesn't exist yet — `null` entries aren't valid on create.
    const initial: Record<string, RoomAccess> = {};
    for (const [id, v] of Object.entries(usersAccesses)) if (v) initial[id] = v;
    await liveblocks.createRoom(roomId, { ...options, usersAccesses: initial });
  }

  return roomId;
}
