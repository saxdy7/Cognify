import type { Metadata } from 'next';
import { InboxPage } from '@/modules/inbox/NotificationsInbox';

export const metadata: Metadata = { title: 'Inbox' };

export default function Page() {
  return <InboxPage />;
}
