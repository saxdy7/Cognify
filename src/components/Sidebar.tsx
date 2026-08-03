'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Folder, Plus, LayoutDashboard, Star, Hash, Settings, ChevronRight, Sparkles, Zap, Command, PanelLeftClose, PanelLeftOpen, Layers, Users, Trash, Award, Home, Presentation, Clock, FileText, FileStack, CornerDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container, CanvasBoard, Note } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  containers: Container[];
  selectedContainerId: string | null;
  onSelectContainer: (id: string | null) => void;
  onAddContainer: () => void;
  isFavorites?: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  viewType?: 'bookmarks' | 'canvas' | 'docs';
  boards?: CanvasBoard[];
  selectedBoardId?: string | null;
  onSelectBoard?: (id: string | null) => void;
  onAddBoard?: () => void;
  notes?: Note[];
  selectedNoteId?: string | null;
  onSelectNote?: (id: string | null) => void;
  onAddNote?: (parentId?: string) => void;
}

// Helper component for animated text
const SidebarText = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.span
    initial={{ opacity: 0, width: 0 }}
    animate={{ opacity: 1, width: "auto" }}
    exit={{ opacity: 0, width: 0 }}
    transition={{ duration: 0.2, ease: "easeInOut" }}
    className={cn("overflow-hidden whitespace-nowrap", className)}
  >
    {children}
  </motion.span>
);

// Recursive docs sidebar row — a Notion-style page tree: expand/collapse
// chevron reveals subpages inline without navigating, hover reveals a
// quick "add subpage" action, and the row itself navigates on click.
function NoteTreeRow({
  note, notes, depth, selectedNoteId, onSelectNote, onAddNote, expanded, onToggleExpand, isCollapsed,
}: {
  note: Note;
  notes: Note[];
  depth: number;
  selectedNoteId?: string | null;
  onSelectNote?: (id: string | null) => void;
  onAddNote?: (parentId?: string) => void;
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;
  isCollapsed: boolean;
}) {
  const children = notes.filter(n => n.parent_id === note.id);
  const hasChildren = children.length > 0;
  const isExpanded = expanded.has(note.id);
  const isSelected = selectedNoteId === note.id;
  const isTopLevel = depth === 0;
  const indent = 10 + depth * 20;

  return (
    <div>
      <div
        onClick={() => onSelectNote && onSelectNote(note.id)}
        title={isCollapsed ? note.title : undefined}
        className={cn(
          "w-full flex items-center gap-2 rounded-lg transition-colors duration-150 group relative cursor-pointer",
          isTopLevel ? "text-sm font-black py-2.5" : "text-xs font-bold py-1.5",
          isSelected ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white hover:bg-white/5",
          isCollapsed && isTopLevel ? "justify-center px-0 py-4" : "pr-2"
        )}
        style={isCollapsed && isTopLevel ? undefined : { paddingLeft: indent }}
      >
        {!isCollapsed && (
          <button
            onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggleExpand(note.id); }}
            className={cn(
              "w-3.5 h-3.5 flex items-center justify-center shrink-0 rounded transition-transform duration-150",
              hasChildren ? "text-zinc-600 hover:text-white" : "opacity-0 pointer-events-none",
              isExpanded && "rotate-90"
            )}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Icon slot: top-level pages show their emoji; nested pages show
            nothing unless active, in which case a corner-arrow "branches"
            off the connecting line into the label — matches a standard
            nested-nav sidebar tree (Shopify-style). */}
        {isTopLevel ? (
          <span className="text-base shrink-0 leading-none w-5 text-center">{note.icon || '📄'}</span>
        ) : (
          <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
            {isSelected && <CornerDownRight className="w-3.5 h-3.5 text-zinc-500" />}
          </span>
        )}

        {!isCollapsed && (
          <>
            <span className="flex-1 text-left truncate">{note.title || 'Untitled'}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onAddNote && onAddNote(note.id); }}
              title="Add subpage"
              className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-600 hover:text-emerald-400 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
      {!isCollapsed && hasChildren && isExpanded && (
        <div className="relative">
          {/* Connecting spine dropping from this row's icon down through its children */}
          <div className="absolute top-0 bottom-1.5 w-px bg-white/10" style={{ left: indent + 8 }} />
          {children.map(child => (
            <NoteTreeRow
              key={child.id}
              note={child}
              notes={notes}
              depth={depth + 1}
              selectedNoteId={selectedNoteId}
              onSelectNote={onSelectNote}
              onAddNote={onAddNote}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  containers,
  selectedContainerId,
  onSelectContainer,
  onAddContainer,
  isFavorites,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onMobileClose,
  viewType = 'bookmarks',
  boards = [],
  selectedBoardId = null,
  onSelectBoard,
  onAddBoard,
  notes = [],
  selectedNoteId = null,
  onSelectNote,
  onAddNote
}: SidebarProps) {
  // Which page rows in the docs tree are expanded to show their subpages.
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<string>>(new Set());
  const toggleNoteExpand = (id: string) => {
    setExpandedNoteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Auto-reveal the selected page's ancestors so its location in the tree
  // is always visible, even if the tree was collapsed when you navigated in.
  useEffect(() => {
    if (viewType !== 'docs' || !selectedNoteId) return;
    const toExpand: string[] = [];
    let current = notes.find(n => n.id === selectedNoteId);
    while (current?.parent_id) {
      toExpand.push(current.parent_id);
      current = notes.find(n => n.id === current!.parent_id);
    }
    if (toExpand.length) {
      setExpandedNoteIds(prev => {
        const next = new Set(prev);
        toExpand.forEach(id => next.add(id));
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNoteId, viewType]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen z-50 flex flex-col bg-black border-r border-white/5 shadow-2xl transition-all duration-300 ease-in-out",
          "lg:z-40",
          isCollapsed && "lg:w-24",
          !isCollapsed && "lg:w-80",
          isMobileOpen ? "w-80 translate-x-0" : "w-80 -translate-x-full lg:translate-x-0"
        )}
      >
      <div className={cn("flex flex-col h-full", isCollapsed ? "p-4 items-center" : "p-6 lg:p-10")}>
        {/* Brand */}
        <div className="flex items-center justify-between mb-10 lg:mb-14 w-full h-12">
          <Link href="/" className={cn("flex items-center gap-4 group cursor-pointer", isCollapsed && "lg:justify-center lg:w-full")}>
            <div className={cn(
              "w-10 h-10 lg:w-12 lg:h-12 rounded-[1rem] lg:rounded-[1.25rem] flex items-center justify-center transition-transform duration-500 shrink-0",
              viewType === 'canvas' ? "bg-rose-500 shadow-[0_10px_30px_rgba(244,63,94,0.3)]" :
              viewType === 'docs' ? "bg-emerald-500 shadow-[0_10px_30px_rgba(16,185,129,0.3)]" :
              "bg-orange-500 shadow-[0_10px_30px_rgba(249,115,22,0.3)]"
            )}>
              <Sparkles className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="min-w-0 overflow-hidden"
                >
                  <span className="block font-black text-2xl tracking-tight font-space-grotesk text-white truncate">Cognify</span>
                  <span className={cn(
                    "block text-[10px] font-bold uppercase tracking-[0.2em] truncate",
                    viewType === 'canvas' ? "text-rose-500/80" : viewType === 'docs' ? "text-emerald-500/80" : "text-orange-500/80"
                  )}>
                    {viewType === 'canvas' ? 'Visual Canvas' : viewType === 'docs' ? 'Knowledge Docs' : 'High-Res Hub'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                onClick={onToggleCollapse}
                className="hidden lg:flex w-8 h-8 items-center justify-center text-zinc-500 hover:text-white transition-colors"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Main Nav */}
        <nav className="space-y-2 mb-10 lg:mb-14 w-full">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6 px-4 truncate overflow-hidden"
              >
                Navigation
              </motion.p>
            )}
          </AnimatePresence>

          {viewType === 'canvas' ? (
            // Canvas specific navigation
            <>
              <button
                onClick={() => onSelectBoard && onSelectBoard(null)}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group",
                  selectedBoardId === null
                    ? "bg-white text-black shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                    : "text-zinc-500 hover:text-white hover:bg-white/5",
                  isCollapsed && "justify-center px-0 py-4"
                )}
                title={isCollapsed ? "All Boards" : undefined}
              >
                <Home className={cn("w-5 h-5 shrink-0", selectedBoardId === null ? "text-rose-500" : "text-zinc-500")} />
                <AnimatePresence>
                  {!isCollapsed && <SidebarText>All Boards</SidebarText>}
                </AnimatePresence>
              </button>
              <button
                onClick={() => onSelectBoard && onSelectBoard('shared')}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group",
                  selectedBoardId === 'shared'
                    ? "bg-white text-black shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                    : "text-zinc-500 hover:text-white hover:bg-white/5",
                  isCollapsed && "justify-center px-0 py-4"
                )}
                title={isCollapsed ? "Shared" : undefined}
              >
                <Users className={cn("w-5 h-5 shrink-0", selectedBoardId === 'shared' ? "text-rose-500" : "text-zinc-500")} />
                <AnimatePresence>
                  {!isCollapsed && <SidebarText>Shared with me</SidebarText>}
                </AnimatePresence>
              </button>
              <button
                onClick={() => onSelectBoard && onSelectBoard('trash')}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group",
                  selectedBoardId === 'trash'
                    ? "bg-white text-black shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                    : "text-zinc-500 hover:text-white hover:bg-white/5",
                  isCollapsed && "justify-center px-0 py-4"
                )}
                title={isCollapsed ? "Trash" : undefined}
              >
                <Trash className={cn("w-5 h-5 shrink-0", selectedBoardId === 'trash' ? "text-rose-500" : "text-zinc-500")} />
                <AnimatePresence>
                  {!isCollapsed && <SidebarText>Trash / Archive</SidebarText>}
                </AnimatePresence>
              </button>
            </>
          ) : viewType === 'docs' ? (
            // Docs / Pages navigation
            <>
              <button
                onClick={() => onSelectNote && onSelectNote(null)}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group",
                  selectedNoteId === null
                    ? "bg-white text-black shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                    : "text-zinc-500 hover:text-white hover:bg-white/5",
                  isCollapsed && "justify-center px-0 py-4"
                )}
                title={isCollapsed ? "All Pages" : undefined}
              >
                <FileStack className={cn("w-5 h-5 shrink-0", selectedNoteId === null ? "text-emerald-500" : "text-zinc-500")} />
                <AnimatePresence>
                  {!isCollapsed && <SidebarText>All Pages</SidebarText>}
                </AnimatePresence>
              </button>
              <button
                onClick={() => onSelectNote && onSelectNote('favorites')}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group",
                  selectedNoteId === 'favorites'
                    ? "bg-white text-black shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                    : "text-zinc-500 hover:text-white hover:bg-white/5",
                  isCollapsed && "justify-center px-0 py-4"
                )}
                title={isCollapsed ? "Favorites" : undefined}
              >
                <Star className={cn("w-5 h-5 shrink-0", selectedNoteId === 'favorites' ? "fill-emerald-500 text-emerald-500" : "text-zinc-500")} />
                <AnimatePresence>
                  {!isCollapsed && <SidebarText>Favorites</SidebarText>}
                </AnimatePresence>
              </button>
              <button
                onClick={() => onSelectNote && onSelectNote('recent')}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group",
                  selectedNoteId === 'recent'
                    ? "bg-white text-black shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                    : "text-zinc-500 hover:text-white hover:bg-white/5",
                  isCollapsed && "justify-center px-0 py-4"
                )}
                title={isCollapsed ? "Recent" : undefined}
              >
                <Clock className={cn("w-5 h-5 shrink-0", selectedNoteId === 'recent' ? "text-emerald-500" : "text-zinc-500")} />
                <AnimatePresence>
                  {!isCollapsed && <SidebarText>Recent</SidebarText>}
                </AnimatePresence>
              </button>
            </>
          ) : (
            // Bookmarks navigation
            <>
              <button
                onClick={() => onSelectContainer(null)}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group",
                  selectedContainerId === null && !isFavorites
                    ? "bg-white text-black shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                    : "text-zinc-500 hover:text-white hover:bg-white/5",
                  isCollapsed && "justify-center px-0 py-4"
                )}
                title={isCollapsed ? "Discovery" : undefined}
              >
                <LayoutDashboard className={cn("w-5 h-5 shrink-0", selectedContainerId === null && !isFavorites ? "text-orange-500" : "text-zinc-500")} />
                <AnimatePresence>
                  {!isCollapsed && <SidebarText>Discovery</SidebarText>}
                </AnimatePresence>
              </button>
              <button
                onClick={() => onSelectContainer('favorites')}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group",
                  selectedContainerId === 'favorites'
                    ? "bg-white text-black shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                    : "text-zinc-500 hover:text-white hover:bg-white/5",
                  isCollapsed && "justify-center px-0 py-4"
                )}
                title={isCollapsed ? "Curated" : undefined}
              >
                <Star className={cn("w-5 h-5 shrink-0", selectedContainerId === 'favorites' ? "fill-orange-500 text-orange-500" : "text-zinc-500")} />
                <AnimatePresence>
                  {!isCollapsed && <SidebarText>Curated</SidebarText>}
                </AnimatePresence>
              </button>
              <button
                onClick={() => onSelectContainer('today')}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group",
                  selectedContainerId === 'today'
                    ? "bg-white text-black shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                    : "text-zinc-500 hover:text-white hover:bg-white/5",
                  isCollapsed && "justify-center px-0 py-4"
                )}
                title={isCollapsed ? "Captured Today" : undefined}
              >
                <Zap className={cn("w-5 h-5 shrink-0", selectedContainerId === 'today' ? "text-orange-500" : "text-zinc-500")} />
                <AnimatePresence>
                  {!isCollapsed && <SidebarText>Captured Today</SidebarText>}
                </AnimatePresence>
              </button>
            </>
          )}
        </nav>

        {/* Dynamic section: Spaces or Boards */}
        <div className="flex-1 flex flex-col min-h-0 w-full">
          {viewType === 'canvas' ? (
            // Visual Boards Section
            <>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between px-4 mb-8"
                >
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] truncate">Visual Boards</p>
                  <button
                    onClick={onAddBoard}
                    className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-xl hover:scale-110 active:scale-90 transition-all text-zinc-500 hover:text-rose-500 border border-white/5 shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
              {isCollapsed && (
                <div className="flex justify-center mb-8">
                  <button
                    onClick={onAddBoard}
                    className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:scale-110 active:scale-90 transition-all text-zinc-500 hover:text-rose-500 border border-white/5 shrink-0"
                    title="Add Board"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              )}

              <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {boards.map((board) => (
                  <motion.button
                    layout
                    key={board.id}
                    onClick={() => onSelectBoard && onSelectBoard(board.id)}
                    className={cn(
                      "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group relative",
                      selectedBoardId === board.id
                        ? "bg-white/10 text-white"
                        : "text-zinc-500 hover:text-white hover:bg-white/5",
                      isCollapsed && "justify-center px-0 py-4"
                    )}
                    title={isCollapsed ? board.name : undefined}
                  >
                    <Presentation className={cn(
                      "w-5 h-5 transition-all duration-500 shrink-0",
                      selectedBoardId === board.id ? "text-rose-500 scale-110" : "text-zinc-600 group-hover:text-zinc-300"
                    )} />
                    <AnimatePresence>
                      {!isCollapsed && (
                        <>
                          <SidebarText className="flex-1 text-left truncate">{board.name}</SidebarText>
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                          >
                            <ChevronRight className={cn(
                              "w-4 h-4 transition-transform duration-300 shrink-0",
                              selectedBoardId === board.id ? "rotate-90 opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                            )} />
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}

                {boards.length === 0 && !isCollapsed && (
                  <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                    <p className="text-[10px] font-black text-zinc-600 leading-relaxed uppercase tracking-widest">No Active Boards</p>
                  </div>
                )}
              </div>
            </>
          ) : viewType === 'docs' ? (
            // Docs Pages Section
            <>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between px-4 mb-8"
                >
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] truncate">Pages</p>
                  <button
                    onClick={() => onAddNote && onAddNote()}
                    className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-xl hover:scale-110 active:scale-90 transition-all text-zinc-500 hover:text-emerald-500 border border-white/5 shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
              {isCollapsed && (
                <div className="flex justify-center mb-8">
                  <button
                    onClick={() => onAddNote && onAddNote()}
                    className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:scale-110 active:scale-90 transition-all text-zinc-500 hover:text-emerald-500 border border-white/5 shrink-0"
                    title="New Page"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              )}

              <div className="space-y-1 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {notes.filter(n => !n.parent_id).map((note) => (
                  <NoteTreeRow
                    key={note.id}
                    note={note}
                    notes={notes}
                    depth={0}
                    selectedNoteId={selectedNoteId}
                    onSelectNote={onSelectNote}
                    onAddNote={onAddNote}
                    expanded={expandedNoteIds}
                    onToggleExpand={toggleNoteExpand}
                    isCollapsed={isCollapsed}
                  />
                ))}

                {notes.filter(n => !n.parent_id).length === 0 && !isCollapsed && (
                  <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                    <p className="text-[10px] font-black text-zinc-600 leading-relaxed uppercase tracking-widest">No Pages Yet</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Spaces (Containers) Section
            <>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between px-4 mb-8"
                >
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] truncate">Spaces</p>
                  <button
                    onClick={onAddContainer}
                    className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-xl hover:scale-110 active:scale-90 transition-all text-zinc-500 hover:text-orange-500 border border-white/5 shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
              {isCollapsed && (
                <div className="flex justify-center mb-8">
                  <button
                    onClick={onAddContainer}
                    className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:scale-110 active:scale-90 transition-all text-zinc-500 hover:text-orange-500 border border-white/5 shrink-0"
                    title="Add Space"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              )}

              <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {containers.map((container) => (
                  <motion.button
                    layout
                    key={container.id}
                    onClick={() => onSelectContainer(container.id)}
                    className={cn(
                      "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group relative",
                      selectedContainerId === container.id
                        ? "bg-white/10 text-white"
                        : "text-zinc-500 hover:text-white hover:bg-white/5",
                      isCollapsed && "justify-center px-0 py-4"
                    )}
                    title={isCollapsed ? container.name : undefined}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full transition-all duration-500 shrink-0",
                      selectedContainerId === container.id ? "bg-orange-500 scale-125 shadow-[0_0_10px_rgba(249,115,22,0.5)]" : "bg-zinc-800"
                    )} />
                    <AnimatePresence>
                      {!isCollapsed && (
                        <>
                          <SidebarText className="flex-1 text-left">{container.name}</SidebarText>
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                          >
                            <ChevronRight className={cn(
                              "w-4 h-4 transition-transform duration-300 shrink-0",
                              selectedContainerId === container.id ? "rotate-90 opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                            )} />
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}

                {containers.length === 0 && !isCollapsed && (
                  <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                    <p className="text-[10px] font-black text-zinc-600 leading-relaxed uppercase tracking-widest">No Active Spaces</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Upgrade to Pro Card for Canvas */}
        {viewType === 'canvas' && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 mb-4 bg-gradient-to-br from-rose-500/10 to-orange-500/10 border border-rose-500/20 rounded-2xl text-center space-y-2 mt-4 backdrop-blur-md shrink-0"
          >
            <Award className="w-5 h-5 text-rose-400 mx-auto" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Upgrade to Pro</h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-bold">Infinite canvas cards, custom arrows & real-time collaboration</p>
            <button className="w-full py-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black text-[9px] uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(244,63,94,0.3)]">Go Pro</button>
          </motion.div>
        )}

        {/* Bottom Section */}
        <div className="pt-6 border-t border-white/5 mt-auto space-y-2 w-full shrink-0">
          {viewType === 'bookmarks' && (
            <button
              onClick={() => onSelectContainer('shortcuts')}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group",
                selectedContainerId === 'shortcuts' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white hover:bg-white/5",
                isCollapsed && "justify-center px-0 py-4"
              )}
              title={isCollapsed ? "Shortcuts" : undefined}
            >
              <Command className={cn("w-5 h-5 shrink-0", selectedContainerId === 'shortcuts' ? "text-orange-500" : "text-zinc-500")} />
              <AnimatePresence>
                {!isCollapsed && <SidebarText>Shortcuts</SidebarText>}
              </AnimatePresence>
            </button>
          )}
          <button
            onClick={() => onSelectContainer('settings')}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group",
              selectedContainerId === 'settings' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white hover:bg-white/5",
              isCollapsed && "justify-center px-0 py-4"
            )}
            title={isCollapsed ? "System Settings" : undefined}
          >
            <Settings className={cn("w-5 h-5 shrink-0", selectedContainerId === 'settings' ? (viewType === 'canvas' ? "text-rose-500" : viewType === 'docs' ? "text-emerald-500" : "text-orange-500") : "text-zinc-500")} />
            <AnimatePresence>
              {!isCollapsed && <SidebarText>System Settings</SidebarText>}
            </AnimatePresence>
          </button>

          {isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center p-4 text-zinc-500 hover:text-white transition-colors border-t border-white/5 mt-4"
              title="Expand Sidebar"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}

