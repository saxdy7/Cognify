import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookmarksPage } from '@/modules/bookmarks/BookmarksPage';

export const metadata: Metadata = { title: 'Bookmarks' };

// BookmarksPage reads URL search params (?space, ?filter) — needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense>
      <BookmarksPage />
    </Suspense>
  );
}
