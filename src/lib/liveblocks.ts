import { Liveblocks } from '@liveblocks/node';
import type { User } from '@supabase/supabase-js';

// Server-side Liveblocks client — keys at https://liveblocks.io/dashboard
// Constructed lazily so a missing key surfaces as a request error, not an import crash.
let client: Liveblocks | null = null;
export function getLiveblocks(): Liveblocks {
  if (client) return client;
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) throw new Error('LIVEBLOCKS_SECRET_KEY is not set — add it to .env.local (https://liveblocks.io/dashboard)');
  client = new Liveblocks({ secret });
  return client;
}

// Room id convention: one Liveblocks room per doc page.
export const noteRoomId = (noteId: string) => `note:${noteId}`;

const AVATAR_COLORS = ['#f97316', '#10b981', '#6366f1', '#ec4899', '#f43f5e', '#14b8a6', '#eab308', '#8b5cf6'];

// Deterministic cursor/avatar colour per user id.
export function colorForUser(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Map a Supabase auth user onto the Liveblocks `UserMeta["info"]` shape.
export function userInfoFromSupabase(user: Pick<User, 'id' | 'email' | 'user_metadata'>) {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (meta.full_name as string) ||
    (meta.name as string) ||
    (meta.user_name as string) ||
    user.email?.split('@')[0] ||
    'Anonymous';
  const avatar = (meta.avatar_url as string) || (meta.picture as string) || '';
  return { name, avatar, color: colorForUser(user.id) };
}
