'use client';

import React from 'react';
import { Folder, Plus, LayoutDashboard, Star, Hash, Settings, ChevronRight, Sparkles, Zap, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container } from '@/types';
import { motion } from 'framer-motion';

interface SidebarProps {
  containers: Container[];
  selectedContainerId: string | null;
  onSelectContainer: (id: string | null) => void;
  onAddContainer: () => void;
  isFavorites?: boolean;
}

export function Sidebar({ 
  containers, 
  selectedContainerId, 
  onSelectContainer, 
  onAddContainer,
  isFavorites 
}: SidebarProps) {
  return (
    <aside className="w-80 h-screen sticky top-0 z-40 flex flex-col bg-white/5 dark:bg-black/5 backdrop-blur-3xl border-r border-white/10 dark:border-zinc-800/50">
      <div className="p-10 flex flex-col h-full overflow-hidden">
        {/* Brand */}
        <div className="flex items-center gap-4 mb-14 group cursor-pointer">
          <div className="w-12 h-12 bg-black dark:bg-white rounded-[1.25rem] flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_30px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="w-7 h-7 text-white dark:text-black" />
          </div>
          <div>
            <span className="block font-black text-2xl tracking-tight font-space-grotesk group-hover:tracking-normal transition-all duration-500">Cognify</span>
            <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Intelligent Hub</span>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="space-y-2 mb-14">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6 px-4">Core</p>
          <button
            onClick={() => onSelectContainer(null)}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 group",
              selectedContainerId === null && !isFavorites
                ? "bg-black dark:bg-white text-white dark:text-black shadow-2xl"
                : "text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/50"
            )}
          >
            <LayoutDashboard className={cn("w-5 h-5", selectedContainerId === null && !isFavorites ? "text-indigo-400" : "text-zinc-400")} />
            Discovery
          </button>
          <button
            onClick={() => onSelectContainer('favorites')}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 group",
              selectedContainerId === 'favorites'
                ? "bg-black dark:bg-white text-white dark:text-black shadow-2xl"
                : "text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/50"
            )}
          >
            <Star className={cn("w-5 h-5", selectedContainerId === 'favorites' ? "fill-amber-400 text-amber-400" : "text-zinc-400")} />
            Curated
          </button>
        </nav>

        {/* Containers */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 mb-8">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Spaces</p>
            <button 
              onClick={onAddContainer}
              className="w-8 h-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 rounded-xl hover:scale-110 active:scale-90 transition-all text-zinc-400 hover:text-indigo-500"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {containers.map((container) => (
              <motion.button
                layout
                key={container.id}
                onClick={() => onSelectContainer(container.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 group relative",
                  selectedContainerId === container.id
                    ? "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white"
                    : "text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/50"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full transition-all duration-500",
                  selectedContainerId === container.id ? "bg-indigo-500 scale-125 shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "bg-zinc-300 dark:bg-zinc-700"
                )} />
                <span className="flex-1 text-left truncate">{container.name}</span>
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform duration-300",
                  selectedContainerId === container.id ? "rotate-90 opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                )} />
              </motion.button>
            ))}
            
            {containers.length === 0 && (
              <div className="p-8 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2rem]">
                <p className="text-[10px] font-bold text-zinc-400 leading-relaxed uppercase tracking-widest">No Spaces Yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-10 border-t border-white/5 dark:border-zinc-800/50 mt-auto space-y-2">
          <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold text-zinc-500 hover:text-black dark:hover:text-white transition-all hover:bg-zinc-100 dark:hover:bg-zinc-900/50 group">
            <Command className="w-5 h-5 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
            Shortcuts
          </button>
          <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold text-zinc-500 hover:text-black dark:hover:text-white transition-all hover:bg-zinc-100 dark:hover:bg-zinc-900/50 group">
            <Settings className="w-5 h-5 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
            Settings
          </button>
        </div>
      </div>
    </aside>
  );
}
