"use client";

import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
import { Bell, CheckCheck, Inbox, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
  useMarkAllNotificationsSeen,
  useMarkNotificationSeen,
  useNotificationsPage,
  useUnreadNotificationCount,
} from "@/hooks/useNotifications";
import {
  pageParser,
  URL_FILTER_HISTORY,
} from "@/lib/search-params/filter-parsers";
import { cn } from "@/lib/utils";
import { type NotificationItem } from "@/services/api/notifications";
import { formatSentAt } from "@/utils/dateTimeUtil";
import { getSafeNotificationActionUrl } from "./notification-action-url";

const NOTIFICATION_PAGE_SIZE = 10;

function NotificationPageRow({
  notification,
  disabled,
  onOpen,
}: {
  notification: NotificationItem;
  disabled: boolean;
  onOpen: (notification: NotificationItem) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "group w-full rounded-2xl border p-4 text-left transition-all hover:border-primary/40 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-70",
        !notification.seen
          ? "border-primary/30 bg-primary/4"
          : "border-border bg-card",
      )}
      disabled={disabled}
      onClick={() => onOpen(notification)}
    >
      <div className="flex gap-3">
        <span
          className={cn(
            "mt-1 size-2 shrink-0 rounded-full",
            notification.seen ? "bg-muted-foreground/30" : "bg-primary",
          )}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="line-clamp-2 text-sm font-semibold text-foreground sm:text-base">
              {notification.title}
            </h2>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {formatSentAt(notification.sentAt)}
            </span>
          </div>
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
            {notification.message}
          </p>
          {notification.actionUrl ? (
            <p className="text-xs font-medium text-primary">Mở chi tiết</p>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export function NotificationListPage() {
  const router = useRouter();
  const [filters, setFilters] = useQueryStates(
    { page: pageParser },
    { history: URL_FILTER_HISTORY },
  );
  const { data, isError, isPending } = useNotificationsPage({
    page: filters.page,
    limit: NOTIFICATION_PAGE_SIZE,
  });
  const { data: unreadData } = useUnreadNotificationCount();
  const {
    markSeen,
    isPending: isMarkingSeen,
    pendingNotificationId,
  } = useMarkNotificationSeen();
  const { markAllSeen, isPending: isMarkingAllSeen } =
    useMarkAllNotificationsSeen();
  const unreadCount = unreadData?.count ?? 0;

  async function handleOpenNotification(notification: NotificationItem) {
    if (!notification.seen) {
      await markSeen(notification.id);
    }

    const actionUrl = getSafeNotificationActionUrl(notification.actionUrl);
    if (actionUrl) {
      router.push(actionUrl);
    }
  }

  async function handleMarkAllSeen() {
    await markAllSeen();
  }

  return (
    <section className="w-full space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bell className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Thông báo
              </h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} thông báo chưa xem`
                  : "Không có thông báo chưa xem"}
              </p>
            </div>
          </div>
        </div>

        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            disabled={isMarkingAllSeen}
            onClick={() => void handleMarkAllSeen()}
          >
            {isMarkingAllSeen ? (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            ) : (
              <CheckCheck data-icon="inline-start" />
            )}
            Đánh dấu tất cả đã xem
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        {isPending ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border bg-card py-12 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Đang tải thông báo...
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Không thể tải thông báo. Vui lòng thử lại sau.
          </div>
        ) : null}

        {!isPending && !isError && data?.items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card py-12 text-center text-sm text-muted-foreground">
            <Inbox className="size-10" aria-hidden="true" />
            Chưa có thông báo nào.
          </div>
        ) : null}

        {data?.items.map((notification) => (
          <NotificationPageRow
            key={notification.id}
            notification={notification}
            disabled={
              isMarkingSeen && pendingNotificationId === notification.id
            }
            onOpen={handleOpenNotification}
          />
        ))}
      </div>

      {data && data.totalPages > 1 ? (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          totalItems={data.total}
          pageSize={NOTIFICATION_PAGE_SIZE}
          allowPageSizeChange={false}
          onPageChange={(nextPage) => {
            void setFilters({ page: nextPage });
          }}
        />
      ) : null}
    </section>
  );
}
