import { Suspense } from "react";
import { NotificationListPage } from "@/components/notifications/notification-list-page";

function NotificationPageFallback() {
  return <div className="w-full rounded-2xl border bg-card p-6" />;
}

export default function AdminNotificationsPage() {
  return (
    <Suspense fallback={<NotificationPageFallback />}>
      <NotificationListPage />
    </Suspense>
  );
}
