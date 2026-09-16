'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Bookmark, CanvasBoard, Container, Note } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface NewBookmarkInput {
  url: string;
  title?: string;
  description?: string;
  logo_url?: string;
  preview_image_url?: string;
  category?: string;
  tags?: string[];
  container_id?: string | null;
  metadata_json?: unknown;
  ai_summary?: string;
}

export type BookmarkPatch = Partial<Pick<Bookmark, 'title' | 'description' | 'category' | 'container_id' | 'tags' | 'is_favorite' | 'notes'>>;

interface WorkspaceState {
  user: User | null;
  loading: boolean;
  containers: Container[];
  bookmarks: Bookmark[];
  boards: CanvasBoard[];
  notes: Note[];
}

interface WorkspaceActions {
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;

  addContainer: (name: string) => Promise<Container | null>;
  deleteContainer: (id: string) => Promise<void>;

  addBookmark: (input: NewBookmarkInput) => Promise<Bookmark | null>;
  updateBookmark: (id: string, patch: BookmarkPatch) => Promise<void>;
  toggleFavorite: (bookmark: Bookmark) => Promise<void>;
  toggleShortcut: (bookmark: Bookmark) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;

  addBoard: (name: string) => Promise<CanvasBoard | null>;
  deleteBoard: (id: string) => Promise<void>;

  addNote: (parentId?: string | null, kind?: 'page' | 'database') => Promise<Note | null>;
  updateNote: (id: string, patch: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

export type WorkspaceContextValue = WorkspaceState & WorkspaceActions;

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

// ─── Helpers ───────────────────────────────────────────────────────────────────

const seedDatabaseContent = () => ({
  kind: 'database',
  columns: [
    { id: 'c_name', name: 'Name', type: 'text' },
    { id: 'c_done', name: 'Done', type: 'checkbox' },
    { id: 'c_link', name: 'Link', type: 'url' },
    { id: 'c_phone', name: 'Number', type: 'text' },
    {
      id: 'c_status', name: 'Status', type: 'select', options: [
        { id: 's1', name: 'Not started', color: 'gray' },
        { id: 's2', name: 'In progress', color: 'blue' },
        { id: 's3', name: 'Done', color: 'green' },
      ],
    },
  ],
  rows: [
    { id: 'r1', cells: { c_name: '', c_done: false, c_link: '', c_phone: '', c_status: null } },
    { id: 'r2', cells: { c_name: '', c_done: false, c_link: '', c_phone: '', c_status: null } },
    { id: 'r3', cells: { c_name: '', c_done: false, c_link: '', c_phone: '', c_status: null } },
  ],
});

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

// ─── Provider ──────────────────────────────────────────────────────────────────

/**
 * Single source of truth for the signed-in user's workspace (containers,
 * bookmarks, boards, docs). Loads once, keeps in sync via Supabase Realtime,
 * and exposes optimistic CRUD actions — so pages read from `useWorkspace()`
 * the same way Convex apps read from `useQuery`.
 */
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [containers, setContainers] = useState<Container[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [boards, setBoards] = useState<CanvasBoard[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const userRef = useRef<User | null>(null);

  // ── Loaders (one per table so realtime can refresh them independently) ──
  const loadContainers = useCallback(async (uid: string) => {
    const { data, error } = await supabase.from('containers').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (error) throw error;
    setContainers(data ?? []);
  }, []);

  const loadBookmarks = useCallback(async (uid: string) => {
    const { data, error } = await supabase.from('bookmarks').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (error) throw error;
    setBookmarks(data ?? []);
  }, []);

  const loadBoards = useCallback(async (uid: string) => {
    const { data, error } = await supabase.from('canvas_boards').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (error) throw error;
    setBoards(data ?? []);
  }, []);

  // RLS returns own pages + pages shared via note_shares
  const loadNotes = useCallback(async () => {
    const { data, error } = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    setNotes(data ?? []);
  }, []);

  const refresh = useCallback(async () => {
    const uid = userRef.current?.id;
    if (!uid) return;
    const results = await Promise.allSettled([loadContainers(uid), loadBookmarks(uid), loadBoards(uid), loadNotes()]);
    const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failed) toast.error('Some data failed to load: ' + errMsg(failed.reason));
  }, [loadContainers, loadBookmarks, loadBoards, loadNotes]);

  // ── Auth bootstrap ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) { router.replace('/login'); return; }
      userRef.current = user;
      setUser(user);
      await refresh();
      if (!cancelled) setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) { userRef.current = null; setUser(null); router.replace('/login'); }
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [router, refresh]);

  // ── Realtime: refetch the affected table when rows change elsewhere ──
  useEffect(() => {
    if (!user) return;
    const uid = user.id;
    const own = `user_id=eq.${uid}`;
    const channel = supabase
      .channel(`workspace:${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'containers', filter: own }, () => loadContainers(uid).catch(() => {}))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks', filter: own }, () => loadBookmarks(uid).catch(() => {}))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'canvas_boards', filter: own }, () => loadBoards(uid).catch(() => {}))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => loadNotes().catch(() => {}))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'note_shares', filter: own }, () => loadNotes().catch(() => {}))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadContainers, loadBookmarks, loadBoards, loadNotes]);

  // ── Actions ──
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  }, [router]);

  const addContainer = useCallback(async (name: string) => {
    const uid = userRef.current?.id; if (!uid) return null;
    try {
      const { data, error } = await supabase.from('containers').insert([{ name, user_id: uid }]).select().single();
      if (error) throw error;
      setContainers((prev) => [data, ...prev]);
      toast.success(`Space "${name}" created`);
      return data as Container;
    } catch (e) { toast.error('Failed to create space: ' + errMsg(e)); return null; }
  }, []);

  const deleteContainer = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('containers').delete().eq('id', id);
      if (error) throw error;
      setContainers((prev) => prev.filter((c) => c.id !== id));
      setBookmarks((prev) => prev.map((b) => (b.container_id === id ? { ...b, container_id: undefined } : b)));
      toast.success('Space deleted');
    } catch (e) { toast.error('Failed to delete space: ' + errMsg(e)); }
  }, []);

  const addBookmark = useCallback(async (input: NewBookmarkInput) => {
    const uid = userRef.current?.id; if (!uid) return null;
    try {
      const row = {
        user_id: uid,
        url: input.url,
        title: input.title,
        description: input.description,
        logo_url: input.logo_url,
        preview_image_url: input.preview_image_url,
        category: input.category,
        tags: input.tags ?? [],
        container_id: input.container_id || null,
        metadata_json: input.metadata_json,
        ai_summary: input.ai_summary,
      };
      const { data, error } = await supabase.from('bookmarks').insert([row]).select().single();
      if (error) throw error;
      setBookmarks((prev) => [data, ...prev]);
      toast.success('Link saved');
      return data as Bookmark;
    } catch (e) { toast.error('Failed to save link: ' + errMsg(e)); return null; }
  }, []);

  const updateBookmark = useCallback(async (id: string, patch: BookmarkPatch) => {
    const prev = bookmarks;
    setBookmarks((list) => list.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    try {
      // `container_id: undefined` means "move to unsorted" — Supabase drops undefined keys, so send null explicitly.
      const row = 'container_id' in patch ? { ...patch, container_id: patch.container_id ?? null } : patch;
      const { error } = await supabase.from('bookmarks').update(row).eq('id', id);
      if (error) throw error;
    } catch (e) { setBookmarks(prev); toast.error('Failed to update link: ' + errMsg(e)); }
  }, [bookmarks]);

  const toggleFavorite = useCallback(async (bookmark: Bookmark) => {
    const next = !bookmark.is_favorite;
    setBookmarks((list) => list.map((b) => (b.id === bookmark.id ? { ...b, is_favorite: next } : b)));
    const { error } = await supabase.from('bookmarks').update({ is_favorite: next }).eq('id', bookmark.id);
    if (error) { setBookmarks((list) => list.map((b) => (b.id === bookmark.id ? { ...b, is_favorite: !next } : b))); toast.error('Failed to update favorite'); }
  }, []);

  const toggleShortcut = useCallback(async (bookmark: Bookmark) => {
    const tags = bookmark.tags ?? [];
    const next = tags.includes('shortcut') ? tags.filter((t) => t !== 'shortcut') : [...tags, 'shortcut'];
    setBookmarks((list) => list.map((b) => (b.id === bookmark.id ? { ...b, tags: next } : b)));
    const { error } = await supabase.from('bookmarks').update({ tags: next }).eq('id', bookmark.id);
    if (error) { setBookmarks((list) => list.map((b) => (b.id === bookmark.id ? { ...b, tags } : b))); toast.error('Failed to update shortcut'); }
  }, []);

  const deleteBookmark = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('bookmarks').delete().eq('id', id);
      if (error) throw error;
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      toast.success('Link removed');
    } catch (e) { toast.error('Failed to remove link: ' + errMsg(e)); }
  }, []);

  const addBoard = useCallback(async (name: string) => {
    const uid = userRef.current?.id; if (!uid) return null;
    try {
      const { data, error } = await supabase.from('canvas_boards').insert([{ name, user_id: uid }]).select().single();
      if (error) throw error;
      setBoards((prev) => [data, ...prev]);
      toast.success(`Board "${name}" created`);
      return data as CanvasBoard;
    } catch (e) { toast.error('Failed to create board: ' + errMsg(e)); return null; }
  }, []);

  const deleteBoard = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('canvas_boards').delete().eq('id', id);
      if (error) throw error;
      setBoards((prev) => prev.filter((b) => b.id !== id));
      toast.success('Board deleted');
    } catch (e) { toast.error('Failed to delete board: ' + errMsg(e)); }
  }, []);

  const addNote = useCallback(async (parentId: string | null = null, kind: 'page' | 'database' = 'page') => {
    const uid = userRef.current?.id; if (!uid) return null;
    const isDb = kind === 'database';
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          user_id: uid,
          parent_id: parentId,
          title: isDb ? 'Untitled Database' : 'Untitled',
          icon: isDb ? '🗃️' : '📄',
          content: isDb ? seedDatabaseContent() : {},
        }])
        .select()
        .single();
      if (error) throw error;
      setNotes((prev) => [data, ...prev]);
      toast.success(isDb ? 'Database created' : 'Page created');
      return data as Note;
    } catch (e) { toast.error('Failed to create page: ' + errMsg(e)); return null; }
  }, []);

  const updateNote = useCallback(async (id: string, patch: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    const { error } = await supabase.from('notes').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error('Failed to save page: ' + error.message);
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    try {
      // DB cascades ON DELETE; mirror the subtree removal locally
      const toRemove = new Set<string>([id]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const n of notes) {
          if (n.parent_id && toRemove.has(n.parent_id) && !toRemove.has(n.id)) { toRemove.add(n.id); grew = true; }
        }
      }
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      setNotes((prev) => prev.filter((n) => !toRemove.has(n.id)));
      toast.success('Page deleted');
    } catch (e) { toast.error('Failed to delete page: ' + errMsg(e)); }
  }, [notes]);

  const value = useMemo<WorkspaceContextValue>(() => ({
    user, loading, containers, bookmarks, boards, notes,
    refresh, signOut,
    addContainer, deleteContainer,
    addBookmark, updateBookmark, toggleFavorite, toggleShortcut, deleteBookmark,
    addBoard, deleteBoard,
    addNote, updateNote, deleteNote,
  }), [
    user, loading, containers, bookmarks, boards, notes,
    refresh, signOut, addContainer, deleteContainer, addBookmark, updateBookmark, toggleFavorite, toggleShortcut,
    deleteBookmark, addBoard, deleteBoard, addNote, updateNote, deleteNote,
  ]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside <WorkspaceProvider>');
  return ctx;
}
