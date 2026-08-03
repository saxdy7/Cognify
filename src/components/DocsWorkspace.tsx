'use client';

import React, { useState, useEffect } from 'react';
import { Note } from '@/types';
import {
  Plus, Star, Trash2, ArrowLeft, ArrowRight, ChevronRight, FileStack,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NoteEditor } from '@/components/NoteEditor';
import { NotionDatabase } from '@/components/NotionDatabase';

interface DocsWorkspaceProps {
  notes: Note[];
  selectedNoteId: string | null; // null | 'favorites' | 'recent' | <uuid>
  searchQuery: string;
  onSelectNote: (id: string | null) => void;
  onAddNote: (parentId?: string | null, kind?: 'page' | 'database') => void;
  onUpdateNote: (id: string, data: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
}

export function DocsWorkspace({
  notes,
  selectedNoteId,
  searchQuery,
  onSelectNote,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}: DocsWorkspaceProps) {
  const openNote = notes.find((n) => n.id === selectedNoteId) || null;

  // ─────────────────────────── Single page view ───────────────────────────
  if (openNote) {
    return <NotePage key={openNote.id} note={openNote} notes={notes} onSelectNote={onSelectNote} onAddNote={onAddNote} onUpdateNote={onUpdateNote} onDeleteNote={onDeleteNote} />;
  }

  // ─────────────────────────── List view ───────────────────────────
  const isFavoritesView = selectedNoteId === 'favorites';
  const isRecentView = selectedNoteId === 'recent';

  let list = isFavoritesView
    ? notes.filter((n) => n.is_favorite)
    : notes.filter((n) => !n.parent_id); // top-level pages

  if (searchQuery) {
    list = notes.filter((n) => n.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }
  if (isRecentView) {
    list = [...notes].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  const heading = isFavoritesView ? 'Favorite Pages' : isRecentView ? 'Recently Edited' : 'Knowledge Docs';

  return (
    <div className="max-w-[2000px] mx-auto pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-space-grotesk tracking-tighter text-white">{heading}</h2>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] mt-1">Block-based pages &amp; nested docs</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onAddNote(null, 'database')}
            className="px-5 py-3 bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:border-emerald-500/30 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all cursor-pointer"
          >
            + Database
          </button>
          <button
            onClick={() => onAddNote(null, 'page')}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            New Page
          </button>
        </div>
      </div>

      {list.length > 0 ? (
        <div className="border border-white/5 rounded-2xl bg-white/[0.015] divide-y divide-white/5 overflow-hidden">
          {list.map((note) => {
            const childCount = notes.filter((n) => n.parent_id === note.id).length;
            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className="group flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.04] transition-colors duration-150 cursor-pointer"
              >
                <span className="text-lg shrink-0 w-6 text-center">{note.icon || '📄'}</span>
                <span className="flex-1 min-w-0 flex items-baseline gap-3">
                  <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors duration-150 truncate">{note.title || 'Untitled'}</span>
                  {childCount > 0 && (
                    <span className="text-[10px] font-bold text-zinc-600 shrink-0">{childCount} subpage{childCount > 1 ? 's' : ''}</span>
                  )}
                </span>
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider shrink-0 hidden sm:block">
                  Edited {new Date(note.updated_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateNote(note.id, { is_favorite: !note.is_favorite }); }}
                    className="p-1.5 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors duration-150"
                    title="Favorite"
                  >
                    <Star className={cn('w-4 h-4', note.is_favorite && 'fill-emerald-500 text-emerald-500')} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${note.title || 'Untitled'}" and its subpages?`)) onDeleteNote(note.id); }}
                    className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors duration-150"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01]">
          <FileStack className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">No pages found</h3>
          <p className="text-xs text-zinc-600 font-medium max-w-xs mx-auto">Create your first page to start writing. Nested subpages and a block editor are on the way.</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Open page (Phase 1 placeholder editor) ───────────────────────────
function NotePage({
  note, notes, onSelectNote, onAddNote, onUpdateNote, onDeleteNote,
}: {
  note: Note;
  notes: Note[];
  onSelectNote: (id: string | null) => void;
  onAddNote: (parentId?: string | null, kind?: 'page' | 'database') => void;
  onUpdateNote: (id: string, data: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
}) {
  const [title, setTitle] = useState(note.title);
  useEffect(() => { setTitle(note.title); }, [note.id, note.title]);

  const isDatabase = note.content?.kind === 'database';
  const children = notes.filter((n) => n.parent_id === note.id);
  const parent = note.parent_id ? notes.find((n) => n.id === note.parent_id) : null;

  const commitTitle = () => {
    const next = title.trim() || 'Untitled';
    if (next !== note.title) onUpdateNote(note.id, { title: next });
  };

  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  return (
    <div className={cn('mx-auto pb-32', isDatabase ? 'max-w-[1400px]' : 'max-w-3xl')}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-xs font-bold text-zinc-500">
        <button onClick={() => onSelectNote(null)} className="flex items-center gap-1.5 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> All Pages
        </button>
        {parent && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <button onClick={() => onSelectNote(parent.id)} className="hover:text-white transition-colors truncate max-w-[160px]">
              {parent.icon} {parent.title}
            </button>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-zinc-300 truncate max-w-[200px]">{note.title}</span>
      </div>

      {/* Title row */}
      <div className="flex items-start gap-4 mb-6">
        <div className="relative shrink-0">
          <button
            onClick={() => setIconPickerOpen((o) => !o)}
            className="text-4xl sm:text-5xl leading-none hover:scale-110 transition-transform duration-150"
            title="Change icon"
          >
            {note.icon || '📄'}
          </button>
          {iconPickerOpen && (
            <IconPicker
              current={note.icon || '📄'}
              onPick={(icon) => { onUpdateNote(note.id, { icon }); setIconPickerOpen(false); }}
              onClose={() => setIconPickerOpen(false)}
            />
          )}
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          placeholder="Untitled"
          className="flex-1 bg-transparent text-3xl sm:text-4xl font-black font-space-grotesk tracking-tighter text-white placeholder:text-zinc-700 outline-none border-none min-w-0"
        />
        <div className="flex items-center gap-1.5 shrink-0 pt-2">
          <button
            onClick={() => onUpdateNote(note.id, { is_favorite: !note.is_favorite })}
            className="p-2 bg-white/5 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
            title="Favorite"
          >
            <Star className={cn('w-5 h-5', note.is_favorite && 'fill-emerald-500 text-emerald-500')} />
          </button>
          <button
            onClick={() => { if (confirm(`Delete "${note.title || 'Untitled'}" and its subpages?`)) { onDeleteNote(note.id); onSelectNote(note.parent_id ?? null); } }}
            className="p-2 bg-white/5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body: database table or block editor */}
      <div className="mb-10">
        {note.content?.kind === 'database' ? (
          <NotionDatabase
            key={note.id}
            content={note.content}
            onChange={(content) => onUpdateNote(note.id, { content })}
          />
        ) : (
          <NoteEditor
            noteId={note.id}
            content={note.content}
            onSave={(json) => onUpdateNote(note.id, { content: json })}
          />
        )}
      </div>

      {/* Subpages */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Subpages</p>
        <button
          onClick={() => onAddNote(note.id)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Subpage
        </button>
      </div>

      {children.length > 0 ? (
        <div className="space-y-2">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => onSelectNote(child.id)}
              className="w-full flex items-center gap-3 p-4 bg-white/5 border border-white/5 hover:border-emerald-500/20 hover:bg-white/[0.07] rounded-2xl transition-all group text-left"
            >
              <span className="text-lg shrink-0">{child.icon || '📄'}</span>
              <span className="flex-1 text-sm font-bold text-white truncate">{child.title || 'Untitled'}</span>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">No subpages — nest one with “Add Subpage”.</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Page icon picker (Notion-style emoji popover) ───────────────────────────
const ICON_CHOICES = [
  '📄', '📝', '📌', '💡', '🚀', '📊', '🎯', '🔖', '⭐', '🧠', '📚', '🗂️',
  '✅', '📅', '🗒️', '📋', '🧩', '🔧', '🔍', '💬', '📁', '🏷️', '🧭', '🔥',
  '🎨', '🎬', '🎧', '📷', '🗺️', '🌱', '💰', '📈', '🧪', '🧱', '🔒', '🌐',
  '☕', '🏆', '🎓', '🛠️', '📦', '🧾', '🗓️', '🧵', '🪄', '🧊', '🛰️', '🪐',
];

function IconPicker({
  current, onPick, onClose,
}: {
  current: string;
  onPick: (icon: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute z-50 top-full left-0 mt-2 w-64 p-3 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl animate-popover-in">
        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] px-1 pb-2">Page icon</p>
        <div className="grid grid-cols-8 gap-1">
          {ICON_CHOICES.map((icon) => (
            <button
              key={icon}
              onClick={() => onPick(icon)}
              className={cn(
                'w-7 h-7 flex items-center justify-center rounded-lg text-lg hover:bg-white/10 transition-colors duration-150',
                icon === current && 'bg-emerald-500/15 ring-1 ring-emerald-500/40',
              )}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
