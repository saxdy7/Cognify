'use client';

/** Overview stat tile. Accent only on the icon. */
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StatCard({ label, value, icon: Icon, href, accentClass, loading }: {
  label: string; value: number; icon: LucideIcon; href: string; accentClass?: string; loading?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:bg-muted/40">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            {loading ? <Skeleton className="mt-1 h-8 w-12" /> : <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>}
          </div>
          <Icon className={cn('size-5', accentClass)} />
        </CardContent>
      </Card>
    </Link>
  );
}
