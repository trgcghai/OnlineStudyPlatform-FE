"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellDot, Inbox, LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  useMarkNotificationSeen,
  useNotificationsList,
  useUnreadNotificationCount,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import {
  NOTIFICATION_TYPES,
  type NotificationItem,
} from "@/services/api/notifications";
import { formatSentAt } from "@/utils/dateTimeUtil";

const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPES.DIRECT]: "Cá nhân",
  [NOTIFICATION_TYPES.QUEUE]: "Hàng đợi",
} as const;

function formatMetadataValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null || value === undefined) return "-";

  return JSON.stringify(value);
}

function NotificationMetadata({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata);

  if (entries.length === 0) return null;

  return (
    <dl className="grid gap-1 rounded-xl bg-muted/60 p-2 text-xs">
      {entries.slice(0, 3).map(([key, value]) => (
        <div key={key} className="grid grid-cols-[5rem_1fr] gap-2">
          <dt className="truncate text-muted-foreground">{key}</dt>
          <dd className="truncate font-medium">{formatMetadataValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function NotificationRow({
  notification,
  onOpen,
  disabled,
}: {
  notification: NotificationItem;
  onOpen: (notification: NotificationItem) => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-2xl border p-3 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-70",
        !notification.seen && "border-primary/30 bg-primary/5",
      )}
      disabled={disabled}
      onClick={() => onOpen(notification)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={notification.seen ? "outline" : "default"}>
              {NOTIFICATION_TYPE_LABELS[notification.type]}
            </Badge>
            {!notification.seen && (
              <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
            )}
          </div>
          <p className="font-medium text-foreground">{notification.title}</p>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {notification.message}
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatSentAt(notification.sentAt)}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        <NotificationMetadata metadata={notification.metadata} />
        {notification.actionUrl && (
          <span className="text-xs font-medium text-primary">
            Mở liên kết liên quan
          </span>
        )}
      </div>
    </button>
  );
}

export function NotificationPopover() {
  const router = useRouter();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { data: unreadData } = useUnreadNotificationCount();
  const {
    data,
    isError,
    isFetchingNextPage,
    isPending,
    fetchNextPage,
    hasNextPage,
  } = useNotificationsList();
  const { markSeen, isPending: isMarkingSeen, pendingNotificationId } =
    useMarkNotificationSeen();
  const notifications = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const unreadCount = unreadData?.count ?? 0;

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasNextPage) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        void fetchNextPage();
      }
    });

    observer.observe(target);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  async function handleOpenNotification(notification: NotificationItem) {
    if (!notification.seen) {
      await markSeen(notification.id);
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Thông báo" className="relative">
            {unreadCount > 0 ? <BellDot /> : <Bell />}
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] gap-3 p-0">
        <PopoverHeader className="p-4 pb-0">
          <PopoverTitle>Thông báo</PopoverTitle>
          <PopoverDescription>
            {unreadCount > 0
              ? `${unreadCount} thông báo chưa xem`
              : "Không có thông báo chưa xem"}
          </PopoverDescription>
        </PopoverHeader>
        <Separator />
        <div className="max-h-[28rem] space-y-2 overflow-y-auto px-3 pb-3">
          {isPending && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              Đang tải thông báo...
            </div>
          )}

          {isError && (
            <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
              Không thể tải thông báo. Vui lòng thử lại sau.
            </div>
          )}

          {!isPending && !isError && notifications.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
              <Inbox className="size-8" aria-hidden="true" />
              Chưa có thông báo nào.
            </div>
          )}

          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              disabled={
                isMarkingSeen && pendingNotificationId === notification.id
              }
              onOpen={handleOpenNotification}
            />
          ))}

          <div ref={loadMoreRef} aria-hidden="true" />

          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              Đang tải thêm...
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
