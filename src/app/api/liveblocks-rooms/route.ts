import { NextRequest, NextResponse } from 'next/server';
import { getLiveblocks } from '@/lib/liveblocks';
import { accessFor, loadNoteWithShares, syncNoteRoom } from '@/lib/note-access';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase-server';

// ID tokens require rooms to exist with explicit permissions. This endpoint
// creates (or refreshes) the room for a doc page from the owner + note_shares,
// then tells the client which role it has. Called by <NoteRoom> before joining.
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { noteId } = (await request.json().catch(() => ({}))) as { noteId?: string };
  if (!noteId) return NextResponse.json({ error: 'noteId is required' }, { status: 400 });

  try {
    getLiveblocks();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const loaded = await loadNoteWithShares(createSupabaseAdminClient(), noteId);
  const access = loaded ? accessFor(loaded.note, loaded.shares, user.id) : null;
  if (!loaded || !access) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const roomId = await syncNoteRoom(loaded.note, loaded.shares);
  return NextResponse.json({ roomId, access });
}
