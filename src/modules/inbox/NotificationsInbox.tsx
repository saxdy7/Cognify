'use client';

import { useRouter } from 'next/navigation';
import {
  ClientSideSuspense,
  useInboxNotifications,
  useMarkAllInboxNotificationsAsRead,
  useUnreadInboxNotificationsCount,
} from '@liveblocks/react/suspense';
import { InboxNotification, InboxNotificationList } from '@liveblocks/react-ui';
import { Bell, CheckCheck, Users } from 'lucide-react';
import { PageHeader } from '@/modules/main/PageHeader';
import { RESOURCES } from '@/lib/share';
import { LiveblocksBoundary } from '@/components/LiveblocksBoundary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

/** Inbox page: comment mentions, replies, thread activity, and page shares from Liveblocks. */
export function InboxPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8">
      <LiveblocksBoundary feature="Inbox">
        <ClientSideSuspense fallback={<InboxSkeleton />}>
          <InboxList />
        </ClientSideSuspense>
      </LiveblocksBoundary>
    </div>
  );
}

function InboxList() {
  const router = useRouter();
  const { inboxNotifications } = useInboxNotifications();
  const markAllAsRead = useMarkAllInboxNotificationsAsRead();
  const { count } = useUnreadInboxNotificationsCount();

  return (
    <>
      <PageHeader
        icon={Bell}
        iconClassName="text-ai"
        title="Inbox"
        description={count ? `${count} unread notification${count === 1 ? '' : 's'}` : 'You’re all caught up.'}
        actions={
          inboxNotifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={!count}><CheckCheck />Mark all read</Button>
          )
        }
      />

      {inboxNotifications.length ? (
        <Card className="overflow-hidden p-0">
          <InboxNotificationList>
            {inboxNotifications.map((inboxNotification) => (
              <InboxNotification
                key={inboxNotification.id}
                inboxNotification={inboxNotification}
                kinds={{
                  // Custom kind triggered by /api/share/[type]/[id]
                  $resourceShared: (props) => {
                    const { title, sharedBy, role, resourceType, resourceId } = props.inboxNotification.activities[0].data;
                    const href = RESOURCES[resourceType].href(resourceId);
                    const noun = RESOURCES[resourceType].label;
                    return (
                      <InboxNotification.Custom
                        {...props}
                        title={<><strong>{sharedBy}</strong> shared the {noun} <strong>{title}</strong> with you</>}
                        aside={<InboxNotification.Icon className="text-docs"><Users className="size-4" /></InboxNotification.Icon>}
                        href={href}
                        onClick={(e) => { e.preventDefault(); router.push(href); }}
                      >
                        You can {role === 'edit' ? 'edit' : 'view'} this {noun}.
                      </InboxNotification.Custom>
                    );
                  },
                  // Legacy v1 kind (pages only)
                  $pageShared: (props) => {
                    const { title, sharedBy, role, noteId } = props.inboxNotification.activities[0].data;
                    return (
                      <InboxNotification.Custom
                        {...props}
                        title={<><strong>{sharedBy}</strong> shared <strong>{title}</strong> with you</>}
                        aside={<InboxNotification.Icon className="text-docs"><Users className="size-4" /></InboxNotification.Icon>}
                        href={`/dashboard/docs/${noteId}`}
                        onClick={(e) => { e.preventDefault(); router.push(`/dashboard/docs/${noteId}`); }}
                      >
                        You can {role === 'edit' ? 'edit' : 'view'} this page.
                      </InboxNotification.Custom>
                    );
                  },
                }}
              />
            ))}
          </InboxNotificationList>
        </Card>
      ) : (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Bell /></EmptyMedia>
            <EmptyTitle>No notifications yet</EmptyTitle>
            <EmptyDescription>Share a page or mention someone with @ in a doc and activity will show up here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </>
  );
}

function InboxSkeleton() {
  return (
    <>
      <div className="space-y-2"><Skeleton className="h-8 w-32" /><Skeleton className="h-4 w-56" /></div>
      <Card className="divide-y p-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4"><Skeleton className="size-9 rounded-full" /><div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div></div>
        ))}
      </Card>
    </>
  );
}

/** Small unread dot. Safe to render anywhere under LiveblocksProvider. */
export function UnreadBadge({ className }: { className?: string }) {
  return (
    <LiveblocksBoundary fallback={null}>
      <ClientSideSuspense fallback={null}>
        <UnreadDot className={className} />
      </ClientSideSuspense>
    </LiveblocksBoundary>
  );
}

function UnreadDot({ className }: { className?: string }) {
  const { count } = useUnreadInboxNotificationsCount();
  if (!count) return null;
  return <span className={className} aria-label={`${count} unread notifications`} />;
}
