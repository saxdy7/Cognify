'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bookmark, FileText, Layers, Plus, Sparkles, Star } from 'lucide-react';
import { useWorkspace } from '@/hooks/use-workspace';
import { greeting, hostnameOf, timeAgo } from '@/lib/format';
import { gradientFor } from '@/lib/static';
import { cn } from '@/lib/utils';
import { useShell } from '@/modules/main/ShellProvider';
import { SectionHeader } from '@/modules/main/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export function DashboardPage() {
  const router = useRouter();
  const { openAi } = useShell();
  const { user, loading, bookmarks, boards, notes, containers, addNote, addBoard } = useWorkspace();
  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  const firstName = (meta.full_name || meta.name || user?.email?.split('@')[0] || 'there').split(' ')[0];

  const recentLinks = bookmarks.slice(0, 6);
  const recentPages = [...notes].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)).slice(0, 4);
  const recentBoards = boards.slice(0, 3);

  const stats = [
    { label: 'Links saved', value: bookmarks.length, icon: Bookmark, href: '/dashboard/bookmarks', accent: 'text-brand' },
    { label: 'Boards', value: boards.length, icon: Layers, href: '/dashboard/canvas', accent: 'text-canvas' },
    { label: 'Pages', value: notes.length, icon: FileText, href: '/dashboard/docs', accent: 'text-docs' },
    { label: 'Starred', value: bookmarks.filter((b) => b.is_favorite).length, icon: Star, href: '/dashboard/bookmarks?filter=favorites', accent: 'text-amber-500' },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 p-6 md:p-8">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()}</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {loading ? <Skeleton className="inline-block h-8 w-56 align-middle" /> : <>Welcome back, {firstName}</>}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {containers.length} {containers.length === 1 ? 'space' : 'spaces'} · {bookmarks.length} links · {notes.length} pages · {boards.length} boards
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={openAi}>
            <Sparkles className="text-ai" /> Ask AI
          </Button>
          <Button size="sm" onClick={async () => { const n = await addNote(null, 'page'); if (n) router.push(`/dashboard/docs/${n.id}`); }}>
            <Plus /> New page
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                  {loading ? <Skeleton className="mt-1 h-8 w-12" /> : <p className="mt-1 text-3xl font-semibold tracking-tight">{s.value}</p>}
                </div>
                <s.icon className={cn('size-5', s.accent)} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Boards */}
      <section className="space-y-4">
        <SectionHeader
          title={<><Layers className="size-4 text-canvas" /> Visual boards</>}
          description="Freeform canvases for ideas, moodboards and plans."
          action={<Button variant="outline" size="sm" asChild><Link href="/dashboard/canvas">View all <ArrowRight /></Link></Button>}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={async () => { const b = await addBoard('Untitled board'); if (b) router.push(`/dashboard/canvas/${b.id}`); }}
            className="flex h-[150px] items-center justify-center rounded-xl border-2 border-dashed text-sm font-medium text-muted-foreground transition-colors hover:border-canvas/60 hover:bg-canvas/5 hover:text-foreground"
          >
            <Plus className="mr-2 size-4" /> New board
          </button>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[150px] rounded-xl" />)
            : recentBoards.map((b, i) => (
                <Link key={b.id} href={`/dashboard/canvas/${b.id}`}>
                  <Card className={cn('relative h-[150px] overflow-hidden bg-linear-to-br p-0 transition-transform hover:scale-[1.02]', gradientFor(i))}>
                    <CardHeader className="p-4">
                      <h3 className="truncate text-base font-semibold">{b.name}</h3>
                    </CardHeader>
                    <CardFooter className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/20 bg-black/5 px-4 py-2 text-[11px] font-medium text-foreground/70 backdrop-blur-xs dark:bg-white/5">
                      <span>Edited {timeAgo(b.updated_at)}</span>
                      <Layers className="size-3.5" />
                    </CardFooter>
                  </Card>
                </Link>
              ))}
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-5">
        {/* Recent links */}
        <section className="space-y-4 lg:col-span-3">
          <SectionHeader
            title={<><Bookmark className="size-4 text-brand" /> Recent links</>}
            description="Your latest saves across all spaces."
            action={<Button variant="outline" size="sm" asChild><Link href="/dashboard/bookmarks">View all <ArrowRight /></Link></Button>}
          />
          <Card className="p-0">
            {loading ? (
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5"><Skeleton className="size-8 rounded-md" /><div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /></div></div>
                ))}
              </div>
            ) : recentLinks.length ? (
              <ul className="divide-y">
                {recentLinks.map((b) => (
                  <li key={b.id}>
                    <a href={b.url} target="_blank" rel="noreferrer" className="group flex items-center gap-3 p-3.5 transition-colors hover:bg-muted/40">
                      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background">
                        {b.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={b.logo_url} alt="" className="size-5 object-contain" />
                        ) : (
                          <Bookmark className="size-4 text-muted-foreground" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium group-hover:text-brand">{b.title || b.url}</span>
                        <span className="block truncate text-xs text-muted-foreground">{hostnameOf(b.url)} · {timeAgo(b.created_at)}</span>
                      </span>
                      {b.category && <Badge variant="secondary" className="hidden sm:inline-flex">{b.category}</Badge>}
                      {b.is_favorite && <Star className="size-3.5 fill-amber-400 text-amber-400" />}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyRow text="No links yet." href="/dashboard/bookmarks?new=1" cta="Save your first link" />
            )}
          </Card>
        </section>

        {/* Recent pages */}
        <section className="space-y-4 lg:col-span-2">
          <SectionHeader
            title={<><FileText className="size-4 text-docs" /> Recent pages</>}
            description="Pick up where you left off."
            action={<Button variant="outline" size="sm" asChild><Link href="/dashboard/docs">View all <ArrowRight /></Link></Button>}
          />
          <Card className="p-0">
            {loading ? (
              <div className="divide-y">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5"><Skeleton className="size-6 rounded" /><Skeleton className="h-4 flex-1" /></div>
                ))}
              </div>
            ) : recentPages.length ? (
              <ul className="divide-y">
                {recentPages.map((n) => (
                  <li key={n.id}>
                    <Link href={`/dashboard/docs/${n.id}`} className="group flex items-center gap-3 p-3.5 transition-colors hover:bg-muted/40">
                      <span className="w-6 text-center text-lg leading-none">{n.icon || '📄'}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium group-hover:text-docs">{n.title || 'Untitled'}</span>
                        <span className="block text-xs text-muted-foreground">Edited {timeAgo(n.updated_at)}{n.user_id !== user?.id ? ' · shared with you' : ''}</span>
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyRow text="No pages yet." href="/dashboard/docs" cta="Create a page" />
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}

function EmptyRow({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Button size="sm" variant="outline" asChild><Link href={href}><Plus />{cta}</Link></Button>
    </div>
  );
}
