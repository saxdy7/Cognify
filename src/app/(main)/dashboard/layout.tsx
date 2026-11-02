'use client';

import React from 'react';
import { Bell, PanelRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { LiveblocksProviders } from '@/lib/provider/LiveblocksProvider';
import { WorkspaceProvider } from '@/lib/provider/WorkspaceProvider';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AppSidebar } from '@/modules/main/AppSidebar';
import { BreadCrumbs } from '@/modules/main/BreadCrumbs';
import { SearchCommand, SearchTrigger } from '@/modules/main/SearchCommand';
import { ShellProvider, useShell } from '@/modules/main/ShellProvider';
import { ThemeToggle } from '@/modules/main/ThemeToggle';
import { UserMenu } from '@/modules/main/UserMenu';
import { AiChatPanel } from '@/modules/ai/AiChatPanel';
import { WorkspaceContextSidebar } from '@/modules/inspector/WorkspaceContextSidebar';
import { UnreadBadge } from '@/modules/inbox/NotificationsInbox';
import { cn } from '@/lib/utils';

/**
 * Authenticated app shell: sidebar + header (trigger · breadcrumbs · search ·
 * actions) + scrollable main + right-hand contextual workspace inspector.
 * Data (WorkspaceProvider) and realtime (LiveblocksProvider) are scoped here
 * so marketing pages stay static.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Confine touchpad pinch-to-zoom strictly to the infinite canvas surface.
    // If cursor is on the sidebar, header, inspector, or other chrome, block browser page zoom.
    const blockOuterPinchZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const target = e.target as HTMLElement | null;
        if (!target?.closest('[data-canvas-surface="true"]')) {
          e.preventDefault();
        }
      }
    };
    window.addEventListener('wheel', blockOuterPinchZoom, { passive: false });
    return () => window.removeEventListener('wheel', blockOuterPinchZoom);
  }, []);

  return (
    <WorkspaceProvider>
      <LiveblocksProviders>
        <ShellProvider>
          <SidebarProvider defaultOpen>
            <AppSidebar />
            <SidebarInset className="min-w-0 h-full" style={{ overscrollBehavior: 'none' }}>
              <Header />
              <div className="flex-1 flex min-h-0 overflow-hidden relative">
                <div className="flex-1 min-w-0 flex flex-col overflow-auto h-full">{children}</div>
                <WorkspaceContextSidebar />
              </div>
            </SidebarInset>
            <SearchCommand />
            <AiChatPanel />
          </SidebarProvider>
        </ShellProvider>
      </LiveblocksProviders>
    </WorkspaceProvider>
  );
}

function Header() {
  const { toggleAi, toggleInspector, inspectorOpen } = useShell();
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-1 h-5!" />
        <BreadCrumbs />
      </div>

      <div className="flex flex-1 justify-center px-2">
        <SearchTrigger />
      </div>

      <div className="flex items-center gap-1">
        {/* Toggle Workspace Inspector (Image 1 side panel) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleInspector}
              aria-label="Toggle Workspace Inspector"
              className={cn('transition-colors cursor-pointer', inspectorOpen && 'bg-sidebar-accent text-orange-400')}
            >
              <PanelRight className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Workspace Inspector (Ctrl+I)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={toggleAi} aria-label="Cognify AI">
              <Sparkles className="size-4 text-ai" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cognify AI</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/inbox" aria-label="Inbox" className="relative">
                <Bell className="size-4" />
                <UnreadBadge className="absolute top-1.5 right-1.5 size-2 rounded-full bg-ai ring-2 ring-background" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Inbox</TooltipContent>
        </Tooltip>

        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
