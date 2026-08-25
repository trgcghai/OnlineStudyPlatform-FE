import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  countUnreadNotifications,
  listMyNotifications,
  markNotificationSeen,
  type NotificationItem,
} from "@/services/api/notifications";

const NOTIFICATION_PAGE_SIZE = 10;

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: notificationKeys.unreadCount(),
        }),
      ]);
    },
  });

  return {
    markSeen: mutation.mutateAsync,
    isPending: mutation.isPending,
    pendingNotificationId: mutation.variables,
  };
}
