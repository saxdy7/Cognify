'use client';

import React from 'react';
import { ExternalLink, MoreVertical, Star, Trash2, Edit2, Move } from 'lucide-react';
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
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-none transition-all duration-300"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
              {bookmark.logo_url ? (
                <img src={bookmark.logo_url} alt={bookmark.title} className="w-6 h-6 object-contain" onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=64`;
                }} />
              ) : (
                <ExternalLink className="w-5 h-5 text-zinc-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight line-clamp-1 group-hover:text-black dark:group-hover:text-white transition-colors">
                {bookmark.title || 'Untitled'}
              </h3>
              <p className="text-xs text-zinc-500 truncate mt-0.5">
                {new URL(bookmark.url).hostname}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => onToggleFavorite(bookmark)}
              className={cn(
                "p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
                bookmark.is_favorite ? "text-yellow-500" : "text-zinc-400"
              )}
            >
              <Star className={cn("w-4 h-4", bookmark.is_favorite && "fill-current")} />
            </button>
            <div className="relative group/menu">
                <button className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:pointer-events-auto transition-all z-10 py-1">
                    <button onClick={() => onEdit(bookmark)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white transition-colors">
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => onDelete(bookmark.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 min-h-[40px] mb-4">
          {bookmark.description || 'No description available.'}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {bookmark.category && (
            <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 rounded-full">
              {bookmark.category}
            </span>
          )}
          {bookmark.tags?.slice(0, 2).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-500 rounded-full">
              #{tag}
            </span>
          ))}
          {bookmark.tags && bookmark.tags.length > 2 && (
            <span className="text-[10px] text-zinc-400 self-center">+{bookmark.tags.length - 2}</span>
          )}
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
          <span className="text-[10px] text-zinc-400">
            Added {new Date(bookmark.created_at).toLocaleDateString()}
          </span>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-black dark:text-white hover:underline"
          >
            Visit <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
