'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { EASE_OUT } from '@/lib/motion';
import { NAV_ITEMS, type NavItem } from '@/lib/static';
import { cn } from '@/lib/utils';
import { CognifyLogo } from '@/modules/main/CognifyLogo';
import { SearchTrigger } from '@/modules/main/SearchCommand';
import { ThemeToggle } from '@/modules/main/ThemeToggle';
import { UserMenu } from '@/modules/main/UserMenu';

function isActive(pathname: string, item: NavItem) {
  if (pathname === item.url) return true;
  return !!item.nested && pathname.startsWith(item.url + '/');
}

const DOT: Record<NavItem['accent'], string> = {
  primary: 'bg-background',
  brand: 'bg-brand',
  canvas: 'bg-canvas',
  docs: 'bg-docs',
  ai: 'bg-ai',
};

/**
 * The pill nav. The black "active" chip is a single element that slides to the
 * measured box of the active link (re-measured on route change, resize and
 * when the nav is revealed), so it always lands where the label is.
 */
function PillNav() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const navRef = React.useRef<HTMLElement>(null);
  const [box, setBox] = React.useState<{ x: number; w: number } | null>(null);
  const activeIndex = NAV_ITEMS.findIndex((i) => isActive(pathname, i));

  const measure = React.useCallback(() => {
    const nav = navRef.current;
    const el = activeIndex >= 0 ? nav?.querySelectorAll<HTMLElement>('[data-nav-link]')[activeIndex] : undefined;
    if (!el || !el.offsetWidth) return setBox(null);
    setBox((prev) => (prev && prev.x === el.offsetLeft && prev.w === el.offsetWidth ? prev : { x: el.offsetLeft, w: el.offsetWidth }));
  }, [activeIndex]);

  React.useLayoutEffect(measure, [measure]);
  React.useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const ro = new ResizeObserver(measure); // fires when the nav is shown/hidden or labels change width
    ro.observe(nav);
    nav.querySelectorAll('[data-nav-link]').forEach((l) => ro.observe(l));
    return () => ro.disconnect();
  }, [measure]);

  return (
    <nav
      ref={navRef}
      aria-label="Primary"
      className="relative flex items-center gap-0.5 rounded-full bg-card p-1 ring-1 ring-foreground/[0.07] backdrop-blur-xl"
    >
      {box && (
        <motion.span
          aria-hidden
          className="absolute top-1 bottom-1 left-0 rounded-full bg-foreground shadow-[0_6px_16px_-6px_rgba(0,0,0,0.45)]"
          initial={false}
          animate={{ x: box.x, width: box.w }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
        />
      )}
      {NAV_ITEMS.map((item, i) => {
        const active = i === activeIndex;
        return (
          <Link
            key={item.url}
            href={item.url}
            data-nav-link
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative z-10 flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap outline-none transition-colors duration-300',
              'focus-visible:ring-2 focus-visible:ring-ring/60',
              active ? (box ? 'text-background' : 'font-semibold text-foreground') : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="hidden sm:inline">{item.title}</span>
            {active && <span className={cn('size-1.5 rounded-full', DOT[item.accent])} />}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Floating header: wordmark · pill navigation · search, theme, account.
 * Transparent over the mesh — no bar, no border.
 */
export function TopNav() {
  const reduce = useReducedMotion();

  return (
    <motion.header
      initial={reduce ? false : { opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      className="relative z-30 flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3 md:grid md:grid-cols-[1fr_auto_1fr] md:pl-[calc(var(--dock-x)*2+var(--dock-w))]"
    >
      <Link href="/dashboard" className="group flex items-center gap-2.5 justify-self-start" aria-label="Cognify home">
        <CognifyLogo className="size-8 transition-transform duration-500 ease-(--ease-pop) group-hover:rotate-[-8deg] group-hover:scale-105" size={32} />
        <span className="font-heading text-lg font-bold tracking-tight">Cognify</span>
      </Link>

      <div className="hidden md:block"><PillNav /></div>

      <div className="flex items-center gap-1.5 justify-self-end rounded-full bg-card p-1 ring-1 ring-foreground/[0.07] backdrop-blur-xl">
        <SearchTrigger />
        <ThemeToggle />
        <UserMenu />
      </div>

      {/* Phones: the pill nav wraps onto its own row under the header */}
      <div className="order-last flex w-full justify-center md:hidden"><PillNav /></div>
    </motion.header>
  );
}
