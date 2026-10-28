import { cn } from '@/lib/utils';

  interface CognifyLogoProps {
    className?: string;
    size?: number;
    priority?: boolean;
  }

  /** Official brand mark: the neural cybernetic "C" node mark with glowing orange, purple, and blue gradients. */
  export function CognifyLogo({ className, size = 28, priority }: CognifyLogoProps) {
    return (
        <span
          className={cn(
            'relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-black ring-1 ring-white/15 shadow-[0_0_12px_rgba(255,107,0,0.25)] shrink-0 select-none',
            className
          )}
          aria-hidden
        >
          <img
            src="/logo-mark.png"
            alt="Cognify"
            width={size}
            height={size}
            className="w-full h-full object-cover pointer-events-none scale-105"
            loading={priority ? 'eager' : 'lazy'}
          />
        </span>
        );
}
