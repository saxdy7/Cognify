'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Link as LinkIcon,
  ExternalLink, FileText, Download, Palette,
  Image as ImageIcon, Search, ChevronRight, FolderOpen,
  Pencil, Eraser, Undo2, Code2
} from 'lucide-react';
import { CanvasElement } from '@/types';
import { toast } from 'sonner';

interface MediaEmbed {
  type: 'youtube' | 'instagram' | 'vimeo' | 'video';
  embedUrl: string;
}

function getMediaEmbedInfo(url: string): MediaEmbed | null {
  if (!url) return null;
  const lowerUrl = url.toLowerCase().trim();

  // 1. YouTube Matches
  let youtubeId = '';
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      youtubeId = match[2];
    } else if (lowerUrl.includes('/shorts/')) {
      const parts = url.split('/shorts/');
      if (parts.length > 1) {
        youtubeId = parts[1].split(/[?#]/)[0];
      }
    }
  }
  if (youtubeId) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=1`
    };
  }

  // 2. Instagram Matches
  if (lowerUrl.includes('instagram.com/p/') || lowerUrl.includes('instagram.com/reel/')) {
    const match = url.match(/instagram\.com\/(p|reel)\/([^/]+)/);
    if (match) {
      const id = match[2];
      return {
        type: 'instagram',
        embedUrl: `https://www.instagram.com/p/${id}/embed`
      };
    }
  }

  // 3. Vimeo Matches
  if (lowerUrl.includes('vimeo.com')) {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) {
      const id = match[1];
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1`
      };
    }
  }

  // 4. Raw Video Files
  if (
    lowerUrl.endsWith('.mp4') || 
    lowerUrl.endsWith('.webm') || 
    lowerUrl.endsWith('.ogg') || 
    lowerUrl.includes('data:video/')
  ) {
    return {
      type: 'video',
      embedUrl: url
    };
  }

  return null;
}

interface CanvasCardProps {
  element: CanvasElement;
  theme?: 'light' | 'dark';
  zoom?: number;
  isSelected?: boolean;
  onDrag: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
  isConnectingSource: boolean;
  activeTool: 'select' | 'connect' | 'delete' | 'hand';
}

const PASTEL_COLORS = [
  { name: 'White', value: '#FFFFFF', darkValue: '#262626' },
  { name: 'Yellow', value: '#FEF9C3', darkValue: '#451a03' },
  { name: 'Orange', value: '#FFEDD5', darkValue: '#431407' },
  { name: 'Red', value: '#FEE2E2', darkValue: '#4c0519' },
  { name: 'Green', value: '#DCFCE7', darkValue: '#022c22' },
  { name: 'Teal', value: '#CCFBF1', darkValue: '#134e4a' },
  { name: 'Blue', value: '#DBEAFE', darkValue: '#1e3a8a' },
  { name: 'Purple', value: '#F3E8FF', darkValue: '#3b0764' },
];

export const CanvasCard = React.memo(function CanvasCard({
  element,
  theme = 'light',
  zoom = 1,
  isSelected = false,
  onDrag,
  onDragEnd,
  onResize,
  onUpdate,
  onDelete,
  onClick,
  isConnectingSource,
  activeTool
}: CanvasCardProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Custom free image search states
  const [imageSearch, setImageSearch] = useState('');
  const [isSearchingImages, setIsSearchingImages] = useState(false);

  // Manual drag state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, elX: 0, elY: 0 });
  const hasDraggedRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragRafRef = useRef<number | null>(null);
  const pendingDragPosRef = useRef<{ x: number; y: number } | null>(null);

  // Resize state
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ w: 0, h: 0, x: 0, y: 0 });
  const resizeRafRef = useRef<number | null>(null);
  const pendingResizeRef = useRef<{ w: number; h: number } | null>(null);

  // Cancel any in-flight rAF batches on unmount so a late frame never fires
  // onDrag/onResize for an element that's already gone.
  useEffect(() => {
    return () => {
      if (dragRafRef.current != null) cancelAnimationFrame(dragRafRef.current);
      if (resizeRafRef.current != null) cancelAnimationFrame(resizeRafRef.current);
    };
  }, []);

  const isBorderless = element.type === 'text' || 
                       (element.type === 'image' && !!element.content.src) ||
                       (element.type === 'link' && !!getMediaEmbedInfo(element.content.url));

  // ─── Manual Drag (zoom-aware) ───
  const handleCardMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start drag on inputs, textareas, buttons, or contenteditable
    const target = e.target as HTMLElement;
    const tag = target.tagName;
    if (
      tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A' ||
      tag === 'LABEL' || tag === 'SELECT' || tag === 'IFRAME' || tag === 'VIDEO' ||
      target.isContentEditable ||
      target.closest('button') || target.closest('a') || target.closest('label') ||
      target.closest('iframe') || target.closest('video') ||
      target.closest('[data-no-drag="true"]') ||
      target.dataset.resizeHandle === 'true'
    ) {
      return;
    }

    if (activeTool !== 'select') return;

    e.stopPropagation();
    e.preventDefault();

    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: element.x,
      elY: element.y
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = (moveEvent.clientX - dragStartRef.current.mouseX) / zoom;
      const deltaY = (moveEvent.clientY - dragStartRef.current.mouseY) / zoom;

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        hasDraggedRef.current = true;
      }

      const newX = dragStartRef.current.elX + deltaX;
      const newY = dragStartRef.current.elY + deltaY;
      // Cap state updates to one per animation frame — mousemove can fire far
      // faster than the display refresh rate on high-poll-rate mice/trackpads.
      pendingDragPosRef.current = { x: newX, y: newY };
      if (dragRafRef.current == null) {
        dragRafRef.current = requestAnimationFrame(() => {
          dragRafRef.current = null;
          if (pendingDragPosRef.current) onDrag(element.id, pendingDragPosRef.current.x, pendingDragPosRef.current.y);
        });
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (dragRafRef.current != null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }

      if (hasDraggedRef.current) {
        const finalPos = pendingDragPosRef.current;
        onDragEnd(element.id, finalPos?.x ?? element.x, finalPos?.y ?? element.y);
      }
      pendingDragPosRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [element.id, element.x, element.y, zoom, activeTool, onDrag, onDragEnd]);

  // ─── Resize handler ───
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isResizingRef.current = true;
    resizeStartRef.current = {
      w: element.width || 280,
      h: element.height || 180,
      x: e.clientX,
      y: e.clientY
    };

    const handleResizeMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - resizeStartRef.current.x) / zoom;
      const deltaY = (moveEvent.clientY - resizeStartRef.current.y) / zoom;
      const newWidth = Math.max(140, resizeStartRef.current.w + deltaX);
      const newHeight = Math.max(60, resizeStartRef.current.h + deltaY);
      pendingResizeRef.current = { w: newWidth, h: newHeight };
      if (resizeRafRef.current == null) {
        resizeRafRef.current = requestAnimationFrame(() => {
          resizeRafRef.current = null;
          if (pendingResizeRef.current) onResize(element.id, pendingResizeRef.current.w, pendingResizeRef.current.h);
        });
      }
    };

    const handleResizeEnd = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
      if (resizeRafRef.current != null) {
        cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = null;
      }
      pendingResizeRef.current = null;
    };

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  };

  // Free image search
  const handleSearchFreeImages = (query: string) => {
    if (!query) return;
    setIsSearchingImages(true);
    setTimeout(() => {
      const randomId = Math.floor(Math.random() * 1000);
      const sourceUrl = `https://images.unsplash.com/photo-${randomId % 2 === 0 ? '1507525428034-b723cf961d3e' : '1498050108023-c5249f4df085'}?auto=format&fit=crop&w=600&q=80&sig=${randomId}`;
      onUpdate(element.id, {
        content: { ...element.content, src: sourceUrl, caption: `Free image: "${query}"` }
      });
      setIsSearchingImages(false);
      toast.success('Free image inserted');
    }, 1000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success(`File "${file.name}" uploaded`);
      onUpdate(element.id, {
        content: {
          ...element.content,
          fileName: file.name,
          fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          fileType: file.type || 'document'
        }
      });
    }
  };

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error('Please select an image or video file');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        if (base64Url) {
          onUpdate(element.id, {
            content: { ...element.content, src: base64Url, caption: file.name }
          });
          toast.success(file.type.startsWith('video/') ? 'Video uploaded' : 'Image uploaded');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Link metadata parser
  const handleLoadLinkPreview = (url: string) => {
    if (!url) return;
    toast.info('Fetching preview...');
    setTimeout(() => {
      let hostname = 'website.com';
      try {
        hostname = new URL(url).hostname;
      } catch {}
      onUpdate(element.id, {
        content: {
          url,
          title: `${hostname}`,
          description: 'A shared visual board curated with mood boards, checklist logs, and visual summaries.',
          image: `https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80`,
          favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
        }
      });
      toast.success('Preview loaded');
    }, 1200);
  };

  // ─── Card content renderers ───
  const renderCardContent = () => {
    switch (element.type) {
      case 'note':
        return (
          <div className="flex flex-col h-full select-text pointer-events-auto">
            <input
              type="text"
              value={element.content.title || ''}
              onChange={(e) => onUpdate(element.id, { content: { ...element.content, title: e.target.value } })}
              placeholder="Note Title"
              className={`w-full bg-transparent font-semibold text-sm outline-none pb-1.5 mb-2 ${
                theme === 'dark' 
                  ? 'text-zinc-100 border-b border-zinc-700/40 placeholder:text-zinc-600' 
                  : 'text-zinc-800 border-b border-zinc-200/60 placeholder:text-zinc-400'
              }`}
            />
            <textarea
              value={element.content.body || ''}
              onChange={(e) => onUpdate(element.id, { content: { ...element.content, body: e.target.value } })}
              placeholder="Type your notes..."
              className={`w-full flex-1 bg-transparent text-xs leading-relaxed outline-none resize-none ${
                theme === 'dark' ? 'text-zinc-300 placeholder:text-zinc-600' : 'text-zinc-600 placeholder:text-zinc-400'
              }`}
            />
          </div>
        );

      case 'text':
        return (
          <div className="flex items-center h-full select-text pointer-events-auto">
            <textarea
              value={element.content.text || ''}
              onChange={(e) => onUpdate(element.id, { content: { ...element.content, text: e.target.value } })}
              placeholder="Label text..."
              className={`w-full bg-transparent font-semibold text-base text-center outline-none resize-none ${
                theme === 'dark' ? 'text-white placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-400'
              }`}
            />
          </div>
        );

      case 'image':
        const isVideo = element.content.src?.startsWith('data:video/') || 
                        element.content.src?.endsWith('.mp4') || 
                        element.content.src?.endsWith('.webm') || 
                        element.content.src?.endsWith('.ogg') ||
                        (element.content.src && !element.content.src.includes('unsplash.com') && !element.content.src.includes('photo-') && 
                         (element.content.src.includes('.mp4') || element.content.src.includes('.mov') || element.content.src.includes('.webm')));
                         
        return (
          <div className="flex flex-col h-full pointer-events-auto">
            {element.content.src ? (
              <div className="flex-1 relative group/img overflow-hidden flex flex-col bg-black rounded-xl">
                {isVideo ? (
                  <video
                    src={element.content.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="flex-1 w-full object-cover min-h-0"
                  />
                ) : (
                  <img
                    src={element.content.src}
                    alt={element.content.caption || 'Canvas Image'}
                    className="flex-1 w-full object-cover min-h-0"
                  />
                )}
                {/* Caption overlay on hover */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity">
                  <input
                    type="text"
                    value={element.content.caption || ''}
                    onChange={(e) => onUpdate(element.id, { content: { ...element.content, caption: e.target.value } })}
                    placeholder="Add caption..."
                    className="w-full bg-transparent text-[10px] text-white/90 font-medium text-center outline-none placeholder:text-white/40"
                  />
                </div>
                <button
                  onClick={() => onUpdate(element.id, { content: { ...element.content, src: '' } })}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center ${
                theme === 'dark' ? 'border-zinc-700 bg-zinc-800/20' : 'border-zinc-200 bg-zinc-50/50'
              }`}>
                <ImageIcon className="w-6 h-6 text-zinc-400 mb-1.5" />
                <span className={`text-[9px] font-semibold uppercase tracking-wider mb-2 ${
                  theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
                }`}>Insert Image</span>
                <div className={`flex items-center gap-1.5 w-full px-2.5 py-1.5 rounded-lg mb-2 ${
                  theme === 'dark' ? 'bg-zinc-800/80 border border-zinc-700/60' : 'bg-white border border-zinc-200/80'
                }`}>
                  <Search className="w-3.5 h-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search Unsplash..."
                    value={imageSearch}
                    onChange={(e) => setImageSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchFreeImages(imageSearch)}
                    className={`w-full bg-transparent text-[10px] font-medium outline-none ${
                      theme === 'dark' ? 'text-zinc-200 placeholder:text-zinc-600' : 'text-zinc-800 placeholder:text-zinc-500'
                    }`}
                  />
                </div>
                {isSearchingImages && <span className="text-[9px] text-blue-500 animate-pulse mb-2">Searching...</span>}
                <div className="text-[8px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">or</div>
                <label 
                  htmlFor={`image-upload-${element.id}`}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[9px] font-semibold uppercase tracking-wider rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Upload
                </label>
                <input
                  type="file"
                  id={`image-upload-${element.id}`}
                  accept="image/*,video/*"
                  onChange={handleLocalImageUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>
        );

      case 'link':
        const media = getMediaEmbedInfo(element.content.url);
        return (
          <div className="flex flex-col h-full pointer-events-auto">
            {media ? (
              <div className="flex-1 overflow-hidden relative w-full h-full bg-black rounded-xl">
                {media.type === 'video' ? (
                  <video
                    src={media.embedUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <iframe
                    src={media.embedUrl}
                    className="w-full h-full border-0"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    scrolling="no"
                  />
                )}
                {/* Small type label */}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-[7px] font-semibold uppercase text-white/70 tracking-wider rounded-md pointer-events-none">
                  {media.type}
                </div>
              </div>
            ) : element.content.title ? (
              <a
                href={element.content.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 flex flex-col rounded-lg overflow-hidden group/link p-3 ${
                  theme === 'dark' ? 'bg-zinc-800/30 border border-zinc-700/30' : 'bg-zinc-50/50 border border-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {element.content.favicon && (
                    <img src={element.content.favicon} className="w-4 h-4 rounded" alt="favicon" />
                  )}
                  <span className="text-[10px] font-medium text-blue-500 flex-1 truncate">
                    {element.content.url}
                  </span>
                  <ExternalLink className="w-3 h-3 text-zinc-400 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                </div>
                {element.content.image && (
                  <img src={element.content.image} className="w-full h-24 object-cover rounded-lg mb-2" alt="preview" />
                )}
                <h4 className={`text-xs font-semibold line-clamp-1 mb-1 leading-snug ${
                  theme === 'dark' ? 'text-white' : 'text-zinc-900'
                }`}>
                  {element.content.title}
                </h4>
                <p className={`text-[10px] line-clamp-2 leading-relaxed ${
                  theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                  {element.content.description}
                </p>
              </a>
            ) : (
              <div className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center ${
                theme === 'dark' ? 'border-zinc-700 bg-zinc-800/20' : 'border-zinc-200 bg-zinc-50/50'
              }`}>
                <LinkIcon className="w-7 h-7 text-zinc-400 mb-2" />
                <span className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${
                  theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
                }`}>Embed URL</span>
                <input
                  type="url"
                  placeholder="https://example.com"
                  onBlur={(e) => handleLoadLinkPreview(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadLinkPreview(e.currentTarget.value)}
                  className={`w-full px-3 py-2 rounded-lg text-[10px] font-medium outline-none ${
                    theme === 'dark' ? 'bg-zinc-800/80 border border-zinc-700/60 text-zinc-200' : 'bg-white border border-zinc-200 text-zinc-800'
                  }`}
                />
              </div>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="flex flex-col h-full pointer-events-auto justify-center">
            {element.content.fileName ? (
              <div className={`flex items-center gap-4 p-4 rounded-xl group/file ${
                theme === 'dark' ? 'bg-zinc-800/30 border border-zinc-700/30' : 'bg-zinc-50 border border-zinc-100'
              }`}>
                <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-xs font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                    {element.content.fileName}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{element.content.fileSize}</p>
                </div>
                <button
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                    theme === 'dark' ? 'bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700' : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
                  }`}
                  title="Download"
                  onClick={() => toast.success(`Downloading "${element.content.fileName}"`)}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center ${
                theme === 'dark' ? 'border-zinc-700 bg-zinc-800/20' : 'border-zinc-200 bg-zinc-50/50'
              }`}>
                <label className="cursor-pointer flex flex-col items-center justify-center">
                  <FileText className="w-7 h-7 text-zinc-400 mb-2" />
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
                  }`}>Drop or Choose File</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            )}
          </div>
        );

      case 'todo':
        const tasks = (element.content.tasks || []) as Array<{ id: string; text: string; completed: boolean }>;
        const completedCount = tasks.filter((t) => t.completed).length;
        const totalCount = tasks.length;
        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        return (
          <div className="flex flex-col h-full pointer-events-auto">
            <input
              type="text"
              value={element.content.title || ''}
              onChange={(e) => onUpdate(element.id, { content: { ...element.content, title: e.target.value } })}
              placeholder="Task list title"
              className={`w-full bg-transparent font-semibold text-sm outline-none pb-1.5 mb-2 ${
                theme === 'dark' 
                  ? 'text-zinc-100 border-b border-zinc-700/40 placeholder:text-zinc-600'
                  : 'text-zinc-800 border-b border-zinc-200/60 placeholder:text-zinc-400'
              }`}
            />
            {/* Progress bar */}
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[9px] font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Progress</span>
              <span className="text-[9px] font-semibold text-blue-500">{progressPercent}%</span>
            </div>
            <div className={`w-full h-1 rounded-full mb-3 overflow-hidden ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
              <div className="h-full bg-blue-500 transition-[width] duration-300 ease-out" style={{ width: `${progressPercent}%` }} />
            </div>

            {/* Tasks list */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(e) => {
                      const updatedTasks = tasks.map((t) => t.id === task.id ? { ...t, completed: e.target.checked } : t);
                      onUpdate(element.id, { content: { ...element.content, tasks: updatedTasks } });
                    }}
                    className="w-3.5 h-3.5 accent-blue-500 rounded border-zinc-300"
                  />
                  <input
                    type="text"
                    value={task.text}
                    onChange={(e) => {
                      const updatedTasks = tasks.map((t) => t.id === task.id ? { ...t, text: e.target.value } : t);
                      onUpdate(element.id, { content: { ...element.content, tasks: updatedTasks } });
                    }}
                    className={`flex-1 bg-transparent text-[11px] outline-none font-medium ${
                      task.completed 
                        ? 'line-through opacity-40' 
                        : theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'
                    }`}
                  />
                  <button
                    onClick={() => {
                      const updatedTasks = tasks.filter((t) => t.id !== task.id);
                      onUpdate(element.id, { content: { ...element.content, tasks: updatedTasks } });
                    }}
                    className="p-0.5 text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Task */}
            <button
              onClick={() => {
                const newTask = { id: Math.random().toString(), text: 'New Task', completed: false };
                onUpdate(element.id, { content: { ...element.content, tasks: [...tasks, newTask] } });
              }}
              className={`mt-2 w-full py-1.5 border border-dashed text-[10px] font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1 ${
                theme === 'dark' 
                  ? 'border-zinc-700 text-zinc-500 hover:text-blue-400 hover:border-blue-500/40'
                  : 'border-zinc-300 text-zinc-500 hover:text-blue-500 hover:border-blue-400'
              }`}
            >
              <Plus className="w-3 h-3" />
              Add Task
            </button>
          </div>
        );

      case 'column':
        return (
          <div className="flex flex-col h-full pointer-events-auto">
            <input
              type="text"
              value={element.content.title || ''}
              onChange={(e) => onUpdate(element.id, { content: { ...element.content, title: e.target.value } })}
              placeholder="Column title"
              className={`w-full bg-transparent font-semibold text-sm text-center uppercase tracking-wider outline-none pb-2 mb-4 ${
                theme === 'dark' 
                  ? 'text-zinc-100 border-b border-zinc-700/40 placeholder:text-zinc-600'
                  : 'text-zinc-800 border-b border-zinc-200/60 placeholder:text-zinc-400'
              }`}
            />
            <div className={`flex-1 border-2 border-dashed rounded-xl flex items-center justify-center p-4 text-center ${
              theme === 'dark' ? 'border-zinc-700/50 bg-black/20' : 'border-zinc-300/50 bg-white/20'
            }`}>
              <span className={`text-[10px] font-medium uppercase tracking-wider leading-relaxed ${
                theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'
              }`}>
                Drag cards over this lane
              </span>
            </div>
          </div>
        );

      case 'heading':
        return (
          <div className="flex items-center h-full select-text pointer-events-auto">
            <textarea
              value={element.content.text || ''}
              onChange={(e) => onUpdate(element.id, { content: { ...element.content, text: e.target.value } })}
              placeholder="Heading"
              className={`w-full bg-transparent font-black text-2xl leading-tight outline-none resize-none font-space-grotesk ${
                theme === 'dark' ? 'text-white placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-300'
              }`}
            />
          </div>
        );

      case 'code':
        return (
          <div className="flex flex-col h-full pointer-events-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                <Code2 className="w-3 h-3" /> Snippet
              </span>
            </div>
            <textarea
              value={element.content.code || ''}
              onChange={(e) => onUpdate(element.id, { content: { ...element.content, code: e.target.value } })}
              placeholder="// paste or type code…"
              spellCheck={false}
              className="w-full flex-1 bg-zinc-900 text-emerald-300 rounded-lg p-3 text-[11px] leading-relaxed font-mono outline-none resize-none placeholder:text-zinc-600"
            />
          </div>
        );

      case 'sketch':
        return <SketchPad element={element} theme={theme} zoom={zoom} onUpdate={onUpdate} />;

      case 'clock':
        return <ClockCard element={element} theme={theme} onUpdate={onUpdate} />;

      case 'countdown':
        return <CountdownCard element={element} theme={theme} onUpdate={onUpdate} />;

      case 'heatmap':
        return <HeatmapCard element={element} theme={theme} onUpdate={onUpdate} />;

      case 'gauge':
        return <GaugeCard element={element} theme={theme} onUpdate={onUpdate} />;

      case 'board_link':
        return (
          <div className="flex flex-col h-full pointer-events-auto justify-center text-center">
            <div className="w-10 h-10 bg-teal-500/10 text-teal-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FolderOpen className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={element.content.title || ''}
              onChange={(e) => onUpdate(element.id, { content: { ...element.content, title: e.target.value } })}
              placeholder="Nested board name..."
              className={`w-full bg-transparent font-semibold text-xs text-center outline-none mb-3 ${
                theme === 'dark' ? 'text-white placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-400'
              }`}
            />
            <button
              onClick={() => toast.info('Opening nested board...')}
              className={`mx-auto px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 ${
                theme === 'dark' 
                  ? 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-zinc-100 border border-zinc-200 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Enter Board
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Compute card styles ───
  const getCardBackground = () => {
    if (isBorderless) return 'transparent';
    if (element.type === 'column') {
      return theme === 'dark' ? 'rgba(30, 30, 30, 0.6)' : 'rgba(240, 240, 242, 0.6)';
    }
    return theme === 'dark'
      ? (PASTEL_COLORS.find(c => c.value === element.color)?.darkValue || '#262626')
      : (element.color || '#FFFFFF');
  };

  const getCardBorder = () => {
    if (isSelected) return undefined; // ring handles the outline
    if (isBorderless) return 'transparent';
    if (element.type === 'column') {
      return theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
    }
    return theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
  };

  // Build className for card wrapper
  const wrapperClasses = [
    'absolute select-none pointer-events-auto rounded-xl transition-shadow duration-200 group animate-card-in',
    // Selection states
    isSelected
      ? 'ring-2 ring-blue-500 shadow-lg z-10'
      : isConnectingSource
        ? 'ring-2 ring-indigo-500 shadow-lg z-10'
        : activeTool === 'connect'
          ? 'hover:ring-2 hover:ring-indigo-400 cursor-pointer'
          : activeTool === 'delete'
            ? 'hover:ring-2 hover:ring-red-400 cursor-crosshair'
            : isBorderless
              ? 'hover:shadow-none'
              : `shadow-sm hover:shadow-lg`,
    // Cursor
    activeTool === 'select' && !isBorderless ? 'cursor-grab active:cursor-grabbing' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={cardRef}
      onMouseDown={handleCardMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowColorPicker(false); }}
      onClick={(e) => {
        e.stopPropagation();
        if (!hasDraggedRef.current) {
          onClick(element.id);
        }
      }}
      className={wrapperClasses}
      style={{
        left: 0,
        top: 0,
        transform: `translate3d(${element.x}px, ${element.y}px, 0)`,
        width: element.width || 280,
        height: element.height || 180,
        backgroundColor: getCardBackground(),
        borderWidth: isBorderless ? 0 : 1,
        borderStyle: 'solid',
        borderColor: getCardBorder(),
        backdropFilter: element.type === 'column' ? 'blur(12px)' : undefined,
        WebkitBackdropFilter: element.type === 'column' ? 'blur(12px)' : undefined,
        overflow: isBorderless ? 'visible' : 'hidden',
      }}
    >
      {/* Full-card pick overlay during Connect or Delete modes so ANY element type can be clicked */}
      {(activeTool === "connect" || activeTool === "delete") && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClick(element.id);
          }}
          className={`absolute inset-0 z-40 rounded-xl flex items-start justify-start p-2 transition-all ${
            activeTool === "connect"
              ? isConnectingSource
                ? "bg-indigo-500/15 ring-2 ring-indigo-500 cursor-pointer"
                : "bg-transparent hover:bg-indigo-500/10 cursor-pointer"
              : "bg-transparent hover:bg-red-500/15 ring-2 ring-red-400 cursor-crosshair"
          }`}
        >
          {activeTool === "connect" && isConnectingSource && (
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider shadow-md animate-pulse">
              Source Card
            </span>
          )}
          {activeTool === "connect" && !isConnectingSource && (
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
              Click to Connect
            </span>
          )}
          {activeTool === "delete" && (
            <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black uppercase tracking-wider shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
              Click to Delete
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className={`relative w-full h-full flex flex-col ${isBorderless ? 'p-0' : 'p-4'}`}>
        {/* Hover action buttons - color picker & delete */}
        {element.type !== 'text' && element.type !== 'column' && activeTool === 'select' && (
          <div className={`absolute top-2 right-2 flex items-center gap-1 z-20 transition-opacity duration-150 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
              className={`p-1 rounded-md transition-colors ${
                theme === 'dark' ? 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-400 hover:text-white' : 'bg-white/90 hover:bg-white text-zinc-500 hover:text-zinc-700 shadow-sm'
              }`}
              title="Color"
            >
              <Palette className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(element.id); }}
              className={`p-1 rounded-md transition-colors ${
                theme === 'dark' ? 'bg-zinc-800/90 hover:bg-red-500 text-zinc-400 hover:text-white' : 'bg-white/90 hover:bg-red-500 text-zinc-500 hover:text-white shadow-sm'
              }`}
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Color Picker Popover */}
        {showColorPicker && (
          <div className={`absolute top-9 right-2 z-30 flex items-center gap-1 p-1.5 rounded-lg shadow-xl ${
            theme === 'dark' ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-zinc-200'
          }`}>
            {PASTEL_COLORS.map(color => (
              <button
                key={color.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(element.id, { color: color.value });
                  setShowColorPicker(false);
                }}
                className="w-4.5 h-4.5 rounded-full border border-black/10 shrink-0 transition-transform hover:scale-125"
                style={{ backgroundColor: color.value, width: 18, height: 18 }}
                title={color.name}
              />
            ))}
          </div>
        )}

        {/* Card content */}
        <div className="flex-1 min-h-0">
          {renderCardContent()}
        </div>

        {/* Resize Handle - subtle, hover only */}
        {element.type !== 'text' && activeTool === 'select' && (
          <div
            data-resize-handle="true"
            onMouseDown={handleResizeStart}
            className={`absolute bottom-0.5 right-0.5 w-4 h-4 cursor-se-resize flex items-end justify-end pointer-events-auto transition-opacity duration-150 ${
              isHovered ? 'opacity-60' : 'opacity-0'
            }`}
            title="Resize"
          >
            <svg width="7" height="7" viewBox="0 0 8 8" className={theme === 'dark' ? 'text-zinc-500' : 'text-zinc-300'}>
              <path d="M6 0 L8 0 L8 8 L0 8 L0 6 L4 6 L4 4 L6 4 Z" fill="currentColor" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
});

// ─────────────────────────── Freehand sketch / draw pad ───────────────────────────
type Stroke = { color: string; size: number; points: number[][] };

const SKETCH_COLORS = ['#0F172A', '#EF4444', '#F97316', '#22C55E', '#3B82F6', '#A855F7', '#FFFFFF'];
const SKETCH_SIZES = [2, 4, 7, 12];

function SketchPad({
  element, theme, zoom = 1, onUpdate,
}: {
  element: CanvasElement;
  theme: 'light' | 'dark';
  zoom?: number;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}) {
  const strokes: Stroke[] = element.content.strokes || [];
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#0F172A');
  const [size, setSize] = useState(4);
  const [current, setCurrent] = useState<Stroke | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dark = theme === 'dark';

  const localPoint = (clientX: number, clientY: number): number[] => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return [0, 0];
    return [(clientX - rect.left) / zoom, (clientY - rect.top) / zoom];
  };

  const commitStrokes = (next: Stroke[]) => {
    onUpdate(element.id, { content: { ...element.content, strokes: next } });
  };

  const eraseAt = (pt: number[]) => {
    const threshold = Math.max(14, size + 8);
    const next = strokes.filter(s => !s.points.some(p => Math.hypot(p[0] - pt[0], p[1] - pt[1]) < threshold));
    if (next.length !== strokes.length) commitStrokes(next);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const pt = localPoint(e.clientX, e.clientY);

    if (tool === 'eraser') {
      eraseAt(pt);
      const move = (me: PointerEvent) => eraseAt(localPoint(me.clientX, me.clientY));
      const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      return;
    }

    let working: Stroke = { color, size, points: [pt] };
    setCurrent(working);
    const move = (me: PointerEvent) => {
      working = { ...working, points: [...working.points, localPoint(me.clientX, me.clientY)] };
      setCurrent(working);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (working.points.length > 1) commitStrokes([...strokes, working]);
      setCurrent(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const toPath = (s: Stroke) =>
    s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');

  const btn = (activeState: boolean) =>
    `w-6 h-6 flex items-center justify-center rounded-md transition-colors ${
      activeState
        ? 'bg-rose-500 text-white'
        : dark ? 'text-zinc-400 hover:bg-zinc-700' : 'text-zinc-500 hover:bg-zinc-100'
    }`;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar (this strip is draggable to move the card) */}
      <div className={`flex items-center gap-1 px-1.5 py-1 mb-1.5 rounded-lg ${dark ? 'bg-zinc-800/60' : 'bg-zinc-100/80'}`}>
        <button onClick={() => setTool('pen')} className={btn(tool === 'pen')} title="Pen"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={() => setTool('eraser')} className={btn(tool === 'eraser')} title="Eraser"><Eraser className="w-3.5 h-3.5" /></button>
        <div className={`w-px h-4 mx-0.5 ${dark ? 'bg-zinc-700' : 'bg-zinc-300'}`} />
        {/* Colors */}
        <div className="flex items-center gap-1">
          {SKETCH_COLORS.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool('pen'); }}
              className={`w-3.5 h-3.5 rounded-full border transition-transform hover:scale-125 ${color === c && tool === 'pen' ? 'ring-2 ring-rose-500 ring-offset-1' : 'border-black/20'}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
        <div className={`w-px h-4 mx-0.5 ${dark ? 'bg-zinc-700' : 'bg-zinc-300'}`} />
        {/* Sizes */}
        <div className="flex items-center gap-1">
          {SKETCH_SIZES.map(s => (
            <button key={s} onClick={() => setSize(s)} className={`w-5 h-5 flex items-center justify-center rounded-md ${size === s ? (dark ? 'bg-zinc-700' : 'bg-zinc-200') : ''}`} title={`${s}px`}>
              <span className="rounded-full bg-current block" style={{ width: Math.min(s, 10), height: Math.min(s, 10), color: dark ? '#d4d4d8' : '#3f3f46' }} />
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => commitStrokes(strokes.slice(0, -1))}
            disabled={strokes.length === 0}
            className={`${btn(false)} disabled:opacity-30`}
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => commitStrokes([])} disabled={strokes.length === 0} className={`${btn(false)} disabled:opacity-30`} title="Clear"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Drawing surface */}
      <svg
        ref={svgRef}
        data-no-drag="true"
        onPointerDown={handlePointerDown}
        className={`flex-1 w-full rounded-lg touch-none ${dark ? 'bg-zinc-900' : 'bg-white'} ${tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'}`}
        style={{ border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}
      >
        {strokes.map((s, i) => (
          <path key={i} d={toPath(s)} stroke={s.color} strokeWidth={s.size} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {current && (
          <path d={toPath(current)} stroke={current.color} strokeWidth={current.size} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </div>
  );
}

// ─────────────────────────── Widget cards ───────────────────────────
interface WidgetCardProps {
  element: CanvasElement;
  theme: 'light' | 'dark';
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}

function WidgetLabel({ value, placeholder, dark, onChange }: { value: string; placeholder: string; dark: boolean; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-transparent text-center text-[10px] font-bold uppercase tracking-widest outline-none pb-2 mb-1 ${
        dark ? 'text-zinc-500 placeholder:text-zinc-700' : 'text-zinc-400 placeholder:text-zinc-300'
      }`}
    />
  );
}

// Live digital clock — no external time-zone data, just the visitor's local clock.
function ClockCard({ element, theme, onUpdate }: WidgetCardProps) {
  const dark = theme === 'dark';
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col h-full items-center justify-center pointer-events-auto" data-no-drag="true">
      <WidgetLabel
        value={element.content.label || ''}
        placeholder="Local Time"
        dark={dark}
        onChange={(v) => onUpdate(element.id, { content: { ...element.content, label: v } })}
      />
      <div className={`text-3xl font-black font-mono tabular-nums tracking-tight ${dark ? 'text-white' : 'text-zinc-900'}`}>
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
      </div>
      <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>
        {now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
}

// Countdown to a user-chosen target date/time, ticking every second.
function CountdownCard({ element, theme, onUpdate }: WidgetCardProps) {
  const dark = theme === 'dark';
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const targetISO: string = element.content.targetISO || '';
  const target = targetISO ? new Date(targetISO).getTime() : null;
  const diff = target != null ? Math.max(0, target - now) : null;
  const units = diff != null
    ? [
        ['D', Math.floor(diff / 86400000)],
        ['H', Math.floor((diff % 86400000) / 3600000)],
        ['M', Math.floor((diff % 3600000) / 60000)],
        ['S', Math.floor((diff % 60000) / 1000)],
      ] as const
    : null;
  const reached = diff === 0;

  return (
    <div className="flex flex-col h-full pointer-events-auto" data-no-drag="true">
      <WidgetLabel
        value={element.content.label || ''}
        placeholder="Countdown title"
        dark={dark}
        onChange={(v) => onUpdate(element.id, { content: { ...element.content, label: v } })}
      />
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        {reached ? (
          <span className="text-2xl">🎉</span>
        ) : units ? (
          <div className="flex items-center gap-2.5">
            {units.map(([unit, val]) => (
              <div key={unit} className="flex flex-col items-center">
                <div className={`text-xl font-black font-mono tabular-nums ${dark ? 'text-white' : 'text-zinc-900'}`}>
                  {String(val).padStart(2, '0')}
                </div>
                <div className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${dark ? 'text-zinc-600' : 'text-zinc-400'}`}>{unit}</div>
              </div>
            ))}
          </div>
        ) : null}
        <input
          type="datetime-local"
          value={targetISO ? targetISO.slice(0, 16) : ''}
          onChange={(e) => onUpdate(element.id, { content: { ...element.content, targetISO: e.target.value ? new Date(e.target.value).toISOString() : '' } })}
          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium outline-none ${
            dark ? 'bg-zinc-800/80 border border-zinc-700/60 text-zinc-300' : 'bg-white border border-zinc-200 text-zinc-700'
          }`}
        />
      </div>
    </div>
  );
}

// GitHub-contribution-style activity heatmap. Click a square to cycle its
// intensity (0-4) — a lightweight habit/activity tracker, state persisted
// in the card's content like every other card type.
const HEATMAP_WEEKS = 12;
const HEATMAP_DAYS = 7;
const HEATMAP_SHADES_DARK = ['bg-white/5', 'bg-emerald-900', 'bg-emerald-700', 'bg-emerald-500', 'bg-emerald-400'];
const HEATMAP_SHADES_LIGHT = ['bg-zinc-100', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-500', 'bg-emerald-600'];

function HeatmapCard({ element, theme, onUpdate }: WidgetCardProps) {
  const dark = theme === 'dark';
  const total = HEATMAP_WEEKS * HEATMAP_DAYS;
  const values: number[] = Array.isArray(element.content.values) && element.content.values.length === total
    ? element.content.values
    : Array.from({ length: total }, () => 0);
  const shades = dark ? HEATMAP_SHADES_DARK : HEATMAP_SHADES_LIGHT;

  const cycle = (i: number) => {
    const next = [...values];
    next[i] = (next[i] + 1) % shades.length;
    onUpdate(element.id, { content: { ...element.content, values: next } });
  };

  return (
    <div className="flex flex-col h-full pointer-events-auto" data-no-drag="true">
      <WidgetLabel
        value={element.content.label || ''}
        placeholder="Activity"
        dark={dark}
        onChange={(v) => onUpdate(element.id, { content: { ...element.content, label: v } })}
      />
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-flow-col gap-[3px]" style={{ gridTemplateRows: `repeat(${HEATMAP_DAYS}, 1fr)` }}>
          {values.map((v, i) => (
            <button
              key={i}
              onClick={() => cycle(i)}
              className={`w-2.5 h-2.5 rounded-[2px] transition-colors duration-150 ${shades[v]}`}
              title="Click to log activity"
            />
          ))}
        </div>
      </div>
      <p className={`text-center text-[9px] font-bold uppercase tracking-wider mt-2 ${dark ? 'text-zinc-600' : 'text-zinc-400'}`}>
        Click a square to log activity
      </p>
    </div>
  );
}

// Radial progress gauge (SVG stroke-dasharray ring) for any value/max metric.
function GaugeCard({ element, theme, onUpdate }: WidgetCardProps) {
  const dark = theme === 'dark';
  const value: number = typeof element.content.value === 'number' ? element.content.value : 60;
  const max: number = typeof element.content.max === 'number' && element.content.max > 0 ? element.content.max : 100;
  const unit: string = element.content.unit ?? '%';
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col h-full items-center justify-center gap-2 pointer-events-auto" data-no-drag="true">
      <WidgetLabel
        value={element.content.label || ''}
        placeholder="Metric name"
        dark={dark}
        onChange={(v) => onUpdate(element.id, { content: { ...element.content, label: v } })}
      />
      <div className="relative w-24 h-24 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke={dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} strokeWidth="8" />
          <circle
            cx="50" cy="50" r={r} fill="none" stroke="#f97316" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 300ms cubic-bezier(0.23, 1, 0.32, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <input
            type="number"
            value={value}
            onChange={(e) => onUpdate(element.id, { content: { ...element.content, value: Number(e.target.value) } })}
            className={`w-12 text-center bg-transparent text-base font-black outline-none ${dark ? 'text-white' : 'text-zinc-900'}`}
          />
          <span className={`text-[9px] font-bold ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>/ {max}{unit}</span>
        </div>
      </div>
    </div>
  );
}
