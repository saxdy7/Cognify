import type { Metadata } from 'next';
import { CanvasBoardsPage } from '@/modules/canvas/CanvasBoardsPage';

export const metadata: Metadata = { title: 'Canvas' };

export default function Page() {
  return <CanvasBoardsPage />;
}
