'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search, Bookmark, FolderPlus, Settings, Share2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MicroExpanderProps {
  onAddBookmark: () => void;
  onAddContainer: () => void;
  onSearch: () => void;
  onToggleFavorites: () => void;
}

export const MicroExpander = ({ 
  onAddBookmark, 
  onAddContainer, 
  onSearch,
  onToggleFavorites
}: MicroExpanderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: <Bookmark className="w-5 h-5" />, label: "Add Link", onClick: onAddBookmark, color: "bg-blue-500" },
    { icon: <FolderPlus className="w-5 h-5" />, label: "New Container", onClick: onAddContainer, color: "bg-purple-500" },
    { icon: <Star className="w-5 h-5" />, label: "Favorites", onClick: onToggleFavorites, color: "bg-amber-500" },
    { icon: <Search className="w-5 h-5" />, label: "Search", onClick: onSearch, color: "bg-emerald-500" },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-20 right-0 flex flex-col gap-3 items-end"
          >
            {actions.map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 group"
              >
                <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-medium shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-zinc-200 dark:border-zinc-700">
                  {action.label}
                </span>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 active:scale-95",
                  action.color
                )}>
                  {action.icon}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-2xl transition-all duration-300 transform",
          isOpen ? "bg-zinc-900 dark:bg-white dark:text-zinc-900 rotate-45" : "bg-black dark:bg-white dark:text-zinc-900"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
      </motion.button>
    </div>
  );
};
