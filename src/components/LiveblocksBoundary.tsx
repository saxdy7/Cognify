'use client';

import React from 'react';
import { PlugZap } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** What to render when Liveblocks can't connect. `null` hides the feature entirely. */
  fallback?: React.ReactNode | null;
  /** Short label used by the default fallback, e.g. "Comments" */
  feature?: string;
}

interface State { error: Error | null }

/**
 * Error boundary for Liveblocks-backed UI. The suspense hooks throw when
 * /api/liveblocks-auth fails (most commonly: LIVEBLOCKS_SECRET_KEY not set),
 * which would otherwise take down the whole dashboard. Pass `fallback={null}`
 * for decorative bits (badges, avatar stacks) and let real features explain.
 */
export class LiveblocksBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== 'production') console.warn('[liveblocks] unavailable:', error.message);
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return <LiveblocksUnavailable feature={this.props.feature} error={this.state.error} />;
  }
}

export function LiveblocksUnavailable({ feature = 'Realtime features', error }: { feature?: string; error?: Error }) {
  const missingKey = /LIVEBLOCKS_SECRET_KEY/.test(error?.message ?? '');
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
      <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <PlugZap className="size-4" />
      </span>
      <p className="text-sm font-medium">{feature} unavailable</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        {missingKey ? (
          <>Add <code className="rounded bg-muted px-1 py-0.5 font-mono">LIVEBLOCKS_SECRET_KEY</code> to <code className="rounded bg-muted px-1 py-0.5 font-mono">.env.local</code> (from the Liveblocks dashboard) and restart the dev server.</>
        ) : (
          <>Couldn’t connect to Liveblocks. {error?.message}</>
        )}
      </p>
    </div>
  );
}
