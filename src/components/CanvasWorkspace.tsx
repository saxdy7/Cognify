'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { CanvasBoard } from '@/types';

// Load TldrawCanvas client-side only (SSR: false)
const TldrawCanvas = dynamic(
  () => import('./TldrawCanvas').then((m) => m.TldrawCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="text-center animate-pulse">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold uppercase tracking-widest">Loading Infinite Canvas...</p>
        </div>
      </div>
    )
  }
);

interface CanvasWorkspaceProps {
  board: CanvasBoard;
  onBackToBoards: () => void;
  userId: string;
}

export function CanvasWorkspace({ board, onBackToBoards, userId }: CanvasWorkspaceProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  return (
    <div className="relative w-full h-[calc(100vh-120px)] rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl overflow-hidden bg-zinc-950">
      <TldrawCanvas
        board={board}
        onBackToBoards={onBackToBoards}
        userId={userId}
        theme={theme}
        setTheme={setTheme}
      />
    </div>
  );
}
