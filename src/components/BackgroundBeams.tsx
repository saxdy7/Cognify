'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const BackgroundBeams = React.memo(({ className }: { className?: string }) => {
  const beams = useMemo(() => [
    {
      d: "M-100 100C150 200 350 -100 600 100C850 300 1050 100 1300 200",
      duration: 15,
      delay: 0,
      color: "#6366f1",
    },
    {
      d: "M-100 300C200 150 450 450 700 300C950 150 1150 350 1400 200",
      duration: 18,
      delay: 2,
      color: "#a855f7",
    },
    {
      d: "M-100 500C250 400 500 600 750 500C1000 400 1200 600 1450 500",
      duration: 20,
      delay: 4,
      color: "#ec4899",
    },
    {
      d: "M-100 700C150 800 400 600 650 700C900 800 1100 600 1350 700",
      duration: 12,
      delay: 1,
      color: "#6366f1",
    },
    {
      d: "M1400 100C1150 200 950 -100 700 100C450 300 250 100 0 200",
      duration: 22,
      delay: 3,
      color: "#3b82f6",
    },
  ], []);

  return (
    <div className={cn("fixed inset-0 z-0 pointer-events-none overflow-hidden bg-zinc-950", className)}>
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      <svg
        className="h-full w-full opacity-40"
        width="100%"
        height="100%"
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {beams.map((beam, i) => (
            <linearGradient key={`grad-${i}`} id={`beam-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={beam.color} stopOpacity="0" />
              <stop offset="50%" stopColor={beam.color} stopOpacity="0.5" />
              <stop offset="100%" stopColor={beam.color} stopOpacity="0" />
            </linearGradient>
          ))}
          <filter id="blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
          </filter>
        </defs>
        
        <g filter="url(#blur)">
          {beams.map((beam, i) => (
            <motion.path
              key={i}
              d={beam.d}
              stroke={`url(#beam-grad-${i})`}
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1, 0],
                opacity: [0, 1, 0],
                transition: {
                  duration: beam.duration,
                  delay: beam.delay,
                  repeat: Infinity,
                  ease: "linear"
                }
              }}
            />
          ))}
        </g>
      </svg>
      
      {/* Radial Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
});

BackgroundBeams.displayName = "BackgroundBeams";
