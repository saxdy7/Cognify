'use client';

/** Dashed empty state with one CTA. Use different copy for "filtered to nothing" vs "nothing exists". */
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

export function EmptyState({ icon: Icon, title, description, cta, onCta }: {
  icon: LucideIcon; title: string; description: string; cta?: string; onCta?: () => void;
}) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon"><Icon /></EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {cta && onCta && (
        <EmptyContent><Button size="sm" onClick={onCta}>{cta}</Button></EmptyContent>
      )}
    </Empty>
  );
}
