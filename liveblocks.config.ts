// Liveblocks type definitions — https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Custom presence, broadcast per user in a room
    Presence: {
      cursor: { x: number; y: number } | null;
    };

    // Static user info, set on the server in /api/liveblocks-auth
    UserMeta: {
      id: string; // Supabase user id
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    // Room metadata (set when creating rooms in /api/liveblocks-rooms)
    RoomInfo: {
      noteId: string;
      title?: string;
    };

    // Custom thread metadata
    ThreadMetadata: {
      resolved?: boolean;
    };

    // Custom inbox notification kinds (triggered from /api/notes/[id]/share)
    ActivitiesData: {
      $pageShared: {
        noteId: string;
        title: string;
        sharedBy: string;
        role: 'view' | 'edit';
      };
    };
  }
}

export {};
