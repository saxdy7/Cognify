'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

// Small UI-only state for the app shell (overlays that any page can open).
interface ShellState {
  aiOpen: boolean;
  openAi: () => void;
  closeAi: () => void;
  toggleAi: () => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
}

const ShellContext = createContext<ShellState | null>(null);

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [aiOpen, setAiOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const openAi = useCallback(() => setAiOpen(true), []);
  const closeAi = useCallback(() => setAiOpen(false), []);
  const toggleAi = useCallback(() => setAiOpen((o) => !o), []);

  const value = useMemo(() => ({ aiOpen, openAi, closeAi, toggleAi, commandOpen, setCommandOpen }), [aiOpen, openAi, closeAi, toggleAi, commandOpen]);
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('useShell must be used inside <ShellProvider>');
  return ctx;
}
