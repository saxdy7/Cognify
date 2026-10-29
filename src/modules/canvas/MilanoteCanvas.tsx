'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Moon, Sun, Loader2, Maximize, Minimize, Plus, Minus,
  Spline, LayoutGrid, Upload, Trash2,
} from 'lucide-react';
import { CanvasBoard, CanvasElement, CanvasConnector } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CanvasCard } from './CanvasCards';
import { ConnectorLine, computePreviewPath } from './ConnectorLine';
import { BOARD_TEMPLATES } from './templates';
import { FigmaCanvasToolbar, CanvasTool } from './FigmaCanvasToolbar';

interface MilanoteCanvasProps {
  board: CanvasBoard;
  onBackToBoards: () => void;
  userId: string;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  headerActions?: React.ReactNode;
}

type Tool = CanvasTool;

// Default geometry + content per element type
const ELEMENT_DEFAULTS: Record<string, { width: number; height: number; color: string; content: any }> = {
  note: { width: 240, height: 200, color: '#FEF9C3', content: { title: '', body: '' } },
  text: { width: 260, height: 64, color: '#FFFFFF', content: { text: '' } },
  link: { width: 280, height: 200, color: '#FFFFFF', content: { url: '' } },
  image: { width: 280, height: 220, color: '#FFFFFF', content: { src: '' } },
  file: { width: 280, height: 120, color: '#FFFFFF', content: {} },
  todo: { width: 250, height: 260, color: '#FFFFFF', content: { title: '', tasks: [] } },
  column: { width: 300, height: 420, color: '#FFFFFF', content: { title: 'New Column' } },
  board_link: { width: 200, height: 150, color: '#FFFFFF', content: { title: '' } },
  sketch: { width: 360, height: 300, color: '#FFFFFF', content: { strokes: [] } },
  heading: { width: 320, height: 72, color: '#FFFFFF', content: { text: '' } },
  code: { width: 320, height: 220, color: '#FFFFFF', content: { code: '' } },
  clock: { width: 240, height: 190, color: '#FFFFFF', content: { label: 'Local Time' } },
  countdown: { width: 260, height: 180, color: '#FFFFFF', content: { label: 'Countdown', targetISO: '' } },
  heatmap: { width: 340, height: 210, color: '#FFFFFF', content: { label: 'Activity', values: [] } },
  gauge: { width: 220, height: 270, color: '#FFFFFF', content: { label: 'Metric', value: 60, max: 100, unit: '%' } },
};

export function MilanoteCanvas({ board, onBackToBoards, userId, theme, setTheme, headerActions }: MilanoteCanvasProps) {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [connectors, setConnectors] = useState<CanvasConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<'synced' | 'saving' | 'error'>('synced');

  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [connectPointer, setConnectPointer] = useState<{ x: number; y: number } | null>(null);
  const [defaultLineStyle, setDefaultLineStyle] = useState<'curved' | 'straight' | 'stepped'>('curved');

  // Viewport (pan + zoom)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Space-drag pan support
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const isSpacePressedRef = useRef(false);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refs so global paste/drop handlers always read the latest viewport
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const handleFullscreen = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreen);
    return () => document.removeEventListener('fullscreenchange', handleFullscreen);
  }, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const [smoothZoom, setSmoothZoom] = useState(false);
  const smoothZoomTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerSmoothZoom = useCallback(() => {
    setSmoothZoom(true);
    if (smoothZoomTimeoutRef.current) clearTimeout(smoothZoomTimeoutRef.current);
    smoothZoomTimeoutRef.current = setTimeout(() => setSmoothZoom(false), 220);
  }, []);
  useEffect(() => () => { if (smoothZoomTimeoutRef.current) clearTimeout(smoothZoomTimeoutRef.current); }, []);

  // Keep latest elements/connectors accessible inside async + event handlers
  const elementsRef = useRef<CanvasElement[]>([]);
  useEffect(() => { elementsRef.current = elements; }, [elements]);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ─────────────────────────── Template seeding ───────────────────────────
  const seedTemplate = useCallback(async (templateId: string): Promise<CanvasElement[]> => {
    const tmpl = BOARD_TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) return [];
    try {
      const rows = tmpl.elements.map(s => ({ board_id: board.id, ...s }));
      const { data: insertedElements, error: elErr } = await supabase.from('canvas_elements').insert(rows).select();
      if (elErr) throw elErr;

      const loadedElements = (insertedElements as CanvasElement[]) || [];

      // Seed connectors from the template if present
      if (tmpl.connectors && tmpl.connectors.length > 0 && loadedElements.length > 0) {
        const connectorRows = tmpl.connectors.map(c => {
          const src = loadedElements[c.sourceIndex];
          const tgt = loadedElements[c.targetIndex];
          if (!src || !tgt) return null;
          return {
            board_id: board.id,
            source_element_id: src.id,
            target_element_id: tgt.id,
            color: c.color || '#5B6CF9',
            style: 'curved' as const,
          };
        }).filter(Boolean);

        if (connectorRows.length > 0) {
          const { data: insertedConnectors, error: connErr } = await supabase
            .from('canvas_connectors')
            .insert(connectorRows)
            .select();
          if (!connErr && insertedConnectors) {
            setConnectors(insertedConnectors as CanvasConnector[]);
          }
        }
      }

      return loadedElements;
    } catch (err) {
      console.error('Template seed failed:', err);
      toast.error('Failed to load template');
      return [];
    }
  }, [board.id]);

  // ─────────────────────────── Initial load + Realtime ───────────────────────────
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [{ data: elData, error: elErr }, { data: connData, error: connErr }] = await Promise.all([
          supabase.from('canvas_elements').select('*').eq('board_id', board.id),
          supabase.from('canvas_connectors').select('*').eq('board_id', board.id),
        ]);

        if (elErr) throw elErr;
        if (!mounted) return;

        let loadedElements = (elData as CanvasElement[]) || [];

        // Seed template if board is brand new and specifies a template
        if (loadedElements.length === 0 && board.template && board.template !== 'blank') {
          loadedElements = await seedTemplate(board.template);
        }

        setElements(loadedElements);
        if (!connErr && connData) {
          setConnectors(connData as CanvasConnector[]);
        }
      } catch (err) {
        console.error('Canvas load failed:', err);
        toast.error('Failed to load canvas data');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`canvas_${board.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'canvas_elements', filter: `board_id=eq.${board.id}` }, payload => {
        if (!mounted) return;
        if (payload.eventType === 'INSERT') {
          const newEl = payload.new as CanvasElement;
          setElements(prev => (prev.some(e => e.id === newEl.id) ? prev : [...prev, newEl]));
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as CanvasElement;
          setElements(prev => prev.map(e => (e.id === updated.id ? updated : e)));
        } else if (payload.eventType === 'DELETE') {
          const oldId = payload.old.id;
          setElements(prev => prev.filter(e => e.id !== oldId));
          setConnectors(prev => prev.filter(c => c.source_element_id !== oldId && c.target_element_id !== oldId));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'canvas_connectors', filter: `board_id=eq.${board.id}` }, payload => {
        if (!mounted) return;
        if (payload.eventType === 'INSERT') {
          const newC = payload.new as CanvasConnector;
          setConnectors(prev => (prev.some(c => c.id === newC.id) ? prev : [...prev, newC]));
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as CanvasConnector;
          setConnectors(prev => prev.map(c => (c.id === updated.id ? updated : c)));
        } else if (payload.eventType === 'DELETE') {
          const oldId = payload.old.id;
          setConnectors(prev => prev.filter(c => c.id !== oldId));
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [board.id, board.template, seedTemplate]);

  // ─────────────────────────── Auto-save ───────────────────────────
  const persistUpdate = useCallback(async (id: string) => {
    if (id.startsWith('temp-')) return;
    const el = elementsRef.current.find(e => e.id === id);
    if (!el) return;

    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    setSavingStatus('saving');

    saveTimers.current[id] = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('canvas_elements')
          .update({
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            color: el.color,
            content: el.content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;
        setSavingStatus('synced');
      } catch (err) {
        console.error('Save failed:', err);
        setSavingStatus('error');
        toast.error('Failed to save changes');
      }
    }, 400);
  }, []);

  // ─────────────────────────── Canvas math ───────────────────────────
  const screenToCanvasCenter = useCallback(() => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return { x: 200, y: 200 };
    return {
      x: (rect.width / 2 - panRef.current.x) / zoomRef.current,
      y: (rect.height / 2 - panRef.current.y) / zoomRef.current,
    };
  }, []);

  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return screenToCanvasCenter();
    return {
      x: (clientX - rect.left - panRef.current.x) / zoomRef.current,
      y: (clientY - rect.top - panRef.current.y) / zoomRef.current,
    };
  }, [screenToCanvasCenter]);

  const addElement = useCallback(async (
    type: string,
    preset?: any,
    at?: { x: number; y: number },
  ): Promise<CanvasElement | null> => {
    const defaults = ELEMENT_DEFAULTS[type] || ELEMENT_DEFAULTS.note;
    const center = at || screenToCanvasCenter();
    const width = preset?.width ?? defaults.width;
    const height = preset?.height ?? defaults.height;
    const content = preset?.content ?? defaults.content;
    const color = preset?.color ?? defaults.color;

    const row = {
      board_id: board.id,
      type,
      x: Math.round(center.x - width / 2),
      y: Math.round(center.y - height / 2),
      width,
      height,
      color,
      content,
    };

    const tempId = 'temp-' + Math.random().toString(36).slice(2);
    const optimistic = { ...row, id: tempId, created_at: '', updated_at: '' } as CanvasElement;
    setElements(prev => [...prev, optimistic]);
    setSelectedId(tempId);

    try {
      const { data, error } = await supabase.from('canvas_elements').insert([row]).select().single();
      if (error) throw error;
      setElements(prev => prev.map(e => (e.id === tempId ? (data as CanvasElement) : e)));
      setSelectedId(data.id);
      return data as CanvasElement;
    } catch (err: any) {
      console.error('Create failed:', err);
      toast.error('Failed to add card: ' + (err.message || 'unknown error'));
      setElements(prev => prev.filter(e => e.id !== tempId));
      return null;
    }
  }, [board.id, screenToCanvasCenter]);

  const handleDrag = useCallback((id: string, x: number, y: number) => {
    setElements(prev => prev.map(e => (e.id === id ? { ...e, x, y } : e)));
  }, []);

  const handleDragEnd = useCallback((id: string) => {
    persistUpdate(id);
  }, [persistUpdate]);

  const handleResize = useCallback((id: string, width: number, height: number) => {
    setElements(prev => prev.map(e => (e.id === id ? { ...e, width, height } : e)));
    persistUpdate(id);
  }, [persistUpdate]);

  const handleUpdate = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)));
    persistUpdate(id);
  }, [persistUpdate]);

  const handleDelete = useCallback(async (id: string) => {
    setElements(prev => prev.filter(e => e.id !== id));
    setConnectors(prev => prev.filter(c => c.source_element_id !== id && c.target_element_id !== id));
    if (selectedId === id) setSelectedId(null);
    if (connectSourceId === id) {
      setConnectSourceId(null);
      setConnectPointer(null);
    }
    if (id.startsWith('temp-')) return;
    try {
      await supabase.from('canvas_elements').delete().eq('id', id);
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete card');
    }
  }, [selectedId, connectSourceId]);

  // ─────────────────────────── Upload Media ───────────────────────────
  const uploadMedia = useCallback(async (file: File): Promise<string> => {
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const { error } = await supabase.storage.from('canvas-assets').upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('canvas-assets').getPublicUrl(path);
      return publicUrl;
    } catch {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }, [userId]);

  const createImageFromFile = useCallback(async (file: File, at?: { x: number; y: number }) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Only images or videos can be added this way');
      return;
    }
    const tid = toast.loading(file.type.startsWith('video/') ? 'Uploading video…' : 'Uploading image…');
    try {
      const src = await uploadMedia(file);
      const preset = file.type.startsWith('video/')
        ? { width: 360, height: 240, content: { src, caption: file.name } }
        : { content: { src, caption: file.name } };
      await addElement('image', preset, at);
      toast.success('Added to canvas', { id: tid });
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error('Failed to add media', { id: tid });
    }
  }, [uploadMedia, addElement]);

  const createFileFromFile = useCallback(async (file: File, at?: { x: number; y: number }) => {
    await addElement('file', {
      content: {
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        fileType: file.type || 'document',
      },
    }, at);
    toast.success(`Added "${file.name}"`);
  }, [addElement]);

  const createLinkFromUrl = useCallback(async (url: string, at?: { x: number; y: number }) => {
    let hostname = 'website.com';
    try { hostname = new URL(url).hostname; } catch {}
    await addElement('link', {
      content: {
        url,
        title: hostname,
        description: 'Linked resource added to canvas.',
        favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
      },
    }, at);
    toast.success('Added link to canvas');
  }, [addElement]);

  // File input change handler
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const center = screenToCanvasCenter();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const offsetAt = {
        x: Math.round(center.x + (i - (files.length - 1) / 2) * 50),
        y: Math.round(center.y + (i - (files.length - 1) / 2) * 50),
      };
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        await createImageFromFile(file, offsetAt);
      } else {
        await createFileFromFile(file, offsetAt);
      }
    }
    e.target.value = '';
  };

  // Paste handler
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const isInput = !!active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (isInput) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file' && (item.type.startsWith('image/') || item.type.startsWith('video/'))) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            createImageFromFile(file, lastPointerRef.current || undefined);
            return;
          }
        }
      }

      const text = e.clipboardData?.getData('text')?.trim();
      if (text) {
        if (/^https?:\/\//i.test(text)) {
          e.preventDefault();
          createLinkFromUrl(text, lastPointerRef.current || undefined);
          return;
        }
        if (text.length > 0) {
          e.preventDefault();
          if (text.length > 120 || text.includes('\n')) {
            addElement('note', { content: { title: '', body: text } }, lastPointerRef.current || undefined);
          } else {
            addElement('text', { content: { text } }, lastPointerRef.current || undefined);
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [createImageFromFile, createLinkFromUrl, addElement]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const at = screenToCanvas(e.clientX, e.clientY);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      for (const file of files) {
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          await createImageFromFile(file, at);
        } else {
          await createFileFromFile(file, at);
        }
      }
      return;
    }

    const text = e.dataTransfer.getData('text')?.trim();
    if (text) {
      if (/^https?:\/\//i.test(text)) {
        await createLinkFromUrl(text, at);
      } else {
        await addElement('note', { content: { title: '', body: text } }, at);
      }
    }
  }, [screenToCanvas, createImageFromFile, createFileFromFile, createLinkFromUrl, addElement]);

  // ─────────────────────────── Connectors (Sigmoid Curves) ───────────────────────────
  const createConnector = useCallback(async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const exists = connectors.some(
      c => (c.source_element_id === sourceId && c.target_element_id === targetId) ||
           (c.source_element_id === targetId && c.target_element_id === sourceId)
    );
    if (exists) {
      toast.info('These cards are already connected');
      return;
    }

    const row = {
      board_id: board.id,
      source_element_id: sourceId,
      target_element_id: targetId,
      color: '#5B6CF9',
      style: defaultLineStyle,
    };

    const tempId = 'temp-' + Math.random().toString(36).slice(2);
    const optimistic: CanvasConnector = {
      ...row,
      id: tempId,
      created_at: new Date().toISOString(),
    };

    setConnectors(prev => [...prev, optimistic]);

    try {
      const { data, error } = await supabase.from('canvas_connectors').insert([row]).select().single();
      if (error) throw error;
      setConnectors(prev => prev.map(c => (c.id === tempId ? (data as CanvasConnector) : c)));
      toast.success('Cards connected with smooth curve');
    } catch (err: any) {
      console.error('Connector create failed:', err);
      toast.error('Failed to create line: ' + (err.message || 'unknown error'));
      setConnectors(prev => prev.filter(c => c.id !== tempId));
    }
  }, [board.id, connectors, defaultLineStyle]);

  const updateConnector = useCallback(async (id: string, updates: Partial<CanvasConnector>) => {
    setConnectors(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    try {
      const { error } = await supabase.from('canvas_connectors').update(updates).eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.error('Connector update failed:', err);
      toast.error('Failed to update line');
    }
  }, []);

  const deleteConnector = useCallback(async (id: string) => {
    const toDelete = connectors.find(c => c.id === id);
    setConnectors(prev => prev.filter(c => c.id !== id));
    try {
      const { error } = await supabase.from('canvas_connectors').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Connector delete failed:', err);
      toast.error('Failed to delete line');
      if (toDelete) setConnectors(prev => [...prev, toDelete]);
    }
  }, [connectors]);

  // Card click — behavior depends on activeTool
  const handleCardClick = useCallback((id: string) => {
    if (activeTool === 'delete') {
      handleDelete(id);
      return;
    }
    if (activeTool === 'connect') {
      if (!connectSourceId) {
        setConnectSourceId(id);
        toast.info('Click destination card to connect');
      } else if (connectSourceId === id) {
        setConnectSourceId(null);
        setConnectPointer(null);
        toast.info('Connection cancelled');
      } else {
        createConnector(connectSourceId, id);
        setConnectSourceId(null);
        setConnectPointer(null);
      }
      return;
    }
    setSelectedId(id);
  }, [activeTool, connectSourceId, handleDelete, createConnector]);

  // ─────────────────────────── Keyboard shortcuts ───────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const editing = !!active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);

      // Space key for temporary hand pan
      if (e.code === 'Space' && !editing) {
        if (!isSpacePressedRef.current) {
          isSpacePressedRef.current = true;
          setIsSpacePressed(true);
        }
      }

      if (editing) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        handleDelete(selectedId);
        return;
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        setConnectSourceId(null);
        setConnectPointer(null);
        setActiveTool('select');
        return;
      }

      // Quick tool shortcuts
      const k = e.key.toLowerCase();
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (k === 'v') setActiveTool('select');
        else if (k === 'h') setActiveTool('hand');
        else if (k === 'f') addElement('column');
        else if (k === 'n' || k === 'r') addElement('note');
        else if (k === 't') addElement('text');
        else if (k === 'p' || k === 'l') setActiveTool(t => (t === 'connect' ? 'select' : 'connect'));
        else if (k === 'c') addElement('note', { content: { title: 'Comment', body: '' }, color: '#DBEAFE' });
        else if (k === 'd') addElement('sketch');
        else if (e.key === '+' || e.key === '=') zoomBy(1.15);
        else if (e.key === '-' || e.key === '_') zoomBy(0.85);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        resetView();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [selectedId, handleDelete, addElement]);

  // ─────────────────────────── Smooth Touchpad Pinch, Pan & Multi-Touch Gestures ───────────────────────────
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      // Allow internal scrolling inside textareas / code editors only when NOT zooming
      if (target?.closest('textarea, [contenteditable="true"], .overflow-y-auto')) {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          return;
        }
      }

      // Intercept wheel on canvas to prevent full-page browser scrolling
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey || e.altKey) {
        // ── 1. TOUCHPAD PINCH-TO-ZOOM & CTRL/ALT SCROLL ──
        // In Windows/Chrome/Edge/macOS, touchpad pinch emits wheel events with e.ctrlKey = true.
        // deltaY < 0 (pinching fingers apart) -> ZOOM IN
        // deltaY > 0 (pinching fingers together) -> ZOOM OUT
        let delta = -e.deltaY;
        if (e.deltaMode === 1) delta *= 20; // Lines mode
        else if (e.deltaMode === 2) delta *= 100; // Pages mode

        // Smooth, responsive exponential scaling for immediate touchpad response
        const factor = Math.exp(delta * 0.012);
        const clampedFactor = Math.min(Math.max(factor, 0.7), 1.4);

        const currentZoom = zoomRef.current;
        const newZoom = Math.min(Math.max(currentZoom * clampedFactor, 0.1), 5);

        if (Math.abs(newZoom - currentZoom) > 0.0001) {
          zoomRef.current = newZoom;

          const rect = surface.getBoundingClientRect();
          const cursorX = e.clientX - rect.left;
          const cursorY = e.clientY - rect.top;

          const currentPan = panRef.current;
          const ratio = newZoom / currentZoom;
          const nextPanX = cursorX - (cursorX - currentPan.x) * ratio;
          const nextPanY = cursorY - (cursorY - currentPan.y) * ratio;

          panRef.current = { x: nextPanX, y: nextPanY };

          setZoom(newZoom);
          setPan({ x: Math.round(nextPanX), y: Math.round(nextPanY) });
        }
      } else {
        // ── 2. TWO FINGERS ON TOUCHPAD: PAN LEFT, RIGHT, TOP, DOWN ──
        // Moving 2 fingers horizontally pans left/right (e.deltaX)
        // Moving 2 fingers vertically pans top/down (e.deltaY)
        const currentPan = panRef.current;
        const nextPanX = currentPan.x - e.deltaX;
        const nextPanY = currentPan.y - e.deltaY;

        panRef.current = { x: nextPanX, y: nextPanY };
        setPan({ x: Math.round(nextPanX), y: Math.round(nextPanY) });
      }
    };

    // ── Touchscreen 2-Finger Pinch & Pan ──
    let initialTouchDist = 0;
    let initialTouchZoom = 1;
    let initialTouchPan = { x: 0, y: 0 };
    let initialTouchCenter = { x: 0, y: 0 };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialTouchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        initialTouchZoom = zoomRef.current;
        initialTouchPan = { ...panRef.current };

        const rect = surface.getBoundingClientRect();
        initialTouchCenter = {
          x: (t1.clientX + t2.clientX) / 2 - rect.left,
          y: (t1.clientY + t2.clientY) / 2 - rect.top,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialTouchDist > 0) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const rect = surface.getBoundingClientRect();

        const currentCenter = {
          x: (t1.clientX + t2.clientX) / 2 - rect.left,
          y: (t1.clientY + t2.clientY) / 2 - rect.top,
        };

        const scale = currentDist / initialTouchDist;
        const newZoom = Math.min(Math.max(initialTouchZoom * scale, 0.1), 5);
        zoomRef.current = newZoom;

        const ratio = newZoom / initialTouchZoom;
        const nextPanX = currentCenter.x - (initialTouchCenter.x - initialTouchPan.x) * ratio;
        const nextPanY = currentCenter.y - (initialTouchCenter.y - initialTouchPan.y) * ratio;

        panRef.current = { x: nextPanX, y: nextPanY };

        setZoom(newZoom);
        setPan({ x: Math.round(nextPanX), y: Math.round(nextPanY) });
      }
    };

    const onTouchEnd = () => {
      initialTouchDist = 0;
    };

    // ── WebKit / Safari Trackpad Gestures ──
    let initialGestureZoom = 1;
    let gestureCenter = { x: 0, y: 0 };

    const onGestureStart = (e: any) => {
      e.preventDefault();
      initialGestureZoom = zoomRef.current;
      const rect = surface.getBoundingClientRect();
      gestureCenter = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const onGestureChange = (e: any) => {
      e.preventDefault();
      const newZoom = Math.min(Math.max(initialGestureZoom * e.scale, 0.1), 5);
      const currentZoom = zoomRef.current;
      zoomRef.current = newZoom;

      const currentPan = panRef.current;
      const ratio = newZoom / currentZoom;
      const nextPanX = gestureCenter.x - (gestureCenter.x - currentPan.x) * ratio;
      const nextPanY = gestureCenter.y - (gestureCenter.y - currentPan.y) * ratio;

      panRef.current = { x: nextPanX, y: nextPanY };

      setZoom(newZoom);
      setPan({ x: Math.round(nextPanX), y: Math.round(nextPanY) });
    };

    surface.addEventListener('wheel', onWheel, { passive: false });
    surface.addEventListener('touchstart', onTouchStart, { passive: false });
    surface.addEventListener('touchmove', onTouchMove, { passive: false });
    surface.addEventListener('touchend', onTouchEnd);
    surface.addEventListener('gesturestart', onGestureStart as any);
    surface.addEventListener('gesturechange', onGestureChange as any);

    return () => {
      surface.removeEventListener('wheel', onWheel);
      surface.removeEventListener('touchstart', onTouchStart);
      surface.removeEventListener('touchmove', onTouchMove);
      surface.removeEventListener('touchend', onTouchEnd);
      surface.removeEventListener('gesturestart', onGestureStart as any);
      surface.removeEventListener('gesturechange', onGestureChange as any);
    };
  }, []);

  // ─────────────────────────── Pan Surface Mouse Drag ───────────────────────────
  const handleSurfaceMouseDown = useCallback((e: React.MouseEvent) => {
    // If not holding space / hand tool, don't pan if clicking directly on a card
    if (!isSpacePressedRef.current && activeTool !== 'hand') {
      if ((e.target as HTMLElement).closest('[data-card="true"]')) return;
    }

    setSelectedId(null);
    if (connectSourceId) {
      setConnectSourceId(null);
      setConnectPointer(null);
    }

    if (e.button !== 0 && e.button !== 1) return;
    setIsPanning(true);

    const startX = e.clientX - panRef.current.x;
    const startY = e.clientY - panRef.current.y;

    const onMove = (moveEvt: MouseEvent) => {
      const nextX = Math.round(moveEvt.clientX - startX);
      const nextY = Math.round(moveEvt.clientY - startY);
      panRef.current = { x: nextX, y: nextY };
      setPan({
        x: nextX,
        y: nextY,
      });
    };

    const onUp = () => {
      setIsPanning(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [connectSourceId, activeTool]);

  const zoomBy = (factor: number) => {
    triggerSmoothZoom();
    const rect = surfaceRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : 400;
    const cy = rect ? rect.height / 2 : 300;

    setZoom(prev => {
      const next = Math.min(Math.max(prev * factor, 0.1), 5);
      zoomRef.current = next;
      setPan(p => {
        const nextX = Math.round(cx - (cx - p.x) * (next / prev));
        const nextY = Math.round(cy - (cy - p.y) * (next / prev));
        panRef.current = { x: nextX, y: nextY };
        return { x: nextX, y: nextY };
      });
      return next;
    });
  };


  const zoomToElement = (elementId: string) => {
    const el = elements.find(e => e.id === elementId);
    if (!el) return;
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return;

    const targetWidth = el.width || 320;
    const targetHeight = el.height || 220;

    const scaleX = (rect.width * 0.72) / targetWidth;
    const scaleY = (rect.height * 0.72) / targetHeight;
    const desiredZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.7), 2.2);

    const viewCenterX = rect.width / 2;
    const viewCenterY = rect.height / 2;

    const cardCenterX = el.x + targetWidth / 2;
    const cardCenterY = el.y + targetHeight / 2;

    const nextPanX = Math.round(viewCenterX - cardCenterX * desiredZoom);
    const nextPanY = Math.round(viewCenterY - cardCenterY * desiredZoom);

    triggerSmoothZoom();
    zoomRef.current = desiredZoom;
    panRef.current = { x: nextPanX, y: nextPanY };
    setZoom(desiredZoom);
    setPan({ x: nextPanX, y: nextPanY });
    setSelectedId(elementId);
  };

  const resetView = () => {
    triggerSmoothZoom();
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  const dark = theme === 'dark';

  const sourceCard = connectSourceId ? elements.find(e => e.id === connectSourceId) : null;
  const sourceCardTitle = sourceCard
    ? (sourceCard.content?.title || sourceCard.content?.text || sourceCard.content?.label || sourceCard.type)
    : '';

  // ─────────────────────────── Render ───────────────────────────
  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-rose-500" />
        <p className="text-xs font-bold uppercase tracking-widest">Loading Canvas...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative overflow-hidden flex flex-col transition-colors duration-300 ${dark ? 'bg-zinc-950 text-zinc-100' : 'bg-[#f4f4f2] text-zinc-900'}`}
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.txt,.doc,.docx"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Top bar */}
      <div className={`w-full h-14 px-4 flex items-center justify-between border-b shrink-0 select-none z-[120] ${dark ? 'bg-zinc-950/90 border-zinc-800/80' : 'bg-white/90 border-zinc-200/80'} backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToBoards}
            className={`flex items-center gap-2 px-3.5 py-1.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-[background-color,transform] active:scale-95 cursor-pointer ${dark ? 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-white' : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-800 shadow-sm'}`}
          >
            <ArrowLeft className="w-3.5 h-3.5 text-rose-500" />
            <span>Catalog</span>
          </button>
          <div className={`h-4 w-px ${dark ? 'bg-zinc-700' : 'bg-zinc-300'}`} />
          <span className="text-xs font-black uppercase tracking-wider font-space-grotesk truncate max-w-[150px] sm:max-w-[260px]">{board.name}</span>
          <div className={`h-4 w-px ${dark ? 'bg-zinc-700' : 'bg-zinc-300'}`} />
          <div className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-[10px] font-black uppercase tracking-wider ${dark ? 'bg-zinc-900/40 border-white/10 text-zinc-400' : 'bg-zinc-100/50 border-zinc-200 text-zinc-500'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${savingStatus === 'synced' ? 'bg-emerald-500' : savingStatus === 'saving' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
            <span>{savingStatus === 'synced' ? 'Saved' : savingStatus === 'saving' ? 'Saving...' : 'Error'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Share button pulled to the left side with distinct separation */}
          {headerActions && (
            <div className="flex items-center gap-3 mr-1">
              {headerActions}
              <div className={`h-4 w-px ${dark ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
            </div>
          )}

          {/* Zoom controls: fully visible with distinct buttons [- 100% +] */}
          <div className={`flex items-center gap-1.5 px-2 py-1 border rounded-xl shadow-xs select-none ${dark ? 'bg-zinc-900/90 border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <button
              onClick={() => zoomBy(0.9)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all cursor-pointer shrink-0 ${dark ? 'bg-zinc-800/80 hover:bg-zinc-700 border-white/10 text-white shadow-xs' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-900 shadow-xs'}`}
              title="Zoom out (-)"
              aria-label="Zoom out"
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.75]" />
            </button>
            <button
              onClick={resetView}
              className={`px-2 py-0.5 text-xs font-black tabular-nums min-w-[50px] text-center rounded-md transition-colors cursor-pointer ${dark ? 'hover:bg-white/10 text-white' : 'hover:bg-zinc-100 text-zinc-900'}`}
              title="Reset zoom to 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => zoomBy(1.1)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all cursor-pointer shrink-0 ${dark ? 'bg-zinc-800/80 hover:bg-zinc-700 border-white/10 text-white shadow-xs' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-900 shadow-xs'}`}
              title="Zoom in (+)"
              aria-label="Zoom in"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.75]" />
            </button>
          </div>

          <div className={`h-4 w-px ${dark ? 'bg-zinc-800' : 'bg-zinc-300'}`} />

          <button onClick={toggleFullscreen} className={`w-9 h-9 flex items-center justify-center border rounded-xl transition-[background-color,transform] active:scale-95 cursor-pointer ${dark ? 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-white' : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-800 shadow-sm'}`} title="Fullscreen">
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setTheme(dark ? 'light' : 'dark')} className={`w-9 h-9 flex items-center justify-center border rounded-xl transition-[background-color,transform] active:scale-95 cursor-pointer ${dark ? 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-white' : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-800 shadow-sm'}`} title="Toggle theme">
            {dark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
          </button>
        </div>
      </div>

      {/* Canvas body: Full edge-to-edge workspace */}
      <div className="flex-1 relative min-h-0 w-full h-full flex overflow-hidden">
        {/* Infinite surface */}
        <div
          ref={surfaceRef}
          onMouseDown={handleSurfaceMouseDown}
          onMouseMove={(e) => {
            const canvasPos = screenToCanvas(e.clientX, e.clientY);
            lastPointerRef.current = canvasPos;
            if (activeTool === 'connect' && connectSourceId) {
              setConnectPointer(canvasPos);
            }
          }}
          onDoubleClick={(e) => {
            if ((e.target as HTMLElement).closest('[data-card="true"]')) return;
            if (activeTool !== 'select') return;
            addElement('note', undefined, screenToCanvas(e.clientX, e.clientY));
          }}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); if (!isDragOver) setIsDragOver(true); }}
          onDragLeave={(e) => { if (e.currentTarget === e.target) setIsDragOver(false); }}
          className={`relative flex-1 w-full h-full overflow-hidden select-none ${
            activeTool === 'connect'
              ? 'cursor-crosshair'
              : activeTool === 'delete'
              ? 'cursor-crosshair'
              : activeTool === 'hand' || isSpacePressed
              ? isPanning ? 'cursor-grabbing' : 'cursor-grab'
              : isPanning
              ? 'cursor-grabbing'
              : 'cursor-default'
          }`}
          style={{
            backgroundImage: dark
              ? `radial-gradient(circle, rgba(255, 255, 255, 0.14) 1.25px, transparent 1.25px), radial-gradient(circle at 50% 40%, rgba(255, 107, 0, 0.04) 0%, rgba(99, 102, 241, 0.02) 50%, transparent 85%)`
              : `radial-gradient(circle, rgba(0, 0, 0, 0.13) 1.25px, transparent 1.25px), radial-gradient(circle at 50% 40%, rgba(255, 107, 0, 0.03) 0%, transparent 75%)`,
            backgroundSize: `${28 * zoom}px ${28 * zoom}px, 100% 100%`,
            backgroundPosition: `${pan.x}px ${pan.y}px, 0 0`,
            touchAction: 'none',
            overscrollBehavior: 'none',
          }}
        >
          {/* Transformed content layer */}
          <div
            className={`absolute top-0 left-0 origin-top-left ${smoothZoom ? 'transition-transform duration-200 ease-out motion-reduce:transition-none' : ''}`}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            {/* Connectors (behind cards) */}
            <svg className="absolute top-0 left-0 overflow-visible pointer-events-none" style={{ width: 1, height: 1, zIndex: 1 }}>
              <defs>
                <marker
                  id="preview-arrowhead"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#6366F1" />
                </marker>
              </defs>

              {connectors.map(c => {
                const source = elements.find(e => e.id === c.source_element_id);
                const target = elements.find(e => e.id === c.target_element_id);
                if (!source || !target) return null;
                return (
                  <ConnectorLine
                    key={c.id}
                    connector={c}
                    source={source}
                    target={target}
                    onDelete={() => deleteConnector(c.id)}
                    onUpdate={(updates) => updateConnector(c.id, updates)}
                  />
                );
              })}

              {/* Live interactive sigmoid preview line while connecting */}
              {activeTool === 'connect' && connectSourceId && connectPointer && (() => {
                const sourceEl = elements.find(e => e.id === connectSourceId);
                if (!sourceEl) return null;
                const preview = computePreviewPath(sourceEl, connectPointer, defaultLineStyle);
                return (
                  <g className="pointer-events-none">
                    <circle cx={preview.start.x} cy={preview.start.y} r="4" fill="#6366F1" />
                    <path
                      d={preview.pathD}
                      fill="none"
                      stroke="#6366F1"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      className="animate-pulse"
                      markerEnd="url(#preview-arrowhead)"
                    />
                    <circle cx={preview.end.x} cy={preview.end.y} r="3" fill="#6366F1" />
                  </g>
                );
              })()}
            </svg>

            {/* Cards */}
            {elements.map(el => (
              <div key={el.id} data-card="true" style={{ position: 'absolute', left: 0, top: 0, zIndex: 2 }}>
                <CanvasCard
                  element={el}
                  theme={theme}
                  zoom={zoom}
                  isSelected={selectedId === el.id}
                  isConnectingSource={connectSourceId === el.id}
                  activeTool={activeTool}
                  onDrag={handleDrag}
                  onDragEnd={(id) => handleDragEnd(id)}
                  onResize={handleResize}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onClick={handleCardClick}
                  onZoomTo={zoomToElement}
                />
              </div>
            ))}
          </div>

          {/* Empty state */}
          {elements.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <div className="flex flex-col items-center max-w-md p-8 rounded-3xl border border-white/10 bg-zinc-950/60 backdrop-blur-xl shadow-2xl text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500/20 to-indigo-500/20 border border-white/15 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,107,0,0.2)]">
                  <LayoutGrid className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className={`text-base font-black font-space-grotesk tracking-tight mb-1.5 ${dark ? 'text-white' : 'text-zinc-900'}`}>
                  Your Creative Workspace
                </h3>
                <p className={`text-xs mb-6 max-w-xs leading-relaxed ${dark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Double-click anywhere to create a note, or pick a tool from the floating dock below.
                </p>
                <div className="grid grid-cols-2 gap-2 w-full text-left">
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] font-medium ${dark ? 'bg-zinc-900/60 border-white/10 text-zinc-300' : 'bg-white/80 border-zinc-200 text-zinc-700'}`}>
                    <span>Note / Card</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono">N</kbd>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] font-medium ${dark ? 'bg-zinc-900/60 border-white/10 text-zinc-300' : 'bg-white/80 border-zinc-200 text-zinc-700'}`}>
                    <span>Column Lane</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono">F</kbd>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] font-medium ${dark ? 'bg-zinc-900/60 border-white/10 text-zinc-300' : 'bg-white/80 border-zinc-200 text-zinc-700'}`}>
                    <span>Connect Lines</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono">L</kbd>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] font-medium ${dark ? 'bg-zinc-900/60 border-white/10 text-zinc-300' : 'bg-white/80 border-zinc-200 text-zinc-700'}`}>
                    <span>Touchpad Zoom</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono">Pinch</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Drag-over overlay */}
          {isDragOver && (
            <div className="absolute inset-3 z-[60] rounded-3xl border-2 border-dashed border-rose-500 bg-rose-500/10 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
              <Upload className="w-10 h-10 text-rose-500 mb-3" />
              <p className="text-sm font-black uppercase tracking-widest text-rose-500">Drop to add to canvas</p>
              <p className="text-xs mt-1 text-rose-400/80">Images, videos, files & links</p>
            </div>
          )}

          {/* Connect-mode floating interactive banner (positioned above bottom dock) */}
          {activeTool === 'connect' && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[140] flex items-center gap-3 px-4 py-2 bg-zinc-900/95 text-white text-xs font-bold rounded-full shadow-2xl border border-indigo-500/40 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
              {connectSourceId ? (
                <>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    <span>Connecting from: <span className="text-indigo-300 font-extrabold">{sourceCardTitle ? `"${sourceCardTitle}"` : 'Selected card'}</span></span>
                  </span>
                  <span className="text-zinc-400">• Click target card</span>
                  <button
                    onClick={() => { setConnectSourceId(null); setConnectPointer(null); }}
                    className="px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-2">
                    <Spline className="w-4 h-4 text-indigo-400" />
                    <span>Click any card to start curve connection</span>
                  </span>
                  <button
                    onClick={() => { setActiveTool('select'); setConnectSourceId(null); setConnectPointer(null); }}
                    className="px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] transition-colors"
                  >
                    Exit
                  </button>
                </>
              )}
            </div>
          )}

          {/* Delete-mode banner (positioned above bottom dock) */}
          {activeTool === 'delete' && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[140] flex items-center gap-3 px-4 py-2 bg-red-950/90 text-white text-xs font-bold rounded-full shadow-2xl border border-red-500/40 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Click any card to delete it</span>
              </span>
              <button
                onClick={() => setActiveTool('select')}
                className="px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] transition-colors"
              >
                Exit
              </button>
            </div>
          )}

          {/* Figma UI3 Floating Bottom Toolbar Dock */}
          <FigmaCanvasToolbar
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            onAddElement={addElement}
            onConnectToggle={() => {
              setActiveTool(t => (t === 'connect' ? 'select' : 'connect'));
              setConnectSourceId(null);
              setConnectPointer(null);
            }}
            onDeleteToggle={() => {
              setActiveTool(t => (t === 'delete' ? 'select' : 'delete'));
              setConnectSourceId(null);
              setConnectPointer(null);
            }}
            onUploadClick={() => fileInputRef.current?.click()}
            dark={dark}
            defaultLineStyle={defaultLineStyle}
            setDefaultLineStyle={setDefaultLineStyle}
            connectSourceId={connectSourceId}
          />
        </div>
      </div>
    </div>
  );
}
