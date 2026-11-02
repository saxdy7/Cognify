'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'brand' | 'dark' | 'ghost' | 'onDark';

const SURFACE: Record<Variant, string> = {
  brand: 'bg-brand text-brand-foreground shadow-[0_14px_34px_-12px_color-mix(in_oklch,var(--brand)_75%,transparent)]',
  dark: 'bg-foreground text-background shadow-[0_14px_34px_-14px_rgba(10,14,12,0.6)]',
  ghost: 'bg-card text-foreground ring-1 ring-foreground/10 backdrop-blur-xl',
  onDark: 'bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-xl hover:bg-white/15',
};

const CHIP: Record<Variant, string> = {
  brand: 'bg-white text-brand',
  dark: 'bg-background text-foreground',
  ghost: 'bg-foreground text-background',
  onDark: 'bg-white text-black',
};

interface CtaProps {
  children: React.ReactNode;
  href?: string;
  variant?: Variant;
  arrow?: boolean;
  className?: string;
  onClick?: () => void;
}

/** Pill call-to-action: lifts on hover, arrow chip slides, presses down. One button for the whole site. */
export function CtaButton({ children, href, variant = 'brand', arrow = true, className, onClick }: CtaProps) {
  const cls = cn(
    'group relative inline-flex h-12 items-center gap-3 rounded-full pr-1.5 pl-6 text-[15px] font-semibold whitespace-nowrap outline-none',
    'transition-[transform,box-shadow,background-color] duration-300 ease-(--ease-out) hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]',
    'focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    !arrow && 'pr-6',
    SURFACE[variant],
    className,
  );
  const inner = (
    <>
      <span>{children}</span>
      {arrow && (
        <span className={cn('flex size-9 items-center justify-center rounded-full transition-transform duration-500 ease-(--ease-pop) group-hover:translate-x-0.5 group-hover:rotate-[-35deg]', CHIP[variant])}>
          <ArrowRight className="size-4" />
        </span>
      )}
    </>
  );
  return href ? (
    <Link href={href} className={cls}>{inner}</Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>{inner}</button>
  );
}
