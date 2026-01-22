'use client';

import React from 'react';
import Link from 'next/link';
import { Folder, Plus, LayoutDashboard, Star, Hash, Settings, ChevronRight, Sparkles, Zap, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container } from '@/types';
import { motion } from 'framer-motion';

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
      <aside className="w-80 h-screen sticky top-0 z-40 flex flex-col bg-black border-r border-white/5 shadow-2xl">
        <div className="p-10 flex flex-col h-full">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-4 mb-14 group cursor-pointer">
            <div className="w-12 h-12 bg-orange-500 rounded-[1.25rem] flex items-center justify-center shadow-[0_10px_30px_rgba(249,115,22,0.3)] group-hover:rotate-12 transition-transform duration-500">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="block font-black text-2xl tracking-tight font-space-grotesk text-white">Cognify</span>
              <span className="block text-[10px] font-bold text-orange-500/80 uppercase tracking-[0.2em]">High-Res Hub</span>
            </div>
          </Link>

          {/* Main Nav */}
          <nav className="space-y-2 mb-14">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6 px-4">Navigation</p>
            <button
              onClick={() => onSelectContainer(null)}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group",
                selectedContainerId === null && !isFavorites
                  ? "bg-white text-black shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <LayoutDashboard className={cn("w-5 h-5", selectedContainerId === null && !isFavorites ? "text-orange-500" : "text-zinc-500")} />
              Discovery
            </button>
            <button
              onClick={() => onSelectContainer('favorites')}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group",
                selectedContainerId === 'favorites'
                  ? "bg-white text-black shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <Star className={cn("w-5 h-5", selectedContainerId === 'favorites' ? "fill-orange-500 text-orange-500" : "text-zinc-500")} />
              Curated
            </button>
            <button
              onClick={() => onSelectContainer('today')}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group",
                selectedContainerId === 'today'
                  ? "bg-white text-black shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <Zap className={cn("w-5 h-5", selectedContainerId === 'today' ? "text-orange-500" : "text-zinc-500")} />
              Captured Today
            </button>
          </nav>

          {/* Containers */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 mb-8">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Spaces</p>
              <button 
                onClick={onAddContainer}
                className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-xl hover:scale-110 active:scale-90 transition-all text-zinc-500 hover:text-orange-500 border border-white/5"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {containers.map((container) => (
                <motion.button
                  layout
                  key={container.id}
                  onClick={() => onSelectContainer(container.id)}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group relative",
                    selectedContainerId === container.id
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-all duration-500",
                    selectedContainerId === container.id ? "bg-orange-500 scale-125 shadow-[0_0_10px_rgba(249,115,22,0.5)]" : "bg-zinc-800"
                  )} />
                  <span className="flex-1 text-left truncate">{container.name}</span>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform duration-300",
                    selectedContainerId === container.id ? "rotate-90 opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                  )} />
                </motion.button>
              ))}
              
              {containers.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                  <p className="text-[10px] font-black text-zinc-600 leading-relaxed uppercase tracking-widest">No Active Spaces</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-10 border-t border-white/5 mt-auto space-y-2">
            <button 
              onClick={() => onSelectContainer('shortcuts')}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group",
                selectedContainerId === 'shortcuts' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <Command className={cn("w-5 h-5", selectedContainerId === 'shortcuts' ? "text-orange-500" : "text-zinc-500")} />
              Shortcuts
            </button>
            <button 
              onClick={() => onSelectContainer('settings')}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group",
                selectedContainerId === 'settings' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <Settings className={cn("w-5 h-5", selectedContainerId === 'settings' ? "text-orange-500" : "text-zinc-500")} />
              System Settings
            </button>
          </div>
        </div>
      </aside>
    );
}
