'use client';

import React from 'react';
import Link from 'next/link';
import { Folder, Plus, LayoutDashboard, Star, Hash, Settings, ChevronRight, Sparkles, Zap, Command, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container } from '@/types';
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
  viewType?: 'bookmarks' | 'passwords';
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
  viewType = 'bookmarks'
}: SidebarProps) {
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
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-500 rounded-[1rem] lg:rounded-[1.25rem] flex items-center justify-center shadow-[0_10px_30px_rgba(249,115,22,0.3)] group-hover:rotate-12 transition-transform duration-500 shrink-0">
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
                  <span className="block text-[10px] font-bold text-orange-500/80 uppercase tracking-[0.2em] truncate">High-Res Hub</span>
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
        </nav>

        {/* Containers */}
        <div className="flex-1 flex flex-col min-h-0 w-full">
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
        </div>

        {/* Bottom Section */}
        <div className="pt-10 border-t border-white/5 mt-auto space-y-2 w-full">
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
          <button
            onClick={() => onSelectContainer('settings')}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group",
              selectedContainerId === 'settings' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white hover:bg-white/5",
              isCollapsed && "justify-center px-0 py-4"
            )}
            title={isCollapsed ? "System Settings" : undefined}
          >
            <Settings className={cn("w-5 h-5 shrink-0", selectedContainerId === 'settings' ? "text-orange-500" : "text-zinc-500")} />
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
