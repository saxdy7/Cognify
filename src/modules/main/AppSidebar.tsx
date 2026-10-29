'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Layers, Plus, Sparkles, Star } from 'lucide-react';
import { useWorkspace } from '@/hooks/use-workspace';
import { ACCENT_ACTIVE, ACCENT_TEXT, NAV_ITEMS, SECONDARY_NAV_ITEMS, type NavItem } from '@/lib/static';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CognifyLogo } from '@/modules/main/CognifyLogo';
import { SidebarUserCard } from '@/modules/main/SidebarUserCard';
import { useShell } from '@/modules/main/ShellProvider';
import { UnreadBadge } from '@/modules/inbox/NotificationsInbox';

function isRouteActive(pathname: string, item: NavItem) {
  if (pathname === item.url) return true;
  return !!item.nested && pathname.startsWith(item.url + '/');
}

export function AppSidebar() {
  const pathname = usePathname();
  const { loading, notes, boards, bookmarks, user } = useWorkspace();
  const { openAi } = useShell();

  // Explicitly block any zooming when the cursor is over the sidebar
  const sidebarContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sidebarContainerRef.current;
    if (!el) return;

    const blockSidebarZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener('wheel', blockSidebarZoom, { passive: false });
    return () => el.removeEventListener('wheel', blockSidebarZoom);
  }, []);

  const favoriteLinks = bookmarks.filter((b) => b.is_favorite).slice(0, 5);
  const recentPages = [...notes]
    .filter((n) => !n.parent_id || n.user_id !== user?.id)
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
    .slice(0, 6);
  const recentBoards = boards.slice(0, 6);

  return (
    <Sidebar collapsible="icon">
      <div ref={sidebarContainerRef} className="flex flex-col h-full w-full">
        <SidebarHeader className="border-b border-sidebar-border">
          <Link href="/dashboard" className="flex h-12 items-center gap-2.5 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <CognifyLogo className="size-7 shrink-0" />
            <span className="font-heading text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">Cognify</span>
          </Link>
          <SidebarUserCard />
        </SidebarHeader>

        <SidebarContent className="gap-0">
          {/* Primary navigation — one entry per workspace */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {NAV_ITEMS.map((item) => {
                  const active = isRouteActive(pathname, item);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className={cn(
                          'h-10 px-3 text-muted-foreground transition-all duration-200',
                          active && [
                            'bg-transparent! bg-linear-to-r to-transparent text-foreground! font-semibold',
                            'rounded-md border-l-[3px] pl-[9px]',
                            ACCENT_ACTIVE[item.accent],
                            'group-data-[collapsible=icon]:border-l-0 group-data-[collapsible=icon]:pl-2',
                          ],
                        )}
                      >
                        <Link href={item.url}>
                          <item.icon className={cn('size-4 shrink-0', active && ACCENT_TEXT[item.accent])} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Quick access — recent docs / boards, and favourite links */}
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider">Quick access</SidebarGroupLabel>
            <SidebarGroupContent className="px-1">
              <Tabs defaultValue="docs">
                <TabsList className="grid h-8 w-full grid-cols-3">
                  <TabsTrigger value="docs" className="text-xs">Docs</TabsTrigger>
                  <TabsTrigger value="boards" className="text-xs">Boards</TabsTrigger>
                  <TabsTrigger value="links" className="text-xs">Starred</TabsTrigger>
                </TabsList>

                <div className="mt-2 h-[184px] overflow-y-auto rounded-md border bg-sidebar-accent/40 p-1.5 custom-scrollbar">
                  <TabsContent value="docs" className="m-0">
                    {loading ? (
                      <QuickListSkeleton />
                    ) : recentPages.length ? (
                      <ul className="flex flex-col gap-0.5">
                        {recentPages.map((n) => (
                          <li key={n.id}>
                            <Link
                              href={`/dashboard/docs/${n.id}`}
                              className={cn(
                                'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                                pathname === `/dashboard/docs/${n.id}` && 'bg-sidebar-accent font-medium text-sidebar-foreground',
                              )}
                            >
                              <span className="text-sm leading-none">{n.icon || '📄'}</span>
                              <span className="truncate">{n.title || 'Untitled'}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <QuickEmpty icon={FileText} label="No pages yet" href="/dashboard/docs" cta="New page" />
                    )}
                  </TabsContent>

                  <TabsContent value="boards" className="m-0">
                    {loading ? (
                      <QuickListSkeleton />
                    ) : recentBoards.length ? (
                      <ul className="flex flex-col gap-0.5">
                        {recentBoards.map((b) => (
                          <li key={b.id}>
                            <Link
                              href={`/dashboard/canvas/${b.id}`}
                              className={cn(
                                'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                                pathname === `/dashboard/canvas/${b.id}` && 'bg-sidebar-accent font-medium text-sidebar-foreground',
                              )}
                            >
                              <Layers className="size-3.5 shrink-0 text-canvas" />
                              <span className="truncate">{b.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <QuickEmpty icon={Layers} label="No boards yet" href="/dashboard/canvas" cta="New board" />
                    )}
                  </TabsContent>

                  <TabsContent value="links" className="m-0">
                    {loading ? (
                      <QuickListSkeleton />
                    ) : favoriteLinks.length ? (
                      <ul className="flex flex-col gap-0.5">
                        {favoriteLinks.map((b) => (
                          <li key={b.id}>
                            <a
                              href={b.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            >
                              {b.logo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={b.logo_url} alt="" className="size-3.5 shrink-0 rounded-sm object-contain" />
                              ) : (
                                <Star className="size-3.5 shrink-0 text-brand" />
                              )}
                              <span className="truncate">{b.title || b.url}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <QuickEmpty icon={Star} label="No starred links" href="/dashboard/bookmarks" cta="Browse links" />
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Secondary navigation */}
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {SECONDARY_NAV_ITEMS.map((item) => {
                  const active = isRouteActive(pathname, item);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className={cn('h-9 px-3 text-muted-foreground', active && 'text-foreground font-medium')}
                      >
                        <Link href={item.url} className="relative">
                          <item.icon className="size-4 shrink-0" />
                          <span>{item.title}</span>
                          {item.url === '/dashboard/inbox' && (
                            <UnreadBadge className="ml-auto size-2 rounded-full bg-ai group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:top-1.5 group-data-[collapsible=icon]:right-1.5" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border group-data-[collapsible=icon]:hidden">

          <div className="space-y-2 rounded-lg bg-linear-to-br from-ai/15 via-ai/5 to-transparent p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 size-4 text-ai" />
              <div className="text-sm leading-snug">
                <p className="font-medium">Cognify AI</p>
                <p className="text-xs text-muted-foreground">Ask about anything in your workspace.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={openAi}>
              Open copilot
            </Button>
          </div>
        </SidebarFooter>
      </div>

      <SidebarRail />
    </Sidebar>
  );
}

function QuickListSkeleton() {
  return (
    <div className="flex flex-col gap-1 p-1">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full rounded-md" />)}
    </div>
  );
}

function QuickEmpty({ icon: Icon, label, href, cta }: { icon: React.ComponentType<{ className?: string }>; label: string; href: string; cta: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 py-6 text-center">
      <Icon className="size-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <Button size="xs" variant="outline" asChild>
        <Link href={href}><Plus className="size-3" />{cta}</Link>
      </Button>
    </div>
  );
}
