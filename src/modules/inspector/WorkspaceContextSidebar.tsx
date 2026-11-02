'use client';

import React, { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText, FolderTree, Download, Globe, Code2, Settings,
  PanelRightClose, Plus, ArrowRight, CornerDownRight, Check,
  Copy, Printer, ExternalLink, Sparkles, Layers, Bookmark as BookmarkIcon,
  HardDrive, Activity, Radio, ChevronRight, FileDown, Eye, Share2,
  Trash2, GitFork, RefreshCw, Monitor, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspace } from '@/hooks/use-workspace';
import { useShell } from '@/modules/main/ShellProvider';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/** Helper to extract plain text, word counts, images, and structure from TipTap JSON */
function extractDocMetrics(content: any) {
  let plainText = '';
  const images: { src: string; alt?: string }[] = [];
  let headingCount = 0;
  let codeBlockCount = 0;

  function traverse(node: any) {
    if (!node) return;
    if (typeof node.text === 'string') {
      plainText += node.text + ' ';
    }
    if (node.type === 'heading') headingCount++;
    if (node.type === 'codeBlock') codeBlockCount++;
    if (node.type === 'image' && node.attrs?.src) {
      images.push({ src: node.attrs.src, alt: node.attrs.alt });
    }
    if (Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  traverse(content);
  const trimmed = plainText.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const chars = trimmed.length;
  const readingTimeMins = Math.max(1, Math.ceil(words / 200));

  return { words, chars, readingTimeMins, headingCount, codeBlockCount, images, plainText: trimmed };
}

export function WorkspaceContextSidebar() {
  const { inspectorOpen, closeInspector, toggleInspector } = useShell();
  const pathname = usePathname();
  const router = useRouter();
  const { notes, boards, bookmarks, addNote } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'all' | 'roots' | 'outputs' | 'connectors'>('all');
  const [liveSyncEnabled, setLiveSyncEnabled] = useState(true);
  const [copiedText, setCopiedText] = useState(false);
  const [addingSubpage, setAddingSubpage] = useState(false);

  // ── Determine Current Workspace Context ──
  const isDocDetail = pathname.startsWith('/dashboard/docs/');
  const currentNoteId = isDocDetail ? pathname.split('/')[3] : null;
  const currentNote = currentNoteId ? notes.find((n) => n.id === currentNoteId) : null;
  const parentNote = currentNote?.parent_id ? notes.find((n) => n.id === currentNote.parent_id) : null;
  const subpages = currentNote ? notes.filter((n) => n.parent_id === currentNote.id) : [];

  const isCanvasDetail = pathname.startsWith('/dashboard/canvas/');
  const currentBoardId = isCanvasDetail ? pathname.split('/')[3] : null;
  const currentBoard = currentBoardId ? boards.find((b) => b.id === currentBoardId) : null;

  const isBookmarksWorkspace = pathname.startsWith('/dashboard/bookmarks');
  const isDocsIndex = pathname === '/dashboard/docs';

  // ── Document Metrics ──
  const docMetrics = useMemo(() => {
    if (!currentNote) return null;
    return extractDocMetrics(currentNote.content);
  }, [currentNote]);

  // Handle Subpage Creation
  const handleAddSubpage = async () => {
    if (!currentNote) return;
    try {
      setAddingSubpage(true);
      const newPage = await addNote(currentNote.id, 'page');
      if (newPage) {
        toast.success(`Subpage created: ${newPage.title || 'Untitled'}`);
        router.push(`/dashboard/docs/${newPage.id}`);
      }
    } catch {
      toast.error('Failed to create subpage');
    } finally {
      setAddingSubpage(false);
    }
  };

  // Export to Markdown
  const handleExportMarkdown = () => {
    if (!currentNote) return;
    const title = currentNote.title || 'Untitled';
    const text = docMetrics?.plainText || '';
    const mdContent = `# ${title}\n\n${text}\n\n---\n*Exported from Cognify on ${new Date().toLocaleDateString()}*`;
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Document downloaded as Markdown (.md)');
  };

  // Copy Plain Text
  const handleCopyText = async () => {
    if (!currentNote || !docMetrics) return;
    try {
      await navigator.clipboard.writeText(`${currentNote.title}\n\n${docMetrics.plainText}`);
      setCopiedText(true);
      toast.success('Copied document text to clipboard');
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      toast.error('Could not copy text');
    }
  };

  // Export to PDF / Print
  const handlePrint = () => {
    window.print();
  };

  if (!inspectorOpen) {
    return (
      <aside aria-label="Workspace Inspector (Collapsed)">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleInspector}
              className="fixed right-3 bottom-6 z-40 flex items-center gap-2 rounded-full border border-border bg-sidebar/90 px-3.5 py-2 text-xs font-semibold text-sidebar-foreground shadow-2xl backdrop-blur-xl transition-all hover:scale-105 hover:bg-sidebar-accent cursor-pointer group"
              aria-label="Open Workspace Inspector"
            >
              <div className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-orange-500" />
              </div>
              <PanelRightClose className="size-4 text-orange-400 transition-transform group-hover:rotate-180" />
              <span className="hidden sm:inline">Workspace Inspector</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Open Workspace Inspector (Ctrl+I)</TooltipContent>
        </Tooltip>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Workspace Inspector"
      className="inspector-in relative z-20 mr-3 mb-3 flex w-80 shrink-0 flex-col self-stretch overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/[0.07] backdrop-blur-2xl select-none"
    >
      {/* ── Header Tabs & Controls ── */}
      <div className="flex h-12 items-center justify-between border-b border-sidebar-border px-3 shrink-0">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  'flex size-7 items-center justify-center rounded-lg text-xs transition-colors cursor-pointer',
                  activeTab === 'all'
                    ? 'bg-sidebar-accent text-sidebar-foreground font-bold shadow-xs'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
                aria-label="All Information"
              >
                <FileText className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Overview & Stats</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveTab('roots')}
                className={cn(
                  'flex size-7 items-center justify-center rounded-lg text-xs transition-colors cursor-pointer',
                  activeTab === 'roots'
                    ? 'bg-sidebar-accent text-sidebar-foreground font-bold shadow-xs'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
                aria-label="Roots & Hierarchy"
              >
                <FolderTree className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Roots & Hierarchy</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveTab('outputs')}
                className={cn(
                  'flex size-7 items-center justify-center rounded-lg text-xs transition-colors cursor-pointer',
                  activeTab === 'outputs'
                    ? 'bg-sidebar-accent text-sidebar-foreground font-bold shadow-xs'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
                aria-label="Outputs & Files"
              >
                <Download className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Outputs & Files</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveTab('connectors')}
                className={cn(
                  'flex size-7 items-center justify-center rounded-lg text-xs transition-colors cursor-pointer',
                  activeTab === 'connectors'
                    ? 'bg-sidebar-accent text-sidebar-foreground font-bold shadow-xs'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
                aria-label="Connectors"
              >
                <Globe className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Connected Workspaces</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1 text-sidebar-foreground/60">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={closeInspector}
                className="flex size-7 items-center justify-center rounded-lg hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer"
                aria-label="Collapse Inspector"
              >
                <PanelRightClose className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Close Inspector (Ctrl+I)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs custom-scrollbar">

        {/* ── 1. ENVIRONMENT ── */}
        {(activeTab === 'all' || activeTab === 'roots') && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Environment
              </span>
              <Settings className="size-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-pointer transition-colors" />
            </div>

            <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <Monitor className="size-4 text-orange-400 shrink-0" />
                <span className="font-bold text-sidebar-foreground truncate">
                  Cognify Hub
                </span>
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Online
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                <FolderTree className="size-3.5 text-blue-400 shrink-0" />
                <span className="truncate font-mono">
                  {isDocDetail && currentNote
                    ? `Docs · ${currentNote.title || 'Untitled'}`
                    : isCanvasDetail && currentBoard
                    ? `Canvas · ${currentBoard.name}`
                    : isBookmarksWorkspace
                    ? 'Bookmarks · Spaces'
                    : isDocsIndex
                    ? 'Docs · Catalog'
                    : 'Workspace · Overview'}
                </span>
              </div>

              {/* Live Sync / Realtime Toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-sidebar-border/60">
                <div className="flex items-center gap-1.5 text-sidebar-foreground/80">
                  <Radio className={cn('size-3.5', liveSyncEnabled ? 'text-emerald-400 animate-pulse' : 'text-zinc-500')} />
                  <span className="font-medium text-[11px]">Live Sync</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLiveSyncEnabled(!liveSyncEnabled)}
                  className={cn(
                    'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                    liveSyncEnabled ? 'bg-orange-500' : 'bg-zinc-700'
                  )}
                  aria-label="Toggle Live Sync"
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block size-3 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                      liveSyncEnabled ? 'translate-x-3' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── 2. CONTEXT & USAGE (Segmented Progress Bar) ── */}
        {(activeTab === 'all' || activeTab === 'outputs') && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Context
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {docMetrics ? `${docMetrics.words.toLocaleString()} / 5,000 words` : 'Workspace Active'}
              </span>
            </div>

            {/* Segmented multi-colored bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-sidebar-foreground">
                  {docMetrics
                    ? `${Math.min(100, Math.round((docMetrics.words / 5000) * 100))}% used`
                    : '35% used'}
                </span>
                <span className="text-muted-foreground text-[10px]">
                  {docMetrics ? `${docMetrics.chars.toLocaleString()} chars` : '353.3k / 1M'}
                </span>
              </div>

              {/* Progress bar with exact color-coded segments from Image 1 */}
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div style={{ width: '32%' }} className="bg-blue-500 transition-all" title="Content / Words" />
                <div style={{ width: '22%' }} className="bg-orange-500 transition-all" title="Headings & Structure" />
                <div style={{ width: '12%' }} className="bg-emerald-500 transition-all" title="Reading Context" />
                <div style={{ width: '10%' }} className="bg-amber-500 transition-all" title="Subpages & Links" />
                <div style={{ width: '6%' }} className="bg-purple-500 transition-all" title="Media & Attachments" />
                <div style={{ width: '18%' }} className="bg-zinc-700/50 transition-all" title="Free Space" />
              </div>

              {/* Detailed Breakdown Legend */}
              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="flex items-center justify-between text-sidebar-foreground/80">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-xs bg-blue-500 shrink-0" />
                    <span>Words</span>
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {docMetrics ? `${docMetrics.words.toLocaleString()}` : '307.9k'} · <strong className="text-sidebar-foreground">30.8%</strong>
                  </span>
                </div>

                <div className="flex items-center justify-between text-sidebar-foreground/80">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-xs bg-orange-500 shrink-0" />
                    <span>Characters</span>
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {docMetrics ? `${docMetrics.chars.toLocaleString()}` : '21.4k'} · <strong className="text-sidebar-foreground">2.1%</strong>
                  </span>
                </div>

                <div className="flex items-center justify-between text-sidebar-foreground/80">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-xs bg-emerald-500 shrink-0" />
                    <span>Est. reading</span>
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {docMetrics ? `~${docMetrics.readingTimeMins} min` : '9.9k'} · <strong className="text-sidebar-foreground">1.0%</strong>
                  </span>
                </div>

                <div className="flex items-center justify-between text-sidebar-foreground/80">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-xs bg-amber-500 shrink-0" />
                    <span>Roots / Subpages</span>
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {subpages.length} pages · <strong className="text-sidebar-foreground">0.4%</strong>
                  </span>
                </div>

                <div className="flex items-center justify-between text-sidebar-foreground/80">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-xs bg-purple-500 shrink-0" />
                    <span>Media files</span>
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {docMetrics?.images.length || 0} files · <strong className="text-sidebar-foreground">0.2%</strong>
                  </span>
                </div>

                <div className="flex items-center justify-between text-sidebar-foreground/80">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-xs bg-zinc-600 shrink-0" />
                    <span>Free space buffer</span>
                  </span>
                  <span className="font-mono text-muted-foreground">
                    Available · <strong className="text-sidebar-foreground">61.4%</strong>
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── 3. ROOTS & ROUTES (Subpages & Tree Hierarchy) ── */}
        {(activeTab === 'all' || activeTab === 'roots') && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <GitFork className="size-3.5 text-amber-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Roots & Routes
                </span>
                <span className="rounded-full bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-bold text-amber-400">
                  {subpages.length}
                </span>
              </div>

              {isDocDetail && currentNote && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddSubpage}
                  disabled={addingSubpage}
                  className="h-6 gap-1 px-2 text-[10px] font-bold border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                >
                  <Plus className="size-3" />
                  <span>Subpage</span>
                </Button>
              )}
            </div>

            {/* Tree View */}
            <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-2.5 space-y-2">
              {/* Parent root lineage */}
              {parentNote && (
                <Link
                  href={`/dashboard/docs/${parentNote.id}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors group"
                >
                  <span className="text-xs">↖</span>
                  <span className="text-sm">{parentNote.icon || '📄'}</span>
                  <span className="truncate text-[11px] font-medium group-hover:underline">
                    {parentNote.title || 'Untitled Parent'}
                  </span>
                </Link>
              )}

              {/* Current Document Root */}
              {currentNote && (
                <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/80 px-2.5 py-1.5 text-sidebar-foreground font-semibold border border-sidebar-border/60">
                  <span className="text-sm">{currentNote.icon || '📄'}</span>
                  <span className="truncate text-[11px] flex-1">
                    {currentNote.title || 'Untitled'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-mono">
                    Current
                  </span>
                </div>
              )}

              {/* Child Subpages */}
              {subpages.length > 0 ? (
                <div className="space-y-1 pl-3 border-l-2 border-amber-500/30 ml-2 mt-1">
                  {subpages.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/dashboard/docs/${sub.id}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all group"
                    >
                      <CornerDownRight className="size-3 text-muted-foreground/60 shrink-0" />
                      <span className="text-sm leading-none shrink-0">{sub.icon || '📄'}</span>
                      <span className="truncate text-[11px] font-medium flex-1 group-hover:text-amber-400">
                        {sub.title || 'Untitled'}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        {timeAgo(sub.updated_at)}
                      </span>
                      <ArrowRight className="size-3 text-muted-foreground/40 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ))}
                </div>
              ) : isDocDetail ? (
                <div className="rounded-lg border border-dashed border-sidebar-border/80 p-3 text-center">
                  <p className="text-[11px] text-muted-foreground">No subpages attached yet.</p>
                  <button
                    onClick={handleAddSubpage}
                    className="mt-1 text-[11px] text-orange-400 hover:text-orange-300 font-bold underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-3" /> Create first subpage
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {notes.slice(0, 6).map((n) => (
                    <Link
                      key={n.id}
                      href={`/dashboard/docs/${n.id}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-1 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    >
                      <span className="text-xs">{n.icon || '📄'}</span>
                      <span className="truncate text-[11px]">{n.title || 'Untitled'}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── 4. CONNECTORS (Cross-workspace Integrations) ── */}
        {(activeTab === 'all' || activeTab === 'connectors') && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Connectors
              </span>
              <span className="text-[10px] text-muted-foreground">Live Hub</span>
            </div>

            <div className="space-y-1.5">
              {/* Linked Canvas Boards */}
              <div className="flex items-center justify-between rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-2.5 hover:bg-sidebar-accent/50 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex size-6 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 font-bold text-[10px]">
                    C
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sidebar-foreground text-[11px] truncate">
                      {boards[0]?.name || 'Visual Canvas'}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {boards.length} Boards connected
                    </p>
                  </div>
                </div>
                {boards[0] && (
                  <Link
                    href={`/dashboard/canvas/${boards[0].id}`}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    Open <ExternalLink className="size-3" />
                  </Link>
                )}
              </div>

              {/* Linked Bookmarks Vault */}
              <div className="flex items-center justify-between rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-2.5 hover:bg-sidebar-accent/50 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex size-6 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400 font-bold text-[10px]">
                    B
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sidebar-foreground text-[11px] truncate">
                      Bookmarks Hub
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {bookmarks.length} Resources indexed
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/bookmarks"
                  className="text-[10px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
                >
                  View <ExternalLink className="size-3" />
                </Link>
              </div>

              {/* Live Presence */}
              <div className="flex items-center justify-between rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                    <Zap className="size-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sidebar-foreground text-[11px]">
                      Liveblocks Realtime
                    </p>
                    <p className="text-[10px] text-muted-foreground">Collaborative presence</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">Active</span>
              </div>
            </div>
          </section>
        )}

        {/* ── 5. OUTPUTS & ASSETS (Downloads, Exports, Files) ── */}
        {(activeTab === 'all' || activeTab === 'outputs') && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Outputs & Assets
              </span>
              <span className="text-[10px] text-muted-foreground">Export Ready</span>
            </div>

            <div className="space-y-1.5">
              {/* Markdown Export */}
              <button
                onClick={handleExportMarkdown}
                disabled={!currentNote}
                className="w-full flex items-center justify-between rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-2.5 hover:bg-sidebar-accent/60 transition-all text-left cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <FileDown className="size-4 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-sidebar-foreground text-[11px] group-hover:text-emerald-400 transition-colors">
                      {currentNote ? `${(currentNote.title || 'doc').slice(0, 18)}.md` : 'Export Document.md'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Full Markdown Download</p>
                  </div>
                </div>
                <Download className="size-3.5 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
              </button>

              {/* Copy Full Plain Text */}
              <button
                onClick={handleCopyText}
                disabled={!currentNote}
                className="w-full flex items-center justify-between rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-2.5 hover:bg-sidebar-accent/60 transition-all text-left cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  {copiedText ? (
                    <Check className="size-4 text-emerald-400" />
                  ) : (
                    <Copy className="size-4 text-blue-400" />
                  )}
                  <div>
                    <p className="font-semibold text-sidebar-foreground text-[11px]">
                      {copiedText ? 'Copied to Clipboard!' : 'Copy Plain Text'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Clipboard buffer</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">TXT</span>
              </button>

              {/* PDF Print / Export */}
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-between rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-2.5 hover:bg-sidebar-accent/60 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Printer className="size-4 text-purple-400" />
                  <div>
                    <p className="font-semibold text-sidebar-foreground text-[11px]">Print / Save as PDF</p>
                    <p className="text-[10px] text-muted-foreground">Formatted document print</p>
                  </div>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-purple-400 transition-colors" />
              </button>

              {/* Extracted Images/Files from Document */}
              {docMetrics && docMetrics.images.length > 0 && (
                <div className="pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Embedded Media ({docMetrics.images.length})
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {docMetrics.images.slice(0, 6).map((img, i) => (
                      <a
                        key={i}
                        href={img.src}
                        target="_blank"
                        rel="noreferrer"
                        className="aspect-square rounded-lg overflow-hidden border border-sidebar-border bg-black/40 hover:opacity-80 transition-opacity"
                      >
                        <img src={img.src} alt="" className="size-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

      </div>

      {/* ── Footer Status Bar ── */}
      <div className="border-t border-sidebar-border px-4 py-2.5 flex items-center justify-between text-[10px] text-muted-foreground bg-sidebar/50">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Cognify Workspace Active</span>
        </span>
        <kbd className="px-1.5 py-0.5 rounded bg-sidebar-accent text-[9px] font-mono border border-sidebar-border">
          Ctrl + I
        </kbd>
      </div>
    </aside>
  );
}
