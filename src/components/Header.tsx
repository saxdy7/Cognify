'use client';

import React from 'react';
import { Search, Plus, Bell, User, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  onAddBookmark: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  containerName?: string;
}

export function Header({ onAddBookmark, searchQuery, onSearchChange, containerName = 'All Bookmarks' }: HeaderProps) {
  return (
    <header className="h-20 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-black/50 backdrop-blur-xl sticky top-0 z-30 px-8 flex items-center justify-between">
      <div className="flex items-center gap-8 flex-1">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white dark:text-black" />
          </div>
          <span className="text-xl font-bold font-space-grotesk tracking-tight hidden sm:block">
            Cognify
          </span>
        </div>

        <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden md:block" />

        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <h1 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hidden lg:block min-w-[120px]">
            {containerName}
          </h1>
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-zinc-100/50 dark:bg-zinc-900/50 border border-transparent focus:border-zinc-200 dark:focus:border-zinc-700 rounded-2xl text-sm focus:ring-0 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddBookmark}
          className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl text-sm font-bold shadow-lg shadow-black/5 dark:shadow-white/5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add New
        </motion.button>
        <button className="p-2.5 text-zinc-500 hover:text-black dark:hover:text-white transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white dark:border-black" />
        </button>
        <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
          <User className="w-5 h-5 text-zinc-500" />
        </div>
      </div>
    </header>
  );
}
