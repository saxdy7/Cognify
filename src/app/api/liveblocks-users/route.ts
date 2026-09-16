import { NextRequest, NextResponse } from 'next/server';
import { userInfoFromSupabase } from '@/lib/liveblocks';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase-server';

// Backs `resolveUsers` (?userIds=a,b) and `resolveMentionSuggestions` (?text=...)
// on the LiveblocksProvider. Returns name/avatar/color for Supabase users.
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const { searchParams } = new URL(request.url);
  const userIdsParam = searchParams.get('userIds');
  const text = searchParams.get('text');

  // resolveUsers: look up specific ids, preserving the requested order
  if (userIdsParam !== null) {
    const ids = userIdsParam.split(',').filter(Boolean);
    const users = await Promise.all(
      ids.map(async (id) => {
        const { data } = await admin.auth.admin.getUserById(id);
        return data.user ? userInfoFromSupabase(data.user) : null;
      })
    );
    return NextResponse.json(users);
  }

  // resolveMentionSuggestions: search all users by name / email
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const q = (text ?? '').trim().toLowerCase();
  const matches = data.users.filter((u) => {
    if (!q) return true;
    const { name } = userInfoFromSupabase(u);
    return name.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q);
  });

  return NextResponse.json(matches.map((u) => u.id));
}
