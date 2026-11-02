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
    // Never let the browser zoom the page while in the app: pinch / Ctrl+wheel is
    // swallowed here (bubble phase). The canvas handles it first for its own camera and
    // stops propagation, so the only thing that can still reach this listener is a pinch
    // somewhere the canvas isn't listening — which must do nothing rather than zoom the UI.
    const blockPageZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    const blockGesture = (e: Event) => e.preventDefault(); // Safari trackpad pinch
    window.addEventListener('wheel', blockPageZoom, { passive: false });
    document.addEventListener('gesturestart', blockGesture);
    document.addEventListener('gesturechange', blockGesture);
    return () => {
      window.removeEventListener('wheel', blockPageZoom);
      document.removeEventListener('gesturestart', blockGesture);
      document.removeEventListener('gesturechange', blockGesture);
    };
  }, []);

  return (
    <WorkspaceProvider>
      <LiveblocksProviders>
        <ShellProvider>
          <div data-lenis-prevent className="app-ui relative flex h-svh flex-col overflow-hidden text-foreground" style={{ overscrollBehavior: 'none' }}>
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
