import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  countUnreadNotifications,
  listMyNotifications,
  markAllNotificationsSeen,
  markNotificationSeen,
  type MarkAllNotificationsSeenResult,
  type NotificationItem,
} from "@/services/api/notifications";
import { notificationKeys } from "@/lib/query-keys";
import { toast } from "@/components/ui/toast";

const NOTIFICATION_PAGE_SIZE = 10;

export function useNotificationsList() {
  return useInfiniteQuery({
    queryKey: notificationKeys.lists(),
    queryFn: ({ pageParam }) =>
      listMyNotifications({ page: pageParam, limit: NOTIFICATION_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
}

export function useNotificationsPage({
  page,
  limit = NOTIFICATION_PAGE_SIZE,
}: {
  page: number;
  limit?: number;
}) {
  const filters = { page, limit };

  return useQuery({
    queryKey: notificationKeys.page(filters),
    queryFn: () => listMyNotifications(filters),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: countUnreadNotifications,
  });
}

export function useMarkNotificationSeen() {
  const queryClient = useQueryClient();
  const mutation = useMutation<NotificationItem, unknown, string>({
    mutationFn: markNotificationSeen,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  return {
    markSeen: mutation.mutateAsync,
    isPending: mutation.isPending,
    pendingNotificationId: mutation.variables,
  };
}

export function useMarkAllNotificationsSeen() {
  const queryClient = useQueryClient();
  const mutation = useMutation<MarkAllNotificationsSeenResult>({
    mutationFn: markAllNotificationsSeen,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error) => {
      console.error("Error marking all notifications as seen:", error);
      toast.add({
        title: "Không thể đánh dấu tất cả thông báo",
        description: "Vui lòng thử lại sau.",
        type: "error",
      });
    },
  });

  return {
    markAllSeen: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
