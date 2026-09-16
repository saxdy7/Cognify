-- Cognify Docs sharing - Database Schema
-- Run this in your Supabase SQL Editor (after supabase-notes-schema.sql)
--
-- Lets a page owner invite other users to a page as an editor or viewer.
-- The Liveblocks room permissions for `note:<id>` are derived from this table
-- by /api/liveblocks-rooms, so this is the single source of truth for access.

CREATE TABLE IF NOT EXISTS public.note_shares (
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'edit' CHECK (role IN ('view', 'edit')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (note_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_note_shares_user_id ON public.note_shares(user_id);

ALTER TABLE public.note_shares ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER helpers keep the notes <-> note_shares policies from recursing.
CREATE OR REPLACE FUNCTION public.is_note_owner(p_note_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.notes n WHERE n.id = p_note_id AND n.user_id = auth.uid()
  );
$$;

-- p_min_role: 'view' = any share, 'edit' = editors only
CREATE OR REPLACE FUNCTION public.has_note_share(p_note_id UUID, p_min_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.note_shares s
    WHERE s.note_id = p_note_id
      AND s.user_id = auth.uid()
      AND (p_min_role = 'view' OR s.role = 'edit')
  );
$$;

-- note_shares: readable by the owner and by the invited user. Writes go
-- through the service role in /api/notes/[id]/share (owner is verified there).
DROP POLICY IF EXISTS "Owners and invitees can view shares" ON public.note_shares;
CREATE POLICY "Owners and invitees can view shares" ON public.note_shares
  FOR SELECT USING (auth.uid() = user_id OR public.is_note_owner(note_id));

-- notes: widen SELECT / UPDATE to collaborators. INSERT and DELETE stay owner-only.
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
CREATE POLICY "Users can view their own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id OR public.has_note_share(id, 'view'));

DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
CREATE POLICY "Users can update their own notes" ON public.notes
  FOR UPDATE
  USING (auth.uid() = user_id OR public.has_note_share(id, 'edit'))
  WITH CHECK (auth.uid() = user_id OR public.has_note_share(id, 'edit'));

GRANT SELECT ON public.note_shares TO authenticated;
GRANT ALL ON public.note_shares TO service_role;
GRANT EXECUTE ON FUNCTION public.is_note_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_note_share(UUID, TEXT) TO authenticated;
