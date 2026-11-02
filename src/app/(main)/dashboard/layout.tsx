'use client';

import React from 'react';
import { LiveblocksProviders } from '@/lib/provider/LiveblocksProvider';
import { WorkspaceProvider } from '@/lib/provider/WorkspaceProvider';
import { FloatingDock } from '@/modules/main/FloatingDock';
import { TopNav } from '@/modules/main/TopNav';
import { SearchCommand } from '@/modules/main/SearchCommand';
import { ShellProvider } from '@/modules/main/ShellProvider';
import { AiChatPanel } from '@/modules/ai/AiChatPanel';
import { WorkspaceContextSidebar } from '@/modules/inspector/WorkspaceContextSidebar';

/**
 * Authenticated app shell: pastel mesh ground · floating pill header · dark
 * tool dock on the left · scrollable main · right-hand workspace inspector.
 * Data (WorkspaceProvider) and realtime (LiveblocksProvider) are scoped here
 * so marketing pages stay static. Skin lives under `.app-ui` (globals.css).
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Confine touchpad pinch-to-zoom strictly to the infinite canvas surface.
    // If cursor is on the dock, header, inspector, or other chrome, block browser page zoom.
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
          <div className="app-ui relative flex h-svh flex-col overflow-hidden text-foreground" style={{ overscrollBehavior: 'none' }}>
            <TopNav />
            <FloatingDock />
            <div className="relative flex min-h-0 flex-1 overflow-hidden md:pl-[calc(var(--dock-x)*2+var(--dock-w))]">
              <main className="flex min-w-0 flex-1 flex-col overflow-auto">{children}</main>
              <WorkspaceContextSidebar />
            </div>
          </div>
          <SearchCommand />
          <AiChatPanel />
        </ShellProvider>
      </LiveblocksProviders>
    </WorkspaceProvider>
  );
}
