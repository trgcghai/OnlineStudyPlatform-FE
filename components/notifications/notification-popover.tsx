"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellDot, CheckCheck, Inbox, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useMarkAllNotificationsSeen,
  useMarkNotificationSeen,
  useNotificationsList,
  useUnreadNotificationCount,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { type NotificationItem } from "@/services/api/notifications";
import { formatSentAt } from "@/utils/dateTimeUtil";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
        "cursor-pointer group relative w-full overflow-hidden p-0 text-left transition-all duration-200 border-t",
        !notification.seen
          ? "border-primary/25 bg-primary/4"
          : "border-border/80",
      )}
      disabled={disabled}
      onClick={() => onOpen(notification)}
    >
      <div className="flex gap-3 p-3 pl-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">
                {notification.title}
              </p>
            </div>
            <span className="shrink-0 text-right text-[11px] leading-4 text-muted-foreground tabular-nums">
              {formatSentAt(notification.sentAt)}
            </span>
          </div>

          <p className="line-clamp-3 max-w-prose text-sm leading-5 text-muted-foreground">
            {notification.message}
          </p>
        </div>
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
  const {
    markSeen,
    isPending: isMarkingSeen,
    pendingNotificationId,
  } = useMarkNotificationSeen();
  const { markAllSeen, isPending: isMarkingAllSeen } =
    useMarkAllNotificationsSeen();
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

  async function handleMarkAllSeen() {
    await markAllSeen();
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Thông báo"
            className="relative"
          >
            {unreadCount > 0 ? <BellDot /> : <Bell />}
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent
        align="end"
        className="w-[min(24rem,calc(100vw-2rem))] gap-3 p-0"
      >
        <PopoverHeader className="p-4 pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <PopoverTitle>Thông báo</PopoverTitle>
              <PopoverDescription>
                {unreadCount > 0
                  ? `${unreadCount} thông báo chưa xem`
                  : "Không có thông báo chưa xem"}
              </PopoverDescription>
            </div>

            {unreadCount > 0 ? (
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 px-2 text-xs"
                    disabled={isMarkingAllSeen}
                    onClick={() => void handleMarkAllSeen()}
                  >
                    <CheckCheck className="size-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Đánh dấu tất cả đã xem</p>
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </PopoverHeader>
        <div className="max-h-[28rem] overflow-y-auto">
          {isPending && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
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
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
              Đang tải thêm...
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
