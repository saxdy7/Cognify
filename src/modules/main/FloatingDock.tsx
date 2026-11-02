'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Bell, Bookmark, BriefcaseBusiness, Clock, FileText, Layers, PanelRight, Plus, Settings, Sparkles } from 'lucide-react';
import { useWorkspace } from '@/hooks/use-workspace';
import { cn } from '@/lib/utils';
import { EASE_OUT } from '@/lib/motion';
import { Magnetic } from '@/components/motion/reveal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UnreadBadge } from '@/modules/inbox/NotificationsInbox';
import { QuickAccess } from '@/modules/main/QuickAccess';
import { useShell } from '@/modules/main/ShellProvider';

const dockBtn =
  'relative flex size-10 items-center justify-center rounded-full text-[color:var(--dock-fg)]/60 outline-none transition-[color,background-color,transform] duration-200 hover:bg-white/10 hover:text-[color:var(--dock-fg)] focus-visible:ring-2 focus-visible:ring-white/40 active:scale-95 data-[active=true]:bg-white/15 data-[active=true]:text-[color:var(--dock-fg)]';

function DockTip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={14}>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Slim dark rail pinned to the left edge (Solvik / Murmura): a brand-coloured
 * "+" on top, utilities below. Primary navigation lives in <TopNav/>.
 */
export function FloatingDock() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { toggleAi, toggleInspector, inspectorOpen } = useShell();
  const { addNote, addBoard } = useWorkspace();
  const [recentsOpen, setRecentsOpen] = React.useState(false);

  const newPage = async () => {
    const n = await addNote(null, 'page');
    if (n) router.push(`/dashboard/docs/${n.id}`);
  };
  const newBoard = async () => {
    const b = await addBoard('Untitled board');
    if (b) router.push(`/dashboard/canvas/${b.id}`);
  };

  const items = (
    <>
      <Magnetic strength={0.25}>
      <DropdownMenu>
        <DockTip label="Create">
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Create new"
              className="group relative mb-1.5 flex size-10 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-[0_6px_18px_-4px_color-mix(in_oklch,var(--brand)_70%,transparent)] outline-none transition-transform duration-300 ease-(--ease-pop) hover:scale-110 focus-visible:ring-2 focus-visible:ring-white/50 active:scale-95"
            >
              <Plus className="size-5 transition-transform duration-300 ease-(--ease-pop) group-hover:rotate-90 group-data-[state=open]:rotate-45" />
            </button>
          </DropdownMenuTrigger>
        </DockTip>
        <DropdownMenuContent side="right" align="start" sideOffset={14} className="w-48">
          <DropdownMenuItem onSelect={newPage}><FileText />New page</DropdownMenuItem>
          <DropdownMenuItem onSelect={newBoard}><Layers />New board</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/dashboard/bookmarks?new=1')}><Bookmark />Save link</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/dashboard/studio/pipeline')}><BriefcaseBusiness />New client deal</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </Magnetic>

      <Popover open={recentsOpen} onOpenChange={setRecentsOpen}>
        <DockTip label="Recents">
          <PopoverTrigger asChild>
            <button aria-label="Recents" data-active={recentsOpen} className={dockBtn}><Clock className="size-[18px]" /></button>
          </PopoverTrigger>
        </DockTip>
        <PopoverContent side="right" align="start" sideOffset={14} className="w-72 gap-0 p-2.5">
          <QuickAccess onNavigate={() => setRecentsOpen(false)} />
        </PopoverContent>
      </Popover>

      <DockTip label="Inbox">
        <Link href="/dashboard/inbox" aria-label="Inbox" className={dockBtn}>
          <Bell className="size-[18px]" />
          <UnreadBadge className="absolute top-2 right-2 size-2 rounded-full bg-ai ring-2 ring-[color:var(--dock-bg)]" />
        </Link>
      </DockTip>

      <DockTip label="Cognify AI">
        <button aria-label="Cognify AI" onClick={toggleAi} className={dockBtn}><Sparkles className="size-[18px]" /></button>
      </DockTip>

      <DockTip label="Workspace inspector (Ctrl+I)">
        <button aria-label="Toggle workspace inspector" data-active={inspectorOpen} suppressHydrationWarning onClick={toggleInspector} className={dockBtn}>
          <PanelRight className="size-[18px]" />
        </button>
      </DockTip>

      <span className="my-1 h-px w-5 bg-white/15" />

      <DockTip label="Settings">
        <Link href="/dashboard/settings" aria-label="Settings" className={dockBtn}><Settings className="size-[18px]" /></Link>
      </DockTip>
    </>
  );

  return (
    <motion.nav
      aria-label="Workspace tools"
      initial={reduce ? false : { opacity: 0, x: -24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.1 }}
      className={cn(
        'dock-rail fixed top-1/2 left-(--dock-x) z-40 hidden -translate-y-1/2 md:flex',
        'w-(--dock-w) flex-col items-center gap-1.5 rounded-full bg-(--dock-bg) px-1.5 py-2',
        'shadow-[0_18px_50px_-14px_rgba(10,14,12,0.5)] ring-1 ring-white/10 backdrop-blur-xl',
      )}
    >
      {items}
    </motion.nav>
  );
}
