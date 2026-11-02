import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CountUp, Reveal, SplitReveal } from '@/components/motion/reveal';

export interface HeaderStat {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  /** Tailwind text colour for the icon, e.g. `text-brand` */
  iconClassName?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Tailwind text colour class for the icon, e.g. `text-brand` */
  iconClassName?: string;
  /** Small count-up chips shown beside the title (Solvik/Murmura header strip). */
  stats?: HeaderStat[];
  actions?: React.ReactNode;
  className?: string;
}

/** Consistent page heading: big title, optional stat chips, description, actions on the right. */
export function PageHeader({ title, description, icon: Icon, iconClassName, stats, actions, className }: PageHeaderProps) {
  return (
    <Reveal className={cn('flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between', className)}>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {Icon && <Icon className={cn('size-7 shrink-0', iconClassName)} />}
            <SplitReveal as="h1" text={title} className="truncate text-3xl font-bold tracking-tight sm:text-4xl" delay={0.05} />
          </div>
          {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
        </div>

        {stats && stats.length > 0 && (
          <ul className="flex flex-wrap items-center gap-2">
            {stats.map((s) => (
              <li
                key={s.label}
                className="flex items-center gap-2 rounded-full bg-card py-1.5 pr-3.5 pl-2 ring-1 ring-foreground/[0.07] backdrop-blur-xl"
              >
                {s.icon && (
                  <span className="flex size-6 items-center justify-center rounded-full bg-foreground/[0.07]">
                    <s.icon className={cn('size-3.5', s.iconClassName)} />
                  </span>
                )}
                <span className="text-sm leading-none font-semibold tabular-nums">
                  {typeof s.value === 'number' ? <CountUp value={s.value} /> : s.value}
                </span>
                <span className="text-xs leading-none text-muted-foreground">{s.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {actions && (
        <div
          className={cn(
            'flex shrink-0 flex-wrap items-center gap-2',
            // One size for every header action, whatever the page asked for (matches Overview's large pills)
            '[&_[data-slot=button]:not([data-size^=icon])]:h-11 [&_[data-slot=button]:not([data-size^=icon])]:px-6 [&_[data-slot=button]:not([data-size^=icon])]:text-[15px]',
            '[&_[data-slot=button][data-size^=icon]]:size-11 [&_[data-slot=input]]:h-11',
          )}
        >
          {actions}
        </div>
      )}
    </Reveal>
  );
}

export function SectionHeader({ title, description, action, className }: { title: React.ReactNode; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
