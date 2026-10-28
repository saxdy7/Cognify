'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MousePointer2, Hand, Frame, Square, Spline, Type, MessageSquare,
  LayoutGrid, Pencil, Crosshair, Code2, Upload, Trash2, ChevronDown,
  Clock, Timer, Grid3x3, Gauge, Video, FileText, CheckSquare, Layers,
  Heading1, Check
} from 'lucide-react';

export type CanvasTool = 'select' | 'connect' | 'delete' | 'hand';

interface FigmaCanvasToolbarProps {
  activeTool: CanvasTool;
  setActiveTool: (tool: CanvasTool) => void;
  onAddElement: (type: string, preset?: any) => void;
  onConnectToggle: () => void;
  onDeleteToggle: () => void;
  onUploadClick: () => void;
  dark: boolean;
  defaultLineStyle: 'curved' | 'straight' | 'stepped';
  setDefaultLineStyle: (style: 'curved' | 'straight' | 'stepped') => void;
  connectSourceId?: string | null;
}

const NOTE_COLORS = [
  { name: 'Yellow', bg: '#FEF9C3', text: '#713F12' },
  { name: 'Sky', bg: '#DBEAFE', text: '#1E3A8A' },
  { name: 'Mint', bg: '#DCFCE7', text: '#14532D' },
  { name: 'Rose', bg: '#FCE7F3', text: '#831843' },
  { name: 'Purple', bg: '#F3E8FF', text: '#581C87' },
  { name: 'Dark', bg: '#27272A', text: '#F4F4F5' },
];

export function FigmaCanvasToolbar({
  activeTool,
  setActiveTool,
  onAddElement,
  onConnectToggle,
  onDeleteToggle,
  onUploadClick,
  dark,
  defaultLineStyle,
  setDefaultLineStyle,
  connectSourceId,
}: FigmaCanvasToolbarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close open popovers when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleMenu = (menuName: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMenu(prev => (prev === menuName ? null : menuName));
  };

  return (
    <div
      ref={toolbarRef}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[130] select-none pointer-events-auto"
      style={{ touchAction: 'none' }}
    >
      {/* Popovers anchored above corresponding tools */}
      {activeMenu && (
        <div
          className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 p-2 rounded-2xl border shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
            dark ? 'bg-[#1e1e1e]/98 border-white/10 text-white shadow-black/80 ring-1 ring-white/10' : 'bg-zinc-900/98 border-zinc-800 text-white shadow-black/50 ring-1 ring-white/5'
          }`}
          style={{ minWidth: 200 }}
        >
          {activeMenu === 'select' && (
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => { setActiveTool('select'); setActiveMenu(null); }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  activeTool === 'select' ? 'bg-[#0c8ce9] text-white' : 'hover:bg-white/10 text-zinc-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <MousePointer2 className="w-4 h-4" />
                  <span>Move / Select</span>
                </span>
                <span className="text-[10px] opacity-70">V</span>
              </button>
              <button
                onClick={() => { setActiveTool('hand'); setActiveMenu(null); }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  activeTool === 'hand' ? 'bg-[#0c8ce9] text-white' : 'hover:bg-white/10 text-zinc-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Hand className="w-4 h-4" />
                  <span>Hand / Pan</span>
                </span>
                <span className="text-[10px] opacity-70">H / Space</span>
              </button>
            </div>
          )}

          {activeMenu === 'frame' && (
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => { onAddElement('column'); setActiveMenu(null); }}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/10 text-zinc-200 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Frame className="w-4 h-4 text-sky-400" />
                  <span>Column Lane</span>
                </span>
                <span className="text-[10px] opacity-70">F</span>
              </button>
              <button
                onClick={() => { onAddElement('column', { content: { title: 'Section Frame' }, width: 440, height: 340 }); setActiveMenu(null); }}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/10 text-zinc-200 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Square className="w-4 h-4 text-emerald-400" />
                  <span>Section Board</span>
                </span>
                <span className="text-[10px] opacity-70">B</span>
              </button>
            </div>
          )}

          {activeMenu === 'shapes' && (
            <div className="flex flex-col gap-2 p-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 pt-1">Sticky Note Color</div>
              <div className="grid grid-cols-6 gap-1.5 px-1">
                {NOTE_COLORS.map(c => (
                  <button
                    key={c.name}
                    onClick={() => { onAddElement('note', { color: c.bg }); setActiveMenu(null); }}
                    className="w-6 h-6 rounded-lg border border-black/20 hover:scale-110 active:scale-95 transition-all shadow-sm"
                    style={{ backgroundColor: c.bg }}
                    title={c.name}
                  />
                ))}
              </div>
              <div className="h-px bg-white/10 my-0.5" />
              <button
                onClick={() => { onAddElement('todo'); setActiveMenu(null); }}
                className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-white/10 text-zinc-200 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                  <span>To-do List</span>
                </span>
                <span className="text-[10px] opacity-70">T</span>
              </button>
              <button
                onClick={() => { onAddElement('board_link'); setActiveMenu(null); }}
                className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-white/10 text-zinc-200 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Board Link</span>
                </span>
                <span className="text-[10px] opacity-70">L</span>
              </button>
            </div>
          )}

          {activeMenu === 'line' && (
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => { setDefaultLineStyle('curved'); setActiveTool('connect'); setActiveMenu(null); }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  defaultLineStyle === 'curved' ? 'bg-[#0c8ce9] text-white' : 'hover:bg-white/10 text-zinc-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Spline className="w-4 h-4" />
                  <span>Sigmoid Curve (Bézier)</span>
                </span>
                {defaultLineStyle === 'curved' && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => { setDefaultLineStyle('straight'); setActiveTool('connect'); setActiveMenu(null); }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  defaultLineStyle === 'straight' ? 'bg-[#0c8ce9] text-white' : 'hover:bg-white/10 text-zinc-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-current" />
                  <span>Straight Line</span>
                </span>
                {defaultLineStyle === 'straight' && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => { setDefaultLineStyle('stepped'); setActiveTool('connect'); setActiveMenu(null); }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  defaultLineStyle === 'stepped' ? 'bg-[#0c8ce9] text-white' : 'hover:bg-white/10 text-zinc-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-xs font-mono">⌐¬</span>
                  <span>Stepped / Orthogonal</span>
                </span>
                {defaultLineStyle === 'stepped' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {activeMenu === 'text' && (
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => { onAddElement('text'); setActiveMenu(null); }}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/10 text-zinc-200 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-zinc-400" />
                  <span>Body Text</span>
                </span>
                <span className="text-[10px] opacity-70">T</span>
              </button>
              <button
                onClick={() => { onAddElement('heading'); setActiveMenu(null); }}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/10 text-zinc-200 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Heading1 className="w-4 h-4 text-amber-400" />
                  <span>Large Heading</span>
                </span>
                <span className="text-[10px] opacity-70">H</span>
              </button>
            </div>
          )}

          {activeMenu === 'widgets' && (
            <div className="grid grid-cols-2 gap-1.5 p-1 w-64">
              <button
                onClick={() => { onAddElement('clock'); setActiveMenu(null); }}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 text-left text-xs text-zinc-200 transition-colors"
              >
                <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Clock</span>
              </button>
              <button
                onClick={() => { onAddElement('countdown'); setActiveMenu(null); }}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 text-left text-xs text-zinc-200 transition-colors"
              >
                <Timer className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Countdown</span>
              </button>
              <button
                onClick={() => { onAddElement('heatmap'); setActiveMenu(null); }}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 text-left text-xs text-zinc-200 transition-colors"
              >
                <Grid3x3 className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Activity</span>
              </button>
              <button
                onClick={() => { onAddElement('gauge'); setActiveMenu(null); }}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 text-left text-xs text-zinc-200 transition-colors"
              >
                <Gauge className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Metric Gauge</span>
              </button>
              <button
                onClick={() => { onAddElement('video'); setActiveMenu(null); }}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 text-left text-xs text-zinc-200 transition-colors"
              >
                <Video className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Video Embed</span>
              </button>
              <button
                onClick={() => { onAddElement('file'); setActiveMenu(null); }}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 text-left text-xs text-zinc-200 transition-colors"
              >
                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Document</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Figma Floating Dock */}
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-2xl border shadow-2xl backdrop-blur-2xl transition-all ${
          dark
            ? 'bg-[#1e1e1e]/95 border-white/10 text-zinc-300 shadow-black/70 ring-1 ring-white/5'
            : 'bg-zinc-900/95 border-zinc-800 text-zinc-300 shadow-black/50 ring-1 ring-white/5'
        }`}
      >
        {/* 1. Select / Hand Tool (V) */}
        <div className="flex items-center">
          <button
            onClick={() => setActiveTool(activeTool === 'select' ? 'hand' : 'select')}
            title={activeTool === 'hand' ? 'Hand / Pan (H)' : 'Select (V)'}
            className={`p-2 rounded-xl transition-all flex items-center justify-center ${
              activeTool === 'select' || activeTool === 'hand'
                ? 'bg-[#0c8ce9] text-white shadow-md'
                : 'hover:bg-white/10 text-zinc-300 hover:text-white'
            }`}
          >
            {activeTool === 'hand' ? <Hand className="w-4 h-4" /> : <MousePointer2 className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => toggleMenu('select', e)}
            className="p-1 -ml-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Selection options"
          >
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* 2. Frame / Column Tool (F) */}
        <div className="flex items-center">
          <button
            onClick={() => onAddElement('column')}
            title="Column / Frame (F)"
            className="p-2 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition-all flex items-center justify-center"
          >
            <Frame className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => toggleMenu('frame', e)}
            className="p-1 -ml-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Frame options"
          >
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* 3. Shape / Card Tool (R / N) */}
        <div className="flex items-center">
          <button
            onClick={() => onAddElement('note')}
            title="Sticky Note / Shape (N)"
            className="p-2 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition-all flex items-center justify-center"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => toggleMenu('shapes', e)}
            className="p-1 -ml-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Shapes & colors"
          >
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* 4. Pen / Sigmoid Line Tool (P / L) */}
        <div className="flex items-center">
          <button
            onClick={onConnectToggle}
            title="Connector Line (P) - Connect cards with smooth sigmoid curve"
            className={`p-2 rounded-xl transition-all flex items-center justify-center relative ${
              activeTool === 'connect'
                ? 'bg-[#0c8ce9] text-white shadow-md animate-pulse'
                : 'hover:bg-white/10 text-zinc-300 hover:text-white'
            }`}
          >
            <Spline className="w-4 h-4" />
            {connectSourceId && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-400 rounded-full ring-2 ring-zinc-900 animate-ping" />
            )}
          </button>
          <button
            onClick={(e) => toggleMenu('line', e)}
            className="p-1 -ml-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Line curve style"
          >
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* 5. Text Tool (T) */}
        <div className="flex items-center">
          <button
            onClick={() => onAddElement('text')}
            title="Text (T)"
            className="p-2 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition-all flex items-center justify-center"
          >
            <Type className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => toggleMenu('text', e)}
            className="p-1 -ml-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Text options"
          >
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* 6. Comment Tool (C) */}
        <button
          onClick={() => onAddElement('note', { content: { title: 'Comment', body: '' }, color: '#DBEAFE' })}
          title="Add Comment (C)"
          className="p-2 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition-all flex items-center justify-center"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* 7. Components & Smart Widgets Tool (M) */}
        <button
          onClick={(e) => toggleMenu('widgets', e)}
          title="Components & Widgets (M)"
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            activeMenu === 'widgets' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-zinc-300 hover:text-white'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-white/15 mx-1 shrink-0" />

        {/* 8. Draw / Freehand Sketch Tool (D) */}
        <button
          onClick={() => onAddElement('sketch')}
          title="Draw / Sketch (D)"
          className="p-2 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition-all flex items-center justify-center"
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* 9. Inspect / Connect Mode Toggle */}
        <button
          onClick={onConnectToggle}
          title={activeTool === 'connect' ? 'Cancel connector link' : 'Quick Connect cards'}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            activeTool === 'connect' ? 'bg-[#0c8ce9] text-white shadow-md' : 'hover:bg-white/10 text-zinc-300 hover:text-white'
          }`}
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {/* 10. Code Block Tool */}
        <button
          onClick={() => onAddElement('code')}
          title="Code Snippet"
          className="p-2 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition-all flex items-center justify-center"
        >
          <Code2 className="w-4 h-4" />
        </button>

        {/* 11. Upload / Media */}
        <button
          onClick={onUploadClick}
          title="Upload image or file"
          className="p-2 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition-all flex items-center justify-center"
        >
          <Upload className="w-4 h-4" />
        </button>

        {/* 12. Delete / Eraser Tool (Del) */}
        <button
          onClick={onDeleteToggle}
          title="Delete / Eraser tool"
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            activeTool === 'delete' ? 'bg-rose-600 text-white shadow-md animate-pulse' : 'hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400'
          }`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
