'use client';

import React from 'react';
import { Search, Plus, Bell, User } from 'lucide-react';

interface HeaderProps {
  onAddBookmark: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  containerName?: string;
}

export function Header({ onAddBookmark, searchQuery, onSearchChange, containerName = 'All Bookmarks' }: HeaderProps) {
  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 hidden md:block min-w-[150px]">
          {containerName}
        </h1>
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-full text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onAddBookmark}
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Bookmark
        </button>
        <button className="p-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center border border-zinc-300 dark:border-zinc-700 overflow-hidden cursor-pointer hover:border-black dark:hover:border-white transition-colors">
          <User className="w-5 h-5 text-zinc-500" />
        </div>
      </div>
    </header>
  );
}
