'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorkspace } from '@/hooks/use-workspace';
import { NAV_ITEMS, SECONDARY_NAV_ITEMS } from '@/lib/static';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';

interface Crumb { label: string; href?: string; loading?: boolean }

/**
 * Route-derived breadcrumbs. Section names come from the nav config; entity
 * names (board / page titles) are resolved from the workspace store.
 */
export function BreadCrumbs() {
  const pathname = usePathname();
  const { boards, notes, loading } = useWorkspace();

  const crumbs: Crumb[] = [{ label: 'Dashboard', href: '/dashboard' }];
  const section = [...NAV_ITEMS, ...SECONDARY_NAV_ITEMS]
    .filter((i) => i.url !== '/dashboard' && (pathname === i.url || pathname.startsWith(i.url + '/')))
    .sort((a, b) => b.url.length - a.url.length)[0];

  if (section) {
    crumbs.push({ label: section.title, href: section.url });
    const rest = pathname.slice(section.url.length).split('/').filter(Boolean);
    const id = rest[0];

    if (id && section.url === '/dashboard/canvas') {
      const board = boards.find((b) => b.id === id);
      crumbs.push({ label: board?.name ?? 'Board', loading: loading && !board });
    }
    if (id && section.url === '/dashboard/docs') {
      // Walk up the page tree so nested pages show their ancestry
      const chain: Crumb[] = [];
      let current = notes.find((n) => n.id === id);
      let guard = 0;
      while (current && guard++ < 6) {
        chain.unshift({ label: `${current.icon ? current.icon + ' ' : ''}${current.title || 'Untitled'}`, href: `/dashboard/docs/${current.id}` });
        current = current.parent_id ? notes.find((n) => n.id === current!.parent_id) : undefined;
      }
      if (chain.length) {
        chain[chain.length - 1].href = undefined;
        crumbs.push(...chain);
      } else {
        crumbs.push({ label: 'Page', loading: loading });
      }
    }
  }

  // Last crumb is the current page
  const last = crumbs.length - 1;

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-sm">
        {crumbs.map((c, i) => (
          <Fragment key={`${c.label}-${i}`}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem className={i < last ? 'hidden sm:inline-flex' : undefined}>
              {c.loading ? (
                <Skeleton className="h-4 w-24" />
              ) : i === last || !c.href ? (
                <BreadcrumbPage className="max-w-[220px] truncate font-medium">{c.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={c.href} className="max-w-[160px] truncate">{c.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
