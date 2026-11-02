'use client';

import * as React from 'react';
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import { EASE_OUT, popItem, riseItem, stagger } from '@/lib/motion';

/** Staggers any `<StaggerItem>` descendants in as the block enters the viewport. */
export function Stagger({
  className,
  gap = 0.05,
  delay = 0.04,
  children,
  ...props
}: HTMLMotionProps<'div'> & { gap?: number; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={stagger(gap, delay)}
      initial={reduce ? 'show' : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount: 'some' }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  className,
  variant = 'rise',
  ...props
}: HTMLMotionProps<'div'> & { variant?: 'rise' | 'pop' }) {
  return <motion.div className={className} variants={variant === 'pop' ? popItem : riseItem} {...props} />;
}

/**
 * For long lists (hundreds of cards): each item reveals when *it* scrolls into
 * view, with a tiny stagger inside the current row batch. Never waits on a
 * parent container being a fraction visible (tall grids would stay hidden).
 */
export function InViewItem({
  index = 0,
  className,
  ...props
}: HTMLMotionProps<'div'> & { index?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 14, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 'some' }}
      transition={{ duration: 0.6, delay: (index % 8) * 0.04, ease: EASE_OUT }}
      {...props}
    />
  );
}

/** One-off rise-in for a single block. */
export function Reveal({
  className,
  delay = 0,
  y = 16,
  ...props
}: HTMLMotionProps<'div'> & { delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: EASE_OUT }}
      {...props}
    />
  );
}

/**
 * Headline reveal: each word rises out of its own mask (yPercent 115, rotate 6°
 * → 0, stagger) — Murmura's title treatment. Text stays one accessible string.
 */
export function SplitReveal({
  text,
  className,
  delay = 0,
  as: Tag = 'span',
  inView = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: 'span' | 'h1' | 'h2';
  /** Play when scrolled into view instead of on mount (below-the-fold headings). */
  inView?: boolean;
}) {
  const reduce = useReducedMotion();
  const words = text.split(' ');
  return (
    <Tag className={className} aria-label={text}>
      {words.map((w, i) => (
        // The observer sits on the mask (it never moves). Observing the word itself fails:
        // it starts translated fully out of its own overflow-hidden mask, so it is "not visible".
        <motion.span
          key={i}
          aria-hidden
          className="inline-block overflow-hidden pb-[0.12em] align-bottom"
          initial={reduce ? 'visible' : 'hidden'}
          {...(inView
            ? { whileInView: 'visible', viewport: { once: true, amount: 'some' as const } }
            : { animate: 'visible' })}
        >
          <motion.span
            className="inline-block origin-bottom-left"
            variants={{
              hidden: { y: '115%', rotate: 6 },
              visible: {
                y: '0%',
                rotate: 0,
                transition: { duration: 0.85, delay: delay + i * 0.045, ease: [0.16, 1, 0.3, 1] },
              },
            }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </motion.span>
      ))}
    </Tag>
  );
}

/** Number that counts up when it scrolls into view (stat tiles). */
export function CountUp({
  value,
  duration = 1.2,
  delay = 0,
  className,
  format = (n: number) => Math.round(n).toLocaleString(),
}: {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const from = React.useRef(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce || !inView) {
      el.textContent = format(reduce ? value : from.current);
      if (reduce) from.current = value;
      return;
    }
    // A count that changes after it has already shown a value pops once (reference "flash").
    if (from.current !== 0 && from.current !== value) {
      el.classList.remove('animate-flash');
      void el.offsetWidth;
      el.classList.add('animate-flash');
    }
    const controls = animate(from.current, value, {
      duration,
      delay,
      ease: EASE_OUT,
      onUpdate: (v) => {
        el.textContent = format(v);
      },
      onComplete: () => {
        from.current = value;
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inView, reduce, duration, delay]);

  return (
    <span ref={ref} className={cn("inline-block", className)}>
      {format(0)}
    </span>
  );
}

/** Pulls its child a few px toward the cursor (primary CTAs, dock FAB). */
export function Magnetic({
  children,
  strength = 0.28,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  return (
    <motion.span
      className={cn('inline-flex', className)}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/** Lift-on-hover wrapper for cards (`power3.out`, 4px). */
export function Lift({ className, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -4, transition: { duration: 0.45, ease: EASE_OUT } }}
      whileTap={{ scale: 0.985 }}
      {...props}
    />
  );
}
