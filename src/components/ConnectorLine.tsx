'use client';

import React, { useState } from 'react';
import { CanvasElement, CanvasConnector } from '@/types';
import { X } from 'lucide-react';

interface ConnectorLineProps {
  connector: CanvasConnector;
  source: CanvasElement;
  target: CanvasElement;
  onDelete: () => void;
}

export function ConnectorLine({ connector, source, target, onDelete }: ConnectorLineProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Default widths if missing
  const srcW = source.width || 280;
  const srcH = source.height || 180;
  const tgtW = target.width || 280;
  const tgtH = target.height || 180;

  // Center points of elements
  const srcCenter = { x: source.x + srcW / 2, y: source.y + srcH / 2 };
  const tgtCenter = { x: target.x + tgtW / 2, y: target.y + tgtH / 2 };

  // Determine boundary anchoring points
  let x1 = srcCenter.x;
  let y1 = srcCenter.y;
  let x2 = tgtCenter.x;
  let y2 = tgtCenter.y;

  // Simple bounding box edge calculation
  if (source.x + srcW < target.x) {
    // Source is left of Target
    x1 = source.x + srcW;
    x2 = target.x;
  } else if (target.x + tgtW < source.x) {
    // Source is right of Target
    x1 = source.x;
    x2 = target.x + tgtW;
  }

  if (source.y + srcH < target.y) {
    // Source is above Target
    y1 = source.y + srcH;
    y2 = target.y;
  } else if (target.y + tgtH < source.y) {
    // Source is below Target
    y1 = source.y;
    y2 = target.y + tgtH;
  }

  // Calculate midpoint for delete button
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Render curved bezier path or straight line
  const dx = x2 - x1;
  const dy = y2 - y1;
  const pathD = connector.style === 'curved'
    ? `M ${x1} ${y1} C ${x1 + dx / 2} ${y1}, ${x2 - dx / 2} ${y2}, ${x2} ${y2}`
    : `M ${x1} ${y1} L ${x2} ${y2}`;

  return (
    <g 
      className="group cursor-pointer pointer-events-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible thicker line to make hovering easier */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth="15"
      />

      {/* Visible line */}
      <path
        d={pathD}
        fill="none"
        stroke={isHovered ? '#EF4444' : connector.color || '#5B6CF9'}
        strokeWidth="2.5"
        markerEnd={`url(#arrowhead-${connector.id})`}
        className="transition-colors duration-150"
      />

      {/* SVG arrowhead marker definition */}
      <defs>
        <marker
          id={`arrowhead-${connector.id}`}
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 2 L 10 5 L 0 8 z"
            fill={isHovered ? '#EF4444' : connector.color || '#5B6CF9'}
            className="transition-colors duration-150"
          />
        </marker>
      </defs>

      {/* MIDPOINT DELETE TRIGGER BUTTON */}
      {isHovered && (
        <foreignObject
          x={midX - 12}
          y={midY - 12}
          width="24"
          height="24"
          className="overflow-visible pointer-events-auto"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-6 h-6 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full border border-white/20 shadow-md transform hover:scale-110 active:scale-95 transition-all"
            title="Delete Connection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </foreignObject>
      )}
    </g>
  );
}
