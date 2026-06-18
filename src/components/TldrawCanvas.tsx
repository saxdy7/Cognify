'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tldraw, createShapeId } from 'tldraw';
import 'tldraw/tldraw.css';
import { ArrowLeft, Moon, Sun, CloudLightning, Loader2, Maximize, Minimize } from 'lucide-react';
import { CanvasBoard } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface TldrawCanvasProps {
  board: CanvasBoard;
  onBackToBoards: () => void;
  userId: string;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export function TldrawCanvas({ board, onBackToBoards, userId, theme, setTheme }: TldrawCanvasProps) {
  const [editor, setEditor] = useState<any>(null);
  const [savingStatus, setSavingStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  const [loading, setLoading] = useState(true);
  const [initialSnapshot, setInitialSnapshot] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 1. Fetch initial board data from database on mount
  useEffect(() => {
    const fetchBoardSnapshot = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('canvas_boards')
          .select('tldraw_snapshot')
          .eq('id', board.id)
          .single();

        if (error) throw error;
        setInitialSnapshot(data?.tldraw_snapshot);
      } catch (err) {
        console.error('Error fetching board snapshot:', err);
        toast.error('Failed to load canvas data');
      } finally {
        setLoading(false);
      }
    };

    fetchBoardSnapshot();
  }, [board.id]);

  // Sync browser fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // 2. Setup template initialization
  const initializeTemplate = useCallback((editorInstance: any, templateId: string) => {
    editorInstance.selectAll();
    editorInstance.deleteShapes(editorInstance.getSelectedShapeIds());

    if (templateId === 'moodboard') {
      editorInstance.createShapes([
        {
          id: createShapeId('theme-note'),
          type: 'note',
          x: 100,
          y: 100,
          props: { text: "Brand Theme\nModern typography, warm pastel colors, off-white background grids, glassmorphism UI elements.", color: 'orange' }
        },
        {
          id: createShapeId('placeholder-image'),
          type: 'geo',
          x: 420,
          y: 100,
          props: {
            w: 320,
            h: 240,
            geo: 'rectangle',
            text: "Moodboard Image Inspiration\n(Drag & drop your own images here!)",
            color: 'red',
            fill: 'pattern'
          }
        },
        {
          id: createShapeId('bookmark-milanote'),
          type: 'bookmark',
          x: 100,
          y: 320,
          props: { url: 'https://milanote.com', w: 300, h: 180 }
        }
      ]);
    } else if (templateId === 'kanban') {
      const frameTodoId = createShapeId('frame-todo');
      const frameProgressId = createShapeId('frame-progress');
      const frameCompletedId = createShapeId('frame-completed');

      editorInstance.createShapes([
        {
          id: frameTodoId,
          type: 'frame',
          x: 100,
          y: 100,
          props: { w: 320, h: 500, name: 'To Do' }
        },
        {
          id: frameProgressId,
          type: 'frame',
          x: 460,
          y: 100,
          props: { w: 320, h: 500, name: 'In Progress' }
        },
        {
          id: frameCompletedId,
          type: 'frame',
          x: 820,
          y: 100,
          props: { w: 320, h: 500, name: 'Completed' }
        },
        {
          id: createShapeId('todo-item-1'),
          parentId: frameTodoId,
          type: 'note',
          x: 20,
          y: 60,
          props: { text: "Product Launch Checklist\n\n[x] Define branding schemas\n[ ] Configure Supabase SSG", color: 'orange' }
        }
      ]);
    } else if (templateId === 'retro') {
      const frameWellId = createShapeId('frame-well');
      const frameImproveId = createShapeId('frame-improve');
      const frameActionsId = createShapeId('frame-actions');

      editorInstance.createShapes([
        {
          id: frameWellId,
          type: 'frame',
          x: 100,
          y: 100,
          props: { w: 320, h: 500, name: 'What Went Well' }
        },
        {
          id: frameImproveId,
          type: 'frame',
          x: 460,
          y: 100,
          props: { w: 320, h: 500, name: 'What to Improve' }
        },
        {
          id: frameActionsId,
          type: 'frame',
          x: 820,
          y: 100,
          props: { w: 320, h: 500, name: 'Action Items' }
        },
        {
          id: createShapeId('retro-well-1'),
          parentId: frameWellId,
          type: 'note',
          x: 20,
          y: 60,
          props: { text: "Great velocity\nFeatures completed ahead of schedule", color: 'green' }
        },
        {
          id: createShapeId('retro-improve-1'),
          parentId: frameImproveId,
          type: 'note',
          x: 20,
          y: 60,
          props: { text: "Test coverage\nMissing edge case validation units", color: 'red' }
        }
      ]);
    } else if (templateId === 'brainstorm') {
      editorInstance.createShapes([
        {
          id: createShapeId('core-note'),
          type: 'note',
          x: 500,
          y: 300,
          props: { text: "Core Concept\nEvolving Cognify into a God-Level visual hub workspace.", color: 'purple' }
        },
        {
          id: createShapeId('pwd-note'),
          type: 'note',
          x: 150,
          y: 150,
          props: { text: "Feature: Passwords\nSecure credential manager encryption.", color: 'blue' }
        },
        {
          id: createShapeId('canvas-note'),
          type: 'note',
          x: 850,
          y: 150,
          props: { text: "Feature: Canvas\nVisual creative boards with connection lines.", color: 'yellow' }
        },
        {
          type: 'arrow',
          x: 500,
          y: 300,
          props: {
            start: { x: 0, y: 0 },
            end: { x: -250, y: -50 },
            color: 'blue',
            label: 'Security'
          }
        },
        {
          type: 'arrow',
          x: 600,
          y: 300,
          props: {
            start: { x: 0, y: 0 },
            end: { x: 250, y: -50 },
            color: 'orange',
            label: 'Visuals'
          }
        }
      ]);
    }
    
    // Zoom to fit elements after rendering template
    editorInstance.zoomToFit();
  }, []);

  // 3. Mount Handler
  const handleMount = useCallback((editorInstance: any) => {
    setEditor(editorInstance);

    // Sync theme
    editorInstance.user.updateUserPreferences({
      colorScheme: theme
    });

    if (initialSnapshot) {
      if (initialSnapshot.isNewTemplate) {
        initializeTemplate(editorInstance, initialSnapshot.templateId);
      } else {
        try {
          editorInstance.store.loadSnapshot(initialSnapshot);
        } catch (e) {
          console.warn("Could not load full snapshot, falling back to schema defaults.", e);
        }
      }
    }
  }, [initialSnapshot, theme, initializeTemplate]);

  // 4. Update user preference theme when state changes
  useEffect(() => {
    if (editor) {
      editor.user.updateUserPreferences({
        colorScheme: theme
      });
    }
  }, [editor, theme]);

  // 5. Debounced Auto-saving
  useEffect(() => {
    if (!editor) return;

    let timeoutId: any;
    
    const saveStore = async () => {
      setSavingStatus('saving');
      try {
        const snapshot = editor.store.getSnapshot();
        const { error } = await supabase
          .from('canvas_boards')
          .update({ 
            tldraw_snapshot: snapshot,
            updated_at: new Date().toISOString()
          })
          .eq('id', board.id);

        if (error) throw error;
        setSavingStatus('synced');
      } catch (err) {
        console.error('Error auto-saving tldraw snapshot:', err);
        setSavingStatus('error');
      }
    };

    const handleStoreChange = (event: any) => {
      // Only trigger save on user actions to prevent infinite loop or saving on programmatic bootstrap
      if (event.source === 'user') {
        setSavingStatus('saving');
        clearTimeout(timeoutId);
        timeoutId = setTimeout(saveStore, 1500); // 1.5 seconds debounce
      }
    };

    const unsubscribe = editor.store.listen(handleStoreChange, {
      source: 'user',
      scope: 'document'
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [editor, board.id]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-rose-500" />
        <p className="text-xs font-bold uppercase tracking-widest">Calibrating Whiteboard...</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full relative overflow-hidden flex flex-col transition-all duration-300 ${
        theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900'
      }`}
    >
      {/* Sub-Header Bar (replaces the absolute overlay to prevent clashing with Tldraw UI) */}
      <div 
        className={`w-full h-14 px-4 flex items-center justify-between border-b shrink-0 select-none z-[100] transition-colors duration-200 ${
          theme === 'dark' 
            ? 'bg-zinc-950/90 border-zinc-800/80 text-zinc-100' 
            : 'bg-zinc-50/90 border-zinc-200/80 text-zinc-900'
        } backdrop-blur-md`}
      >
        {/* Left: Back to catalog + Board Title + Sync Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToBoards}
            className={`flex items-center gap-2 px-3.5 py-1.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
              theme === 'dark'
                ? 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-white shadow-lg'
                : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-800 shadow-sm'
            }`}
            title="Back to boards catalog"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-rose-500" />
            <span>Catalog</span>
          </button>

          <div className="h-4 w-px bg-zinc-800/50 dark:bg-zinc-200/20" />

          {/* Board Title */}
          <span className="text-xs font-black uppercase tracking-wider font-space-grotesk truncate max-w-[150px] sm:max-w-[250px]">
            {board.name}
          </span>

          <div className="h-4 w-px bg-zinc-800/50 dark:bg-zinc-200/20" />

          {/* Sync Status Badge */}
          <div 
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-[10px] font-black uppercase tracking-wider ${
              theme === 'dark'
                ? 'bg-zinc-900/40 border-white/10 text-zinc-400'
                : 'bg-zinc-100/50 border-zinc-200/85 text-zinc-500'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${
              savingStatus === 'synced' ? 'bg-emerald-500 animate-pulse' :
              savingStatus === 'saving' ? 'bg-amber-500 animate-spin' : 'bg-red-500'
            }`} />
            <span>
              {savingStatus === 'synced' && 'Vault Synced'}
              {savingStatus === 'saving' && 'Syncing...'}
              {savingStatus === 'error' && 'Sync Error'}
            </span>
          </div>
        </div>

        {/* Right: Fullscreen + Theme Toggles */}
        <div className="flex items-center gap-2">
          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`w-9 h-9 flex items-center justify-center border rounded-xl transition-all active:scale-95 cursor-pointer ${
              theme === 'dark'
                ? 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-white shadow-lg'
                : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-800 shadow-sm'
            }`}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={`w-9 h-9 flex items-center justify-center border rounded-xl transition-all active:scale-95 cursor-pointer ${
              theme === 'dark'
                ? 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-white shadow-lg'
                : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-800 shadow-sm'
            }`}
            title="Toggle Canvas Theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
          </button>
        </div>
      </div>

      {/* Tldraw infinite canvas mount */}
      <div className="flex-1 w-full h-full relative">
        <Tldraw
          onMount={handleMount}
          autoFocus={true}
        />
      </div>
    </div>
  );
}
