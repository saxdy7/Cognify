import { cn } from '@/lib/utils';

interface CognifyLogoProps {
  className?: string;
  size?: number;
  priority?: boolean;
}

/**
 * Official brand mark: the violet ribbon "C" with its sparkle. Transparent PNG, so it sits
 * directly on any surface (no tile behind it); a soft violet shadow lifts it off the page.
 */
export function CognifyLogo({ className, size = 28, priority }: CognifyLogoProps) {
  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center select-none', className)}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mark.png"
        alt=""
        width={size}
        height={size}
        className="pointer-events-none size-full object-contain drop-shadow-[0_3px_8px_rgba(124,58,237,0.35)]"
        loading={priority ? 'eager' : 'lazy'}
      />
    </span>
  );
}
