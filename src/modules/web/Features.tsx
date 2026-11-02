'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Zap, Layers, Sparkles } from 'lucide-react';
import { SplitReveal, Stagger, StaggerItem } from '@/components/motion/reveal';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

const features = [
  {
    title: 'Smart Spaces',
    description: 'Auto-categorize bookmarks into high-res containers using AI context.',
    icon: Layers,
    tone: 'bg-tint-lime text-tint-lime-foreground',
    span: 'md:col-span-2',
    visual: 'chips',
  },
  {
    title: 'Knowledge Docs',
    description: 'Write and structure notes with a block-based editor built for deep work.',
    icon: FileText,
    tone: 'bg-tint-sky text-tint-sky-foreground',
    span: 'md:col-span-1',
    visual: 'lines',
  },
  {
    title: 'Instant Flow',
    description: 'Beautiful Microlink-powered previews for every capture.',
    icon: Zap,
    tone: 'bg-tint-coral text-tint-coral-foreground',
    span: 'md:col-span-1',
    visual: 'bars',
  },
  {
    title: 'Visual Canvas',
    description: 'Drag bookmarks onto an infinite canvas and connect ideas spatially.',
    icon: Sparkles,
    tone: 'bg-tint-ink text-tint-ink-foreground',
    span: 'md:col-span-2',
    visual: 'nodes',
  },
] as const;

function Visual({ kind }: { kind: (typeof features)[number]['visual'] }) {
  if (kind === 'chips') {
    return (
      <div className="mt-8 flex flex-wrap gap-2">
        {['Design', 'Development', 'Research', 'Reading', 'Video'].map((c, i) => (
          <span key={c} className={cn('rounded-full bg-current/10 px-3.5 py-1.5 text-xs font-bold transition-transform duration-500 ease-(--ease-pop) group-hover:-translate-y-1', i % 2 && 'group-hover:translate-y-0')} style={{ transitionDelay: `${i * 40}ms` }}>
            {c}
          </span>
        ))}
      </div>
    );
  }
  if (kind === 'lines') {
    return (
      <div className="mt-8 space-y-2.5">
        {['w-full', 'w-5/6', 'w-2/3'].map((w, i) => (
          <span key={i} className={cn('block h-2.5 rounded-full bg-current/15 transition-all duration-700 ease-(--ease-out) group-hover:bg-current/30', w)} />
        ))}
      </div>
    );
  }
  if (kind === 'bars') {
    return (
      <div className="mt-8 flex h-14 items-end gap-2">
        {[40, 70, 52, 90, 64].map((h, i) => (
          <span key={i} className="w-full rounded-t-lg bg-current/20 transition-all duration-700 ease-(--ease-pop) group-hover:bg-current/35" style={{ height: `${h}%`, transitionDelay: `${i * 50}ms` }} />
        ))}
      </div>
    );
  }
  return (
    <svg viewBox="0 0 300 70" className="mt-8 h-16 w-full max-w-md" fill="none" aria-hidden>
      <path d="M20 45 C80 5, 120 65, 170 30 S 260 10, 285 40" stroke="currentColor" strokeOpacity=".35" strokeWidth="2" strokeDasharray="4 5" className="transition-all duration-700 group-hover:[stroke-opacity:.7]" />
      {[[20, 45], [100, 38], [170, 30], [285, 40]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="9" fill="currentColor" fillOpacity=".18" stroke="currentColor" strokeOpacity=".5" />
      ))}
    </svg>
  );
}

export const LandingFeatures = () => {
  return (
    <section id="features" className="relative py-20 md:py-28 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto mb-16 max-w-4xl text-center md:mb-20">
          <h2 className="text-4xl leading-[1] font-bold tracking-tight md:text-7xl">
            <SplitReveal inView text="Engineered for" />
            <br />
            <SplitReveal inView text="infinite knowledge." delay={0.12} className="text-muted-foreground" />
          </h2>
        </div>

        <Stagger className="relative z-10 mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3 md:gap-5" gap={0.09}>
          {features.map((feature) => (
            <StaggerItem key={feature.title} variant="pop" className={feature.span}>
              <motion.div
                whileHover={{ y: -8, transition: { duration: 0.45, ease: EASE_OUT } }}
                className={cn('group relative flex h-full min-h-[260px] flex-col justify-between overflow-hidden rounded-[2rem] p-8 md:p-10', feature.tone)}
              >
                <div>
                  <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-current/10 transition-transform duration-500 ease-(--ease-pop) group-hover:rotate-6 group-hover:scale-110">
                    <feature.icon className="size-7" />
                  </div>
                  <h3 className="mb-2 text-2xl font-bold tracking-tight md:text-3xl">{feature.title}</h3>
                  <p className="max-w-sm text-base leading-relaxed font-medium opacity-75">{feature.description}</p>
                </div>
                <Visual kind={feature.visual} />
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
};
