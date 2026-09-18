'use client';

import { usePathname } from 'next/navigation';
import { AiChat } from '@liveblocks/react-ui';
import { RegisterAiKnowledge, useSendAiMessage } from '@liveblocks/react';
import { Sparkles } from 'lucide-react';
import { useWorkspace } from '@/hooks/use-workspace';
import { useShell } from '@/modules/main/ShellProvider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LiveblocksBoundary } from '@/components/LiveblocksBoundary';

// Chats are private per authenticated user, so a fixed id gives each user
// one persistent "Cognify assistant" thread.
const CHAT_ID = 'cognify-assistant';

/**
 * Liveblocks AI Copilot in a right-hand sheet. Registers workspace context as
 * knowledge so the copilot can answer questions about the user's own data.
 */
export function AiChatPanel() {
  const { aiOpen, closeAi } = useShell();
  const pathname = usePathname();
  const { bookmarks, boards, notes, containers } = useWorkspace();

  const currentNoteId = pathname.startsWith('/dashboard/docs/') ? pathname.split('/')[3] : null;
  const currentNote = currentNoteId ? notes.find((n) => n.id === currentNoteId) : null;
  const currentBoardId = pathname.startsWith('/dashboard/canvas/') ? pathname.split('/')[3] : null;
  const currentBoard = currentBoardId ? boards.find((b) => b.id === currentBoardId) : null;

  return (
    <>
      <RegisterAiKnowledge
        description="What Cognify is"
        value="Cognify is a personal knowledge hub with three workspaces: Bookmarks (saved links organised in spaces), Canvas (infinite visual boards), and Docs (block-based collaborative pages with comments and sharing)."
      />
      <RegisterAiKnowledge description="The route the user is currently on" value={pathname} />
      <RegisterAiKnowledge description="The doc page currently open (if any)" value={currentNote ? { title: currentNote.title, icon: currentNote.icon } : 'none'} />
      <RegisterAiKnowledge description="The canvas board currently open (if any)" value={currentBoard ? { name: currentBoard.name } : 'none'} />
      <RegisterAiKnowledge
        description="Counts of items in the user's workspace"
        value={{ bookmarks: bookmarks.length, boards: boards.length, pages: notes.length, spaces: containers.length }}
      />
      <RegisterAiKnowledge
        description="Titles of the user's most recent doc pages"
        value={notes.slice(0, 15).map((n) => n.title)}
      />
      <RegisterAiKnowledge
        description="Titles and URLs of the user's most recent bookmarks"
        value={bookmarks.slice(0, 20).map((b) => ({ title: b.title, url: b.url, category: b.category }))}
      />

      <Sheet open={aiOpen} onOpenChange={(o) => { if (!o) closeAi(); }}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-base">
              <span className="flex size-7 items-center justify-center rounded-md bg-ai/15 text-ai">
                <Sparkles className="size-4" />
              </span>
              Cognify AI
            </SheetTitle>
            <SheetDescription>Your workspace copilot. It knows what you have saved.</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 p-0 [&>div:has(>.lb-root)]:h-full">
            <LiveblocksBoundary feature="Cognify AI">
              <AiChat
                chatId={CHAT_ID}
                // Optional: a copilot created in the Liveblocks dashboard (your own provider key + prompt).
                // Without it the Liveblocks-hosted default model is used, which is rate/plan limited.
                copilotId={process.env.NEXT_PUBLIC_LIVEBLOCKS_COPILOT_ID || undefined}
                components={{ Empty: EmptyChat }}
                className="h-full"
              />
            </LiveblocksBoundary>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function EmptyChat() {
  const sendAiMessage = useSendAiMessage(CHAT_ID);
  const suggestions = [
    'Summarise what I have saved recently',
    'Help me outline a new doc page',
    'Which bookmarks should I organise into spaces?',
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="flex size-10 items-center justify-center rounded-xl bg-ai/15 text-ai">
        <Sparkles className="size-5" />
      </span>
      <div>
        <p className="text-sm font-medium">How can I help?</p>
        <p className="text-xs text-muted-foreground">Try one of these to get started.</p>
      </div>
      <div className="flex w-full flex-col gap-2">
        {suggestions.map((s) => (
          <Button key={s} variant="outline" className="h-auto justify-start whitespace-normal py-2.5 text-left text-xs font-normal" onClick={() => sendAiMessage(s)}>
            {s}
          </Button>
        ))}
      </div>
    </div>
  );
}
