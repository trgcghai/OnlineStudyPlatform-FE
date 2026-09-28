"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import {
  NOTIFICATION_CREATED_EVENT,
  type NotificationCreatedEventPayload,
} from "@/services/api/notifications";
import {
  selectAccessToken,
  selectIsAuthenticated,
} from "@/lib/features/authSlice";
import { notificationKeys } from "@/lib/query-keys";
import type { RootState } from "@/lib/store";

function getNotificationSocketOrigin(): string | null {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;

  try {
    return new URL(apiUrl).origin;
  } catch {
    return null;
  }
}

function isNotificationCreatedPayload(
  payload: unknown,
): payload is NotificationCreatedEventPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "notificationId" in payload &&
    typeof payload.notificationId === "string" &&
    payload.notificationId.trim().length > 0
  );
}

export function NotificationRealtimeListener() {
  const queryClient = useQueryClient();
  const isAuthenticated = useSelector((state: RootState) =>
    selectIsAuthenticated(state),
  );
  const accessToken = useSelector((state: RootState) =>
    selectAccessToken(state),
  );

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socketOrigin = getNotificationSocketOrigin();
    if (!socketOrigin) return;

    const socket = io(socketOrigin, {
      auth: { token: accessToken },
    });

    function handleNotificationCreated(payload: unknown) {
      if (!isNotificationCreatedPayload(payload)) return;

      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    }

    socket.on(NOTIFICATION_CREATED_EVENT, handleNotificationCreated);

    return () => {
      socket.off(NOTIFICATION_CREATED_EVENT, handleNotificationCreated);
      socket.disconnect();
    };
  }, [accessToken, isAuthenticated, queryClient]);

  return null;
}
