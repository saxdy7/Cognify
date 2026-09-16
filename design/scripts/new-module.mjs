#!/usr/bin/env node
/**
 * Cognify UI scaffolder.
 *
 *   node design/scripts/new-module.mjs <slug> [--title "Name"] [--icon LucideIcon] [--accent brand|canvas|docs|ai|primary] [--secondary] [--max list|grid|reading]
 *   node design/scripts/new-module.mjs --sync-tokens
 *
 * Creates, following the design system:
 *   src/modules/<slug>/<Pascal>Page.tsx      page body (PageHeader → toolbar → list/empty/skeleton → confirm)
 *   src/app/(main)/dashboard/<slug>/page.tsx thin route with metadata
 *   src/lib/static.ts                        a NAV_ITEMS (or SECONDARY_NAV_ITEMS) entry → sidebar, breadcrumbs, ⌘K
 *
 * --sync-tokens copies src/app/globals.css → design/tokens.css (minus the landing-only block).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);

function flag(name, fallback) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = args[i + 1];
  return v && !v.startsWith('--') ? v : true;
}

// ── --sync-tokens ─────────────────────────────────────────────────────────────
if (args.includes('--sync-tokens')) {
  const css = readFileSync(join(root, 'src/app/globals.css'), 'utf8');
  const start = css.indexOf('/* ─── Landing:');
  const end = css.indexOf('/* ─── Doc editor prose');
  const trimmed = start !== -1 && end !== -1 ? css.slice(0, start) + css.slice(end) : css;
  const header = `/*\n * Cognify design tokens — canonical copy of src/app/globals.css (app-only; the\n * landing-page button styles are omitted). Regenerate with:\n *   node design/scripts/new-module.mjs --sync-tokens\n */\n`;
  writeFileSync(join(root, 'design/tokens.css'), header + trimmed);
  console.log('✓ design/tokens.css synced from src/app/globals.css');
  process.exit(0);
}

// ── scaffold ──────────────────────────────────────────────────────────────────
const slug = args.find((a) => !a.startsWith('--') && !['brand', 'canvas', 'docs', 'ai', 'primary', 'list', 'grid', 'reading'].includes(a));
if (!slug || !/^[a-z][a-z0-9-]*$/.test(slug)) {
  console.error('Usage: node design/scripts/new-module.mjs <slug> [--title "Name"] [--icon Icon] [--accent brand|canvas|docs|ai|primary] [--secondary] [--max list|grid|reading]');
  process.exit(1);
}

const pascal = slug.split('-').map((s) => s[0].toUpperCase() + s.slice(1)).join('');
const title = String(flag('title', pascal));
const icon = String(flag('icon', 'Sparkles'));
const accent = String(flag('accent', 'primary'));
const secondary = args.includes('--secondary');
const maxWidth = { list: 'max-w-5xl', grid: 'max-w-7xl', reading: 'max-w-3xl' }[String(flag('max', 'list'))] ?? 'max-w-5xl';
const accentText = { primary: 'text-foreground', brand: 'text-brand', canvas: 'text-canvas', docs: 'text-docs', ai: 'text-ai' }[accent] ?? 'text-foreground';
const hover = { primary: 'group-hover:text-foreground', brand: 'group-hover:text-brand', canvas: 'group-hover:text-canvas', docs: 'group-hover:text-docs', ai: 'group-hover:text-ai' }[accent];

const modDir = join(root, 'src/modules', slug);
const routeDir = join(root, 'src/app/(main)/dashboard', slug);
const modFile = join(modDir, `${pascal}Page.tsx`);
const routeFile = join(routeDir, 'page.tsx');
const staticFile = join(root, 'src/lib/static.ts');

for (const f of [modFile, routeFile]) {
  if (existsSync(f)) { console.error(`✗ ${f} already exists`); process.exit(1); }
}

const modSrc = `'use client';

import { useMemo, useState } from 'react';
import { ${icon}, Plus, Search } from 'lucide-react';
import { useWorkspace } from '@/hooks/use-workspace';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/modules/main/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

interface Item { id: string; title: string; meta: string }

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'recent', label: 'Recent' },
];

/** ${title} — see design/PAGES.md for the page anatomy this follows. */
export function ${pascal}Page() {
  const { loading } = useWorkspace();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  // TODO: replace with real data from useWorkspace()
  const items = useMemo<Item[]>(() => [], []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => !q || i.title.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className="mx-auto w-full ${maxWidth} space-y-6 p-6 md:p-8">
      <PageHeader
        icon={${icon}}
        iconClassName="${accentText}"
        title="${title}"
        description="One sentence about what lives here."
        actions={<Button size="sm"><Plus />New item</Button>}
      />

      {/* Toolbar: segmented filters + search */}
      <div className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-md border bg-muted p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-sm px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
                filter === f.id && 'bg-background text-foreground shadow-sm',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="h-8 pl-8" />
        </div>
      </div>

      {loading ? (
        <div className="divide-y rounded-lg border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3"><Skeleton className="size-6 rounded" /><Skeleton className="h-4 w-1/3" /><Skeleton className="ml-auto h-3 w-20" /></div>
          ))}
        </div>
      ) : filtered.length ? (
        <div className="divide-y overflow-hidden rounded-lg border bg-card">
          {filtered.map((i) => (
            <div key={i.id} className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium ${hover}">{i.title}</p>
                <p className="text-xs text-muted-foreground">{i.meta}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon"><${icon} /></EmptyMedia>
            <EmptyTitle>{query ? 'No matches' : 'Nothing here yet'}</EmptyTitle>
            <EmptyDescription>{query ? 'Try another search term.' : 'Create your first item to get started.'}</EmptyDescription>
          </EmptyHeader>
          {!query && <EmptyContent><Button size="sm"><Plus />New item</Button></EmptyContent>}
        </Empty>
      )}
    </div>
  );
}
`;

const routeSrc = `import type { Metadata } from 'next';
import { ${pascal}Page } from '@/modules/${slug}/${pascal}Page';

export const metadata: Metadata = { title: '${title}' };

export default function Page() {
  return <${pascal}Page />;
}
`;

mkdirSync(modDir, { recursive: true });
mkdirSync(routeDir, { recursive: true });
writeFileSync(modFile, modSrc);
writeFileSync(routeFile, routeSrc);
console.log(`✓ ${modFile}`);
console.log(`✓ ${routeFile}`);

// Nav entry
let staticSrc = readFileSync(staticFile, 'utf8');
const eol = staticSrc.includes('\r\n') ? '\r\n' : '\n'; // git may check out CRLF on Windows
const entry = `  { title: '${title}', url: '/dashboard/${slug}', icon: ${icon}, accent: '${accent}', nested: true },${eol}`;
const listName = secondary ? 'SECONDARY_NAV_ITEMS' : 'NAV_ITEMS';
const marker = `export const ${listName}: NavItem[] = [`;
if (!staticSrc.includes(`'/dashboard/${slug}'`)) {
  const idx = staticSrc.indexOf(marker);
  if (idx === -1) {
    console.warn(`! Could not find ${listName} in src/lib/static.ts — add the nav entry manually:\n${entry}`);
  } else {
    // add to the list (at the end, before the closing bracket)
    const closeIdx = staticSrc.indexOf('];', idx);
    staticSrc = staticSrc.slice(0, closeIdx) + entry + staticSrc.slice(closeIdx);
    // ensure the icon is imported from lucide-react
    const importMatch = staticSrc.match(/import \{([^}]*)\} from 'lucide-react';/);
    if (importMatch && !importMatch[1].split(',').map((s) => s.trim()).includes(icon)) {
      staticSrc = staticSrc.replace(importMatch[0], `import {${importMatch[1].replace(/\s*$/, '')}${eol}  ${icon},${eol}} from 'lucide-react';`);
    }
    writeFileSync(staticFile, staticSrc);
    console.log(`✓ src/lib/static.ts — added to ${listName}`);
  }
}

console.log(`\nNext: wire data in WorkspaceProvider, then open http://localhost:3010/dashboard/${slug}`);
