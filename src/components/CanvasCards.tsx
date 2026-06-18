'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, CheckSquare, Plus, Trash2, Link as LinkIcon, 
  ExternalLink, FileText, Download, ArrowRight, Palette, 
  Image as ImageIcon, Search, ChevronRight, MessageSquare, FolderOpen
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

  // 1. YouTube Matches (e.g. youtube.com/watch?v=..., youtu.be/...)
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

  // 2. Instagram Matches (e.g. instagram.com/p/..., instagram.com/reel/...)
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

  // 3. Vimeo Matches (e.g. vimeo.com/...)
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
  onDrag: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
  isConnectingSource: boolean;
  activeTool: 'select' | 'connect' | 'delete';
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

export function CanvasCard({
  element,
  theme = 'light',
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
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef({ w: 0, h: 0, x: 0, y: 0 });

  // Custom free image search states
  const [imageSearch, setImageSearch] = useState('');
  const [isSearchingImages, setIsSearchingImages] = useState(false);

  // Dragging reference
  const dragRef = useRef<HTMLDivElement>(null);

  // Resize handler
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      w: element.width || 280,
      h: element.height || 180,
      x: e.clientX,
      y: e.clientY
    };

    const handleResizeMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - resizeStartRef.current.x;
      const deltaY = moveEvent.clientY - resizeStartRef.current.y;
      const newWidth = Math.max(160, resizeStartRef.current.w + deltaX);
      const newHeight = Math.max(80, resizeStartRef.current.h + deltaY);
      onResize(element.id, newWidth, newHeight);
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  };

  // Free image selection simulation (Uses high-quality free placeholders)
  const handleSearchFreeImages = (query: string) => {
    if (!query) return;
    setIsSearchingImages(true);
    setTimeout(() => {
      // Simulate search and pull a high-res royalty-free Unsplash/Pexels image matching query
      const encodedQuery = encodeURIComponent(query);
      const randomId = Math.floor(Math.random() * 1000);
      const sourceUrl = `https://images.unsplash.com/photo-${randomId % 2 === 0 ? '1507525428034-b723cf961d3e' : '1498050108023-c5249f4df085'}?auto=format&fit=crop&w=600&q=80&sig=${randomId}`;
      onUpdate(element.id, {
        content: { ...element.content, src: sourceUrl, caption: `Free image search: "${query}"` }
      });
      setIsSearchingImages(false);
      toast.success('Free royalty-free image inserted successfully');
    }, 1000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success(`File "${file.name}" uploaded successfully (Simulated)`);
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
          toast.success(file.type.startsWith('video/') ? 'Video uploaded successfully' : 'Image uploaded successfully');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Mock Link metadata parser
  const handleLoadLinkPreview = (url: string) => {
    if (!url) return;
    toast.info('Fetching Link Preview...');
    setTimeout(() => {
      let hostname = 'website.com';
      try {
        hostname = new URL(url).hostname;
      } catch (err) {}
      onUpdate(element.id, {
        content: {
          url,
          title: `Creative Inspiration from ${hostname}`,
          description: 'A shared visual board curated with mood boards, checklist logs, and visual summaries.',
          image: `https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80`,
          favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
        }
      });
      toast.success('Link preview loaded!');
    }, 1200);
  };

  // Render card specifics
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
              className="w-full bg-transparent font-space-grotesk font-black text-sm outline-none border-b border-zinc-200/50 dark:border-zinc-800/50 pb-1.5 mb-2 text-zinc-900 dark:text-zinc-100"
            />
            <textarea
              value={element.content.body || ''}
              onChange={(e) => onUpdate(element.id, { content: { ...element.content, body: e.target.value } })}
              placeholder="Type your notes..."
              className="w-full flex-1 bg-transparent text-xs leading-relaxed outline-none resize-none text-zinc-700 dark:text-zinc-300 font-medium custom-scrollbar"
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
              className="w-full bg-transparent font-space-grotesk font-black text-base md:text-lg text-center outline-none resize-none text-zinc-900 dark:text-white"
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
              <div className="flex-1 relative group rounded-lg overflow-hidden flex flex-col bg-black">
                {isVideo ? (
                  <video
                    src={element.content.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="flex-1 w-full object-cover min-h-0 rounded-lg"
                  />
                ) : (
                  <img
                    src={element.content.src}
                    alt={element.content.caption || 'Canvas Image'}
                    className="flex-1 w-full object-cover min-h-0 rounded-lg"
                  />
                )}
                <input
                  type="text"
                  value={element.content.caption || ''}
                  onChange={(e) => onUpdate(element.id, { content: { ...element.content, caption: e.target.value } })}
                  placeholder="Image caption..."
                  className="w-full bg-transparent text-[10px] text-zinc-500 font-bold text-center mt-1.5 outline-none"
                />
                <button
                  onClick={() => onUpdate(element.id, { content: { ...element.content, src: '' } })}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove Image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex-1 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center p-4 text-center bg-zinc-50/30 dark:bg-black/10">
                <ImageIcon className="w-7 h-7 text-zinc-400 mb-1.5" />
                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 mb-2">Insert Board Image</span>
                <div className="flex items-center gap-1.5 w-full bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 px-2.5 py-1.5 rounded-xl shadow-sm mb-2">
                  <Search className="w-3.5 h-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search Free Unsplash..."
                    value={imageSearch}
                    onChange={(e) => setImageSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchFreeImages(imageSearch)}
                    className="w-full bg-transparent text-[10px] font-bold outline-none placeholder:text-zinc-500 text-zinc-800 dark:text-zinc-200"
                  />
                </div>
                {isSearchingImages && <span className="text-[9px] text-rose-500 animate-pulse mb-2">Searching...</span>}
                <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2">OR</div>
                <label 
                  htmlFor={`image-upload-${element.id}`}
                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Upload Image
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
              <div className="flex-1 rounded-xl overflow-hidden relative w-full h-full bg-black border border-zinc-200/20">
                {media.type === 'video' ? (
                  <video
                    src={media.embedUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <iframe
                    src={media.embedUrl}
                    className="w-full h-full border-0 rounded-xl"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    scrolling="no"
                  />
                )}
                {/* Small indicator label */}
                <div className="absolute top-2.5 left-2.5 px-2 py-1 bg-black/80 border border-white/10 text-[8px] font-black uppercase text-rose-500 tracking-wider rounded-lg shadow-md pointer-events-none">
                  {media.type} Player
                </div>
              </div>
            ) : element.content.title ? (
              <a
                href={element.content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex flex-col rounded-lg overflow-hidden group/link bg-zinc-50/50 dark:bg-black/30 border border-zinc-100 dark:border-zinc-800/50 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  {element.content.favicon && (
                    <img src={element.content.favicon} className="w-4 h-4 rounded" alt="favicon" />
                  )}
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider flex-1 truncate">
                    {element.content.url}
                  </span>
                  <ExternalLink className="w-3 h-3 text-zinc-400 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                </div>
                {element.content.image && (
                  <img src={element.content.image} className="w-full h-24 object-cover rounded-lg mb-2" alt="preview" />
                )}
                <h4 className="text-xs font-black text-zinc-900 dark:text-white line-clamp-1 mb-1 leading-snug">
                  {element.content.title}
                </h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {element.content.description}
                </p>
              </a>
            ) : (
              <div className="flex-1 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                <LinkIcon className="w-8 h-8 text-zinc-400 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-3">Embed URL Web Clip</span>
                <input
                  type="url"
                  placeholder="https://example.com"
                  onBlur={(e) => handleLoadLinkPreview(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadLinkPreview(e.currentTarget.value)}
                  className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-[10px] font-bold outline-none text-zinc-800 dark:text-zinc-200"
                />
              </div>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="flex flex-col h-full pointer-events-auto justify-center">
            {element.content.fileName ? (
              <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-black/30 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl group/file">
                <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-zinc-900 dark:text-white truncate">{element.content.fileName}</h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{element.content.fileSize}</p>
                </div>
                <button
                  className="w-9 h-9 flex items-center justify-center bg-white dark:bg-zinc-800 text-zinc-600 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-700 hover:scale-110 active:scale-95 transition-all"
                  title="Download File"
                  onClick={() => toast.success(`Downloading "${element.content.fileName}"`)}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex-1 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                <label className="cursor-pointer flex flex-col items-center justify-center">
                  <FileText className="w-8 h-8 text-zinc-400 mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Choose / Drop File</span>
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
              className="w-full bg-transparent font-space-grotesk font-black text-sm outline-none border-b border-zinc-200/50 dark:border-zinc-800/50 pb-1.5 mb-2 text-zinc-900 dark:text-zinc-100"
            />
            {/* Progress bar */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Progress</span>
              <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">{progressPercent}%</span>
            </div>
            <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-4 overflow-hidden">
              <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>

            {/* Tasks list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(e) => {
                      const updatedTasks = tasks.map((t) => t.id === task.id ? { ...t, completed: e.target.checked } : t);
                      onUpdate(element.id, { content: { ...element.content, tasks: updatedTasks } });
                    }}
                    className="w-4 h-4 accent-rose-500 rounded border-zinc-300 text-rose-500"
                  />
                  <input
                    type="text"
                    value={task.text}
                    onChange={(e) => {
                      const updatedTasks = tasks.map((t) => t.id === task.id ? { ...t, text: e.target.value } : t);
                      onUpdate(element.id, { content: { ...element.content, tasks: updatedTasks } });
                    }}
                    className={`flex-1 bg-transparent text-[11px] outline-none text-zinc-700 dark:text-zinc-300 font-semibold ${task.completed ? 'line-through opacity-40' : ''}`}
                  />
                  <button
                    onClick={() => {
                      const updatedTasks = tasks.filter((t) => t.id !== task.id);
                      onUpdate(element.id, { content: { ...element.content, tasks: updatedTasks } });
                    }}
                    className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
              className="mt-3 w-full py-1.5 border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-rose-500 hover:border-rose-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
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
              className="w-full bg-transparent font-space-grotesk font-black text-sm text-center uppercase tracking-wider outline-none border-b border-zinc-200/50 dark:border-zinc-800/50 pb-2 mb-4 text-zinc-900 dark:text-zinc-100"
            />
            {/* Lane container body */}
            <div className="flex-1 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center p-4 text-center bg-black/10 dark:bg-black/40">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed">
                Drag cards over this lane to cluster layout
              </span>
            </div>
          </div>
        );

      case 'board_link':
        return (
          <div className="flex flex-col h-full pointer-events-auto justify-center text-center">
            <div className="w-12 h-12 bg-teal-500/10 text-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FolderOpen className="w-6 h-6" />
            </div>
            <input
              type="text"
              value={element.content.title || ''}
              onChange={(e) => onUpdate(element.id, { content: { ...element.content, title: e.target.value } })}
              placeholder="Nested board name..."
              className="w-full bg-transparent font-space-grotesk font-black text-xs text-center outline-none mb-3 text-zinc-900 dark:text-white"
            />
            <button
              onClick={() => toast.info('Opening nested Board workspace...')}
              className="mx-auto px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
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

  return (
    <motion.div
      ref={dragRef}
      drag={activeTool === 'select'}
      dragMomentum={false}
      dragElastic={0}
      onDrag={(event, info) => {
        onDrag(element.id, element.x + info.delta.x, element.y + info.delta.y);
      }}
      onDragEnd={(event, info) => {
        onDragEnd(element.id, element.x, element.y);
      }}
      className={`absolute select-none pointer-events-auto rounded-3xl border transition-shadow duration-300 group ${
        isConnectingSource 
          ? 'ring-4 ring-indigo-500 border-indigo-500 scale-[1.03] shadow-2xl' 
          : activeTool === 'connect' 
            ? 'hover:ring-4 hover:ring-indigo-400 hover:border-indigo-400 hover:scale-[1.02] cursor-pointer'
            : activeTool === 'delete'
              ? 'hover:ring-4 hover:ring-red-400 hover:border-red-400 cursor-crosshair'
              : 'hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] shadow-sm'
      }`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width || 280,
        height: element.height || 180,
        backgroundColor: element.type === 'text' 
          ? 'transparent' 
          : (theme === 'dark' 
              ? (PASTEL_COLORS.find(c => c.value === element.color)?.darkValue || '#262626') 
              : (element.color || '#FFFFFF')),
        borderColor: element.type === 'text' 
          ? 'transparent' 
          : (theme === 'dark'
              ? 'rgba(255,255,255,0.08)'
              : (element.color === '#FFFFFF' ? 'rgba(0,0,0,0.06)' : 'transparent')),
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(element.id);
      }}
    >
      {/* Element wrapper */}
      <div className="relative w-full h-full p-5 flex flex-col">
        {/* Color picker option trigger */}
        {element.type !== 'text' && element.type !== 'column' && activeTool === 'select' && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1.5 bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 text-zinc-500 hover:text-rose-500 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-all"
              title="Change Background Color"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(element.id)}
              className="p-1.5 bg-white/80 dark:bg-zinc-800/80 hover:bg-red-500 hover:text-white text-zinc-500 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-all"
              title="Delete Card"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Color Picker Popover */}
        {showColorPicker && (
          <div className="absolute top-12 right-3 z-30 flex items-center gap-1 p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl">
            {PASTEL_COLORS.map(color => (
              <button
                key={color.value}
                onClick={() => {
                  onUpdate(element.id, { color: color.value });
                  setShowColorPicker(false);
                }}
                className="w-5 h-5 rounded-full border border-black/10 shrink-0 transition-transform hover:scale-125"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        )}

        {/* Dynamic Card Renders */}
        <div className="flex-1 min-h-0">
          {renderCardContent()}
        </div>

        {/* Resize Handle (Bottom-Right) */}
        {element.type !== 'text' && activeTool === 'select' && (
          <div
            onMouseDown={handleResizeStart}
            className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-end justify-end pointer-events-auto"
            title="Drag to resize card"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" className="text-zinc-300 dark:text-zinc-600">
              <path d="M6 0 L8 0 L8 8 L0 8 L0 6 L4 6 L4 4 L6 4 Z" fill="currentColor" />
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  );
}
