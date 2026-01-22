'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search, Bookmark, FolderPlus, Star, LayoutGrid, Zap } from 'lucide-react';
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
    { icon: <Bookmark className="w-5 h-5" />, label: "Quick Save", onClick: onAddBookmark, color: "bg-indigo-500 shadow-indigo-500/40" },
    { icon: <FolderPlus className="w-5 h-5" />, label: "New Space", onClick: onAddContainer, color: "bg-fuchsia-500 shadow-fuchsia-500/40" },
    { icon: <Star className="w-5 h-5" />, label: "Curated", onClick: onToggleFavorites, color: "bg-amber-500 shadow-amber-500/40" },
    { icon: <Search className="w-5 h-5" />, label: "Find Anything", onClick: onSearch, color: "bg-emerald-500 shadow-emerald-500/40" },
  ];

  return (
    <div className="fixed bottom-12 right-12 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute bottom-24 right-0 flex flex-col gap-4 items-end"
          >
            {actions.map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, type: "spring", damping: 15 }}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className="flex items-center gap-4 group"
              >
                <div className="px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 text-white text-xs font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 shadow-2xl">
                  {action.label}
                </div>
                <div className={cn(
                  "w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl transition-all duration-300 group-hover:scale-110 active:scale-90 group-hover:rotate-6",
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
          "w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] relative overflow-hidden group",
          isOpen ? "bg-zinc-900 rotate-[135deg]" : "bg-white text-black"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-transparent to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        {isOpen ? <X className="w-10 h-10" /> : <Plus className="w-10 h-10" />}
      </motion.button>
      
      {/* Decorative Glow */}
      <div className="absolute inset-0 -z-10 bg-indigo-500/20 blur-[100px] rounded-full opacity-50 pointer-events-none" />
    </div>
  );
};
