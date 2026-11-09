import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

/**
 * Agent endpoint: lets a local Claude Code session (through the cognify-canvas MCP server) put
 * reference boards on the live canvas. Protected by a shared secret, not by a login cookie.
 *
 *   COGNIFY_AGENT_KEY      secret the MCP server sends as `Authorization: Bearer <key>`
 *   COGNIFY_AGENT_USER_ID  the Supabase user the boards are created for
 *
 * Inserts go through the service role, and the canvas page already listens to
 * `canvas_elements` over Supabase realtime — so images appear on screen as they are written.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PARENT_BOARD = 'Claude sessions';
const COLUMNS = 5;
const CARD_W = 260;
const GAP = 24;
const MAX_IMAGES = 60;

const digest = (value: string) => createHash('sha256').update(value).digest();
const authorised = (request: Request) => {
  const key = process.env.COGNIFY_AGENT_KEY;
  if (!key || key.length < 24) return false;
  const given = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  return timingSafeEqual(digest(given), digest(key));
};

interface IncomingImage { url: string; caption?: string; width?: number; height?: number }

const httpUrl = (value: unknown) => {
  if (typeof value !== 'string' || value.length > 2000) return null;
  try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null; } catch { return null; }
};

export async function POST(request: Request) {
  if (!process.env.COGNIFY_AGENT_KEY || !process.env.COGNIFY_AGENT_USER_ID) return NextResponse.json({ error: 'Agent endpoint is not configured on this deployment' }, { status: 503 });
  if (!authorised(request)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  let body: { session?: string; images?: IncomingImage[]; note?: string; heading?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const session = (body.session ?? '').trim().slice(0, 80);
  if (!session) return NextResponse.json({ error: '`session` (the board name) is required' }, { status: 400 });
  const images = (body.images ?? []).slice(0, MAX_IMAGES).flatMap((image) => { const url = httpUrl(image?.url); return url ? [{ ...image, url }] : []; });
  if (!images.length && !body.note) return NextResponse.json({ error: 'Nothing to add: send `images` and/or `note`' }, { status: 400 });

  const db = createSupabaseAdminClient();
  const userId = process.env.COGNIFY_AGENT_USER_ID!;

  // "Claude sessions" parent board, then one board per session — reused when it already exists.
  const findOrCreate = async (name: string, parent: string | null) => {
    let query = db.from('canvas_boards').select('id').eq('user_id', userId).eq('name', name);
    query = parent ? query.eq('parent_board_id', parent) : query.is('parent_board_id', null);
    const { data: found } = await query.limit(1).maybeSingle();
    if (found) return { id: found.id as string, created: false };
    const { data, error } = await db.from('canvas_boards').insert({ user_id: userId, name, parent_board_id: parent }).select('id').single();
    if (error || !data) throw new Error(error?.message ?? 'Could not create board');
    return { id: data.id as string, created: true };
  };

  try {
    const parent = await findOrCreate(PARENT_BOARD, null);
    const board = await findOrCreate(session, parent.id);

    // New material goes below whatever is already on the board.
    const { data: existing } = await db.from('canvas_elements').select('y,height').eq('board_id', board.id);
    const startY = (existing ?? []).reduce((max, element) => Math.max(max, (element.y ?? 0) + (element.height ?? 0)), -GAP) + GAP * 2;
    const rows: Record<string, unknown>[] = [];
    let y = startY;

    const heading = (body.heading ?? (images.length ? `${images.length} reference${images.length === 1 ? '' : 's'}` : '')).trim();
    if (heading || body.note) {
      rows.push({ board_id: board.id, type: 'note', x: 0, y, width: COLUMNS * (CARD_W + GAP) - GAP, height: body.note ? 120 : 72, color: '#FFF7CC', content: { text: [heading || session, body.note].filter(Boolean).join('\n\n') } });
      y += (body.note ? 120 : 72) + GAP;
    }

    // Masonry: each image goes into the currently shortest column.
    const columnY = Array.from({ length: COLUMNS }, () => y);
    images.forEach((image) => {
      const ratio = image.width && image.height && image.width > 0 && image.height > 0 ? image.height / image.width : 1.25;
      const height = Math.round(Math.min(Math.max(CARD_W * ratio, 140), 520));
      const column = columnY.indexOf(Math.min(...columnY));
      rows.push({ board_id: board.id, type: 'image', x: column * (CARD_W + GAP), y: columnY[column], width: CARD_W, height, color: '#FFFFFF', content: { src: image.url, alt: image.caption ?? '', caption: image.caption ?? '' } });
      columnY[column] += height + GAP;
    });

    // One insert per small batch so the canvas fills in visibly rather than all at once.
    for (let i = 0; i < rows.length; i += 6) {
      const { error } = await db.from('canvas_elements').insert(rows.slice(i, i + 6));
      if (error) throw new Error(error.message);
    }

    // Tell any open copy of this board to pull the new cards now (no table-realtime setting needed).
    try {
      const channel = db.channel(`canvas_${board.id}`);
      await channel.httpSend('agent-refresh', { added: rows.length });
      await db.removeChannel(channel);
    } catch { /* the cards are saved either way; an open page picks them up on next load */ }

    const origin = process.env.COGNIFY_PUBLIC_URL ?? new URL(request.url).origin;
    return NextResponse.json({ ok: true, board: session, boardId: board.id, createdBoard: board.created, added: rows.length, url: `${origin}/dashboard/canvas/${board.id}` });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
