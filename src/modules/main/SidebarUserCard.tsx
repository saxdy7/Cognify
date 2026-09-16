'use client';

import { useWorkspace } from '@/hooks/use-workspace';
import { initialsOf } from '@/lib/format';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

// Compact identity card under the logo (hidden when the sidebar is collapsed).
export function SidebarUserCard() {
  const { user, loading } = useWorkspace();
  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  const name = meta.full_name || meta.name || user?.email?.split('@')[0] || 'You';
  const avatar = meta.avatar_url || meta.picture;

  if (loading || !user) {
    return (
      <div className="mb-1 flex items-center gap-3 rounded-md border bg-sidebar-accent/40 px-3 py-2 group-data-[collapsible=icon]:hidden">
        <Skeleton className="size-9 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-1 flex items-center gap-3 overflow-hidden rounded-md border bg-sidebar-accent/40 px-3 py-2 group-data-[collapsible=icon]:hidden">
      <Avatar className="size-9">
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback className="text-xs font-semibold">{initialsOf(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
    </div>
  );
}
