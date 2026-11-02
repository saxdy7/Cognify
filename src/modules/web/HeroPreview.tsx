'use client';

import React from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { Bell, Bookmark, Check, Clock, FileText, Layers, Plus, Settings, Sparkles, Star } from 'lucide-react';
import { CountUp } from '@/components/motion/reveal';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

const TILES = [
  { label: 'Links saved', value: 121, icon: Bookmark, tone: 'bg-tint-lime text-tint-lime-foreground' },
  { label: 'Boards', value: 14, icon: Layers, tone: 'bg-tint-coral text-tint-coral-foreground' },
  { label: 'Pages', value: 38, icon: FileText, tone: 'bg-tint-sky text-tint-sky-foreground' },
  { label: 'Starred', value: 9, icon: Star, tone: 'bg-tint-ink text-tint-ink-foreground' },
];

const BOARDS = [
  { name: 'Q4 launch plan', tone: 'bg-tint-coral text-tint-coral-foreground' },
  { name: 'Moodboard 2.0', tone: 'bg-tint-sky text-tint-sky-foreground' },
  { name: 'Reading map', tone: 'bg-tint-ink text-tint-ink-foreground' },
];

const LINKS = [
  { title: 'How Linear builds product', host: 'linear.app', tag: 'Design', mark: 'L' },
  { title: 'Vercel docs — deployments', host: 'vercel.com', tag: 'Dev', mark: 'V' },
  { title: 'Figma community files', host: 'figma.com', tag: 'Design', mark: 'F' },
];

/**
 * A decorative, non-interactive mock of the dashboard for the hero. Tilts toward the
 * cursor, counts its numbers up, and carries three floating "live" chips.
 */
export function HeroPreview() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 20, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 120, damping: 20, mass: 0.6 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [5, -5]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-3.5, 3.5]);

  return (
    <motion.div
      aria-hidden
      className="relative mx-auto w-full max-w-5xl"
      initial={reduce ? false : { opacity: 0, y: 60, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.1, delay: 0.55, ease: EASE_OUT }}
      style={{ perspective: 1600 }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <motion.div
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="overflow-hidden rounded-[2rem] bg-card/70 shadow-[0_50px_120px_-40px_rgba(10,14,12,0.55)] ring-1 ring-foreground/10 backdrop-blur-2xl"
      >
        {/* window chrome */}
        <div className="flex items-center gap-3 border-b border-foreground/[0.07] px-5 py-3">
          <span className="flex gap-1.5">
            <i className="size-2.5 rounded-full bg-tint-coral" />
            <i className="size-2.5 rounded-full bg-tint-lime" />
            <i className="size-2.5 rounded-full bg-tint-sky" />
          </span>
          <span className="mx-auto rounded-full bg-foreground/[0.06] px-4 py-1 text-[11px] font-medium text-muted-foreground">cognify.app/dashboard</span>
          <span className="w-10" />
        </div>

        {/* app body — uses the same tokens as the real dashboard */}
        <div className="app-ui relative grid gap-4 p-4 md:grid-cols-[52px_1fr] md:p-6" style={{ backgroundAttachment: 'scroll' }}>
          {/* dock */}
          <div className="hidden flex-col items-center gap-2 self-start rounded-full bg-(--dock-bg) px-1.5 py-2 ring-1 ring-white/10 md:flex">
            <span className="flex size-9 items-center justify-center rounded-full bg-brand text-brand-foreground"><Plus className="size-4" /></span>
            {[Clock, Bell, Sparkles, Settings].map((Icon, i) => (
              <span key={i} className="flex size-9 items-center justify-center rounded-full text-white/60"><Icon className="size-4" /></span>
            ))}
          </div>

          <div className="min-w-0 space-y-4 text-left">
            {/* pill nav */}
            <div className="mx-auto flex w-fit items-center gap-0.5 rounded-full bg-card p-1 ring-1 ring-foreground/[0.07]">
              {['Overview', 'Bookmarks', 'Canvas', 'Docs'].map((t, i) => (
                <span key={t} className={cn('rounded-full px-3 py-1.5 text-[11px] font-semibold md:px-4 md:text-xs', i === 0 ? 'bg-foreground text-background' : 'text-muted-foreground')}>{t}</span>
              ))}
            </div>

            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Good afternoon</p>
              <p className="text-2xl leading-tight font-bold tracking-tight md:text-4xl">Welcome back, Sandeep</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
              {TILES.map((t, i) => (
                <div key={t.label} className={cn('flex h-24 flex-col justify-between rounded-3xl p-4 md:h-28', t.tone)}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold opacity-80">{t.label}</span>
                    <t.icon className="size-3.5 opacity-70" />
                  </div>
                  <span className="text-3xl leading-none font-bold tabular-nums md:text-4xl"><CountUp value={t.value} delay={0.9 + i * 0.08} /></span>
                </div>
              ))}
            </div>

            <div className="grid gap-2.5 md:grid-cols-5">
              <div className="grid grid-cols-3 gap-2.5 md:col-span-2 md:grid-cols-1">
                {BOARDS.map((b) => (
                  <div key={b.name} className={cn('flex h-14 items-center rounded-2xl px-4 text-xs font-bold md:h-12', b.tone)}>{b.name}</div>
                ))}
              </div>
              <div className="hidden divide-y divide-foreground/[0.06] overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.07] md:col-span-3 md:block">
                {LINKS.map((l) => (
                  <div key={l.title} className="flex items-center gap-3 px-3.5 py-2.5">
                    <span className="flex size-8 items-center justify-center rounded-xl border bg-background text-xs font-bold">{l.mark}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold">{l.title}</span>
                      <span className="block text-[11px] text-muted-foreground">{l.host}</span>
                    </span>
                    <span className="rounded-full bg-foreground/[0.07] px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{l.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* floating chips */}
      <FloatingChip className="top-28 -left-3 hidden md:flex lg:-left-12" delay={1.2} drift={-10}>
        <span className="flex size-7 items-center justify-center rounded-full bg-ai/15 text-ai"><Sparkles className="size-3.5" /></span>
        <span className="text-xs font-semibold">AI filed 12 links into <span className="text-brand">Design</span></span>
      </FloatingChip>

      <FloatingChip className="top-52 -right-3 hidden md:flex lg:-right-12" delay={1.5} drift={10}>
        <span className="flex -space-x-2">
          {['bg-tint-lime', 'bg-tint-coral', 'bg-tint-sky'].map((c, i) => (
            <i key={i} className={cn('size-6 rounded-full ring-2 ring-card', c)} />
          ))}
        </span>
        <span className="text-xs font-semibold">3 editing live</span>
      </FloatingChip>

      <FloatingChip className="bottom-6 left-1/2 -translate-x-1/2" delay={1.8} drift={-6} dark>
        <Check className="size-3.5 text-tint-lime" />
        <span className="text-xs font-semibold">Moved to Reading</span>
        <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold text-brand-foreground">Undo</span>
      </FloatingChip>
    </motion.div>
  );
}

function FloatingChip({ className, delay, drift, dark, children }: { className?: string; delay: number; drift: number; dark?: boolean; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.34, 1.56, 0.64, 1] }}
      className={cn('absolute z-10', className)}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, drift, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay }}
        className={cn(
          'flex items-center gap-2.5 rounded-full px-3.5 py-2 shadow-[0_18px_40px_-14px_rgba(10,14,12,0.45)] ring-1 backdrop-blur-xl',
          dark ? 'bg-tint-ink text-tint-ink-foreground ring-white/10' : 'bg-card text-foreground ring-foreground/10',
        )}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
