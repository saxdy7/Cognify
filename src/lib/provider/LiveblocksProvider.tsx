'use client';

import { ReactNode } from 'react';
import { LiveblocksProvider } from '@liveblocks/react/suspense';

// App-wide Liveblocks client. Authenticates with ID tokens via
// /api/liveblocks-auth and resolves user names/avatars from Supabase.
export function LiveblocksProviders({ children }: { children: ReactNode }) {
  return (
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
  );
}
