import { NextResponse } from 'next/server';
import { getLiveblocks, userInfoFromSupabase } from '@/lib/liveblocks';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// ID-token authentication — https://liveblocks.io/docs/api-reference/authentication/id-token/nextjs
// Identifies the logged-in Supabase user; per-room permissions live on the
// rooms themselves (see /api/liveblocks-rooms).
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let liveblocks;
  try {
    liveblocks = getLiveblocks();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const { status, body } = await liveblocks.identifyUser(
    { userId: user.id, groupIds: [] },
    { userInfo: userInfoFromSupabase(user) },
  );

  return new Response(body, { status });
}

// Lightweight readiness probe used by the client to skip Liveblocks UI entirely
// (instead of retrying auth for ~30s) when the secret key isn't configured.
export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.LIVEBLOCKS_SECRET_KEY) });
}
