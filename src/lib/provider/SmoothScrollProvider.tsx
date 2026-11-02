'use client';

import type { ReactNode } from 'react';
import { ReactLenis } from 'lenis/react';

/**
 * Lenis controls document scrolling on marketing and authentication pages.
 * The authenticated dashboard marks its fixed, nested-scroll shell with
 * `data-lenis-prevent`, preserving native canvas, drag and panel gestures.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        autoToggle: true,
        anchors: { offset: -88 },
        duration: 1.05,
        easing: (time: number) => Math.min(1, 1.001 - Math.pow(2, -10 * time)),
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1,
        overscroll: true,
        respectReducedMotion: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}

