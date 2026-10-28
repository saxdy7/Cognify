'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CanvasElement, CanvasConnector } from '@/types';
import { X, Spline, Minus, Tag, Check } from 'lucide-react';

export interface Point {
  x: number;
  y: number;
}

export interface ConnectorGeometry {
  start: Point;
  end: Point;
  c1: Point;
  c2: Point;
  midX: number;
  midY: number;
  pathD: string;
  orientation: 'horizontal' | 'vertical';
}

const CONNECTOR_COLORS = [
  { name: 'Indigo', value: '#5B6CF9' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'White', value: '#E2E8F0' },
];

/**
 * Computes optimal boundary anchors and cubic Bézier sigmoid S-curve geometry
 * between two canvas elements.
 */
export function computeConnectorGeometry(
  source: CanvasElement,
  target: CanvasElement,
  style: 'curved' | 'straight' | 'stepped' = 'curved'
): ConnectorGeometry {
  const srcW = source.width || 280;
  const srcH = source.height || 180;
  const tgtW = target.width || 280;
  const tgtH = target.height || 180;

  const srcCenter = { x: source.x + srcW / 2, y: source.y + srcH / 2 };
  const tgtCenter = { x: target.x + tgtW / 2, y: target.y + tgtH / 2 };

  const dx = tgtCenter.x - srcCenter.x;
  const dy = tgtCenter.y - srcCenter.y;

  // Normalized distance to determine whether horizontal or vertical flow dominates
  const normX = Math.abs(dx) / Math.max(1, (srcW + tgtW) / 2);
  const normY = Math.abs(dy) / Math.max(1, (srcH + tgtH) / 2);

  let start: Point;
  let end: Point;
  let normal: { x: number; y: number };
  let orientation: 'horizontal' | 'vertical';

  if (normX >= normY) {
    orientation = 'horizontal';
    if (dx >= 0) {
      // Source left of target: exit Right, enter Left
      start = { x: source.x + srcW, y: srcCenter.y };
      end = { x: target.x, y: tgtCenter.y };
      normal = { x: 1, y: 0 };
    } else {
      // Source right of target: exit Left, enter Right
      start = { x: source.x, y: srcCenter.y };
      end = { x: target.x + tgtW, y: tgtCenter.y };
      normal = { x: -1, y: 0 };
    }
  } else {
    orientation = 'vertical';
    if (dy >= 0) {
      // Source above target: exit Bottom, enter Top
      start = { x: srcCenter.x, y: source.y + srcH };
      end = { x: tgtCenter.x, y: target.y };
      normal = { x: 0, y: 1 };
    } else {
      // Source below target: exit Top, enter Bottom
      start = { x: srcCenter.x, y: source.y };
      end = { x: tgtCenter.x, y: target.y + tgtH };
      normal = { x: 0, y: -1 };
    }
  }

  // Calculate cubic control points
  let c1: Point;
  let c2: Point;
  if (orientation === 'horizontal') {
    const curvature = Math.max(Math.abs(end.x - start.x) * 0.5, 45);
    c1 = { x: start.x + normal.x * curvature, y: start.y };
    c2 = { x: end.x - normal.x * curvature, y: end.y };
  } else {
    const curvature = Math.max(Math.abs(end.y - start.y) * 0.5, 45);
    c1 = { x: start.x, y: start.y + normal.y * curvature };
    c2 = { x: end.x, y: end.y - normal.y * curvature };
  }

  let pathD = '';
  let midX = (start.x + end.x) / 2;
  let midY = (start.y + end.y) / 2;

  if (style === 'straight') {
    pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  } else if (style === 'stepped') {
    if (orientation === 'horizontal') {
      const mx = (start.x + end.x) / 2;
      pathD = `M ${start.x} ${start.y} L ${mx} ${start.y} L ${mx} ${end.y} L ${end.x} ${end.y}`;
    } else {
      const my = (start.y + end.y) / 2;
      pathD = `M ${start.x} ${start.y} L ${start.x} ${my} L ${end.x} ${my} L ${end.x} ${end.y}`;
    }
  } else {
    // Smooth Sigmoid Cubic Bézier Curve (S-curve)
    pathD = `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
    // Mathematically exact midpoint along cubic bezier at t=0.5
    midX = 0.125 * start.x + 0.375 * c1.x + 0.375 * c2.x + 0.125 * end.x;
    midY = 0.125 * start.y + 0.375 * c1.y + 0.375 * c2.y + 0.125 * end.y;
  }

  return { start, end, c1, c2, midX, midY, pathD, orientation };
}

/**
 * Computes live preview sigmoid curve geometry from a source card to any arbitrary mouse pointer.
 */
export function computePreviewPath(
  source: CanvasElement,
  targetPoint: Point,
  style: 'curved' | 'straight' | 'stepped' = 'curved'
) {
  const srcW = source.width || 280;
  const srcH = source.height || 180;
  const srcCenter = { x: source.x + srcW / 2, y: source.y + srcH / 2 };

  const dx = targetPoint.x - srcCenter.x;
  const dy = targetPoint.y - srcCenter.y;

  const normX = Math.abs(dx) / Math.max(1, srcW / 2);
  const normY = Math.abs(dy) / Math.max(1, srcH / 2);

  let start: Point;
  let normal: { x: number; y: number };
  let orientation: 'horizontal' | 'vertical';

  if (normX >= normY) {
    orientation = 'horizontal';
    if (dx >= 0) {
      start = { x: source.x + srcW, y: srcCenter.y };
      normal = { x: 1, y: 0 };
    } else {
      start = { x: source.x, y: srcCenter.y };
      normal = { x: -1, y: 0 };
    }
  } else {
    orientation = 'vertical';
    if (dy >= 0) {
      start = { x: srcCenter.x, y: source.y + srcH };
      normal = { x: 0, y: 1 };
    } else {
      start = { x: srcCenter.x, y: source.y };
      normal = { x: 0, y: -1 };
    }
  }

  if (style === 'straight') {
    return {
      start,
      end: targetPoint,
      pathD: `M ${start.x} ${start.y} L ${targetPoint.x} ${targetPoint.y}`,
    };
  }

  if (style === 'stepped') {
    const midX = Math.round((start.x + targetPoint.x) / 2);
    return {
      start,
      end: targetPoint,
      pathD: `M ${start.x} ${start.y} H ${midX} V ${targetPoint.y} H ${targetPoint.x}`,
    };
  }

  const curvature = orientation === 'horizontal'
    ? Math.max(Math.abs(targetPoint.x - start.x) * 0.5, 45)
    : Math.max(Math.abs(targetPoint.y - start.y) * 0.5, 45);

  const c1 = orientation === 'horizontal'
    ? { x: start.x + normal.x * curvature, y: start.y }
    : { x: start.x, y: start.y + normal.y * curvature };
  const c2 = orientation === 'horizontal'
    ? { x: targetPoint.x - normal.x * curvature, y: targetPoint.y }
    : { x: targetPoint.x, y: targetPoint.y - normal.y * curvature };

  return {
    start,
    end: targetPoint,
    pathD: `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${targetPoint.x} ${targetPoint.y}`,
  };
}

interface ConnectorLineProps {
  connector: CanvasConnector;
  source: CanvasElement;
  target: CanvasElement;
  onDelete: () => void;
  onUpdate?: (updates: Partial<CanvasConnector>) => void;
}

export function ConnectorLine({
  connector,
  source,
  target,
  onDelete,
  onUpdate,
}: ConnectorLineProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelText, setLabelText] = useState(connector.label || '');
  const [showPalette, setShowPalette] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingLabel) {
      labelInputRef.current?.focus();
      labelInputRef.current?.select();
    }
  }, [isEditingLabel]);

  const { start, midX, midY, pathD } = computeConnectorGeometry(
    source,
    target,
    connector.style || 'curved'
  );

  const connectorColor = connector.color || '#5B6CF9';
  const markerId = `arrowhead-${connector.id}`;

  const handleSaveLabel = () => {
    setIsEditingLabel(false);
    if (onUpdate && labelText !== connector.label) {
      onUpdate({ label: labelText.trim() });
    }
  };

  const handleToggleStyle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdate) return;
    const nextStyle = connector.style === 'curved' ? 'straight' : 'curved';
    onUpdate({ style: nextStyle });
  };

  const handleColorChange = (e: React.MouseEvent, colorVal: string) => {
    e.stopPropagation();
    if (onUpdate) {
      onUpdate({ color: colorVal });
    }
    setShowPalette(false);
  };

  return (
    <g
      className="group cursor-pointer pointer-events-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!isEditingLabel) setShowPalette(false);
      }}
    >
      {/* SVG arrowhead marker definition */}
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 1.5 L 8 5 L 0 8.5 z"
            fill={isHovered ? '#EF4444' : connectorColor}
            className="transition-colors duration-150"
          />
        </marker>
        <filter id={`glow-${connector.id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={connectorColor} floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Origin dot at source connection point */}
      <circle
        cx={start.x}
        cy={start.y}
        r="4"
        fill={isHovered ? '#EF4444' : connectorColor}
        className="transition-colors duration-150"
      />

      {/* Invisible wider path to make hovering and clicking responsive */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth="24"
        strokeLinecap="round"
      />

      {/* Visible line */}
      <path
        d={pathD}
        fill="none"
        stroke={isHovered ? '#EF4444' : connectorColor}
        strokeWidth={isHovered ? '3.5' : '2.5'}
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
        filter={isHovered ? `url(#glow-${connector.id})` : undefined}
        className="transition-[stroke,stroke-width] duration-150"
      />

      {/* Midpoint Label Badge (when not hovering or when label exists) */}
      {connector.label && !isHovered && !isEditingLabel && (
        <foreignObject
          x={midX - 70}
          y={midY - 14}
          width="140"
          height="28"
          className="overflow-visible pointer-events-none"
        >
          <div className="flex items-center justify-center">
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-md border truncate max-w-[130px] select-none backdrop-blur-md"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                borderColor: connectorColor,
                color: '#F8FAFC',
              }}
            >
              {connector.label}
            </span>
          </div>
        </foreignObject>
      )}

      {/* Midpoint Interactive Controls (on Hover or when Editing Label) */}
      {(isHovered || isEditingLabel) && (
        <foreignObject
          x={midX - 90}
          y={midY - 20}
          width="180"
          height="40"
          className="overflow-visible pointer-events-auto"
        >
          <div className="flex items-center justify-center gap-1.5 p-1 rounded-full bg-zinc-900/95 border border-white/20 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
            {isEditingLabel ? (
              <div className="flex items-center gap-1 px-2 py-0.5" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={labelInputRef}
                  type="text"
                  value={labelText}
                  placeholder="Label..."
                  onChange={(e) => setLabelText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveLabel();
                    if (e.key === 'Escape') setIsEditingLabel(false);
                  }}
                  className="w-24 bg-transparent text-white text-[11px] font-semibold outline-none border-b border-indigo-400"
                />
                <button
                  type="button"
                  onClick={handleSaveLabel}
                  className="p-1 text-emerald-400 hover:text-emerald-300"
                  title="Save label"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                {/* Style toggle: Curved (Sigmoid) vs Straight */}
                {onUpdate && (
                  <button
                    type="button"
                    onClick={handleToggleStyle}
                    className="p-1 text-zinc-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                    title={connector.style === 'curved' ? 'Switch to straight' : 'Switch to curved'}
                  >
                    {connector.style === 'curved' ? (
                      <Spline className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Minus className="w-3.5 h-3.5 text-zinc-300" />
                    )}
                  </button>
                )}

                {/* Label edit button */}
                {onUpdate && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLabelText(connector.label || '');
                      setIsEditingLabel(true);
                    }}
                    className="p-1 text-zinc-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                    title={connector.label ? 'Edit label' : 'Add label'}
                  >
                    <Tag className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Color dots picker */}
                {onUpdate && (
                  <div className="relative flex items-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPalette((prev) => !prev);
                      }}
                      className="w-4 h-4 rounded-full border border-white/40 transition-transform hover:scale-110"
                      style={{ backgroundColor: connectorColor }}
                      title="Change color"
                    />
                    {showPalette && (
                      <div
                        className="absolute bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-700 rounded-full shadow-2xl z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {CONNECTOR_COLORS.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={(e) => handleColorChange(e, c.value)}
                            className="w-3.5 h-3.5 rounded-full border border-white/20 hover:scale-125 transition-transform"
                            style={{ backgroundColor: c.value }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Delete button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="w-6 h-6 flex items-center justify-center bg-red-500/90 hover:bg-red-600 text-white rounded-full border border-white/20 shadow-md transition-transform hover:scale-110 active:scale-95"
                  title="Delete connector"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  );
}
