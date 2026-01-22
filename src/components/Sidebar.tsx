'use client';

import React from 'react';
import { Folder, Plus, LayoutDashboard, Star, Hash, Settings, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container } from '@/types';

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
    <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 h-screen flex flex-col bg-white dark:bg-black sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
            <Hash className="w-5 h-5 text-white dark:text-black" />
          </div>
          <span className="font-bold text-xl tracking-tight">SmartMark</span>
        </div>

        <nav className="space-y-1">
          <button
            onClick={() => onSelectContainer(null)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              selectedContainerId === null && !isFavorites
                ? "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white"
                : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            All Bookmarks
          </button>
          <button
            onClick={() => onSelectContainer('favorites')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              selectedContainerId === 'favorites'
                ? "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white"
                : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white"
            )}
          >
            <Star className="w-4 h-4" />
            Favorites
          </button>
        </nav>

        <div className="mt-10">
          <div className="flex items-center justify-between px-3 mb-2">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Containers</h2>
            <button 
              onClick={onAddContainer}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-350px)]">
            {containers.map((container) => (
              <button
                key={container.id}
                onClick={() => onSelectContainer(container.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                  selectedContainerId === container.id
                    ? "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white"
                    : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white"
                )}
              >
                <Folder className={cn("w-4 h-4", selectedContainerId === container.id ? "text-black dark:text-white" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300")} />
                <span className="flex-1 text-left truncate">{container.name}</span>
                <ChevronRight className={cn("w-3 h-3 transition-opacity", selectedContainerId === container.id ? "opacity-100" : "opacity-0 group-hover:opacity-50")} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-zinc-100 dark:border-zinc-900">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </aside>
  );
}
