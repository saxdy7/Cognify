'use client';

import React from 'react';
import { Folder, Plus, LayoutDashboard, Star, Hash, Settings, ChevronRight, Sparkles } from 'lucide-react';
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
    <aside className="w-72 border-r border-zinc-200/50 dark:border-zinc-800/50 h-screen flex flex-col bg-white/50 dark:bg-black/50 backdrop-blur-xl sticky top-0 z-40">
      <div className="p-8 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/10">
            <Sparkles className="w-6 h-6 text-white dark:text-black" />
          </div>
          <span className="font-bold text-2xl tracking-tighter font-space-grotesk">Cognify</span>
        </div>

        <nav className="space-y-2 mb-12">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4 px-4">Navigation</p>
          <button
            onClick={() => onSelectContainer(null)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group",
              selectedContainerId === null && !isFavorites
                ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-xl shadow-black/5 dark:shadow-white/5"
                : "text-zinc-500 hover:text-black dark:hover:text-white"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            All Bookmarks
          </button>
          <button
            onClick={() => onSelectContainer('favorites')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group",
              selectedContainerId === 'favorites'
                ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-xl shadow-black/5 dark:shadow-white/5"
                : "text-zinc-500 hover:text-black dark:hover:text-white"
            )}
          >
            <Star className={cn("w-4 h-4", selectedContainerId === 'favorites' && "fill-current")} />
            Favorites
          </button>
        </nav>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 mb-6">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Collections</p>
            <button 
              onClick={onAddContainer}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors group"
            >
              <Plus className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white" />
            </button>
          </div>
          
          <div className="space-y-1 overflow-y-auto pr-2 custom-scrollbar">
            {containers.map((container) => (
              <button
                key={container.id}
                onClick={() => onSelectContainer(container.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group",
                  selectedContainerId === container.id
                    ? "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white"
                    : "text-zinc-500 hover:text-black dark:hover:text-white"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  selectedContainerId === container.id ? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-700"
                )} />
                <span className="flex-1 text-left truncate">{container.name}</span>
                <span className="text-[10px] opacity-50 group-hover:opacity-100">
                  <ChevronRight className="w-3 h-3" />
                </span>
              </button>
            ))}
            
            {containers.length === 0 && (
              <div className="px-4 py-8 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl">
                <p className="text-xs text-zinc-400 font-medium">Create your first collection to start organizing.</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800/50 mt-auto">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-zinc-500 hover:text-black dark:hover:text-white transition-all">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>
    </aside>
  );
}
