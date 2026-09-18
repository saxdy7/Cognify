import type { SupabaseClient } from '@supabase/supabase-js';
import { getLiveblocks, noteRoomId } from '@/lib/liveblocks';

// ─── Shareable resources ───────────────────────────────────────────────────────

export type ShareRole = 'view' | 'edit';
export type ResourceType = 'note' | 'board' | 'container';
export type Access = 'owner' | ShareRole | null;

export interface ShareRow {
  resource_type: ResourceType;
  resource_id: string;
  user_id: string;
  role: ShareRole;
  invited_by: string | null;
  created_at: string;
}

export interface ResourceRow {
  id: string;
  user_id: string;
  title: string;
}

/** Table + title column per resource type, and where it lives in the app. */
export const RESOURCES: Record<ResourceType, { table: string; titleColumn: string; label: string; href: (id: string) => string }> = {
  note: { table: 'notes', titleColumn: 'title', label: 'page', href: (id) => `/dashboard/docs/${id}` },
  board: { table: 'canvas_boards', titleColumn: 'name', label: 'board', href: (id) => `/dashboard/canvas/${id}` },
  container: { table: 'containers', titleColumn: 'name', label: 'space', href: (id) => `/dashboard/bookmarks?space=${id}` },
};

export const isResourceType = (v: unknown): v is ResourceType => v === 'note' || v === 'board' || v === 'container';

// ─── Loading ───────────────────────────────────────────────────────────────────

/** Loads a resource (bypassing RLS — pass the admin client) and its share rows. */
export async function loadResource(admin: SupabaseClient, type: ResourceType, id: string) {
  const { table, titleColumn } = RESOURCES[type];
  const { data: row } = await admin
    .from(table)
    .select(`id, user_id, ${titleColumn}`)
    .eq('id', id)
    .maybeSingle<Record<string, string>>();
  if (!row) return null;

  const { data: shares } = await admin
    .from('shares')
    .select('resource_type, resource_id, user_id, role, invited_by, created_at')
    .eq('resource_type', type)
    .eq('resource_id', id)
    .returns<ShareRow[]>();

  const resource: ResourceRow = { id: row.id, user_id: row.user_id, title: row[titleColumn] ?? '' };
  return { resource, shares: shares ?? [] };
}

export function accessFor(resource: ResourceRow, shares: ShareRow[], userId: string): Access {
  if (resource.user_id === userId) return 'owner';
  return shares.find((s) => s.user_id === userId)?.role ?? null;
}

// ─── Liveblocks room sync (notes only) ────────────────────────────────────────

// Liveblocks permissions for each collaborator role. Viewers can't edit the
// document but can still see presence and leave comments.
type RoomAccess = ['room:write'] | ['room:read', 'room:presence:write', 'comments:write'];
const ROOM_ACCESS: Record<ShareRole, RoomAccess> = {
  edit: ['room:write'],
  view: ['room:read', 'room:presence:write', 'comments:write'],
};

/**
 * Rebuilds the Liveblocks room for a note from the DB (owner + shares).
 * `removedUserIds` are explicitly nulled so revoked users lose access.
 * Idempotent under concurrent first-open (update → create on 404 → update on 409).
 */
export async function syncNoteRoom(note: ResourceRow, shares: ShareRow[], removedUserIds: string[] = []) {
  const liveblocks = getLiveblocks();
  const roomId = noteRoomId(note.id);

  const usersAccesses: Record<string, RoomAccess | null> = { [note.user_id]: ROOM_ACCESS.edit };
  for (const s of shares) usersAccesses[s.user_id] = ROOM_ACCESS[s.role];
  for (const id of removedUserIds) if (!(id in usersAccesses)) usersAccesses[id] = null;

  const options = {
    defaultAccesses: [] as [],
    usersAccesses,
    metadata: { noteId: note.id, title: note.title ?? '' },
  };

  try {
    await liveblocks.updateRoom(roomId, options);
  } catch (e) {
    if ((e as { status?: number }).status !== 404) throw e;
    const initial: Record<string, RoomAccess> = {};
    for (const [id, v] of Object.entries(usersAccesses)) if (v) initial[id] = v;
    try {
      await liveblocks.createRoom(roomId, { ...options, usersAccesses: initial });
    } catch (e2) {
      if ((e2 as { status?: number }).status !== 409) throw e2;
      await liveblocks.updateRoom(roomId, options);
    }
  }

  return roomId;
}
