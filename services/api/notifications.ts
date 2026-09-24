import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export const NOTIFICATION_TYPES = {
  DIRECT: "direct",
  QUEUE: "queue",
} as const;

// Future realtime handler contract: when NOTIFICATION_CREATED_EVENT is received,
// invalidate notificationKeys.lists() and notificationKeys.unreadCount().
// T3-02 does not open a socket or mount a subscription.
export const NOTIFICATION_CREATED_EVENT = "notification.created";

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export interface NotificationCreatedEventPayload {
  notificationId: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  actionUrl: string | null;
  sentAt: string;
  seen: boolean;
}

export interface NotificationListFilters {
  page?: number;
  limit?: number;
}

export interface NotificationListResult {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UnreadNotificationCountResult {
  count: number;
}

export interface MarkAllNotificationsSeenResult {
  modifiedCount: number;
}

function buildNotificationListQuery(filters: NotificationListFilters): string {
  const params = new URLSearchParams();

  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();

  return query.length > 0 ? `?${query}` : "";
}

export async function listMyNotifications(
  filters: NotificationListFilters = {},
): Promise<NotificationListResult> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<NotificationListResult>
  >(`/notifications/me${buildNotificationListQuery(filters)}`);

  return data.data;
}

export async function countUnreadNotifications(): Promise<UnreadNotificationCountResult> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<UnreadNotificationCountResult>
  >("/notifications/me/unread-count");

  return data.data;
}

export async function markNotificationSeen(
  notificationId: string,
): Promise<NotificationItem> {
  const { data } = await axiosClient.patch<
    ApiSuccessResponse<NotificationItem>
  >(`/notifications/${notificationId}/seen`);

  return data.data;
}

export async function markAllNotificationsSeen(): Promise<MarkAllNotificationsSeenResult> {
  const { data } = await axiosClient.patch<
    ApiSuccessResponse<MarkAllNotificationsSeenResult>
  >("/notifications/me/seen");

  return data.data;
}
