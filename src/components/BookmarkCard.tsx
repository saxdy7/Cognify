'use client';

import React from 'react';
import { ExternalLink, MoreHorizontal, Star, Trash2, Edit2, Share2, Sparkles } from 'lucide-react';
import { Bookmark } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (bookmark: Bookmark) => void;
}

export function BookmarkCard({ bookmark, onEdit, onDelete, onToggleFavorite }: BookmarkCardProps) {
  const domain = new URL(bookmark.url).hostname;
  const previewUrl = `https://api.microlink.io/?url=${encodeURIComponent(bookmark.url)}&screenshot=true&embed=screenshot.url`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all"
    >
      {/* Action Overlay */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
        <button 
          onClick={() => onToggleFavorite(bookmark)}
          className={cn(
            "p-2.5 rounded-2xl backdrop-blur-md shadow-lg transition-all hover:scale-110",
            bookmark.is_favorite 
              ? "bg-amber-500 text-white" 
              : "bg-white/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400"
          )}
        >
          <Star className={cn("w-4 h-4", bookmark.is_favorite && "fill-current")} />
        </button>
        <button 
          onClick={() => onDelete(bookmark.id)}
          className="p-2.5 rounded-2xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md text-zinc-600 dark:text-zinc-400 shadow-lg transition-all hover:scale-110 hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Image Preview */}
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <img 
          src={previewUrl} 
          alt={bookmark.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
            {bookmark.logo_url ? (
              <img 
                src={bookmark.logo_url} 
                alt="" 
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                }}
              />
            ) : (
              <Sparkles className="w-5 h-5 text-indigo-500" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate font-space-grotesk">
              {bookmark.title || 'Untitled Project'}
            </h3>
            <p className="text-xs font-medium text-zinc-500 truncate mt-0.5">
              {domain}
            </p>
          </div>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-6 leading-relaxed">
          {bookmark.description || 'Explore this curated resource in your Cognify hub.'}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {bookmark.category && (
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
              {bookmark.category}
            </span>
          )}
          {bookmark.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-medium rounded-lg">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
            <span className="text-[10px] font-medium text-zinc-400">Cognify AI</span>
          </div>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white hover:opacity-70 transition-opacity"
          >
            Open <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
