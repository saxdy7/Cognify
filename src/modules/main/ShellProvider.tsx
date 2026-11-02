'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Small UI-only state for the app shell (overlays & panels that any page can open).
interface ShellState {
  aiOpen: boolean;
  openAi: () => void;
  closeAi: () => void;
  toggleAi: () => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  inspectorOpen: boolean;
  openInspector: () => void;
  closeInspector: () => void;
  toggleInspector: () => void;
}

const ShellContext = createContext<ShellState | null>(null);

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [aiOpen, setAiOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Lazy initializer avoids setState-in-effect
  const [inspectorOpen, setInspectorOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = localStorage.getItem('cognify:inspector-open');
      if (saved !== null) return saved === 'true';
      return window.innerWidth >= 1100;
    } catch {
      return true;
    }
  });

  const openAi = useCallback(() => setAiOpen(true), []);
  const closeAi = useCallback(() => setAiOpen(false), []);
  const toggleAi = useCallback(() => setAiOpen((o) => !o), []);

  const openInspector = useCallback(() => {
    setInspectorOpen(true);
    try { localStorage.setItem('cognify:inspector-open', 'true'); } catch {}
  }, []);

  const closeInspector = useCallback(() => {
    setInspectorOpen(false);
    try { localStorage.setItem('cognify:inspector-open', 'false'); } catch {}
  }, []);

  const toggleInspector = useCallback(() => {
    setInspectorOpen((prev) => {
      const next = !prev;
      try { localStorage.setItem('cognify:inspector-open', String(next)); } catch {}
      return next;
    });
  }, []);

  // Keyboard shortcut: Ctrl + I or Cmd + I to toggle Inspector
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        const target = e.target as HTMLElement | null;
        if (target?.closest('input, textarea, [contenteditable="true"]')) return;
        e.preventDefault();
        toggleInspector();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleInspector]);

  const value = useMemo(
    () => ({
      aiOpen,
      openAi,
      closeAi,
      toggleAi,
      commandOpen,
      setCommandOpen,
      inspectorOpen,
      openInspector,
      closeInspector,
      toggleInspector,
    }),
    [aiOpen, openAi, closeAi, toggleAi, commandOpen, inspectorOpen, openInspector, closeInspector, toggleInspector]
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('useShell must be used inside <ShellProvider>');
  return ctx;
}
