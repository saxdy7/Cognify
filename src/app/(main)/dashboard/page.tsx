import type { Metadata } from 'next';
import { DashboardPage } from '@/modules/dashboard/DashboardPage';

export const metadata: Metadata = { title: 'Overview' };

export default function Page() {
  return <DashboardPage />;
}
