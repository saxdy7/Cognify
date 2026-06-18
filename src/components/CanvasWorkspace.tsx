'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  ZoomIn, ZoomOut, Maximize, Minimize, Undo, Redo, Grid, 
  Share2, Download, StickyNote, Image as ImageIcon, Link as LinkIcon, 
  FileText, CheckSquare, Columns, FolderOpen, ArrowRight, Type, 
  X, Plus, Trash2, ArrowLeft, Sun, Moon
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
  const [selectedElementIds, setSelectedElementIds] = useState<Set<string>>(new Set());
  const [pendingPlacement, setPendingPlacement] = useState<CanvasElement['type'] | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Connection state
  const [connectSource, setConnectSource] = useState<string | null>(null);

  // Undo / Redo Stacks
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Panning states
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  
  // Mouse tracking for paste-at-cursor
  const mouseCoordsRef = useRef({ x: 0, y: 0 });
  const isMouseOverCanvasRef = useRef(false);

  // Marquee selection state
  const [selectionRect, setSelectionRect] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const isMarqueeRef = useRef(false);
  const marqueeStartRef = useRef({ x: 0, y: 0 });

  // Modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Load Elements & Connectors
  useEffect(() => {
    fetchBoardData();
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
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // ─── Paste handler (images) ───
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
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
                  targetX = mouseCoordsRef.current.x - defaultWidth / 2;
                  targetY = mouseCoordsRef.current.y - defaultHeight / 2;
                } else {
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
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [pan, zoom, elements, board.id, snapToGrid]);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl && (
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true'
        )
      ) {
        return;
      }

      // Delete/Backspace — delete all selected elements
      if (selectedElementIds.size > 0 && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        selectedElementIds.forEach(id => handleDeleteElement(id));
        setSelectedElementIds(new Set());
      }

      // Escape — clear selection or cancel placement
      if (e.key === 'Escape') {
        if (pendingPlacement) {
          setPendingPlacement(null);
        } else {
          setSelectedElementIds(new Set());
        }
      }

      // Ctrl+A — select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedElementIds(new Set(elements.map(el => el.id)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElementIds, elements, pendingPlacement]);

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

      setHistory([loadedElements]);
      setHistoryIndex(0);
    } catch (error) {
      console.error('Error fetching canvas data:', error);
      toast.error('Failed to load board');
    }
  };

  // ─── History management ───
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
      syncElementsState(targetState);
      toast.success('Undone');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const targetState = history[newIndex];
      setHistoryIndex(newIndex);
      setElements(targetState);
      syncElementsState(targetState);
      toast.success('Redone');
    }
  };

  const syncElementsState = async (state: CanvasElement[]) => {
    for (const el of state) {
      await supabase
        .from('canvas_elements')
        .update({ x: el.x, y: el.y, width: el.width, height: el.height, content: el.content, color: el.color })
        .eq('id', el.id);
    }
  };

  // ─── Mouse Handlers ───
  const handleMouseDown = (e: React.MouseEvent) => {
    // Click-to-place mode
    if (pendingPlacement) {
      if (
        e.target === canvasRef.current || 
        (e.target as HTMLElement).classList.contains('canvas-grid') ||
        (e.target as HTMLElement).tagName === 'svg'
      ) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const clickX = (e.clientX - rect.left - pan.x) / zoom;
          const clickY = (e.clientY - rect.top - pan.y) / zoom;
          const defaultWidth = pendingPlacement === 'column' ? 320 : pendingPlacement === 'image' ? 320 : pendingPlacement === 'text' ? 240 : 280;
          const defaultHeight = pendingPlacement === 'column' ? 500 : pendingPlacement === 'image' ? 240 : pendingPlacement === 'text' ? 60 : 180;
          handleAddElement(pendingPlacement, { 
            x: snapValue(clickX - defaultWidth / 2), 
            y: snapValue(clickY - defaultHeight / 2) 
          });
          setPendingPlacement(null);
        }
      }
      return;
    }

    if (activeTool !== 'select') return;

    // Check if clicking on empty canvas (for panning or marquee)
    const isCanvasClick = (
      e.target === canvasRef.current || 
      (e.target as HTMLElement).classList.contains('canvas-grid') ||
      (e.target as HTMLElement).tagName === 'svg'
    );

    if (isCanvasClick) {
      // Shift-click starts marquee selection
      if (e.shiftKey) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const canvasX = (e.clientX - rect.left - pan.x) / zoom;
          const canvasY = (e.clientY - rect.top - pan.y) / zoom;
          isMarqueeRef.current = true;
          marqueeStartRef.current = { x: canvasX, y: canvasY };
          setSelectionRect({ startX: canvasX, startY: canvasY, endX: canvasX, endY: canvasY });
        }
        return;
      }

      // Regular click on canvas — start panning, clear selection
      setIsPanning(true);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      setSelectedElementIds(new Set());
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

    // Marquee selection
    if (isMarqueeRef.current && rect) {
      const canvasX = (e.clientX - rect.left - pan.x) / zoom;
      const canvasY = (e.clientY - rect.top - pan.y) / zoom;
      setSelectionRect(prev => prev ? { ...prev, endX: canvasX, endY: canvasY } : null);
      return;
    }

    // Panning
    if (isPanning) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);

    // Finish marquee selection
    if (isMarqueeRef.current && selectionRect) {
      isMarqueeRef.current = false;
      
      const minX = Math.min(selectionRect.startX, selectionRect.endX);
      const maxX = Math.max(selectionRect.startX, selectionRect.endX);
      const minY = Math.min(selectionRect.startY, selectionRect.endY);
      const maxY = Math.max(selectionRect.startY, selectionRect.endY);

      const selected = new Set<string>();
      elements.forEach(el => {
        const elRight = el.x + (el.width || 280);
        const elBottom = el.y + (el.height || 180);
        // Element overlaps with selection rect
        if (el.x < maxX && elRight > minX && el.y < maxY && elBottom > minY) {
          selected.add(el.id);
        }
      });
      setSelectedElementIds(selected);
      setSelectionRect(null);
    }
  };

  // ─── Zooming ───
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scale = e.deltaY < 0 ? 1.08 : 0.92;
    const nextZoom = Math.min(Math.max(zoom * scale, 0.2), 3.0);
    
    const newPanX = mouseX - (mouseX - pan.x) * (nextZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (nextZoom / zoom);

    setZoom(parseFloat(nextZoom.toFixed(2)));
    setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
  };

  const zoomAtCenter = (zoomIn: boolean) => {
    const scale = zoomIn ? 1.15 : 0.85;
    const nextZoom = Math.min(Math.max(zoom * scale, 0.2), 3.0);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : window.innerWidth / 2;
    const centerY = rect ? rect.height / 2 : window.innerHeight / 2;

    const newPanX = centerX - (centerX - pan.x) * (nextZoom / zoom);
    const newPanY = centerY - (centerY - pan.y) * (nextZoom / zoom);

    setZoom(parseFloat(nextZoom.toFixed(2)));
    setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
  };

  // Grid snapping
  const snapValue = (val: number) => {
    if (!snapToGrid) return val;
    return Math.round(val / 20) * 20;
  };

  // ─── Element Actions ───
  const handleAddElement = async (type: CanvasElement['type'], customPosition?: { x: number; y: number }, customSrc?: string) => {
    const defaultWidth = type === 'column' ? 320 : type === 'image' ? 320 : type === 'text' ? 240 : 280;
    const defaultHeight = type === 'column' ? 500 : type === 'image' ? 240 : type === 'text' ? 60 : 180;
    
    const viewportCenterX = (window.innerWidth / 2 - pan.x) / zoom;
    const viewportCenterY = (window.innerHeight / 2 - pan.y) / zoom;
    
    const posX = customPosition ? customPosition.x : snapValue(viewportCenterX - defaultWidth / 2);
    const posY = customPosition ? customPosition.y : snapValue(viewportCenterY - defaultHeight / 2);

    let defaultContent: Record<string, unknown> = {};
    if (type === 'note') {
      defaultContent = { title: 'Untitled Note', body: 'Start typing here...' };
    } else if (type === 'text') {
      defaultContent = { text: 'Double click to edit' };
    } else if (type === 'todo') {
      defaultContent = { title: 'To-do List', tasks: [{ id: '1', text: 'First task', completed: false }] };
    } else if (type === 'link') {
      defaultContent = { url: '', title: '', description: '' };
    } else if (type === 'image') {
      defaultContent = { src: customSrc || '', caption: customSrc ? 'Pasted image' : '' };
    } else if (type === 'column') {
      defaultContent = { title: 'Column', childIds: [] };
    } else if (type === 'board_link') {
      defaultContent = { title: 'Sub-board', boardId: null };
    }

    const newElementPayload = {
      board_id: board.id,
      type,
      x: posX,
      y: posY,
      width: defaultWidth,
      height: defaultHeight,
      color: type === 'note' ? '#FEF9C3' : '#FFFFFF',
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
        toast.success(customSrc ? 'Image pasted' : `${type} added`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to create element');
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

  // ─── Drag handlers (called by CanvasCard) ───
  const handleDragElement = (id: string, newX: number, newY: number) => {
    const finalX = snapValue(newX);
    const finalY = snapValue(newY);

    // If dragging a selected element, move all selected together
    if (selectedElementIds.has(id) && selectedElementIds.size > 1) {
      const draggedEl = elements.find(el => el.id === id);
      if (draggedEl) {
        const deltaX = finalX - draggedEl.x;
        const deltaY = finalY - draggedEl.y;
        setElements(prev => prev.map(el => 
          selectedElementIds.has(el.id) 
            ? { ...el, x: el.x + deltaX, y: el.y + deltaY }
            : el
        ));
      }
    } else {
      setElements(prev => prev.map(el => el.id === id ? { ...el, x: finalX, y: finalY } : el));
    }
  };

  const handleDragElementEnd = async (id: string, newX: number, newY: number) => {
    const finalX = snapValue(newX);
    const finalY = snapValue(newY);

    const updated = elements.map(el => el.id === id ? { ...el, x: finalX, y: finalY } : el);
    setElements(updated);
    pushToHistory(updated);

    // Persist all selected elements positions
    if (selectedElementIds.has(id) && selectedElementIds.size > 1) {
      for (const elId of selectedElementIds) {
        const el = updated.find(e => e.id === elId);
        if (el) {
          try {
            await supabase.from('canvas_elements').update({ x: el.x, y: el.y }).eq('id', elId);
          } catch (err) {
            console.error('Drag persist failed:', err);
          }
        }
      }
    } else {
      try {
        await supabase.from('canvas_elements').update({ x: finalX, y: finalY }).eq('id', id);
      } catch (err) {
        console.error('Drag persist failed:', err);
      }
    }
  };

  const handleResizeElement = async (id: string, width: number, height: number) => {
    const updated = elements.map(el => el.id === id ? { ...el, width, height } : el);
    setElements(updated);
    pushToHistory(updated);

    try {
      await supabase.from('canvas_elements').update({ width, height }).eq('id', id);
    } catch (err) {
      console.error('Resize failed:', err);
    }
  };

  const handleDeleteElement = async (id: string) => {
    try {
      const { error } = await supabase.from('canvas_elements').delete().eq('id', id);
      if (error) throw error;
      const updated = elements.filter(el => el.id !== id);
      setElements(updated);
      setConnectors(prev => prev.filter(c => c.source_element_id !== id && c.target_element_id !== id));
      pushToHistory(updated);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    }
  };

  // ─── Connector Actions ───
  const handleElementClick = (id: string) => {
    if (activeTool === 'connect') {
      if (!connectSource) {
        setConnectSource(id);
        toast.info('Select destination');
      } else {
        if (connectSource === id) {
          setConnectSource(null);
          return;
        }

        const newConnectorPayload = {
          board_id: board.id,
          source_element_id: connectSource,
          target_element_id: id,
          color: '#5B6CF9',
          style: 'straight' as const
        };

        (async () => {
          try {
            const { data, error } = await supabase
              .from('canvas_connectors')
              .insert([newConnectorPayload])
              .select();

            if (error) throw error;
            if (data) {
              setConnectors([...connectors, data[0]]);
              toast.success('Connected');
            }
          } catch (err) {
            console.error(err);
            toast.error('Connection failed');
          } finally {
            setConnectSource(null);
            setActiveTool('select');
          }
        })();
      }
    } else if (activeTool === 'delete') {
      handleDeleteElement(id);
    } else if (activeTool === 'select') {
      setSelectedElementIds(new Set([id]));
    }
  };

  const handleExport = (format: 'png' | 'pdf') => {
    toast.info(`Preparing ${format.toUpperCase()}...`);
    setTimeout(() => {
      toast.success(`${board.name}.${format} exported`);
      setShowExportModal(false);
    }, 1500);
  };

  // ─── Minimap computation ───
  const computeMinimapData = () => {
    if (elements.length === 0) return { elements: [], viewportRect: { left: 0, top: 0, width: 50, height: 40 } };

    // Compute bounding box of all elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach(el => {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + (el.width || 280));
      maxY = Math.max(maxY, el.y + (el.height || 180));
    });

    // Add padding
    const padding = 200;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const worldW = maxX - minX;
    const worldH = maxY - minY;
    const minimapW = 136; // internal minimap width in px
    const minimapH = 80;
    const scale = Math.min(minimapW / worldW, minimapH / worldH);

    const mappedElements = elements.map(el => ({
      id: el.id,
      x: (el.x - minX) * scale,
      y: (el.y - minY) * scale,
      w: (el.width || 280) * scale,
      h: (el.height || 180) * scale,
      color: el.type === 'note' ? '#FBBF24' : el.type === 'image' ? '#10B981' : el.type === 'link' ? '#6366F1' : el.type === 'todo' ? '#F97316' : '#94A3B8'
    }));

    // Viewport rectangle
    const rect = canvasRef.current?.getBoundingClientRect();
    const vpW = rect ? rect.width : window.innerWidth;
    const vpH = rect ? rect.height : window.innerHeight;
    const vpLeft = (-pan.x / zoom - minX) * scale;
    const vpTop = (-pan.y / zoom - minY) * scale;
    const vpWidth = (vpW / zoom) * scale;
    const vpHeight = (vpH / zoom) * scale;

    return {
      elements: mappedElements,
      viewportRect: {
        left: Math.max(0, vpLeft),
        top: Math.max(0, vpTop),
        width: Math.min(minimapW, vpWidth),
        height: Math.min(minimapH, vpHeight)
      }
    };
  };

  const minimapData = computeMinimapData();

  // ─── Marquee selection rect rendering ───
  const renderMarquee = () => {
    if (!selectionRect) return null;
    const left = Math.min(selectionRect.startX, selectionRect.endX);
    const top = Math.min(selectionRect.startY, selectionRect.endY);
    const width = Math.abs(selectionRect.endX - selectionRect.startX);
    const height = Math.abs(selectionRect.endY - selectionRect.startY);

    return (
      <div
        className="absolute border-2 border-blue-500 bg-blue-500/10 rounded-sm pointer-events-none"
        style={{ left, top, width, height }}
      />
    );
  };

  // ─── Sidebar tool items ───
  const sidebarTools = [
    { type: 'note' as const, icon: StickyNote, label: 'Note', color: 'text-yellow-500' },
    { type: 'link' as const, icon: LinkIcon, label: 'Link', color: 'text-indigo-500' },
    { type: 'todo' as const, icon: CheckSquare, label: 'To-Do', color: 'text-amber-500' },
    { type: 'image' as const, icon: ImageIcon, label: 'Image', color: 'text-emerald-500' },
    { type: 'text' as const, icon: Type, label: 'Text', color: 'text-blue-500' },
    { type: 'column' as const, icon: Columns, label: 'Column', color: 'text-purple-500' },
    { type: 'board_link' as const, icon: FolderOpen, label: 'Board', color: 'text-teal-500' },
  ];

  return (
    <div className={`overflow-hidden transition-colors duration-300 ${
      isFullscreen 
        ? 'fixed inset-0 z-[9999] w-screen h-screen' 
        : 'relative w-full h-[calc(100vh-120px)] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner'
    } ${
      theme === 'dark' ? 'bg-[#1A1A1A] text-white' : 'bg-[#FAFAFA] text-zinc-900'
    }`}>

      {/* Placement indicator */}
      {pendingPlacement && (
        <div className={`absolute top-5 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-2.5 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider rounded-full shadow-lg backdrop-blur-md ${
          theme === 'dark' ? 'bg-blue-600/90 text-white border border-blue-500/30' : 'bg-blue-500 text-white border border-blue-400/30'
        }`}>
          <span>Click canvas to place {pendingPlacement}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); setPendingPlacement(null); }}
            className="p-0.5 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 2D Canvas Viewport */}
      <div 
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onMouseEnter={() => { isMouseOverCanvasRef.current = true; }}
        onMouseLeave={() => { isMouseOverCanvasRef.current = false; }}
        className={`w-full h-full relative overflow-hidden ${
          pendingPlacement 
            ? 'cursor-crosshair' 
            : 'cursor-grab active:cursor-grabbing'
        }`}
        style={{
          backgroundImage: theme === 'dark'
            ? 'radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px)'
            : 'radial-gradient(rgba(0, 0, 0, 0.06) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      >
        {/* Zoomed/Panned Container */}
        <div
          className="absolute origin-top-left pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: '6000px',
            height: '6000px'
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
                zoom={zoom}
                isSelected={selectedElementIds.has(el.id)}
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

            {/* Marquee selection rectangle */}
            {renderMarquee()}
          </div>
        </div>
      </div>

      {/* ─── Bottom-Left: Zoom Controls ─── */}
      <div className={`absolute bottom-5 left-24 z-20 flex items-center gap-1 p-1 rounded-xl shadow-lg border backdrop-blur-xl ${
        theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-zinc-200/60'
      }`}>
        <button
          onClick={() => zoomAtCenter(false)}
          className={`p-2.5 rounded-lg transition-colors ${
            theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
          }`}
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className={`px-2 text-[11px] font-semibold select-none tabular-nums ${
          theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
        }`}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => zoomAtCenter(true)}
          className={`p-2.5 rounded-lg transition-colors ${
            theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
          }`}
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className={`w-px h-5 mx-0.5 ${theme === 'dark' ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
        <button
          onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }}
          className={`p-2.5 rounded-lg transition-colors ${
            theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
          }`}
          title="Reset View"
        >
          <Maximize className="w-4 h-4" />
        </button>
        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`p-2.5 rounded-lg transition-colors ${
            snapToGrid 
              ? (theme === 'dark' ? 'text-blue-400 bg-blue-500/10' : 'text-blue-500 bg-blue-500/10')
              : (theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100')
          }`}
          title="Snap to Grid"
        >
          <Grid className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
          className={`p-2.5 rounded-lg transition-colors ${
            theme === 'dark' ? 'text-amber-400 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
          }`}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* ─── Top-Right: History + Actions ─── */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <div className={`flex items-center gap-1 p-1 rounded-xl shadow-lg border backdrop-blur-xl ${
          theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-zinc-200/60'
        }`}>
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className={`p-2.5 rounded-lg transition-colors disabled:opacity-30 ${
              theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
            }`}
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className={`p-2.5 rounded-lg transition-colors disabled:opacity-30 ${
              theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
            }`}
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        <div className={`flex items-center gap-1 p-1 rounded-xl shadow-lg border backdrop-blur-xl ${
          theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-zinc-200/60'
        }`}>
          <button
            onClick={() => setShowShareModal(true)}
            className={`p-2.5 rounded-lg transition-colors ${
              theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
            }`}
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className={`p-2.5 rounded-lg transition-colors ${
              theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
            }`}
            title="Export"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className={`p-2.5 rounded-lg transition-colors ${
              theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
            }`}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          <button
            onClick={onBackToBoards}
            className={`p-2.5 rounded-lg transition-colors ${
              theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
            }`}
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Left Sidebar ─── */}
      <div className={`absolute top-0 bottom-0 left-0 w-20 z-20 flex flex-col justify-between py-4 border-r transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#1E1E1E] border-zinc-800' : 'bg-white border-zinc-200/60'
      }`}>
        <div className="flex flex-col items-center w-full gap-1.5">
          {/* Back button */}
          <button
            onClick={onBackToBoards}
            className={`w-11 h-11 flex items-center justify-center rounded-lg transition-colors mb-2 ${
              theme === 'dark' ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
            }`}
            title="Back"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          
          <div className={`w-10 h-px mb-1 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

          {/* Tool buttons */}
          <div className="flex flex-col items-center w-full gap-0.5 px-1">
            {sidebarTools.map(tool => (
              <button
                key={tool.type}
                onClick={() => { setPendingPlacement(tool.type); setActiveTool('select'); }}
                className={`w-[60px] py-2 flex flex-col items-center gap-0.5 rounded-lg transition-all ${
                  pendingPlacement === tool.type 
                    ? 'bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20' 
                    : theme === 'dark'
                      ? 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
                }`}
                title={`Add ${tool.label}`}
              >
                <tool.icon className={`w-4.5 h-4.5 ${pendingPlacement === tool.type ? 'text-blue-500' : tool.color}`} />
                <span className={`text-[8px] font-semibold uppercase tracking-wider ${
                  pendingPlacement === tool.type 
                    ? 'text-blue-500'
                    : theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'
                }`}>{tool.label}</span>
              </button>
            ))}

            {/* Connector line tool */}
            <button
              onClick={() => {
                setActiveTool(activeTool === 'connect' ? 'select' : 'connect');
                setConnectSource(null);
                setPendingPlacement(null);
              }}
              className={`w-[60px] py-2 flex flex-col items-center gap-0.5 rounded-lg transition-all ${
                activeTool === 'connect'
                  ? 'bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20'
                  : theme === 'dark'
                    ? 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
              }`}
              title="Draw Line"
            >
              <ArrowRight className={`w-4.5 h-4.5 ${activeTool === 'connect' ? 'text-indigo-500' : 'text-indigo-400'}`} />
              <span className={`text-[8px] font-semibold uppercase tracking-wider ${
                activeTool === 'connect' ? 'text-indigo-500' : theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'
              }`}>Line</span>
            </button>
          </div>
        </div>

        {/* Bottom: Trash */}
        <div className="flex flex-col items-center w-full px-1">
          <button
            onClick={() => setActiveTool(activeTool === 'delete' ? 'select' : 'delete')}
            className={`w-[60px] py-2 flex flex-col items-center gap-0.5 rounded-lg transition-all ${
              activeTool === 'delete'
                ? 'bg-red-500 text-white shadow-md'
                : theme === 'dark'
                  ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
                  : 'text-zinc-400 hover:text-red-500 hover:bg-red-500/10'
            }`}
            title="Delete Tool"
          >
            <Trash2 className="w-4.5 h-4.5" />
            <span className={`text-[8px] font-semibold uppercase tracking-wider ${
              activeTool === 'delete' ? 'text-white' : theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'
            }`}>Trash</span>
          </button>
        </div>
      </div>

      {/* ─── Bottom-Right: Minimap ─── */}
      <div className={`absolute bottom-5 right-5 z-20 p-2 rounded-xl shadow-lg border backdrop-blur-xl w-40 h-28 flex flex-col gap-1 ${
        theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-zinc-200/60'
      }`}>
        <span className={`text-[7px] font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Minimap
        </span>
        <div className={`relative flex-1 rounded-lg overflow-hidden ${
          theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-100/80'
        }`}>
          {/* Real element dots */}
          {minimapData.elements.map(el => (
            <div
              key={el.id}
              className="absolute rounded-sm"
              style={{
                left: el.x,
                top: el.y,
                width: Math.max(3, el.w),
                height: Math.max(2, el.h),
                backgroundColor: el.color,
                opacity: 0.7
              }}
            />
          ))}
          {/* Viewport window */}
          <div 
            className="absolute border border-blue-500 bg-blue-500/10 rounded-sm" 
            style={{ 
              left: minimapData.viewportRect.left,
              top: minimapData.viewportRect.top,
              width: minimapData.viewportRect.width,
              height: minimapData.viewportRect.height
            }} 
          />
        </div>
      </div>

      {/* ─── Export Modal ─── */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl ${
                theme === 'dark' ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Export board</h3>
                <button 
                  onClick={() => setShowExportModal(false)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    theme === 'dark' ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className={`text-sm mb-5 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Download a snapshot of your workspace.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleExport('png')}
                  className="py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm rounded-xl transition-colors"
                >
                  PNG
                </button>
                <button 
                  onClick={() => handleExport('pdf')}
                  className={`py-3 font-semibold text-sm rounded-xl transition-colors ${
                    theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200'
                  }`}
                >
                  PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Share Modal ─── */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${
                theme === 'dark' ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Share board</h3>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    theme === 'dark' ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={`text-[10px] font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Email
                  </label>
                  <div className="flex gap-2 mt-1.5">
                    <input 
                      type="email" 
                      placeholder="teammate@example.com" 
                      className={`flex-1 px-3 py-2.5 rounded-lg outline-none text-sm ${
                        theme === 'dark' ? 'bg-zinc-800 border border-zinc-700 text-white' : 'bg-zinc-100 border border-zinc-200 text-zinc-800'
                      }`}
                    />
                    <button 
                      onClick={() => { toast.success('Invite sent'); setShowShareModal(false); }}
                      className="px-5 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm rounded-lg transition-colors"
                    >
                      Invite
                    </button>
                  </div>
                </div>
                <div>
                  <label className={`text-[10px] font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Shareable Link
                  </label>
                  <div className="flex gap-2 mt-1.5">
                    <input 
                      type="text" 
                      readOnly 
                      value={`https://cognify.app/board/${board.id}`} 
                      className={`flex-1 px-3 py-2.5 rounded-lg outline-none text-sm select-all ${
                        theme === 'dark' ? 'bg-zinc-800 border border-zinc-700 text-zinc-400' : 'bg-zinc-100 border border-zinc-200 text-zinc-500'
                      }`}
                    />
                    <button 
                      onClick={() => { navigator.clipboard.writeText(`https://cognify.app/board/${board.id}`); toast.success('Copied'); }}
                      className={`px-5 font-semibold text-sm rounded-lg transition-colors ${
                        theme === 'dark' ? 'bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-800 border border-zinc-300 hover:bg-zinc-300'
                      }`}
                    >
                      Copy
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
