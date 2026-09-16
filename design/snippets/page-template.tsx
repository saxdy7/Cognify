'use client';

/**
 * PAGE TEMPLATE — start every new dashboard page from this file.
 * 1. Copy to src/modules/<feature>/<Feature>Page.tsx (or run design/scripts/new-module.mjs)
 * 2. Add a thin route: src/app/(main)/dashboard/<feature>/page.tsx → <FeaturePage />
 * 3. Add a NAV_ITEMS entry in src/lib/static.ts
 *
 * The snippet imports below point at design/snippets/*; when you adopt a snippet for real,
 * move it into src/modules/main/ (or the feature folder) and update the import.
 */
import { useMemo, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useWorkspace } from '@/hooks/use-workspace';
import { timeAgo } from '@/lib/format';
import { PageHeader } from '@/modules/main/PageHeader';
import { Button } from '@/components/ui/button';
import { ListRows, ListRowsSkeleton } from './list-row';
import { Toolbar } from './toolbar';
import { EmptyState } from './empty-state';
import { ConfirmDelete } from './confirm-dialog';

const FILTERS = [{ id: 'all', label: 'All' }, { id: 'starred', label: 'Starred' }];

export function FeaturePage() {
  const { loading, notes } = useWorkspace(); // swap for your collection
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null);

  const items = useMemo(() => notes
    .filter((n) => filter !== 'starred' || n.is_favorite)
    .filter((n) => !query || n.title.toLowerCase().includes(query.toLowerCase()))
    .map((n) => ({ id: n.id, icon: n.icon, title: n.title || 'Untitled', meta: `Edited ${timeAgo(n.updated_at)}`, starred: n.is_favorite })),
  [notes, filter, query]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 md:p-8">
      <PageHeader
        icon={Sparkles}
        iconClassName="text-ai"
        title="Feature"
        description="One sentence about what lives here."
        actions={<Button size="sm"><Plus />New item</Button>}
      />

      <Toolbar filters={FILTERS} active={filter} onFilter={setFilter} query={query} onQuery={setQuery} placeholder="Search items…" />

      {loading ? (
        <ListRowsSkeleton />
      ) : items.length ? (
        <ListRows items={items} hrefFor={(i) => `/dashboard/docs/${i.id}`} accentHover="group-hover:text-ai" onDelete={(i) => setDeleting(i)} />
      ) : (
        <EmptyState
          icon={Sparkles}
          title={query ? 'No matches' : 'Nothing here yet'}
          description={query ? 'Try another search.' : 'Create your first item to get started.'}
          cta={query ? undefined : 'New item'}
          onCta={() => {}}
        />
      )}

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        name={deleting?.title ?? ''}
        what="This item will be permanently removed."
        onConfirm={() => setDeleting(null)}
      />
    </div>
  );
}
