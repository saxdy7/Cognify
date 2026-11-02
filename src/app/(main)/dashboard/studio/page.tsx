import type { Metadata } from 'next';
import { StudioPage } from '@/modules/studio/StudioShell';

export const metadata: Metadata = { title: 'Studio' };

export default function Page() {
  return <StudioPage />;
}

