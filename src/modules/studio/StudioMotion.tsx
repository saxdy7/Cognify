'use client';

import React from 'react';
import Lenis from 'lenis';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

/* ───────────────────────── Lenis scroll layer ─────────────────────────
 * The dashboard shell keeps the global Lenis off (canvas, drag and panel
 * gestures need native input), so the Studio runs its own Lenis instance on
 * the shell's scroll container (<main>). Everything below hangs off it:
 * parallax, velocity skew, the progress bar, section jumps and back-to-top.
 */

interface ScrollState { scroll: number; velocity: number; progress: number }
interface StudioScrollValue {
  scrollTo: (target: string | number | HTMLElement, options?: { offset?: number; duration?: number }) => void;
  subscribe: (listener: (state: ScrollState) => void) => () => void;
}

const noop: StudioScrollValue = { scrollTo: () => {}, subscribe: () => () => {} };
const StudioScrollContext = React.createContext<StudioScrollValue>(noop);
export const useStudioScroll = () => React.useContext(StudioScrollContext);

const lenisEase = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

export function StudioScroller({ children }: { children: React.ReactNode }) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const listeners = React.useRef(new Set<(state: ScrollState) => void>());
  const lenisRef = React.useRef<Lenis | null>(null);
  const scrollerRef = React.useRef<HTMLElement | Window | null>(null);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const main = root.closest('main');
    const scrollable = main ? /(auto|scroll)/.test(getComputedStyle(main).overflowY) : false;
    const wrapper = scrollable ? main : null;
    const target: HTMLElement | Window = wrapper ?? window;
    scrollerRef.current = target;
    let lenis: Lenis | null = null;
    // Inside the dashboard shell we own the scroller; anywhere else the global Lenis (or native scroll) already does.
    if (wrapper && !reduce) {
      // `content` must be an element whose height follows the page. The shell's own wrapper is fixed to the screen height, so measuring it would freeze the scroll limit.
      lenis = new Lenis({ wrapper, content: root, eventsTarget: wrapper, autoRaf: true, duration: 1.05, easing: lenisEase, smoothWheel: true, wheelMultiplier: 0.9 });
      lenisRef.current = lenis;
    }
    // Pages grow after mount (view switches, data arriving): keep Lenis's limit in step.
    const sizeObserver = lenis ? new ResizeObserver(() => lenis?.resize()) : null;
    sizeObserver?.observe(root);

    let parallaxEls: HTMLElement[] = [];
    let skewEls: HTMLElement[] = [];
    const collect = () => {
      parallaxEls = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax]'));
      skewEls = Array.from(root.querySelectorAll<HTMLElement>('[data-velocity-skew]'));
    };
    collect();
    const observer = new MutationObserver(collect);
    observer.observe(root, { childList: true, subtree: true });

    const apply = (scroll: number, velocity: number, limit: number) => {
      const progress = limit > 0 ? Math.min(1, Math.max(0, scroll / limit)) : 0;
      const view = wrapper ? wrapper.clientHeight : window.innerHeight;
      if (!reduce) {
        parallaxEls.forEach((el) => {
          const speed = Number(el.dataset.parallax) || 0.1;
          const rect = el.getBoundingClientRect();
          const offset = (rect.top + rect.height / 2 - view / 2) * speed;
          el.style.translate = `0 ${(-offset).toFixed(1)}px`;
        });
        const skew = Math.max(-1.2, Math.min(1.2, velocity * 0.05));
        skewEls.forEach((el) => { el.style.transform = `skewY(${skew.toFixed(2)}deg)`; });
      }
      root.style.setProperty('--studio-progress', progress.toFixed(4));
      listeners.current.forEach((listener) => listener({ scroll, velocity, progress }));
    };

    let lastScroll = -1;
    const onNative = () => {
      const scroll = wrapper ? wrapper.scrollTop : window.scrollY;
      const limit = wrapper ? wrapper.scrollHeight - wrapper.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
      apply(scroll, scroll - (lastScroll < 0 ? scroll : lastScroll), limit);
      lastScroll = scroll;
    };
    if (lenis) lenis.on('scroll', ({ scroll, velocity, limit }: { scroll: number; velocity: number; limit: number }) => apply(scroll, velocity, limit));
    else target.addEventListener('scroll', onNative, { passive: true });
    onNative();

    // One delegated listener powers the cursor spotlight on every `.studio-spotlight` card.
    const onPointer = (event: PointerEvent) => {
      const card = (event.target as HTMLElement).closest<HTMLElement>('.studio-spotlight');
      if (!card) return;
      const box = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - box.left}px`);
      card.style.setProperty('--my', `${event.clientY - box.top}px`);
    };
    root.addEventListener('pointermove', onPointer, { passive: true });

    return () => {
      observer.disconnect();
      sizeObserver?.disconnect();
      root.removeEventListener('pointermove', onPointer);
      target.removeEventListener('scroll', onNative);
      lenis?.destroy();
      lenisRef.current = null;
    };
  }, [reduce]);

  const value = React.useMemo<StudioScrollValue>(() => ({
    scrollTo: (to, options) => {
      const lenis = lenisRef.current;
      if (lenis) { lenis.scrollTo(to, { offset: options?.offset ?? 0, duration: options?.duration ?? 1.2, easing: lenisEase }); return; }
      const scroller = scrollerRef.current;
      if (typeof to === 'number') { (scroller as HTMLElement | Window | null)?.scrollTo({ top: to, behavior: 'smooth' }); return; }
      const el = typeof to === 'string' ? document.querySelector<HTMLElement>(to) : to;
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    subscribe: (listener) => { listeners.current.add(listener); return () => { listeners.current.delete(listener); }; },
  }), []);

  return <StudioScrollContext.Provider value={value}><div ref={rootRef} className="studio-scroller">{children}</div></StudioScrollContext.Provider>;
}

/** Thin bar that fills as the page scrolls. */
export function ScrollProgress({ className }: { className?: string }) {
  return <div aria-hidden className={cn('pointer-events-none h-[2px] origin-left bg-lime-300', className)} style={{ transform: 'scaleX(var(--studio-progress, 0))' }} />;
}

/** Floating button that appears after the first screen and glides back up with Lenis. */
export function BackToTop() {
  const { scrollTo, subscribe } = useStudioScroll();
  const [show, setShow] = React.useState(false);
  React.useEffect(() => subscribe(({ scroll }) => setShow((current) => (scroll > 520) === current ? current : scroll > 520)), [subscribe]);
  return (
    <motion.button
      type="button"
      aria-label="Back to top"
      initial={false}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : 16, scale: show ? 1 : 0.85 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      style={{ pointerEvents: show ? 'auto' : 'none' }}
      onClick={() => scrollTo(0, { duration: 1.4 })}
      className="fixed right-5 bottom-5 z-30 flex size-11 items-center justify-center rounded-full bg-foreground text-background shadow-xl ring-1 ring-foreground/10 transition-transform hover:scale-110 active:scale-95"
    >
      <ArrowUp className="size-4" />
    </motion.button>
  );
}

/** Sticky chip bar: jumps between sections with Lenis and highlights the one in view. */
export function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  const { scrollTo } = useStudioScroll();
  const [active, setActive] = React.useState(items[0]?.id);
  React.useEffect(() => {
    const els = items.map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver((entries) => {
      const hit = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(hit.target.id);
    }, { rootMargin: '-25% 0px -60% 0px' });
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);
  return (
    <nav aria-label="Sections" className="sticky top-[68px] z-20 -mx-1 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-card/80 p-1 ring-1 ring-foreground/[0.08] backdrop-blur-xl no-scrollbar">
      {items.map((item) => (
        <button key={item.id} type="button" onClick={() => scrollTo(`#${item.id}`, { offset: -132 })} className={cn('relative h-8 shrink-0 rounded-full px-3.5 text-[11px] font-semibold transition-colors', active === item.id ? 'text-background' : 'text-muted-foreground hover:text-foreground')}>
          {active === item.id && <motion.span layoutId="studio-section-pill" transition={{ type: 'spring', stiffness: 520, damping: 38 }} className="absolute inset-0 rounded-full bg-foreground" />}
          <span className="relative">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ───────────────────────── In-view primitives ───────────────────────── */

/** `[ref, revealed]` — flips to true once, when the element first scrolls into view. */
export function useRevealed<T extends Element = HTMLDivElement>(amount = 0.35) {
  const ref = React.useRef<T>(null);
  const revealed = useInView(ref, { once: true, amount });
  return [ref, revealed] as const;
}

/** Wrap a chart/meter group so its CSS draw-in animations wait until it is on screen. */
export function ChartScope({ children, className }: { children: React.ReactNode; className?: string }) {
  const [ref, revealed] = useRevealed<HTMLDivElement>(0.2);
  return <div ref={ref} data-inview={revealed} className={cn('studio-chart', className)}>{children}</div>;
}

/** Fade-and-rise as a block scrolls into view. */
export function ScrollReveal({ children, delay = 0, y = 22, className }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────── Numbers, lines ───────────────────────── */

/**
 * Number that tweens to its new value whenever it changes (forecast tickers,
 * column totals, chart headlines). The first count starts when it scrolls into
 * view; every later change pops once so the eye catches what moved.
 */
export function AnimatedNumber({
  value,
  format = (n: number) => Math.round(n).toLocaleString('en-IN'),
  duration = 0.7,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const [ref, inView] = useRevealed<HTMLSpanElement>(0.4);
  const shown = React.useRef(0);
  const counted = React.useRef(false);
  const reduce = useReducedMotion();
  const formatRef = React.useRef(format);
  React.useEffect(() => { formatRef.current = format; }, [format]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = formatRef.current(value);
      shown.current = value;
      return;
    }
    if (!inView) { el.textContent = formatRef.current(0); return; }
    if (counted.current && shown.current !== value) {
      el.classList.remove('animate-flash');
      void el.offsetWidth;
      el.classList.add('animate-flash');
    }
    counted.current = true;
    const controls = animate(shown.current, value, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => { shown.current = v; el.textContent = formatRef.current(v); },
      onComplete: () => { shown.current = value; el.textContent = formatRef.current(value); },
    });
    return () => controls.stop();
  }, [value, duration, reduce, inView, ref]);

  // Server + first client render show the final value so nothing is blank before hydration.
  return <span ref={ref} className={cn('tabular-nums', className)} suppressHydrationWarning>{format(value)}</span>;
}

/** Tiny trend line that draws itself in once it is on screen. */
export function Sparkline({ data, className, stroke = 'currentColor' }: { data: number[]; className?: string; stroke?: string }) {
  const [ref, revealed] = useRevealed<SVGSVGElement>(0.5);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => `${data.length === 1 ? 50 : (i / (data.length - 1)) * 100},${88 - ((v - min) / span) * 76}`).join(' ');
  return (
    <svg ref={ref} viewBox="0 0 100 100" preserveAspectRatio="none" className={cn('h-8 w-24 overflow-visible', className)} aria-hidden>
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        style={{ strokeDasharray: 1, strokeDashoffset: revealed ? 0 : 1, transition: 'stroke-dashoffset 900ms cubic-bezier(0.23,1,0.32,1)' }}
      />
    </svg>
  );
}
