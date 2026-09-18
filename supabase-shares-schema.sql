-- Cognify sharing (v2) - Database Schema
-- Run this in your Supabase SQL Editor. Safe to run after supabase-note-shares-schema.sql:
-- it migrates note_shares into the generic `shares` table and drops the old one.
--
-- One table covers every shareable thing:
--   resource_type = 'note'      -> public.notes         (doc pages)
--   resource_type = 'board'     -> public.canvas_boards (canvas boards, incl. elements/connectors)
--   resource_type = 'container' -> public.containers    (bookmark spaces, incl. their bookmarks)
-- Liveblocks room permissions for notes are derived from this table by /api/liveblocks-rooms.

CREATE TABLE IF NOT EXISTS public.shares (
  resource_type TEXT NOT NULL CHECK (resource_type IN ('note', 'board', 'container')),
  resource_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'edit' CHECK (role IN ('view', 'edit')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (resource_type, resource_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_shares_user_id ON public.shares(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_resource ON public.shares(resource_type, resource_id);

ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- Migrate v1 note shares, then retire the old table.
INSERT INTO public.shares (resource_type, resource_id, user_id, role, invited_by, created_at)
SELECT 'note', note_id, user_id, role, invited_by, created_at
FROM public.note_shares
ON CONFLICT DO NOTHING;
DROP TABLE IF EXISTS public.note_shares;
-- The v1 notes policies reference these helpers; CASCADE drops those policies
-- too (they are recreated below on the new helpers).
DROP FUNCTION IF EXISTS public.has_note_share(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.is_note_owner(UUID) CASCADE;

-- Clean up rows whose resource has been deleted (no FK possible across three tables).
CREATE OR REPLACE FUNCTION public.shares_cleanup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.shares
  WHERE resource_id = OLD.id
    AND resource_type = CASE TG_TABLE_NAME
      WHEN 'notes' THEN 'note'
      WHEN 'canvas_boards' THEN 'board'
      WHEN 'containers' THEN 'container'
    END;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS shares_cleanup_notes ON public.notes;
CREATE TRIGGER shares_cleanup_notes AFTER DELETE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.shares_cleanup();
DROP TRIGGER IF EXISTS shares_cleanup_boards ON public.canvas_boards;
CREATE TRIGGER shares_cleanup_boards AFTER DELETE ON public.canvas_boards FOR EACH ROW EXECUTE FUNCTION public.shares_cleanup();
DROP TRIGGER IF EXISTS shares_cleanup_containers ON public.containers;
CREATE TRIGGER shares_cleanup_containers AFTER DELETE ON public.containers FOR EACH ROW EXECUTE FUNCTION public.shares_cleanup();

-- SECURITY DEFINER helpers keep policies from recursing between tables.
-- p_min_role: 'view' = any share, 'edit' = editors only
CREATE OR REPLACE FUNCTION public.has_share(p_type TEXT, p_id UUID, p_min_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shares s
    WHERE s.resource_type = p_type
      AND s.resource_id = p_id
      AND s.user_id = auth.uid()
      AND (p_min_role = 'view' OR s.role = 'edit')
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_resource(p_type TEXT, p_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE p_type
    WHEN 'note'      THEN EXISTS (SELECT 1 FROM public.notes         WHERE id = p_id AND user_id = auth.uid())
    WHEN 'board'     THEN EXISTS (SELECT 1 FROM public.canvas_boards WHERE id = p_id AND user_id = auth.uid())
    WHEN 'container' THEN EXISTS (SELECT 1 FROM public.containers    WHERE id = p_id AND user_id = auth.uid())
    ELSE FALSE END;
$$;

-- Board access via a board id (used by elements/connectors policies)
CREATE OR REPLACE FUNCTION public.can_access_board(p_board UUID, p_min_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.canvas_boards b WHERE b.id = p_board AND b.user_id = auth.uid())
      OR public.has_share('board', p_board, p_min_role);
$$;

-- shares: readable by the owner of the resource and by the invited user.
-- Writes go through the service role in /api/share (owner is verified there).
DROP POLICY IF EXISTS "Owners and invitees can view shares" ON public.shares;
CREATE POLICY "Owners and invitees can view shares" ON public.shares
  FOR SELECT USING (auth.uid() = user_id OR public.owns_resource(resource_type, resource_id));

-- ── notes ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
CREATE POLICY "Users can view their own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id OR public.has_share('note', id, 'view'));

DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
CREATE POLICY "Users can update their own notes" ON public.notes
  FOR UPDATE
  USING (auth.uid() = user_id OR public.has_share('note', id, 'edit'))
  WITH CHECK (auth.uid() = user_id OR public.has_share('note', id, 'edit'));

-- ── canvas boards + their elements / connectors ──────────────────────────────
DROP POLICY IF EXISTS "Users can view their own boards" ON public.canvas_boards;
CREATE POLICY "Users can view their own boards" ON public.canvas_boards
  FOR SELECT USING (auth.uid() = user_id OR public.has_share('board', id, 'view'));

DROP POLICY IF EXISTS "Users can update their own boards" ON public.canvas_boards;
CREATE POLICY "Users can update their own boards" ON public.canvas_boards
  FOR UPDATE
  USING (auth.uid() = user_id OR public.has_share('board', id, 'edit'))
  WITH CHECK (auth.uid() = user_id OR public.has_share('board', id, 'edit'));

DROP POLICY IF EXISTS "Users can view elements on their boards" ON public.canvas_elements;
CREATE POLICY "Users can view elements on their boards" ON public.canvas_elements
  FOR SELECT USING (public.can_access_board(board_id, 'view'));
DROP POLICY IF EXISTS "Users can insert elements on their boards" ON public.canvas_elements;
CREATE POLICY "Users can insert elements on their boards" ON public.canvas_elements
  FOR INSERT WITH CHECK (public.can_access_board(board_id, 'edit'));
DROP POLICY IF EXISTS "Users can update elements on their boards" ON public.canvas_elements;
CREATE POLICY "Users can update elements on their boards" ON public.canvas_elements
  FOR UPDATE USING (public.can_access_board(board_id, 'edit')) WITH CHECK (public.can_access_board(board_id, 'edit'));
DROP POLICY IF EXISTS "Users can delete elements on their boards" ON public.canvas_elements;
CREATE POLICY "Users can delete elements on their boards" ON public.canvas_elements
  FOR DELETE USING (public.can_access_board(board_id, 'edit'));

DROP POLICY IF EXISTS "Users can view connectors on their boards" ON public.canvas_connectors;
CREATE POLICY "Users can view connectors on their boards" ON public.canvas_connectors
  FOR SELECT USING (public.can_access_board(board_id, 'view'));
DROP POLICY IF EXISTS "Users can insert connectors on their boards" ON public.canvas_connectors;
CREATE POLICY "Users can insert connectors on their boards" ON public.canvas_connectors
  FOR INSERT WITH CHECK (public.can_access_board(board_id, 'edit'));
DROP POLICY IF EXISTS "Users can update connectors on their boards" ON public.canvas_connectors;
CREATE POLICY "Users can update connectors on their boards" ON public.canvas_connectors
  FOR UPDATE USING (public.can_access_board(board_id, 'edit')) WITH CHECK (public.can_access_board(board_id, 'edit'));
DROP POLICY IF EXISTS "Users can delete connectors on their boards" ON public.canvas_connectors;
CREATE POLICY "Users can delete connectors on their boards" ON public.canvas_connectors
  FOR DELETE USING (public.can_access_board(board_id, 'edit'));

-- ── containers (bookmark spaces) + their bookmarks ───────────────────────────
DROP POLICY IF EXISTS "Users can view their own containers" ON public.containers;
CREATE POLICY "Users can view their own containers" ON public.containers
  FOR SELECT USING (auth.uid() = user_id OR public.has_share('container', id, 'view'));

DROP POLICY IF EXISTS "Users can update their own containers" ON public.containers;
CREATE POLICY "Users can update their own containers" ON public.containers
  FOR UPDATE
  USING (auth.uid() = user_id OR public.has_share('container', id, 'edit'))
  WITH CHECK (auth.uid() = user_id OR public.has_share('container', id, 'edit'));

-- Bookmarks inside a shared space are visible to viewers and editable by editors.
-- Editors may add links to the space (row stays owned by whoever added it).
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view their own bookmarks" ON public.bookmarks
  FOR SELECT USING (
    auth.uid() = user_id
    OR (container_id IS NOT NULL AND public.has_share('container', container_id, 'view'))
  );

DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can insert their own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (container_id IS NULL OR public.owns_resource('container', container_id) OR public.has_share('container', container_id, 'edit'))
  );

DROP POLICY IF EXISTS "Users can update their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can update their own bookmarks" ON public.bookmarks
  FOR UPDATE
  USING (auth.uid() = user_id OR (container_id IS NOT NULL AND public.has_share('container', container_id, 'edit')))
  WITH CHECK (auth.uid() = user_id OR (container_id IS NOT NULL AND public.has_share('container', container_id, 'edit')));

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete their own bookmarks" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id OR (container_id IS NOT NULL AND public.has_share('container', container_id, 'edit')));

-- ── grants ───────────────────────────────────────────────────────────────────
GRANT SELECT ON public.shares TO authenticated;
GRANT ALL ON public.shares TO service_role;
GRANT EXECUTE ON FUNCTION public.has_share(TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_resource(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_board(UUID, TEXT) TO authenticated;

-- Realtime: let clients receive changes for shared rows too (RLS still applies).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'shares') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shares;
  END IF;
END $$;
