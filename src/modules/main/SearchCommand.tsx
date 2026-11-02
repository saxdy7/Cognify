'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, BriefcaseBusiness, FileText, Layers, Plus, Search, Sparkles, Bell, Settings, LayoutDashboard } from 'lucide-react';
import { useWorkspace } from '@/hooks/use-workspace';
import { hostnameOf } from '@/lib/format';
import { useShell } from '@/modules/main/ShellProvider';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Kbd, KbdGroup } from '@/components/ui/kbd';

/** Header search trigger. Opens the ⌘K palette. */
export function SearchTrigger() {
  const { setCommandOpen } = useShell();
  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setCommandOpen(true)}
        className="hidden h-8 w-56 justify-start gap-2 rounded-full bg-foreground/[0.05] pr-1.5 text-muted-foreground shadow-none hover:bg-foreground/[0.09] lg:flex"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate text-left text-sm font-normal">Search everything…</span>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setCommandOpen(true)} className="rounded-full lg:hidden">
        <Search className="size-4" />
      </Button>
    </>
  );
}

/** Global ⌘K palette — navigate anywhere and jump to any entity. */
export function SearchCommand() {
  const router = useRouter();
  const { commandOpen, setCommandOpen, openAi } = useShell();
  const { bookmarks, boards, notes, addNote, addBoard } = useWorkspace();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [commandOpen, setCommandOpen]);

  const go = (href: string) => { setCommandOpen(false); router.push(href); };
  const run = (fn: () => void) => { setCommandOpen(false); fn(); };

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen} title="Search" description="Jump to anything in your workspace">
      {/* This shadcn CommandDialog variant doesn't wrap children in <Command>, and cmdk's Input needs that store */}
      <Command>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList className="max-h-[420px]">
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go('/dashboard')}><LayoutDashboard />Overview</CommandItem>
          <CommandItem onSelect={() => go('/dashboard/bookmarks')}><Bookmark />Bookmarks</CommandItem>
          <CommandItem onSelect={() => go('/dashboard/canvas')}><Layers />Canvas</CommandItem>
          <CommandItem onSelect={() => go('/dashboard/docs')}><FileText />Docs</CommandItem>
          <CommandItem onSelect={() => go('/dashboard/studio')}><BriefcaseBusiness />Client studio</CommandItem>
          <CommandItem onSelect={() => go('/dashboard/inbox')}><Bell />Inbox</CommandItem>
          <CommandItem onSelect={() => go('/dashboard/settings')}><Settings />Settings</CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(openAi)}><Sparkles />Ask Cognify AI<CommandShortcut>AI</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => go('/dashboard/bookmarks?new=1')}><Plus />Save a link</CommandItem>
          <CommandItem onSelect={() => run(async () => { const n = await addNote(null, 'page'); if (n) router.push(`/dashboard/docs/${n.id}`); })}><Plus />New page</CommandItem>
          <CommandItem onSelect={() => run(async () => { const b = await addBoard('Untitled board'); if (b) router.push(`/dashboard/canvas/${b.id}`); })}><Plus />New board</CommandItem>
          <CommandItem onSelect={() => go('/dashboard/studio/pipeline')}><Plus />New client deal</CommandItem>
        </CommandGroup>

        {notes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Pages">
              {notes.slice(0, 30).map((n) => (
                <CommandItem key={n.id} value={`page ${n.title}`} onSelect={() => go(`/dashboard/docs/${n.id}`)}>
                  <span className="w-4 text-center text-sm leading-none">{n.icon || '📄'}</span>
                  <span className="truncate">{n.title || 'Untitled'}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {boards.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Boards">
              {boards.slice(0, 20).map((b) => (
                <CommandItem key={b.id} value={`board ${b.name}`} onSelect={() => go(`/dashboard/canvas/${b.id}`)}>
                  <Layers className="text-canvas" />
                  <span className="truncate">{b.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {bookmarks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Links">
              {bookmarks.slice(0, 40).map((b) => (
                <CommandItem key={b.id} value={`link ${b.title ?? ''} ${b.url}`} onSelect={() => run(() => window.open(b.url, '_blank', 'noopener'))}>
                  <Bookmark className="text-brand" />
                  <span className="truncate">{b.title || b.url}</span>
                  <span className="ml-auto truncate pl-3 text-xs text-muted-foreground">{hostnameOf(b.url)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
