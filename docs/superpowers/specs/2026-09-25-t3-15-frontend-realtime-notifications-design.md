# T3-15 Frontend Realtime Notifications Design

## Context

T3-15 frontend work connects the existing REST-first notification center to the backend `notification.created` socket signal. The socket payload is intentionally minimal and must only trigger TanStack Query invalidation. REST remains the source of truth for notification list data, unread counts, mark-single-read, and mark-all-read.

Existing anchors:

- `services/api/notifications.ts` exports `NOTIFICATION_CREATED_EVENT = "notification.created"` and `NotificationCreatedEventPayload`.
- `hooks/useNotifications.ts` already invalidates `notificationKeys.lists()` and `notificationKeys.unreadCount()` after mark-single and mark-all mutations.
- `lib/query-keys.ts` defines `notificationKeys.lists()` and `notificationKeys.unreadCount()`.
- `lib/features/authSlice.ts` exposes `selectIsAuthenticated`, `selectAccessToken`, and `selectAuthUser`.
- `app/layout.tsx` mounts `ReduxProvider` outside `QueryProvider`, so a global client listener can read auth state and invalidate query data if mounted inside both providers.
- `package.json` does not currently include `socket.io-client`.

## Goals

- Open one authenticated Socket.IO connection while an authenticated user session is active.
- Close the socket on logout, session loss, unmount, or access-token change.
- Listen for `notification.created`.
- Validate the payload as `{ notificationId: string }` with a non-empty `notificationId`.
- Invalidate notification list and unread-count queries for valid events.
- Avoid mutating notification data from the socket payload.
- Preserve all existing REST notification behavior and public response field names.
- Rely on manual QA plus existing lint/typecheck/build commands; do not add a frontend test framework for this task.

## Non-Goals

- No notification-center page.
- No notification filters.
- No new notification type/category taxonomy.
- No browser Notification API permission prompt.
- No push notification or email notification work.
- No client-side construction/insertion of notification rows from the socket event.
- No new frontend testing stack.

## Architecture

Use a single global client listener component mounted once in the root provider tree:

```text
app/layout.tsx
  ThemeProvider
    ReduxProvider
      QueryProvider
        NuqsAdapter
          NotificationRealtimeListener
          TooltipProvider
          Toaster
```

The listener owns only the realtime lifecycle:

- Read auth state from Redux.
- Create/disconnect Socket.IO client.
- Register/unregister one `notification.created` handler.
- Invalidate TanStack Query notification keys.

The existing popover, API functions, and notification hooks remain REST-backed.

## Dependency

Add `socket.io-client` to frontend dependencies:

```powershell
pnpm add socket.io-client
```

Run from `onlinestudyplatform-fe/`.

## Backend Origin Derivation

The socket should connect to the backend origin derived from `NEXT_PUBLIC_API_URL`.

Rules:

- If `NEXT_PUBLIC_API_URL` is `http://localhost:3001`, socket origin is `http://localhost:3001`.
- If `NEXT_PUBLIC_API_URL` is `http://localhost:3001/api`, socket origin is `http://localhost:3001`.
- If `NEXT_PUBLIC_API_URL` is `https://api.example.com/api`, socket origin is `https://api.example.com`.
- If parsing fails or env is missing, do not create a socket and keep REST notification center behavior unchanged.

Suggested helper inside the listener file:

```ts
function getNotificationSocketOrigin(): string | null {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;

  try {
    const url = new URL(apiUrl);
    return url.origin;
  } catch {
    return null;
  }
}
```

Using `url.origin` safely strips `/api` and any other path segments. Do not connect directly to the full API URL path unless the backend explicitly mounts the Socket.IO server under that path.

## Listener Component

Create:

```text
components/notifications/notification-realtime-listener.tsx
```

Behavior:

- Mark as client component with `"use client"`.
- Read `isAuthenticated` and `accessToken` from Redux selectors.
- Read `queryClient` with `useQueryClient()`.
- If not authenticated or no access token, do not open a socket.
- If backend origin is unavailable, do not open a socket.
- Create the socket with:

```ts
io(socketOrigin, {
  auth: { token: accessToken },
  transports: ["websocket", "polling"],
});
```

- Register a single `NOTIFICATION_CREATED_EVENT` handler.
- On valid payload, invalidate:

```ts
void Promise.all([
  queryClient.invalidateQueries({ queryKey: notificationKeys.lists() }),
  queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() }),
]);
```

- In cleanup, call `socket.off(NOTIFICATION_CREATED_EVENT, handler)` and `socket.disconnect()`.
- The effect dependencies should include `accessToken`, `isAuthenticated`, and `queryClient`.

Payload validation can stay local and minimal:

```ts
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
```

## Redux Selector Usage

The repo does not currently define typed Redux hooks. Use the minimal local approach for this task:

```ts
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
```

Then select:

```ts
const isAuthenticated = useSelector((state: RootState) =>
  selectIsAuthenticated(state),
);
const accessToken = useSelector((state: RootState) =>
  selectAccessToken(state),
);
```

Do not add global typed Redux hooks solely for T3-15 unless the implementation becomes noisy or repeated.

## Reconnect And Duplicate Handling

Socket.IO handles reconnects. The frontend should avoid duplicate event handling by scoping the handler inside one effect and removing it in cleanup.

Requirements:

- Do not invalidate on `connect`, `reconnect`, ping/pong, or `connect_error`.
- Invalidate only on valid `notification.created` payloads.
- Do not register multiple handlers for the same socket.
- On token change, cleanup disconnects the old socket before the effect creates a new one.
- On logout, Redux auth clears and the effect cleanup disconnects the socket.
- Socket failures should not affect the existing REST notification popover.

Optional logging:

- `connect_error` may be logged only in development.
- Avoid noisy production console logs.

## Mounting

Modify `app/layout.tsx`:

- Import `NotificationRealtimeListener`.
- Mount once under `NuqsAdapter`, before or near `TooltipProvider`.
- Do not mount it in topbars, role layouts, or `NotificationPopover`, because those locations can create multiple sockets or couple realtime behavior to UI visibility.

Suggested structure:

```tsx
<NuqsAdapter>
  <NotificationRealtimeListener />
  <TooltipProvider>{children}</TooltipProvider>
  <Toaster />
</NuqsAdapter>
```

## Manual QA

Manual QA should cover:

- Authenticated connect: after login, one socket connection is opened.
- Event-driven unread badge refresh: backend creates a notification and the unread badge refreshes without reload.
- Notification list refresh: after the event, opening the popover shows the new notification from REST data.
- Reconnect: temporarily interrupt/restart backend/network, then trigger one event and confirm the UI refresh happens once.
- Logout cleanup: logout disconnects the socket; later backend events do not refresh the logged-out browser session.
- REST fallback: if socket connection fails, the popover still loads list/count and mark-read operations through REST.

Record QA in a short report if this task is being closed against the backlog DoD.

## Verification

Run from `onlinestudyplatform-fe/`:

```powershell
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Open Decisions

None. The approved design uses `socket.io-client`, one globally mounted listener, manual QA, and REST-backed query invalidation.
