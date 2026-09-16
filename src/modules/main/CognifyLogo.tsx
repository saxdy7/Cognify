import { cn } from '@/lib/utils';

/** Brand mark: a rounded tile with a "C" node graph. Inherits `currentColor` for the glyph. */
export function CognifyLogo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center justify-center rounded-lg bg-foreground text-background', className)} aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-[62%]">
        <path d="M16.5 8.5a6 6 0 1 0 0 7" />
        <circle cx="17.5" cy="8" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="17.5" cy="16" r="1.6" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}
