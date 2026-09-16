import type { Metadata } from 'next';
import { DocsPage } from '@/modules/docs/DocsPage';

export const metadata: Metadata = { title: 'Docs' };

export default function Page() {
  return <DocsPage />;
}
