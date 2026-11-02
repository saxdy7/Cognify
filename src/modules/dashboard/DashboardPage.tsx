'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bookmark, FileText, Layers, Plus, Sparkles, Star } from 'lucide-react';
import { useWorkspace } from '@/hooks/use-workspace';
import { greeting, hostnameOf, timeAgo } from '@/lib/format';
import { tintFor, TINT_CARDS } from '@/lib/static';
import { cn } from '@/lib/utils';
import { useShell } from '@/modules/main/ShellProvider';
import { SectionHeader } from '@/modules/main/PageHeader';
import { CountUp, Lift, Magnetic, Reveal, SplitReveal, Stagger, StaggerItem } from '@/components/motion/reveal';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
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

  // Tile order maps onto TINT_CARDS: lime · coral · sky · ink.
  const stats = [
    { label: 'Links saved', value: bookmarks.length, icon: Bookmark, href: '/dashboard/bookmarks' },
    { label: 'Boards', value: boards.length, icon: Layers, href: '/dashboard/canvas' },
    { label: 'Pages', value: notes.length, icon: FileText, href: '/dashboard/docs' },
    { label: 'Starred', value: bookmarks.filter((b) => b.is_favorite).length, icon: Star, href: '/dashboard/bookmarks?filter=favorites' },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 p-4 pb-12 md:p-6 md:pb-12">
      {/* Greeting */}
      <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{greeting()}</p>
          <h1 className="mt-1 text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl">
            {loading ? <Skeleton className="inline-block h-10 w-64 align-middle" /> : (
              <>
                <SplitReveal text="Welcome back," />
                <br className="hidden sm:block" />{' '}
                <SplitReveal text={firstName} delay={0.18} />
              </>
            )}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {containers.length} {containers.length === 1 ? 'space' : 'spaces'} · {bookmarks.length} links · {notes.length} pages · {boards.length} boards
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="lg" className="rounded-full bg-card backdrop-blur-xl" onClick={openAi}>
            <Sparkles className="text-ai" /> Ask AI
          </Button>
          <Magnetic>
            <Button size="lg" className="rounded-full" onClick={async () => { const n = await addNote(null, 'page'); if (n) router.push(`/dashboard/docs/${n.id}`); }}>
              <Plus /> New page
            </Button>
          </Magnetic>
        </div>
      </Reveal>

      {/* Stats */}
      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4" gap={0.07}>
        {stats.map((s, i) => (
          <StaggerItem key={s.label} variant="pop">
            <Lift>
              <Link href={s.href} className={cn('group relative flex h-36 flex-col justify-between overflow-hidden rounded-3xl p-5', tintFor(i))}>
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold opacity-80">{s.label}</p>
                  <span className="flex size-9 items-center justify-center rounded-full bg-current/10 transition-transform duration-500 ease-(--ease-pop) group-hover:rotate-12 group-hover:scale-110">
                    <s.icon className="size-4" />
                  </span>
                </div>
                {loading ? (
                  <Skeleton className="h-10 w-16 bg-current/15" />
                ) : (
                  <p className="text-5xl leading-none font-bold tracking-tight tabular-nums">
                    <CountUp value={s.value} delay={0.15 + i * 0.07} />
                  </p>
                )}
                <ArrowRight className="absolute right-5 bottom-5 size-4 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-70" />
              </Link>
            </Lift>
          </StaggerItem>
        ))}
      </Stagger>

      {/* Boards */}
      <section className="space-y-4">
        <SectionHeader
          title={<><Layers className="size-4 text-canvas" /> Visual boards</>}
          description="Freeform canvases for ideas, moodboards and plans."
          action={<Button variant="outline" size="sm" className="rounded-full bg-card backdrop-blur-xl" asChild><Link href="/dashboard/canvas">View all <ArrowRight /></Link></Button>}
        />
        <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" gap={0.06}>
          <StaggerItem variant="pop">
            <button
              onClick={async () => { const b = await addBoard('Untitled board'); if (b) router.push(`/dashboard/canvas/${b.id}`); }}
              className="group flex h-[150px] w-full items-center justify-center rounded-3xl border-2 border-dashed border-foreground/15 text-sm font-semibold text-muted-foreground transition-colors duration-300 hover:border-canvas/60 hover:bg-canvas/5 hover:text-foreground"
            >
              <Plus className="mr-2 size-4 transition-transform duration-300 ease-(--ease-pop) group-hover:rotate-90" /> New board
            </button>
          </StaggerItem>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[150px] rounded-3xl" />)
            : recentBoards.map((b, i) => (
                <StaggerItem key={b.id} variant="pop">
                  <Lift>
                    <Link href={`/dashboard/canvas/${b.id}`}>
                      <Card className={cn('relative h-[150px] gap-0 overflow-hidden rounded-3xl border-0 p-0 ring-0', TINT_CARDS[(i + 1) % TINT_CARDS.length])}>
                        <CardHeader className="p-5">
                          <h3 className="truncate text-lg font-bold">{b.name}</h3>
                        </CardHeader>
                        <CardFooter className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-current/10 bg-current/5 px-5 py-3 text-[11px] font-semibold opacity-80">
                          <span>Edited {timeAgo(b.updated_at)}</span>
                          <Layers className="size-3.5" />
                        </CardFooter>
                      </Card>
                    </Link>
                  </Lift>
                </StaggerItem>
              ))}
        </Stagger>
      </section>

      <div className="grid gap-10 lg:grid-cols-5">
        {/* Recent links */}
        <section className="space-y-4 lg:col-span-3">
          <SectionHeader
            title={<><Bookmark className="size-4 text-brand" /> Recent links</>}
            description="Your latest saves across all spaces."
            action={<Button variant="outline" size="sm" className="rounded-full bg-card backdrop-blur-xl" asChild><Link href="/dashboard/bookmarks">View all <ArrowRight /></Link></Button>}
          />
          <Card className="p-0">
            {loading ? (
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5"><Skeleton className="size-8 rounded-lg" /><div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /></div></div>
                ))}
              </div>
            ) : recentLinks.length ? (
              <Stagger className="divide-y divide-foreground/[0.06]" gap={0.045} role="list">
                {recentLinks.map((b) => (
                  <StaggerItem key={b.id} role="listitem">
                    <a href={b.url} target="_blank" rel="noreferrer" className="group flex items-center gap-3 p-3.5 transition-colors hover:bg-foreground/[0.04]">
                      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-background transition-transform duration-300 ease-(--ease-pop) group-hover:scale-110">
                        {b.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={b.logo_url} alt="" className="size-5 object-contain" />
                        ) : (
                          <Bookmark className="size-4 text-muted-foreground" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold group-hover:text-brand">{b.title || b.url}</span>
                        <span className="block truncate text-xs text-muted-foreground">{hostnameOf(b.url)} · {timeAgo(b.created_at)}</span>
                      </span>
                      {b.category && <Badge variant="secondary" className="hidden rounded-full sm:inline-flex">{b.category}</Badge>}
                      {b.is_favorite && <Star className="size-3.5 fill-amber-400 text-amber-400" />}
                    </a>
                  </StaggerItem>
                ))}
              </Stagger>
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
            action={<Button variant="outline" size="sm" className="rounded-full bg-card backdrop-blur-xl" asChild><Link href="/dashboard/docs">View all <ArrowRight /></Link></Button>}
          />
          <Card className="p-0">
            {loading ? (
              <div className="divide-y">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5"><Skeleton className="size-6 rounded" /><Skeleton className="h-4 flex-1" /></div>
                ))}
              </div>
            ) : recentPages.length ? (
              <Stagger className="divide-y divide-foreground/[0.06]" gap={0.05} role="list">
                {recentPages.map((n) => (
                  <StaggerItem key={n.id} role="listitem">
                    <Link href={`/dashboard/docs/${n.id}`} className="group flex items-center gap-3 p-3.5 transition-colors hover:bg-foreground/[0.04]">
                      <span className="w-6 text-center text-lg leading-none transition-transform duration-300 ease-(--ease-pop) group-hover:scale-125">{n.icon || '📄'}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold group-hover:text-docs">{n.title || 'Untitled'}</span>
                        <span className="block text-xs text-muted-foreground">Edited {timeAgo(n.updated_at)}{n.user_id !== user?.id ? ' · shared with you' : ''}</span>
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground/50 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </StaggerItem>
                ))}
              </Stagger>
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
      <Button size="sm" variant="outline" className="rounded-full" asChild><Link href={href}><Plus />{cta}</Link></Button>
    </div>
  );
}
