'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { LiveblocksProvider } from '@liveblocks/react/suspense';

/** `null` = unknown (probe in flight), otherwise whether LIVEBLOCKS_SECRET_KEY is set on the server. */
const LiveblocksStatusContext = createContext<boolean | null>(null);
export const useLiveblocksConfigured = () => useContext(LiveblocksStatusContext);

// App-wide Liveblocks client. Authenticates with ID tokens via
// /api/liveblocks-auth and resolves user names/avatars from Supabase.
export function LiveblocksProviders({ children }: { children: ReactNode }) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/liveblocks-auth')
      .then((r) => r.json())
      .then((d: { configured?: boolean }) => { if (!cancelled) setConfigured(Boolean(d.configured)); })
      .catch(() => { if (!cancelled) setConfigured(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <LiveblocksStatusContext.Provider value={configured}>
    <LiveblocksProvider
      authEndpoint="/api/liveblocks-auth"
      // Names, avatars and colours for cursors, comments and notifications
      resolveUsers={async ({ userIds }) => {
        const res = await fetch(`/api/liveblocks-users?userIds=${encodeURIComponent(userIds.join(','))}`);
        if (!res.ok) return userIds.map(() => undefined);
        return res.json();
      }}
      // "@" mention suggestions in the editor and comment composer
      resolveMentionSuggestions={async ({ text }) => {
        const res = await fetch(`/api/liveblocks-users?text=${encodeURIComponent(text)}`);
        if (!res.ok) return [];
        return res.json();
      }}
    >
      {children}
    </LiveblocksProvider>
    </LiveblocksStatusContext.Provider>
  );
}
