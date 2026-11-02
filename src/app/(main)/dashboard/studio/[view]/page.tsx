import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StudioPage, type StudioView } from '@/modules/studio/StudioShell';

const VIEWS: StudioView[] = ['pipeline', 'schedule', 'finance', 'growth', 'projects'];

export async function generateMetadata({ params }: { params: Promise<{ view: string }> }): Promise<Metadata> {
  const { view } = await params;
  return { title: VIEWS.includes(view as StudioView) ? `Studio ${view[0].toUpperCase()}${view.slice(1)}` : 'Studio' };
}

export default async function Page({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  if (!VIEWS.includes(view as StudioView)) notFound();
  return <StudioPage view={view as StudioView} />;
}

