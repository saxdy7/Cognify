'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Moon, Sun, Loader2, Maximize, Minimize, Plus, Minus,
  StickyNote, Link as LinkIcon, CheckSquare, Spline, LayoutGrid, Columns,
  MessageSquare, MoreHorizontal, Image as ImageIcon, Upload, Trash2,
  MousePointer2, Type, Video, FileText, Frame, Pencil, Code2,
} from 'lucide-react';
import { CanvasBoard, CanvasElement, CanvasConnector } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CanvasCard } from './CanvasCards';
import { ConnectorLine } from './ConnectorLine';

interface MilanoteCanvasProps {
  board: CanvasBoard;
  onBackToBoards: () => void;
  userId: string;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

type Tool = 'select' | 'connect' | 'delete';

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
};

interface ToolbarItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  type?: string;        // element type to create
  action?: 'connect' | 'delete';
  preset?: any;         // extra content merged in
}

const MAIN_TOOLS: ToolbarItem[] = [
  { key: 'note', label: 'Note', icon: <StickyNote className="w-5 h-5" />, type: 'note' },
  { key: 'link', label: 'Link', icon: <LinkIcon className="w-5 h-5" />, type: 'link' },
  { key: 'todo', label: 'To-do', icon: <CheckSquare className="w-5 h-5" />, type: 'todo' },
  { key: 'line', label: 'Line', icon: <Spline className="w-5 h-5" />, action: 'connect' },
  { key: 'sketch', label: 'Draw', icon: <Pencil className="w-5 h-5" />, type: 'sketch' },
  { key: 'board', label: 'Board', icon: <LayoutGrid className="w-5 h-5" />, type: 'board_link' },
  { key: 'column', label: 'Column', icon: <Columns className="w-5 h-5" />, type: 'column' },
  { key: 'comment', label: 'Comment', icon: <MessageSquare className="w-5 h-5" />, type: 'note', preset: { content: { title: 'Comment', body: '' }, color: '#DBEAFE' } },
];

const MORE_TOOLS: ToolbarItem[] = [
  { key: 'heading', label: 'Heading', icon: <Type className="w-4 h-4" />, type: 'heading' },
  { key: 'text', label: 'Text', icon: <Type className="w-4 h-4" />, type: 'text' },
  { key: 'video', label: 'Video', icon: <Video className="w-4 h-4" />, type: 'link', preset: { width: 320, height: 200 } },
  { key: 'document', label: 'Document', icon: <FileText className="w-4 h-4" />, type: 'file' },
  { key: 'code', label: 'Code', icon: <Code2 className="w-4 h-4" />, type: 'code' },
  { key: 'frame', label: 'Frame', icon: <Frame className="w-4 h-4" />, type: 'column' },
];

const BOTTOM_TOOLS: ToolbarItem[] = [
  { key: 'image', label: 'Add image', icon: <ImageIcon className="w-5 h-5" />, type: 'image' },
  { key: 'upload', label: 'Upload', icon: <Upload className="w-5 h-5" />, type: 'file' },
];

export function MilanoteCanvas({ board, onBackToBoards, userId, theme, setTheme }: MilanoteCanvasProps) {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [connectors, setConnectors] = useState<CanvasConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<'synced' | 'saving' | 'error'>('synced');

  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  // Viewport (pan + zoom)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Refs so global paste/drop handlers always read the latest viewport
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  // Keep latest elements/connectors accessible inside async + event handlers
  const elementsRef = useRef<CanvasElement[]>([]);
  useEffect(() => { elementsRef.current = elements; }, [elements]);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ─────────────────────────── Load board data ───────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [elRes, coRes] = await Promise.all([
          supabase.from('canvas_elements').select('*').eq('board_id', board.id).order('created_at', { ascending: true }),
          supabase.from('canvas_connectors').select('*').eq('board_id', board.id),
        ]);
        if (elRes.error) throw elRes.error;
        if (coRes.error) throw coRes.error;
        if (cancelled) return;

        let loaded = elRes.data || [];
        // Seed a template the first time an empty templated board is opened
        if (loaded.length === 0 && board.tldraw_snapshot?.isNewTemplate) {
          loaded = await seedTemplate(board.tldraw_snapshot.templateId);
        }
        setElements(loaded);
        setConnectors(coRes.data || []);
      } catch (err: any) {
        console.error('Error loading canvas:', err);
        toast.error('Failed to load canvas: ' + (err.message || 'unknown error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.id]);

  // Fullscreen sync
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Clean up pending timers on unmount
  useEffect(() => {
    const timers = saveTimers.current;
    return () => { Object.values(timers).forEach(clearTimeout); };
  }, []);

  // ─────────────────────────── Persistence ───────────────────────────
  const persistUpdate = useCallback((id: string, immediate = false) => {
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    const run = async () => {
      const el = elementsRef.current.find(e => e.id === id);
      if (!el) return;
      setSavingStatus('saving');
      try {
        const { error } = await supabase
          .from('canvas_elements')
          .update({
            x: el.x, y: el.y, width: el.width, height: el.height,
            color: el.color, content: el.content, updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        if (error) throw error;
        setSavingStatus('synced');
      } catch (err) {
        console.error('Save failed:', err);
        setSavingStatus('error');
      }
    };
    if (immediate) run();
    else saveTimers.current[id] = setTimeout(run, 700);
  }, []);

  const screenToCanvasCenter = useCallback(() => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return { x: 200, y: 200 };
    return {
      x: (rect.width / 2 - panRef.current.x) / zoomRef.current,
      y: (rect.height / 2 - panRef.current.y) / zoomRef.current,
    };
  }, []);

  // Convert a screen (clientX/Y) point into canvas coordinates
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

    // Optimistic temp element
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
    if (id.startsWith('temp-')) return;
    try {
      await supabase.from('canvas_elements').delete().eq('id', id);
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete card');
    }
  }, [selectedId]);

  // ─────────────────────────── Paste / Drop (images, links, text, files) ───────────────────────────
  // Upload an image/video to Supabase storage; fall back to an inline base64 data URL
  const uploadMedia = useCallback(async (file: File): Promise<string> => {
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const { error } = await supabase.storage.from('canvas-assets').upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('canvas-assets').getPublicUrl(path);
      return publicUrl;
    } catch {
      // Storage bucket missing / blocked → embed as base64 so it still works
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
      console.error('Image paste/drop failed:', err);
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
    let hostname = 'link';
    try { hostname = new URL(url).hostname.replace(/^www\./, ''); } catch { /* keep default */ }
    const baseContent = {
      url,
      title: hostname,
      description: '',
      image: '',
      favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
    };
    const el = await addElement('link', { width: 300, height: 220, content: baseContent }, at);
    if (!el) return;
    // Enrich with real metadata (title / preview image). Harmless for video links — the card embeds those directly.
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const d = await res.json();
        handleUpdate(el.id, {
          content: {
            url,
            title: d.title || hostname,
            description: d.description || '',
            image: d.preview_image_url || '',
            favicon: d.logo_url || baseContent.favicon,
          },
        });
      }
    } catch { /* metadata is best-effort */ }
  }, [addElement, handleUpdate]);

  const createNoteFromText = useCallback(async (text: string, at?: { x: number; y: number }) => {
    await addElement('note', { content: { title: '', body: text } }, at);
  }, [addElement]);

  // Global paste handler
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const cd = e.clipboardData;
      if (!cd) return;

      // 1) Image from clipboard (screenshots, copied images)
      const imageItem = Array.from(cd.items || []).find(i => i.type.startsWith('image/'));
      const fileImage = Array.from(cd.files || []).find(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
      const at = lastPointerRef.current || undefined;

      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) { e.preventDefault(); await createImageFromFile(file, at); return; }
      }
      if (fileImage) { e.preventDefault(); await createImageFromFile(fileImage, at); return; }

      // 2) Text / URL — but don't hijack paste while editing a card field
      const active = document.activeElement as HTMLElement | null;
      const editing = !!active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (editing) return;

      const text = (cd.getData('text/plain') || '').trim();
      if (!text) return;
      e.preventDefault();
      if (/^https?:\/\/\S+$/i.test(text)) await createLinkFromUrl(text, at);
      else await createNoteFromText(text, at);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [createImageFromFile, createLinkFromUrl, createNoteFromText]);

  // Drag & drop onto the surface
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const at = screenToCanvas(e.clientX, e.clientY);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) {
      let i = 0;
      for (const f of files) {
        const spot = { x: at.x + i * 24, y: at.y + i * 24 };
        if (f.type.startsWith('image/') || f.type.startsWith('video/')) await createImageFromFile(f, spot);
        else await createFileFromFile(f, spot);
        i++;
      }
      return;
    }
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (url && /^https?:\/\/\S+$/i.test(url.trim())) await createLinkFromUrl(url.trim(), at);
    else if (url) await createNoteFromText(url.trim(), at);
  }, [screenToCanvas, createImageFromFile, createFileFromFile, createLinkFromUrl, createNoteFromText]);

  // ─────────────────────────── Connectors ───────────────────────────
  const createConnector = useCallback(async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const exists = connectors.some(
      c => (c.source_element_id === sourceId && c.target_element_id === targetId) ||
           (c.source_element_id === targetId && c.target_element_id === sourceId)
    );
    if (exists) { toast.info('These cards are already connected'); return; }

    const row = {
      board_id: board.id,
      source_element_id: sourceId,
      target_element_id: targetId,
      color: '#5B6CF9',
      style: 'curved',
    };
    try {
      const { data, error } = await supabase.from('canvas_connectors').insert([row]).select().single();
      if (error) throw error;
      setConnectors(prev => [...prev, data as CanvasConnector]);
    } catch (err: any) {
      console.error('Connector create failed:', err);
      toast.error('Failed to create line: ' + (err.message || 'unknown error'));
    }
  }, [board.id, connectors]);

  const deleteConnector = useCallback(async (id: string) => {
    setConnectors(prev => prev.filter(c => c.id !== id));
    try {
      await supabase.from('canvas_connectors').delete().eq('id', id);
    } catch (err) {
      console.error('Connector delete failed:', err);
    }
  }, []);

  // Card click — behavior depends on the active tool
  const handleCardClick = useCallback((id: string) => {
    if (activeTool === 'delete') { handleDelete(id); return; }
    if (activeTool === 'connect') {
      if (!connectSourceId) {
        setConnectSourceId(id);
        toast.info('Now click a second card to connect');
      } else {
        createConnector(connectSourceId, id);
        setConnectSourceId(null);
      }
      return;
    }
    setSelectedId(id);
  }, [activeTool, connectSourceId, handleDelete, createConnector]);

  // ─────────────────────────── Pan & Zoom ───────────────────────────
  const handleSurfaceMouseDown = useCallback((e: React.MouseEvent) => {
    // Ignore clicks that originate inside a card
    if ((e.target as HTMLElement).closest('[data-card="true"]')) return;

    setSelectedId(null);
    if (activeTool === 'connect') { setConnectSourceId(null); }

    // Begin panning (left button on empty space, or middle button anywhere)
    if (e.button === 1 || activeTool === 'select') {
      setIsPanning(true);
      const start = { x: e.clientX, y: e.clientY };
      const startPan = { ...pan };
      const move = (me: MouseEvent) => {
        setPan({ x: startPan.x + (me.clientX - start.x), y: startPan.y + (me.clientY - start.y) });
      };
      const up = () => {
        setIsPanning(false);
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    }
  }, [activeTool, pan]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom toward cursor
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(3, Math.max(0.2, zoom * factor));
      // keep the point under the cursor stationary
      const worldX = (cx - pan.x) / zoom;
      const worldY = (cy - pan.y) / zoom;
      setPan({ x: cx - worldX * newZoom, y: cy - worldY * newZoom });
      setZoom(newZoom);
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  }, [pan, zoom]);

  const zoomBy = (factor: number) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : 0;
    const cy = rect ? rect.height / 2 : 0;
    const newZoom = Math.min(3, Math.max(0.2, zoom * factor));
    const worldX = (cx - pan.x) / zoom;
    const worldY = (cy - pan.y) / zoom;
    setPan({ x: cx - worldX * newZoom, y: cy - worldY * newZoom });
    setZoom(newZoom);
  };

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // ─────────────────────────── Toolbar handler ───────────────────────────
  const handleToolClick = (item: ToolbarItem) => {
    setShowMore(false);
    if (item.action === 'connect') {
      setActiveTool(t => (t === 'connect' ? 'select' : 'connect'));
      setConnectSourceId(null);
      return;
    }
    if (item.type) {
      setActiveTool('select');
      addElement(item.type, item.preset);
    }
  };

  // ─────────────────────────── Template seeding ───────────────────────────
  const seedTemplate = async (templateId: string): Promise<CanvasElement[]> => {
    const T: Record<string, any[]> = {
      moodboard: [
        { type: 'text', x: 100, y: 60, width: 320, height: 60, color: '#FFFFFF', content: { text: 'Creative Moodboard' } },
        { type: 'note', x: 100, y: 150, width: 260, height: 200, color: '#FFEDD5', content: { title: 'Brand Theme', body: 'Modern typography, warm pastel colors, glassmorphism UI.' } },
        { type: 'image', x: 400, y: 150, width: 320, height: 240, color: '#FFFFFF', content: { src: '' } },
        { type: 'link', x: 100, y: 380, width: 280, height: 200, color: '#FFFFFF', content: { url: '' } },
      ],
      kanban: [
        { type: 'column', x: 80, y: 80, width: 300, height: 460, color: '#FFFFFF', content: { title: 'To Do' } },
        { type: 'column', x: 410, y: 80, width: 300, height: 460, color: '#FFFFFF', content: { title: 'In Progress' } },
        { type: 'column', x: 740, y: 80, width: 300, height: 460, color: '#FFFFFF', content: { title: 'Completed' } },
        { type: 'todo', x: 110, y: 160, width: 240, height: 220, color: '#FFFFFF', content: { title: 'Launch Checklist', tasks: [{ id: '1', text: 'Define branding', completed: true }, { id: '2', text: 'Configure Supabase', completed: false }] } },
      ],
      retro: [
        { type: 'column', x: 80, y: 80, width: 300, height: 460, color: '#FFFFFF', content: { title: 'What Went Well' } },
        { type: 'column', x: 410, y: 80, width: 300, height: 460, color: '#FFFFFF', content: { title: 'What to Improve' } },
        { type: 'column', x: 740, y: 80, width: 300, height: 460, color: '#FFFFFF', content: { title: 'Action Items' } },
        { type: 'note', x: 110, y: 160, width: 240, height: 120, color: '#DCFCE7', content: { title: 'Great velocity', body: 'Features completed ahead of schedule' } },
        { type: 'note', x: 440, y: 160, width: 240, height: 120, color: '#FEE2E2', content: { title: 'Test coverage', body: 'Missing edge case validation' } },
      ],
      brainstorm: [
        { type: 'note', x: 450, y: 280, width: 260, height: 140, color: '#F3E8FF', content: { title: 'Core Concept', body: 'Evolving Cognify into a visual hub.' } },
        { type: 'note', x: 130, y: 120, width: 240, height: 120, color: '#DBEAFE', content: { title: 'Feature: Passwords', body: 'Secure credential manager.' } },
        { type: 'note', x: 780, y: 120, width: 240, height: 120, color: '#FEF9C3', content: { title: 'Feature: Canvas', body: 'Visual boards with connectors.' } },
      ],
    };
    const seeds = T[templateId];
    if (!seeds) return [];
    try {
      const rows = seeds.map(s => ({ board_id: board.id, ...s }));
      const { data, error } = await supabase.from('canvas_elements').insert(rows).select();
      if (error) throw error;
      return (data as CanvasElement[]) || [];
    } catch (err) {
      console.error('Template seed failed:', err);
      return [];
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  const dark = theme === 'dark';

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
    >
      {/* Top bar */}
      <div className={`w-full h-14 px-4 flex items-center justify-between border-b shrink-0 select-none z-[120] ${dark ? 'bg-zinc-950/90 border-zinc-800/80' : 'bg-white/90 border-zinc-200/80'} backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToBoards}
            className={`flex items-center gap-2 px-3.5 py-1.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${dark ? 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-white' : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-800 shadow-sm'}`}
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

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className={`flex items-center gap-0.5 p-0.5 border rounded-xl ${dark ? 'bg-zinc-900/80 border-white/10' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <button onClick={() => zoomBy(0.9)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors" title="Zoom out"><Minus className="w-3.5 h-3.5" /></button>
            <button onClick={resetView} className="px-2 text-[10px] font-black tabular-nums w-12 text-center" title="Reset view">{Math.round(zoom * 100)}%</button>
            <button onClick={() => zoomBy(1.1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors" title="Zoom in"><Plus className="w-3.5 h-3.5" /></button>
          </div>
          <button onClick={toggleFullscreen} className={`w-9 h-9 flex items-center justify-center border rounded-xl transition-all active:scale-95 ${dark ? 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-white' : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-800 shadow-sm'}`} title="Fullscreen">
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setTheme(dark ? 'light' : 'dark')} className={`w-9 h-9 flex items-center justify-center border rounded-xl transition-all active:scale-95 ${dark ? 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-white' : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-800 shadow-sm'}`} title="Toggle theme">
            {dark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
          </button>
        </div>
      </div>

      {/* Canvas body */}
      <div className="flex-1 relative min-h-0 flex">
        {/* Left toolbar */}
        <div className={`relative z-[110] w-[72px] shrink-0 border-r flex flex-col items-center py-3 gap-1 overflow-y-auto ${dark ? 'bg-zinc-950/95 border-zinc-800/80' : 'bg-white/95 border-zinc-200/80'} backdrop-blur-md`}>
          <ToolbarButton dark={dark} active={activeTool === 'select'} label="Select" onClick={() => { setActiveTool('select'); setConnectSourceId(null); }}>
            <MousePointer2 className="w-5 h-5" />
          </ToolbarButton>
          <div className={`w-8 h-px my-1 ${dark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

          {MAIN_TOOLS.map(item => (
            <ToolbarButton key={item.key} dark={dark} active={item.action === 'connect' && activeTool === 'connect'} label={item.label} onClick={() => handleToolClick(item)}>
              {item.icon}
            </ToolbarButton>
          ))}

          {/* More popover */}
          <div className="relative">
            <ToolbarButton dark={dark} active={showMore} label="More" onClick={() => setShowMore(s => !s)}>
              <MoreHorizontal className="w-5 h-5" />
            </ToolbarButton>
            {showMore && (
              <div className={`absolute left-[64px] top-0 z-[130] grid grid-cols-2 gap-1 p-2 rounded-2xl shadow-2xl border ${dark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'}`} style={{ width: 200 }}>
                {MORE_TOOLS.map(item => (
                  <button key={item.key} onClick={() => handleToolClick(item)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${dark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700'}`}>
                    {item.icon}
                    <span className="text-[10px] font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={`w-8 h-px my-1 ${dark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
          {BOTTOM_TOOLS.map(item => (
            <ToolbarButton key={item.key} dark={dark} label={item.label} onClick={() => handleToolClick(item)}>
              {item.icon}
            </ToolbarButton>
          ))}

          <div className="mt-auto" />
          <ToolbarButton dark={dark} active={activeTool === 'delete'} label="Delete" danger onClick={() => { setActiveTool(t => (t === 'delete' ? 'select' : 'delete')); setConnectSourceId(null); }}>
            <Trash2 className="w-5 h-5" />
          </ToolbarButton>
        </div>

        {/* Infinite surface */}
        <div
          ref={surfaceRef}
          onMouseDown={handleSurfaceMouseDown}
          onMouseMove={(e) => { lastPointerRef.current = screenToCanvas(e.clientX, e.clientY); }}
          onDoubleClick={(e) => {
            if ((e.target as HTMLElement).closest('[data-card="true"]')) return;
            if (activeTool !== 'select') return;
            addElement('note', undefined, screenToCanvas(e.clientX, e.clientY));
          }}
          onWheel={handleWheel}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); if (!isDragOver) setIsDragOver(true); }}
          onDragLeave={(e) => { if (e.currentTarget === e.target) setIsDragOver(false); }}
          className={`relative flex-1 overflow-hidden ${activeTool === 'connect' ? 'cursor-crosshair' : activeTool === 'delete' ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            backgroundImage: `radial-gradient(circle, ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'} 1px, transparent 1px)`,
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        >
          {/* Transformed content layer */}
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            {/* Connectors (behind cards) */}
            <svg className="absolute top-0 left-0 overflow-visible pointer-events-none" style={{ width: 1, height: 1, zIndex: 1 }}>
              {connectors.map(c => {
                const source = elements.find(e => e.id === c.source_element_id);
                const target = elements.find(e => e.id === c.target_element_id);
                if (!source || !target) return null;
                return (
                  <ConnectorLine key={c.id} connector={c} source={source} target={target} onDelete={() => deleteConnector(c.id)} />
                );
              })}
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
                />
              </div>
            ))}
          </div>

          {/* Empty state */}
          {elements.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <LayoutGrid className={`w-10 h-10 mb-3 ${dark ? 'text-zinc-700' : 'text-zinc-300'}`} />
              <p className={`text-sm font-bold ${dark ? 'text-zinc-600' : 'text-zinc-400'}`}>Your canvas is empty</p>
              <p className={`text-xs mt-1 ${dark ? 'text-zinc-700' : 'text-zinc-400'}`}>Pick a tool on the left, or paste / drop an image or link</p>
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

          {/* Connect-mode hint */}
          {activeTool === 'connect' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-full shadow-lg pointer-events-none">
              {connectSourceId ? 'Click a second card to connect' : 'Click the first card to start a line'}
            </div>
          )}
          {activeTool === 'delete' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg pointer-events-none">
              Click any card to delete it
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  children, label, onClick, active, danger, dark,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  dark: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`group relative w-14 flex flex-col items-center gap-1 py-2 rounded-xl transition-colors ${
        active
          ? danger ? 'bg-red-500 text-white' : 'bg-rose-500 text-white'
          : dark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
      }`}
    >
      {children}
      <span className="text-[9px] font-bold leading-none">{label}</span>
    </button>
  );
}
