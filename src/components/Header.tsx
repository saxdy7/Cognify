'use client';

import React from 'react';
import { Search, Plus, Bell, User, Sparkles, Command, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  onAddBookmark: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  containerName?: string;
}

export function Header({ onAddBookmark, searchQuery, onSearchChange, containerName = 'All Bookmarks' }: HeaderProps) {
  return (
    <header className="h-32 bg-transparent sticky top-0 z-30 px-12 flex items-center justify-between">
      <div className="flex items-center gap-12 flex-1">
        {/* Breadcrumb / Title */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500 fill-emerald-500/20" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Workspace</span>
          </div>
          <h1 className="text-3xl font-black font-space-grotesk tracking-tighter text-zinc-900 dark:text-white flex items-center gap-4">
            {containerName}
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          </h1>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl group">
          <div className="relative">
            <div className="absolute inset-0 bg-zinc-900/5 dark:bg-white/5 rounded-[2rem] blur-xl group-focus-within:bg-indigo-500/10 transition-all duration-500" />
            <div className="relative flex items-center">
              <Search className="absolute left-6 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search resources, tags, or links..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-16 pr-24 py-5 bg-white/5 dark:bg-black/20 backdrop-blur-2xl border border-white/10 dark:border-zinc-800/50 focus:border-indigo-500/50 rounded-[2rem] text-sm font-bold placeholder:text-zinc-500 focus:ring-0 transition-all outline-none shadow-2xl"
              />
              <div className="absolute right-6 flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl">
                <Command className="w-3 h-3 text-zinc-400" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">K</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 ml-12">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddBookmark}
          className="hidden xl:flex items-center gap-3 px-8 py-5 bg-black dark:bg-white text-white dark:text-black rounded-[1.75rem] text-sm font-black shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] transition-all"
        >
          <Zap className="w-4 h-4 fill-current" />
          Capture Link
        </motion.button>

        <div className="flex items-center gap-2 p-1.5 bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 dark:border-zinc-800/50 rounded-[1.75rem] shadow-2xl">
          <button className="w-12 h-12 flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white transition-colors relative group">
            <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-black animate-bounce" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center overflow-hidden cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-inner">
            <User className="w-5 h-5 text-zinc-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
