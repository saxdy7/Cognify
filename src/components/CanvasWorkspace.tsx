'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ZoomIn, ZoomOut, Maximize, Minimize, Undo, Redo, Grid, Presentation, 
  Share2, Download, StickyNote, Image as ImageIcon, Link as LinkIcon, 
  FileText, CheckSquare, Columns, FolderOpen, ArrowRight, Type, 
  X, Plus, Trash2, Settings2, Play, Users, Eye, HelpCircle, Check, ArrowLeft,
  Sun, Moon
} from 'lucide-react';
import { CanvasBoard, CanvasElement, CanvasConnector } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { CanvasCard } from './CanvasCards';
import { ConnectorLine } from './ConnectorLine';

interface CanvasWorkspaceProps {
  board: CanvasBoard;
  onBackToBoards: () => void;
  userId: string;
}

export function CanvasWorkspace({ board, onBackToBoards, userId }: CanvasWorkspaceProps) {
  // Canvas State
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [connectors, setConnectors] = useState<CanvasConnector[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [activeTool, setActiveTool] = useState<'select' | 'connect' | 'delete'>('select');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Connection state
  const [connectSource, setConnectSource] = useState<string | null>(null);

  // Undo / Redo Stacks
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Dragging states
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  
  // Mouse tracking for pasting image at cursor
  const mouseCoordsRef = useRef({ x: 0, y: 0 });
  const isMouseOverCanvasRef = useRef(false);

  // Presence simulation
  const [presenceCursors, setPresenceCursors] = useState<{ id: string; name: string; color: string; x: number; y: number }[]>([]);

  // Open Template Gallery Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Load Elements & Connectors
  useEffect(() => {
    fetchBoardData();
  }, [board.id]);

  // Sync state with browser-level fullscreen changes
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
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Global paste handler to detect copy-pasted images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Don't intercept paste if focused on an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            
            const reader = new FileReader();
            reader.onload = async (event) => {
              const base64Url = event.target?.result as string;
              if (base64Url) {
                const defaultWidth = 320;
                const defaultHeight = 240;
                
                let targetX, targetY;
                if (isMouseOverCanvasRef.current) {
                  // Center under mouse cursor
                  targetX = mouseCoordsRef.current.x - defaultWidth / 2;
                  targetY = mouseCoordsRef.current.y - defaultHeight / 2;
                } else {
                  // Center in the middle of active viewport
                  const viewportCenterX = (window.innerWidth / 2 - pan.x) / zoom;
                  const viewportCenterY = (window.innerHeight / 2 - pan.y) / zoom;
                  targetX = viewportCenterX - defaultWidth / 2;
                  targetY = viewportCenterY - defaultHeight / 2;
                }

                await handleAddElement(
                  'image',
                  { x: snapValue(targetX), y: snapValue(targetY) },
                  base64Url
                );
              }
            };
            reader.readAsDataURL(file);
            break; // Handle single image paste
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [pan, zoom, elements, board.id, snapToGrid]);

  const fetchBoardData = async () => {
    try {
      const { data: elementsData, error: elementsError } = await supabase
        .from('canvas_elements')
        .select('*')
        .eq('board_id', board.id);

      if (elementsError) throw elementsError;

      const { data: connectorsData, error: connectorsError } = await supabase
        .from('canvas_connectors')
        .select('*')
        .eq('board_id', board.id);

      if (connectorsError) throw connectorsError;

      const loadedElements = elementsData || [];
      setElements(loadedElements);
      setConnectors(connectorsData || []);

      // Initialize history
      setHistory([loadedElements]);
      setHistoryIndex(0);
    } catch (error) {
      console.error('Error fetching canvas data:', error);
      toast.error('Failed to load board components');
    }
  };

  // Push state to Undo History
  const pushToHistory = (newElements: CanvasElement[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    setHistory([...updatedHistory, newElements]);
    setHistoryIndex(updatedHistory.length);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const targetState = history[newIndex];
      setHistoryIndex(newIndex);
      setElements(targetState);
      // Persist undo sync
      syncElementsState(targetState);
      toast.success('Action undone');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const targetState = history[newIndex];
      setHistoryIndex(newIndex);
      setElements(targetState);
      // Persist redo sync
      syncElementsState(targetState);
      toast.success('Action redone');
    }
  };

  const syncElementsState = async (state: CanvasElement[]) => {
    // Sync all positions to Database
    for (const el of state) {
      await supabase
        .from('canvas_elements')
        .update({ x: el.x, y: el.y, width: el.width, height: el.height, content: el.content, color: el.color })
        .eq('id', el.id);
    }
  };

  // Mouse Handlers for infinite canvas panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'select') return;
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-grid')) {
      setIsPanning(true);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mouseCoordsRef.current = {
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom
      };
    }

    if (isPanning) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Zooming Logic
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scale = e.deltaY < 0 ? 1.05 : 0.95;
    const nextZoom = Math.min(Math.max(zoom * scale, 0.25), 2.05);
    setZoom(parseFloat(nextZoom.toFixed(2)));
  };

  // Grid Snapping
  const snapValue = (val: number) => {
    if (!snapToGrid) return val;
    return Math.round(val / 20) * 20;
  };

  // Element Actions
  const handleAddElement = async (type: CanvasElement['type'], customPosition?: { x: number; y: number }, customSrc?: string) => {
    const defaultWidth = type === 'column' ? 320 : type === 'image' ? 320 : type === 'text' ? 240 : 280;
    const defaultHeight = type === 'column' ? 500 : type === 'image' ? 240 : type === 'text' ? 60 : 180;
    
    // Spawn in the center of current viewport view, taking zoom into account
    const viewportCenterX = (window.innerWidth / 2 - pan.x) / zoom;
    const viewportCenterY = (window.innerHeight / 2 - pan.y) / zoom;
    
    const posX = customPosition ? customPosition.x : snapValue(viewportCenterX - defaultWidth / 2);
    const posY = customPosition ? customPosition.y : snapValue(viewportCenterY - defaultHeight / 2);

    let defaultContent: Record<string, unknown> = {};
    if (type === 'note') {
      defaultContent = { title: 'Untitled Note', body: 'Start typing here...' };
    } else if (type === 'text') {
      defaultContent = { text: 'Double click to edit label' };
    } else if (type === 'todo') {
      defaultContent = { title: 'To-do List', tasks: [{ id: '1', text: 'First task', completed: false }] };
    } else if (type === 'link') {
      defaultContent = { url: '', title: 'Web Link preview', description: 'Enter link to load preview metadata.' };
    } else if (type === 'image') {
      defaultContent = { src: customSrc || '', caption: customSrc ? 'Pasted image' : 'Caption descriptive text' };
    } else if (type === 'column') {
      defaultContent = { title: 'New Lane', childIds: [] };
    } else if (type === 'board_link') {
      defaultContent = { title: 'Nested Workspace Sub-board', boardId: null };
    }

    const newElementPayload = {
      board_id: board.id,
      type,
      x: posX,
      y: posY,
      width: defaultWidth,
      height: defaultHeight,
      color: type === 'note' ? '#FEF9C3' : '#FFFFFF', // Yellow pastel default note
      content: defaultContent
    };

    try {
      const { data, error } = await supabase
        .from('canvas_elements')
        .insert([newElementPayload])
        .select();

      if (error) throw error;
      if (data) {
        const updated = [...elements, data[0]];
        setElements(updated);
        pushToHistory(updated);
        toast.success(customSrc ? 'Image pasted successfully' : `${type.toUpperCase()} Card dropped`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not create element');
    }
  };

  const handleUpdateElement = async (id: string, updates: Partial<CanvasElement>) => {
    const updated = elements.map(el => el.id === id ? { ...el, ...updates } : el);
    setElements(updated);

    try {
      await supabase
        .from('canvas_elements')
        .update({
          x: updates.x !== undefined ? updates.x : undefined,
          y: updates.y !== undefined ? updates.y : undefined,
          width: updates.width !== undefined ? updates.width : undefined,
          height: updates.height !== undefined ? updates.height : undefined,
          color: updates.color !== undefined ? updates.color : undefined,
          content: updates.content !== undefined ? updates.content : undefined
        })
        .eq('id', id);
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleDragElement = (id: string, newX: number, newY: number) => {
    // Snap to grid option
    const finalX = snapValue(newX);
    const finalY = snapValue(newY);

    setElements(prev => prev.map(el => el.id === id ? { ...el, x: finalX, y: finalY } : el));
  };

  const handleDragElementEnd = async (id: string, newX: number, newY: number) => {
    const finalX = snapValue(newX);
    const finalY = snapValue(newY);

    const updated = elements.map(el => el.id === id ? { ...el, x: finalX, y: finalY } : el);
    setElements(updated);
    pushToHistory(updated);

    try {
      await supabase
        .from('canvas_elements')
        .update({ x: finalX, y: finalY })
        .eq('id', id);
    } catch (err) {
      console.error('Drag update persistence failed:', err);
    }
  };

  const handleResizeElement = async (id: string, width: number, height: number) => {
    const updated = elements.map(el => el.id === id ? { ...el, width, height } : el);
    setElements(updated);
    pushToHistory(updated);

    try {
      await supabase
        .from('canvas_elements')
        .update({ width, height })
        .eq('id', id);
    } catch (err) {
      console.error('Resize failed:', err);
    }
  };

  const handleDeleteElement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('canvas_elements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      const updated = elements.filter(el => el.id !== id);
      setElements(updated);
      setConnectors(prev => prev.filter(c => c.source_element_id !== id && c.target_element_id !== id));
      pushToHistory(updated);
      toast.success('Element deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete element');
    }
  };

  // Connector Actions
  const handleElementClick = async (id: string) => {
    if (activeTool === 'connect') {
      if (!connectSource) {
        setConnectSource(id);
        toast.info('Select the destination card');
      } else {
        if (connectSource === id) {
          setConnectSource(null);
          toast.warning('Connection cancelled');
          return;
        }

        // Create connection
        const newConnectorPayload = {
          board_id: board.id,
          source_element_id: connectSource,
          target_element_id: id,
          color: '#5B6CF9',
          style: 'straight' as const
        };

        try {
          const { data, error } = await supabase
            .from('canvas_connectors')
            .insert([newConnectorPayload])
            .select();

          if (error) throw error;
          if (data) {
            setConnectors([...connectors, data[0]]);
            toast.success('Cards connected successfully');
          }
        } catch (err) {
          console.error(err);
          toast.error('Failed to create connector link');
        } finally {
          setConnectSource(null);
          setActiveTool('select');
        }
      }
    } else if (activeTool === 'delete') {
      handleDeleteElement(id);
    }
  };

  // Export board as mockup
  const handleExport = (format: 'png' | 'pdf') => {
    toast.info(`Preparing ${format.toUpperCase()} export...`);
    setTimeout(() => {
      toast.success(`Export successful! Mockup ${board.name}.${format} ready for download.`);
      setShowExportModal(false);
    }, 1500);
  };

  return (
    <div className={`overflow-hidden transition-colors duration-300 ${
      isFullscreen 
        ? 'fixed inset-0 z-50 w-screen h-screen bg-[#F4F4F0] dark:bg-[#1A1A1A]' 
        : 'relative w-full h-[calc(100vh-120px)] rounded-[2.5rem] border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner'
    } ${
      theme === 'dark' ? 'bg-[#1A1A1A] text-white' : 'bg-[#F4F4F0] text-zinc-900'
    }`}>
      {/* 2D Canvas Viewport */}
      <div 
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onMouseEnter={() => { isMouseOverCanvasRef.current = true; }}
        onMouseLeave={() => { isMouseOverCanvasRef.current = false; }}
        className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden"
        style={{
          backgroundImage: theme === 'dark'
            ? 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)'
            : 'radial-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      >
        {/* Dynamic Zoomed and Panned Container */}
        <div
          className="absolute origin-top-left pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: '4000px',
            height: '4000px'
          }}
        >
          {/* Connector Arrows SVG Layer */}
          <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
            {connectors.map(c => {
              const source = elements.find(el => el.id === c.source_element_id);
              const target = elements.find(el => el.id === c.target_element_id);
              if (!source || !target) return null;
              return (
                <ConnectorLine
                  key={c.id}
                  connector={c}
                  source={source}
                  target={target}
                  onDelete={async () => {
                    try {
                      await supabase.from('canvas_connectors').delete().eq('id', c.id);
                      setConnectors(prev => prev.filter(conn => conn.id !== c.id));
                      toast.success('Connector removed');
                    } catch (err) {
                      toast.error('Failed to remove connector');
                    }
                  }}
                />
              );
            })}
          </svg>

          {/* Cards Layer */}
          <div className="absolute inset-0 pointer-events-auto">
            {elements.map(el => (
              <CanvasCard
                key={el.id}
                element={el}
                theme={theme}
                onDrag={handleDragElement}
                onDragEnd={handleDragElementEnd}
                onResize={handleResizeElement}
                onUpdate={handleUpdateElement}
                onDelete={handleDeleteElement}
                onClick={handleElementClick}
                isConnectingSource={connectSource === el.id}
                activeTool={activeTool}
              />
            ))}

            {/* Collaborative Real-time Cursors */}
            {presenceCursors.map(cursor => (
              <div
                key={cursor.id}
                className="absolute pointer-events-none transition-all duration-300 flex items-center gap-2"
                style={{ left: cursor.x, top: cursor.y }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5.65376 12.3963L16.2753 2.18322C17.0733 1.41595 18.3615 1.99617 18.3377 3.09939L18.1098 13.6826C18.0898 14.6148 17.0768 15.1764 16.299 14.6622L11.5976 11.5541L7.75508 15.3966C7.03901 16.1127 5.82025 15.5228 5.92723 14.5126L6.23078 11.646C6.2625 11.3465 6.06209 11.0664 5.76012 10.9634L2.88371 9.98238C1.86877 9.63623 1.95679 8.16335 3.01168 7.94639L10.3703 6.43265C10.7483 6.35489 11.0261 6.05927 11.0772 5.67496L11.5721 1.94423C11.6983 0.992688 12.9818 0.741093 13.4566 1.57469L19.4674 12.126C19.986 13.0363 19.3496 14.1812 18.3079 14.2057L5.75376 14.502L5.65376 12.3963Z" fill={cursor.color} />
                </svg>
                <div 
                  className="px-2 py-1 rounded-md text-[10px] font-black text-white whitespace-nowrap shadow-md"
                  style={{ backgroundColor: cursor.color }}
                >
                  {cursor.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Canvas Action Bar (Bottom-Left) */}
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-1.5 p-1.5 bg-white/70 dark:bg-zinc-900/70 border border-white/20 dark:border-zinc-800/80 backdrop-blur-2xl rounded-2xl shadow-xl">
        <button
          onClick={() => setZoom(prev => Math.max(0.25, parseFloat((prev - 0.1).toFixed(2))))}
          className="p-3 text-zinc-500 hover:text-rose-500 hover:bg-white/10 dark:hover:bg-zinc-800 rounded-xl transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="px-3 text-xs font-black text-zinc-600 dark:text-zinc-400 select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(prev => Math.min(2.0, parseFloat((prev + 0.1).toFixed(2))))}
          className="p-3 text-zinc-500 hover:text-rose-500 hover:bg-white/10 dark:hover:bg-zinc-800 rounded-xl transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }}
          className="p-3 text-zinc-500 hover:text-rose-500 hover:bg-white/10 dark:hover:bg-zinc-800 rounded-xl transition-all"
          title="Fit Board Content"
        >
          <Maximize className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-800 mx-1" />
        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`p-3 rounded-xl transition-all ${
            snapToGrid 
              ? 'text-rose-500 bg-rose-500/10' 
              : 'text-zinc-500 hover:text-rose-500 hover:bg-white/10 dark:hover:bg-zinc-800'
          }`}
          title="Toggle Grid Snapping"
        >
          <Grid className="w-5 h-5" />
        </button>
        <button
          onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
          className="p-3 text-zinc-500 hover:text-rose-500 hover:bg-white/10 dark:hover:bg-zinc-800 rounded-xl transition-all"
          title="Toggle Canvas Theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-zinc-500" />}
        </button>
      </div>

      {/* Floating Canvas History Bar (Top-Right) */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <div className="flex items-center gap-1.5 p-1.5 bg-white/70 dark:bg-zinc-900/70 border border-white/20 dark:border-zinc-800/80 backdrop-blur-2xl rounded-2xl shadow-xl">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-3 text-zinc-500 hover:text-rose-500 hover:bg-white/10 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:text-zinc-500 rounded-xl transition-all"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-3 text-zinc-500 hover:text-rose-500 hover:bg-white/10 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:text-zinc-500 rounded-xl transition-all"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 bg-white/70 dark:bg-zinc-900/70 border border-white/20 dark:border-zinc-800/80 backdrop-blur-2xl rounded-2xl shadow-xl">
          <button
            onClick={() => setShowShareModal(true)}
            className="p-3 text-zinc-500 hover:text-rose-500 hover:bg-white/10 dark:hover:bg-zinc-800 rounded-xl transition-all"
            title="Share Board"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="p-3 text-zinc-500 hover:text-rose-500 hover:bg-white/10 dark:hover:bg-zinc-800 rounded-xl transition-all"
            title="Export Layout"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-3 text-zinc-500 hover:text-rose-500 hover:bg-white/10 dark:hover:bg-zinc-800 rounded-xl transition-all"
            title={isFullscreen ? "Minimize Canvas" : "Fullscreen Canvas"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
          <button
            onClick={onBackToBoards}
            className="p-3 text-zinc-500 hover:text-rose-500 hover:bg-white/10 dark:hover:bg-zinc-800 rounded-xl transition-all"
            title="All Boards"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Milanote-Style Anchored Left Sidebar */}
      <div className="absolute top-0 bottom-0 left-0 w-20 z-20 flex flex-col justify-between py-4 bg-white dark:bg-[#1E1E1E] border-r border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
        
        {/* Top Section: Back Button and Main Tools */}
        <div className="flex flex-col items-center w-full gap-2">
          {/* Back to boards arrow */}
          <button
            onClick={onBackToBoards}
            className="w-12 h-12 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all mb-2"
            title="Back to All Boards"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-px bg-zinc-200 dark:bg-zinc-800 mb-2" />

          {/* Tools List */}
          <div className="flex flex-col items-center w-full gap-1 px-1">
            {/* Note Tool */}
            <button
              onClick={() => handleAddElement('note')}
              className="w-16 py-2 flex flex-col items-center gap-1 text-zinc-500 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
              title="Add Note Card"
            >
              <StickyNote className="w-5 h-5 text-yellow-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Note</span>
            </button>

            {/* Link Tool */}
            <button
              onClick={() => handleAddElement('link')}
              className="w-16 py-2 flex flex-col items-center gap-1 text-zinc-500 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
              title="Embed Web Link"
            >
              <LinkIcon className="w-5 h-5 text-indigo-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Link</span>
            </button>

            {/* To-Do Checklist */}
            <button
              onClick={() => handleAddElement('todo')}
              className="w-16 py-2 flex flex-col items-center gap-1 text-zinc-500 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
              title="Drop Checklist"
            >
              <CheckSquare className="w-5 h-5 text-amber-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">To-Do</span>
            </button>

            {/* Line / Connection Tool */}
            <button
              onClick={() => {
                setActiveTool(activeTool === 'connect' ? 'select' : 'connect');
                setConnectSource(null);
              }}
              className={`w-16 py-2 flex flex-col items-center gap-1 rounded-xl transition-all ${
                activeTool === 'connect'
                  ? 'bg-indigo-500/15 text-indigo-500 ring-2 ring-indigo-500/30'
                  : 'text-zinc-500 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="Draw Connection Arrow"
            >
              <ArrowRight className="w-5 h-5 text-indigo-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Line</span>
            </button>

            {/* Board Link (Nested sub-board) */}
            <button
              onClick={() => handleAddElement('board_link')}
              className="w-16 py-2 flex flex-col items-center gap-1 text-zinc-500 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
              title="Create Sub-Board"
            >
              <FolderOpen className="w-5 h-5 text-teal-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Board</span>
            </button>

            {/* Kanban Column */}
            <button
              onClick={() => handleAddElement('column')}
              className="w-16 py-2 flex flex-col items-center gap-1 text-zinc-500 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
              title="Add Column Container"
            >
              <Columns className="w-5 h-5 text-purple-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Column</span>
            </button>

            {/* Text Label */}
            <button
              onClick={() => handleAddElement('text')}
              className="w-16 py-2 flex flex-col items-center gap-1 text-zinc-500 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
              title="Add Text Label"
            >
              <Type className="w-5 h-5 text-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Text</span>
            </button>

            {/* Image Insertion */}
            <button
              onClick={() => handleAddElement('image')}
              className="w-16 py-2 flex flex-col items-center gap-1 text-zinc-500 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
              title="Insert Image Card"
            >
              <ImageIcon className="w-5 h-5 text-emerald-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Image</span>
            </button>
          </div>
        </div>

        {/* Bottom Section: Trash / Erase */}
        <div className="flex flex-col items-center w-full px-1">
          <button
            onClick={() => setActiveTool(activeTool === 'delete' ? 'select' : 'delete')}
            className={`w-16 py-2.5 flex flex-col items-center gap-1 rounded-xl transition-all ${
              activeTool === 'delete'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-zinc-400 hover:text-red-500 hover:bg-red-500/10'
            }`}
            title="Trash / Deletion Tool"
          >
            <Trash2 className="w-5 h-5" />
            <span className={`text-[9px] font-black uppercase tracking-widest ${activeTool === 'delete' ? 'text-white' : 'text-zinc-400'}`}>Trash</span>
          </button>
        </div>
      </div>

      {/* Floating Canvas Minimap (Bottom-Right) */}
      <div className="absolute bottom-6 right-6 z-20 p-2 bg-white/70 dark:bg-zinc-900/70 border border-white/20 dark:border-zinc-800/80 backdrop-blur-2xl rounded-2xl shadow-xl w-40 h-32 flex flex-col justify-between">
        <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Board Minimap</span>
        <div className="relative flex-1 bg-zinc-200/50 dark:bg-black/40 border border-white/5 rounded-lg overflow-hidden flex items-center justify-center">
          {/* Mock elements dots */}
          <div className="absolute w-2 h-2 bg-rose-500 rounded-full" style={{ left: '30%', top: '40%' }} />
          <div className="absolute w-2.5 h-1.5 bg-yellow-500 rounded" style={{ left: '55%', top: '30%' }} />
          <div className="absolute w-2 h-2 bg-indigo-500 rounded-full" style={{ left: '70%', top: '65%' }} />
          {/* Active viewport box */}
          <div 
            className="absolute border border-rose-500 bg-rose-500/10 rounded" 
            style={{ 
              left: `${Math.max(10, Math.min(80, 40 - pan.x/100))}%`, 
              top: `${Math.max(10, Math.min(80, 40 - pan.y/100))}%`,
              width: `${Math.max(20, 50 / zoom)}px`,
              height: `${Math.max(15, 40 / zoom)}px`
            }} 
          />
        </div>
      </div>

      {/* Export layout modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold font-space-grotesk text-zinc-900 dark:text-white">Export board</h3>
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="p-2 text-zinc-500 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-zinc-500 text-sm mb-6 font-medium">Download a complete high-res snapshot of your workspace layout to share with teammates.</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleExport('png')}
                  className="py-4 bg-rose-500 hover:bg-rose-600 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-md"
                >
                  Download PNG
                </button>
                <button 
                  onClick={() => handleExport('pdf')}
                  className="py-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all"
                >
                  Download PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share / Invite modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold font-space-grotesk text-zinc-900 dark:text-white">Invite collaborators</h3>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="p-2 text-zinc-500 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Collaborator Email</label>
                  <div className="flex gap-2 mt-2">
                    <input 
                      type="email" 
                      placeholder="teammate@example.com" 
                      className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800/50 border border-transparent dark:border-zinc-700 rounded-xl outline-none text-sm"
                    />
                    <button 
                      onClick={() => { toast.success('Invite sent successfully!'); setShowShareModal(false); }}
                      className="px-6 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-xl transition-all"
                    >
                      Invite
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Shareable Board Link</label>
                  <div className="flex gap-2 mt-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={`https://cognify.app/workspace/board-${board.id}`} 
                      className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800/50 border border-transparent dark:border-zinc-700 rounded-xl outline-none text-sm text-zinc-500 select-all"
                    />
                    <button 
                      onClick={() => { navigator.clipboard.writeText(`https://cognify.app/workspace/board-${board.id}`); toast.success('Link copied to clipboard!'); }}
                      className="px-6 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-white border border-zinc-300 dark:border-zinc-700 font-bold text-sm rounded-xl transition-all"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
