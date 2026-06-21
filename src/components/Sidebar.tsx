'use client';

import React from 'react';
import Link from 'next/link';
import { Folder, Plus, LayoutDashboard, Star, Hash, Settings, ChevronRight, Sparkles, Zap, Command, PanelLeftClose, PanelLeftOpen, Layers, Users, Trash, Award, Home, Presentation, KeyRound, Clock, ShieldCheck, FileText, FileStack } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container, CanvasBoard, Password, Note } from '@/types';
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
  viewType?: 'bookmarks' | 'passwords' | 'canvas' | 'docs';
  boards?: CanvasBoard[];
  selectedBoardId?: string | null;
  onSelectBoard?: (id: string | null) => void;
  onAddBoard?: () => void;
  passwords?: Password[];
  notes?: Note[];
  selectedNoteId?: string | null;
  onSelectNote?: (id: string | null) => void;
  onAddNote?: () => void;
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
  passwords = [],
  notes = [],
  selectedNoteId = null,
  onSelectNote,
  onAddNote
}: SidebarProps) {
  // Mirror the strength buckets used by PasswordCard so the vault summary stays consistent.
  const passwordStrength = (pwd: string) => {
    let s = 0;
    if (pwd.length >= 8) s++;
    if (pwd.length >= 12) s++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++;
    if (/\d/.test(pwd)) s++;
    if (/[^a-zA-Z0-9]/.test(pwd)) s++;
    if (s <= 2) return 'weak';
    if (s <= 3) return 'medium';
    return 'strong';
  };
  const vault = {
    total: passwords.length,
    strong: passwords.filter(p => passwordStrength(p.password) === 'strong').length,
    medium: passwords.filter(p => passwordStrength(p.password) === 'medium').length,
    weak: passwords.filter(p => passwordStrength(p.password) === 'weak').length,
    favorites: passwords.filter(p => p.is_favorite).length,
  };

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
              viewType === 'passwords' ? "bg-indigo-500 shadow-[0_10px_30px_rgba(99,102,241,0.3)]" :
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
                    viewType === 'canvas' ? "text-rose-500/80" : viewType === 'passwords' ? "text-indigo-500/80" : viewType === 'docs' ? "text-emerald-500/80" : "text-orange-500/80"
                  )}>
                    {viewType === 'canvas' ? 'Visual Canvas' : viewType === 'passwords' ? 'Secure Vault' : viewType === 'docs' ? 'Knowledge Docs' : 'High-Res Hub'}
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
          ) : viewType === 'passwords' ? (
            // Password Vault navigation
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
                title={isCollapsed ? "All Passwords" : undefined}
              >
                <KeyRound className={cn("w-5 h-5 shrink-0", selectedContainerId === null && !isFavorites ? "text-indigo-500" : "text-zinc-500")} />
                <AnimatePresence>
                  {!isCollapsed && <SidebarText>All Passwords</SidebarText>}
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
                title={isCollapsed ? "Favorites" : undefined}
              >
                <Star className={cn("w-5 h-5 shrink-0", selectedContainerId === 'favorites' ? "fill-indigo-500 text-indigo-500" : "text-zinc-500")} />
                <AnimatePresence>
                  {!isCollapsed && <SidebarText>Favorites</SidebarText>}
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
                title={isCollapsed ? "Recently Added" : undefined}
              >
                <Clock className={cn("w-5 h-5 shrink-0", selectedContainerId === 'today' ? "text-indigo-500" : "text-zinc-500")} />
                <AnimatePresence>
                  {!isCollapsed && <SidebarText>Recently Added</SidebarText>}
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
          ) : viewType === 'passwords' ? (
            // Password Vault Summary Section
            <>
              {!isCollapsed ? (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between px-4 mb-8"
                  >
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] truncate">Vault Summary</p>
                  </motion.div>

                  <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                    {/* Total */}
                    <div className="p-5 bg-indigo-500/5 border border-indigo-500/15 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-2xl font-black text-white leading-none">{vault.total}</p>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Stored Credentials</p>
                        </div>
                      </div>
                    </div>

                    {/* Strength breakdown */}
                    <div className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl space-y-3">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Strength</p>
                      {([
                        { key: 'strong', label: 'Strong', count: vault.strong, bar: 'bg-green-500', text: 'text-green-400' },
                        { key: 'medium', label: 'Medium', count: vault.medium, bar: 'bg-yellow-500', text: 'text-yellow-400' },
                        { key: 'weak', label: 'Weak', count: vault.weak, bar: 'bg-red-500', text: 'text-red-400' },
                      ]).map((row) => (
                        <div key={row.key} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-400">{row.label}</span>
                            <span className={cn("text-xs font-black", row.text)}>{row.count}</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all duration-500", row.bar)}
                              style={{ width: vault.total ? `${(row.count / vault.total) * 100}%` : '0%' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Favorites */}
                    <button
                      onClick={() => onSelectContainer('favorites')}
                      className="w-full p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/[0.06] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Star className="w-4 h-4 fill-indigo-500 text-indigo-500 shrink-0" />
                        <span className="text-xs font-bold text-zinc-300 group-hover:text-white">Favorites</span>
                      </div>
                      <span className="text-xs font-black text-zinc-400">{vault.favorites}</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center gap-4 pt-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center" title={`${vault.total} passwords`}>
                    <ShieldCheck className="w-6 h-6 text-indigo-400" />
                  </div>
                  <span className="text-xs font-black text-white">{vault.total}</span>
                </div>
              )}
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
                    onClick={onAddNote}
                    className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-xl hover:scale-110 active:scale-90 transition-all text-zinc-500 hover:text-emerald-500 border border-white/5 shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
              {isCollapsed && (
                <div className="flex justify-center mb-8">
                  <button
                    onClick={onAddNote}
                    className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:scale-110 active:scale-90 transition-all text-zinc-500 hover:text-emerald-500 border border-white/5 shrink-0"
                    title="New Page"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              )}

              <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {notes.filter(n => !n.parent_id).map((note) => (
                  <motion.button
                    layout
                    key={note.id}
                    onClick={() => onSelectNote && onSelectNote(note.id)}
                    className={cn(
                      "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group relative",
                      selectedNoteId === note.id
                        ? "bg-white/10 text-white"
                        : "text-zinc-500 hover:text-white hover:bg-white/5",
                      isCollapsed && "justify-center px-0 py-4"
                    )}
                    title={isCollapsed ? note.title : undefined}
                  >
                    <span className="text-base shrink-0 leading-none w-5 text-center">{note.icon || '📄'}</span>
                    <AnimatePresence>
                      {!isCollapsed && (
                        <>
                          <SidebarText className="flex-1 text-left truncate">{note.title || 'Untitled'}</SidebarText>
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                          >
                            <ChevronRight className={cn(
                              "w-4 h-4 transition-transform duration-300 shrink-0",
                              selectedNoteId === note.id ? "rotate-90 opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                            )} />
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </motion.button>
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
            <Settings className={cn("w-5 h-5 shrink-0", selectedContainerId === 'settings' ? (viewType === 'canvas' ? "text-rose-500" : viewType === 'passwords' ? "text-indigo-500" : viewType === 'docs' ? "text-emerald-500" : "text-orange-500") : "text-zinc-500")} />
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

