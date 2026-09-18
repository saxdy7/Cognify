import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { getLiveblocks, userInfoFromSupabase } from '@/lib/liveblocks';
import { RESOURCES, accessFor, isResourceType, loadResource, syncNoteRoom, type ResourceType, type ShareRole } from '@/lib/share';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase-server';

type Params = { params: Promise<{ type: string; id: string }> };

export interface Collaborator {
  userId: string;
  name: string;
  avatar: string;
  color: string;
  email: string | null;
  role: 'owner' | ShareRole;
}

// Shared setup: authenticate, load the resource + shares, compute the caller's role.
async function loadContext(typeParam: string, id: string) {
  if (!isResourceType(typeParam)) return { error: NextResponse.json({ error: 'Unknown resource type' }, { status: 400 }) };
  const type: ResourceType = typeParam;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const admin = createSupabaseAdminClient();
  const loaded = await loadResource(admin, type, id);
  const access = loaded ? accessFor(loaded.resource, loaded.shares, user.id) : null;
  if (!loaded || !access) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) };

  return { type, user, admin, access, ...loaded };
}

async function toCollaborator(admin: SupabaseClient, userId: string, role: Collaborator['role']): Promise<Collaborator> {
  const { data } = await admin.auth.admin.getUserById(userId);
  const u = data.user;
  const info = u ? userInfoFromSupabase(u) : { name: 'Unknown user', avatar: '', color: '#71717a' };
  return { userId, email: u?.email ?? null, role, ...info };
}

// Supabase Auth has no "get by email" — page through users (fine at this scale).
async function findUserByEmail(admin: SupabaseClient, email: string): Promise<User | null> {
  const target = email.trim().toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < 1000) break;
  }
  return null;
}

// GET — everyone with access (owner first).
export async function GET(_request: NextRequest, { params }: Params) {
  const { type, id } = await params;
  const ctx = await loadContext(type, id);
  if ('error' in ctx) return ctx.error;

  const collaborators = await Promise.all([
    toCollaborator(ctx.admin, ctx.resource.user_id, 'owner'),
    ...ctx.shares.map((s) => toCollaborator(ctx.admin, s.user_id, s.role)),
  ]);
  return NextResponse.json({ access: ctx.access, collaborators });
}

// POST { email, role } — owner invites a user (or changes their role).
export async function POST(request: NextRequest, { params }: Params) {
  const { type, id } = await params;
  const ctx = await loadContext(type, id);
  if ('error' in ctx) return ctx.error;
  if (ctx.access !== 'owner') return NextResponse.json({ error: `Only the owner can share this ${RESOURCES[ctx.type].label}` }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { email?: string; role?: string };
  const role: ShareRole = body.role === 'view' ? 'view' : 'edit';
  if (!body.email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  let invitee: User | null;
  try {
    invitee = await findUserByEmail(ctx.admin, body.email);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
  if (!invitee) return NextResponse.json({ error: 'No Cognify account with that email' }, { status: 404 });
  if (invitee.id === ctx.resource.user_id) return NextResponse.json({ error: `That user already owns this ${RESOURCES[ctx.type].label}` }, { status: 400 });

  const { error } = await ctx.admin
    .from('shares')
    .upsert({ resource_type: ctx.type, resource_id: id, user_id: invitee.id, role, invited_by: ctx.user.id }, { onConflict: 'resource_type,resource_id,user_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const isNew = !ctx.shares.some((s) => s.user_id === invitee!.id);
  const shares = [
    ...ctx.shares.filter((s) => s.user_id !== invitee!.id),
    { resource_type: ctx.type, resource_id: id, user_id: invitee.id, role, invited_by: ctx.user.id, created_at: new Date().toISOString() },
  ];

  try {
    // Notes also live in a Liveblocks room whose permissions mirror the DB.
    if (ctx.type === 'note') await syncNoteRoom(ctx.resource, shares);

    // Tell the invitee via their Liveblocks inbox (rendered in the Inbox page).
    if (isNew) {
      await getLiveblocks().triggerInboxNotification({
        userId: invitee.id,
        kind: '$resourceShared',
        subjectId: `${ctx.type}:${id}`,
        ...(ctx.type === 'note' ? { roomId: `note:${id}` } : {}),
        activityData: {
          resourceType: ctx.type,
          resourceId: id,
          title: ctx.resource.title || 'Untitled',
          sharedBy: userInfoFromSupabase(ctx.user).name,
          role,
        },
      });
    }
  } catch (e) {
    // Sharing itself succeeded; Liveblocks is best-effort (e.g. key not configured)
    console.warn('[share] liveblocks sync failed:', (e as Error).message);
  }

  return NextResponse.json({ collaborator: await toCollaborator(ctx.admin, invitee.id, role) });
}

// DELETE { userId } — owner revokes access, or a collaborator leaves.
export async function DELETE(request: NextRequest, { params }: Params) {
  const { type, id } = await params;
  const ctx = await loadContext(type, id);
  if ('error' in ctx) return ctx.error;

  const body = (await request.json().catch(() => ({}))) as { userId?: string };
  const targetId = body.userId ?? ctx.user.id;
  if (ctx.access !== 'owner' && targetId !== ctx.user.id) {
    return NextResponse.json({ error: 'Only the owner can remove other collaborators' }, { status: 403 });
  }
  if (targetId === ctx.resource.user_id) return NextResponse.json({ error: 'The owner cannot be removed' }, { status: 400 });

  const { error } = await ctx.admin.from('shares').delete().eq('resource_type', ctx.type).eq('resource_id', id).eq('user_id', targetId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (ctx.type === 'note') {
    try {
      await syncNoteRoom(ctx.resource, ctx.shares.filter((s) => s.user_id !== targetId), [targetId]);
    } catch (e) {
      console.warn('[share] liveblocks sync failed:', (e as Error).message);
    }
  }

  return NextResponse.json({ ok: true });
}
