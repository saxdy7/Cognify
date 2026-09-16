'use client';

import { useThreads } from '@liveblocks/react/suspense';
import { AnchoredThreads, FloatingComposer, FloatingThreads } from '@liveblocks/react-tiptap';
import type { Editor } from '@tiptap/react';

// Comment threads anchored to text selections in the editor.
// AnchoredThreads renders in a side column on desktop, FloatingThreads on mobile.
export function Threads({ editor }: { editor: Editor | null }) {
  const { threads } = useThreads({ query: { resolved: false } });

  return (
    <>
      <div className="anchored-threads">
        <AnchoredThreads editor={editor} threads={threads} />
      </div>
      <FloatingThreads editor={editor} threads={threads} className="floating-threads" />
      <FloatingComposer editor={editor} className="floating-composer" />
    </>
  );
}
