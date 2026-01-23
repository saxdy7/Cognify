'use client';

import React from 'react';
import { ExternalLink, Star, Trash2, Sparkles, Zap, Command } from 'lucide-react';
import { Bookmark } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (bookmark: Bookmark) => void;
  onToggleShortcut?: (bookmark: Bookmark) => void;
  viewMode?: 'grid' | 'list';
}

export function BookmarkCard({ bookmark, onEdit, onDelete, onToggleFavorite, onToggleShortcut, viewMode = 'grid' }: BookmarkCardProps) {
  let domain = 'unknown';
  try {
    if (bookmark.url) {
      domain = new URL(bookmark.url).hostname;
    }
  } catch (e) {
    // Fallback for invalid URLs
  }
  const isShortcut = bookmark.tags?.includes('shortcut');
  // Using a more reliable screenshot service or a placeholder if needed
  const previewUrl = bookmark.url
    ? `https://api.microlink.io/?url=${encodeURIComponent(bookmark.url)}&screenshot=true&embed=screenshot.url`
    : '';

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="group relative flex items-center gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 bg-white/5 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/10 dark:border-zinc-800/50 rounded-xl sm:rounded-[1.5rem] hover:bg-white/10 transition-all duration-300 w-full"
      >
        {/* List View Image */}
        <div className="relative w-20 h-12 sm:w-24 sm:h-16 md:w-32 md:h-20 rounded-lg sm:rounded-xl overflow-hidden shrink-0">
          <img
            src={previewUrl}
            alt={bookmark.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop`;
            }}
          />
        </div>

        {/* List View Content */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onEdit(bookmark)}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            {bookmark.logo_url && (
              <img src={bookmark.logo_url} alt="" className="w-3 h-3 sm:w-4 sm:h-4 object-contain opacity-70" />
            )}
            <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
              {bookmark.title || 'Untitled Project'}
            </h3>
          </div>
          <p className="text-[10px] sm:text-xs text-zinc-500 truncate">{domain}</p>
        </div>

        {/* List View Actions */}
        <div className="flex items-center gap-1 sm:gap-2 opacity-0 sm:group-hover:opacity-100 sm:transition-opacity px-2 sm:px-4">
          {bookmark.tags?.slice(0, 2).map(tag => (
            <span key={tag} className="hidden md:inline-block px-2 py-1 bg-white/5 rounded-full text-[10px] font-medium text-zinc-400">
              #{tag}
            </span>
          ))}
          <div className="hidden sm:block w-px h-6 sm:h-8 bg-white/10 mx-1 sm:mx-2" />
          <button
            onClick={(e) => { e.preventDefault(); onToggleShortcut?.(bookmark); }}
            className={cn("p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors", isShortcut ? "text-indigo-400" : "text-zinc-400")}
          >
            <Command className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onToggleFavorite(bookmark); }}
            className={cn("p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors", bookmark.is_favorite ? "text-amber-400" : "text-zinc-400")}
          >
            <Star className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", bookmark.is_favorite && "fill-current")} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onDelete(bookmark.id); }}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -8, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }}
      className="group relative flex flex-col bg-white/5 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/10 dark:border-zinc-800/50 rounded-[2.5rem] overflow-hidden hover:shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] transition-all duration-500 h-full"
    >
      {/* Action Buttons - Pinterest Style Overlay */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-6 md:right-6 z-20 flex gap-1.5 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 translate-y-0 sm:translate-y-2 sm:group-hover:translate-y-0">
        <button
          onClick={(e) => { e.preventDefault(); onToggleShortcut?.(bookmark); }}
          className={cn(
            "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 transition-all hover:scale-110 active:scale-95 shadow-2xl",
            isShortcut
              ? "bg-indigo-500 text-white border-indigo-400"
              : "bg-white/10 dark:bg-zinc-800/40 text-white"
          )}
        >
          <Command className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); onToggleFavorite(bookmark); }}
          className={cn(
            "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 transition-all hover:scale-110 active:scale-95 shadow-2xl",
            bookmark.is_favorite
              ? "bg-amber-500 text-white border-amber-400"
              : "bg-white/10 dark:bg-zinc-800/40 text-white"
          )}
        >
          <Star className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5", bookmark.is_favorite && "fill-current")} />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); onDelete(bookmark.id); }}
          className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center bg-white/10 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/20 text-white transition-all hover:scale-110 active:scale-95 hover:bg-red-500/80 hover:border-red-400 shadow-2xl"
        >
          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
        </button>
      </div>

      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <img
          src={previewUrl}
          alt={bookmark.title}
          className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop`;
          }}
        />

        {/* Category Badge */}
        {bookmark.category && (
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 md:bottom-6 md:left-6 z-20 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white">
            <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-400 fill-indigo-400" />
            {bookmark.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className="p-4 sm:p-5 md:p-6 lg:p-8 flex flex-col flex-1 cursor-pointer"
        onClick={() => onEdit(bookmark)}
      >
        <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl md:rounded-[1.25rem] bg-white/10 dark:bg-zinc-800/80 border border-white/10 dark:border-zinc-700/50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:border-indigo-500/50 transition-colors">
            {bookmark.logo_url ? (
              <img
                src={bookmark.logo_url}
                alt=""
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                }}
              />
            ) : (
              <Sparkles className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-indigo-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-white leading-tight mb-1 font-space-grotesk group-hover:text-indigo-300 transition-colors line-clamp-2">
              {bookmark.title || 'Untitled Project'}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-zinc-500 tracking-wide truncate">
              {domain}
            </p>
          </div>
        </div>

        <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3 mb-4 sm:mb-6 md:mb-8">
          {bookmark.description || 'Automatically extracted metadata for this resource. Organize and manage your digital assets with Cognify AI.'}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-auto">
          {bookmark.tags?.slice(0, 4).map(tag => (
            <span key={tag} className="px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 bg-white/5 border border-white/5 rounded-full text-[9px] sm:text-[10px] font-semibold text-zinc-400 group-hover:border-white/10 transition-colors">
              #{tag}
            </span>
          ))}
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl"
          >
            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
