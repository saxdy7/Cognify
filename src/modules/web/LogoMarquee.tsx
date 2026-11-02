'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const ICON = 'size-7 md:size-8';

const BRANDS = [
  {
    name: 'Linear',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={ICON}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        <path d="M2.05 12a9.97 9.97 0 0 1 9.9-9.95v2.8a7.21 7.21 0 0 0-5.1 2.1l-1.93 1.93.07.08A9.95 9.95 0 0 1 2.05 12z" />
      </svg>
    ),
  },
  { name: 'Vercel', icon: <svg viewBox="0 0 24 24" fill="currentColor" className={ICON}><path d="M12 1L24 22H0L12 1Z" /></svg> },
  {
    name: 'Supabase',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={ICON}>
        <path d="M12.9 22.1c.3.5-.8.9-1.3.4l-9.1-8.7A1.5 1.5 0 0 1 3.5 11h6.6C10.7 11 11 10.4 10.8 10L6.6 1.9c-.3-.6.7-1 1.2-.5l9.1 8.7a1.5 1.5 0 0 1-1 2.6h-6.6c-.6 0-.8.6-.6 1l4.2 8.4z" />
      </svg>
    ),
  },
  { name: 'Framer', icon: <svg viewBox="0 0 24 24" fill="currentColor" className={ICON}><path d="M4 0h16v8h-8zM4 12h8v8l-8-8zM4 8h8v4H4z" /></svg> },
  {
    name: 'Next.js',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={ICON}>
        <path d="M20.7 18.7L12 6.5l-3.2 4.5L12 18.7zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM6 12c0-3.3 2.7-6 6-6 .6 0 1.2.1 1.8.3L7.3 16.6c-2.3-2.6-2.5-6.3-1.3-4.6zM18 12c0 1.1-.3 2.1-.8 3L9 6.2c.9-.1 1.9-.2 3-.2 3.3 0 6 2.7 6 6z" />
      </svg>
    ),
  },
  {
    name: 'React',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={ICON}>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM12 4c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8z" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
];

/** "Trusted by builders at" — a seamless, edge-faded marquee that pauses on hover. */
export function LogoMarquee() {
  const reduce = useReducedMotion();
  // Two identical halves; translating by exactly one half (-50%) loops with no jump.
  const row = (
    <div className="flex shrink-0 items-center gap-4 pr-4">
      {BRANDS.map((b) => (
        <span
          key={b.name}
          className="flex items-center gap-3 rounded-full bg-card px-6 py-3.5 text-2xl font-bold tracking-tight text-muted-foreground ring-1 ring-foreground/[0.07] backdrop-blur-xl transition-[color,transform] duration-300 hover:-translate-y-1 hover:text-brand md:text-3xl"
        >
          {b.icon}
          {b.name}
        </span>
      ))}
    </div>
  );

  return (
    <section className="overflow-hidden py-16 md:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <p className="mb-10 text-center text-xs font-bold tracking-[0.3em] text-muted-foreground uppercase">Trusted by builders at</p>
        <div className="relative [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <motion.div
            className="flex w-max"
            animate={reduce ? undefined : { x: ['0%', '-50%'] }}
            transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
          >
            {row}
            {row}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
