'use client';

import React from 'react';
import { Search, Plus, Bell, User, Sparkles, Command, ShieldCheck, Zap, Menu, Bookmark, Key, Layers, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onAddBookmark: () => void;
  onProfileClick: () => void;
  onNotificationsClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  containerName?: string;
  onMenuClick?: () => void;
  viewType?: 'bookmarks' | 'passwords' | 'canvas' | 'docs';
  onViewTypeChange?: (type: 'bookmarks' | 'passwords' | 'canvas' | 'docs') => void;
}

export function Header({ onAddBookmark, onProfileClick, onNotificationsClick, searchQuery, onSearchChange, containerName = 'All Bookmarks', onMenuClick, viewType = 'bookmarks', onViewTypeChange }: HeaderProps) {
  return (
    <header className="h-20 sm:h-24 md:h-28 lg:h-32 bg-transparent sticky top-0 z-30 px-4 sm:px-6 md:px-8 lg:px-12 flex items-center justify-between">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors mr-3"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex items-center gap-3 sm:gap-6 md:gap-8 lg:gap-12 flex-1 min-w-0">
        {/* View Type Toggle */}
        {onViewTypeChange && (
          <div className="hidden lg:flex items-center gap-2 p-1.5 bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 dark:border-zinc-800/50 rounded-[1.5rem] shadow-2xl">
            <button
              onClick={() => onViewTypeChange('bookmarks')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                viewType === 'bookmarks' 
                  ? "bg-orange-500 text-white shadow-lg" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden xl:inline">Bookmarks</span>
            </button>
            <button
              onClick={() => onViewTypeChange('passwords')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                viewType === 'passwords' 
                  ? "bg-indigo-500 text-white shadow-lg" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Key className="w-4 h-4" />
              <span className="hidden xl:inline">Passwords</span>
            </button>
            <button
              onClick={() => onViewTypeChange('canvas')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                viewType === 'canvas'
                  ? "bg-rose-500 text-white shadow-lg"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden xl:inline">Canvas</span>
            </button>
            <button
              onClick={() => onViewTypeChange('docs')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                viewType === 'docs'
                  ? "bg-emerald-500 text-white shadow-lg"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden xl:inline">Docs</span>
            </button>
          </div>
        )}

        {/* Breadcrumb / Title */}
        <div className="flex flex-col min-w-0">
          <div className="hidden sm:flex items-center gap-2 mb-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500 fill-emerald-500/20" />
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Workspace</span>
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black font-space-grotesk tracking-tighter text-zinc-900 dark:text-white flex items-center gap-2 lg:gap-4 truncate">
            <span className="truncate">{containerName}</span>
            <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse flex-shrink-0", "bg-orange-500")} />
          </h1>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-2xl group">
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
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 ml-2 sm:ml-4 md:ml-8 lg:ml-12">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddBookmark}
          className="hidden xl:flex items-center gap-3 px-6 lg:px-8 py-4 lg:py-5 bg-black dark:bg-white text-white dark:text-black rounded-[1.5rem] lg:rounded-[1.75rem] text-sm font-black shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] transition-all">
          {viewType === 'bookmarks' ? <Zap className="w-4 h-4 fill-current" /> : <Plus className="w-4 h-4" />}
          <span className="hidden 2xl:inline">
            {viewType === 'canvas' ? 'New Board' : viewType === 'passwords' ? 'Add Password' : viewType === 'docs' ? 'New Page' : 'Capture Link'}
          </span>
        </motion.button>

        <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 dark:border-zinc-800/50 rounded-[1.5rem] lg:rounded-[1.75rem] shadow-2xl">
          <button
            onClick={onNotificationsClick}
            className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white transition-colors relative group">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
            <span className="absolute top-2 right-2 sm:top-3 sm:right-3 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-black animate-bounce" />
          </button>
          <div
            onClick={onProfileClick}
            className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center overflow-hidden cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-inner">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
          </div>
        </div>

      </div>
    </header>
  );
}
