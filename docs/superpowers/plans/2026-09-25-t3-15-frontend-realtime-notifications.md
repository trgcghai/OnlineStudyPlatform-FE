# T3-15 Frontend Realtime Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add frontend realtime notification delivery by opening one authenticated Socket.IO connection during active sessions and invalidating existing REST-backed notification queries when `notification.created` arrives.

**Architecture:** Add a global client-only listener mounted once under the existing root providers. The listener owns only socket lifecycle and query invalidation; the existing notification popover and API hooks remain REST-backed. Socket events are lightweight signals and never directly mutate notification rows.

**Tech Stack:** Next.js 16 App Router, React 19, Redux Toolkit + redux-persist, TanStack Query, Socket.IO client, pnpm 11.9.0, TypeScript strict mode.

---

## Source References

- Task: `../ba/tasks/phase-3-ai/T3-15-realtime-notifications.md` from the root repo.
- Design: `docs/superpowers/specs/2026-09-25-t3-15-frontend-realtime-notifications-design.md`.
- Notes: `../T3-15-backend-frontend-notes.md` from the root repo.
- Local Next docs rule: read relevant docs under `node_modules/next/dist/docs/` before coding in this app.

## Shared Rules

- Run commands from `onlinestudyplatform-fe/`.
- Use `pnpm` only.
- Do not add a frontend test framework for T3-15.
- Do not add a notification-center page, filters, notification categories, browser notifications, push notifications, or email behavior.
- Do not mutate notification rows from the socket payload.
- Keep `NOTIFICATION_CREATED_EVENT` as `notification.created`.
- Keep REST notification response fields unchanged: `id`, `type`, `title`, `message`, `metadata`, `actionUrl`, `sentAt`, `seen`.
- Do not commit unless explicitly requested.

## File Structure

- Modify: `onlinestudyplatform-fe/package.json`
  - Add `socket.io-client` through `pnpm add socket.io-client`.
- Modify: `onlinestudyplatform-fe/pnpm-lock.yaml`
  - Updated automatically by `pnpm add socket.io-client`.
- Create: `onlinestudyplatform-fe/components/notifications/notification-realtime-listener.tsx`
  - Global client listener for authenticated socket lifecycle and query invalidation.
- Modify: `onlinestudyplatform-fe/app/layout.tsx`
  - Mount `NotificationRealtimeListener` once inside `ReduxProvider` and `QueryProvider`.
- Optional Create: `onlinestudyplatform-fe/docs/superpowers/reports/2026-09-25-t3-15-frontend-realtime-notification-qa.md`
  - Manual QA evidence if runtime QA is performed during completion.

---

### Task 1: Install Socket.IO Client Dependency

**Related skills:** `nextjs`, `verification-before-completion`

**Files:**
- Modify: `onlinestudyplatform-fe/package.json`
- Modify: `onlinestudyplatform-fe/pnpm-lock.yaml`

- [ ] **Step 1: Read local Next docs relevant to client components**

Read these local docs before coding:

```powershell
Get-Content -LiteralPath "node_modules/next/dist/docs/01-app/03-building-your-application/03-rendering/02-client-components.mdx"
```

If the exact path differs in the installed Next docs, locate the App Router client-components doc under `node_modules/next/dist/docs/` and read it before implementation.

- [ ] **Step 2: Install dependency**

Run:

```powershell
pnpm add socket.io-client
```

Expected:

- `socket.io-client` appears in `package.json` dependencies.
- `pnpm-lock.yaml` is updated.
- No npm/yarn/bun files are created.

- [ ] **Step 3: Verify dependency installation is type-resolvable**

Run:

```powershell
pnpm exec tsc --noEmit
```

Expected: existing project typecheck remains green before application code changes. If unrelated existing type errors appear, stop and report them before continuing.

---

### Task 2: Build The Global Realtime Listener

**Related skills:** `nextjs`, `vercel-react-best-practices`, `test-driven-development`

**Files:**
- Create: `onlinestudyplatform-fe/components/notifications/notification-realtime-listener.tsx`

- [ ] **Step 1: Create the client listener component**

Create `components/notifications/notification-realtime-listener.tsx`:

```tsx
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

      void Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: notificationKeys.unreadCount(),
        }),
      ]);
    }

    socket.on(NOTIFICATION_CREATED_EVENT, handleNotificationCreated);

    return () => {
      socket.off(NOTIFICATION_CREATED_EVENT, handleNotificationCreated);
      socket.disconnect();
    };
  }, [accessToken, isAuthenticated, queryClient]);

  return null;
}
```

Implementation notes:

- Use Socket.IO default transport behavior; do not force `transports` unless runtime QA proves it is needed.
- Do not add `connect`, `reconnect`, or `connect_error` invalidations.
- Do not add production console logging.
- Do not move notification REST logic into this component.

- [ ] **Step 2: Run typecheck for listener compile feedback**

Run:

```powershell
pnpm exec tsc --noEmit
```

Expected: typecheck passes. If TypeScript reports missing `socket.io-client` types, verify that `pnpm add socket.io-client` completed and lockfile is updated.

---

### Task 3: Mount The Listener Once In Root Layout

**Related skills:** `nextjs`, `vercel-react-best-practices`

**Files:**
- Modify: `onlinestudyplatform-fe/app/layout.tsx`

- [ ] **Step 1: Import the listener**

Modify `app/layout.tsx` imports:

```tsx
import { NotificationRealtimeListener } from "@/components/notifications/notification-realtime-listener";
```

- [ ] **Step 2: Mount the listener inside providers**

Modify the `NuqsAdapter` subtree:

```tsx
<NuqsAdapter>
  <NotificationRealtimeListener />
  <TooltipProvider>{children}</TooltipProvider>
  <Toaster />
</NuqsAdapter>
```

Expected behavior:

- The listener is mounted once globally.
- It is inside both `ReduxProvider` and `QueryProvider`.
- It is not mounted inside `NotificationPopover`, topbars, or role-specific layouts.

- [ ] **Step 3: Run typecheck after mount**

Run:

```powershell
pnpm exec tsc --noEmit
```

Expected: typecheck passes.

---

### Task 4: Static Verification

**Related skills:** `verification-before-completion`, `systematic-debugging`

**Files:**
- No code files unless verification finds a defect.

- [ ] **Step 1: Run lint**

Run:

```powershell
pnpm lint
```

Expected: ESLint exits 0.

- [ ] **Step 2: Run TypeScript check**

Run:

```powershell
pnpm exec tsc --noEmit
```

Expected: TypeScript exits 0.

- [ ] **Step 3: Run production build**

Run:

```powershell
pnpm build
```

Expected: Next build exits 0.

- [ ] **Step 4: Inspect dependency diff**

Run:

```powershell
git diff -- package.json pnpm-lock.yaml
```

Expected:

- Only `socket.io-client` and its transitive lockfile entries were added.
- No unrelated dependency or script changes.

---

### Task 5: Manual Runtime QA

**Related skills:** `verification-before-completion`, `systematic-debugging`

**Files:**
- Optional Create: `onlinestudyplatform-fe/docs/superpowers/reports/2026-09-25-t3-15-frontend-realtime-notification-qa.md`

- [ ] **Step 1: Start required runtime services**

Use the existing project runtime setup. The backend must include the T3-15 backend socket implementation and be reachable through `NEXT_PUBLIC_API_URL`.

Expected:

- FE loads successfully.
- BE health is reachable.
- User login works.

- [ ] **Step 2: Verify authenticated socket connect**

Manual check:

1. Login as a learner, instructor, or admin.
2. Open browser devtools Network tab.
3. Confirm one Socket.IO connection is established to the backend origin.
4. Confirm no duplicate socket connections appear after normal navigation.

Expected: one authenticated notification socket while the user session is active.

- [ ] **Step 3: Verify event-driven unread badge refresh**

Manual check:

1. Trigger a backend notification for the logged-in user.
2. Do not refresh the page.
3. Confirm the unread badge count refreshes.

Expected: badge updates through query invalidation and REST refetch.

- [ ] **Step 4: Verify notification list refresh**

Manual check:

1. After the realtime event, open the notification popover.
2. Confirm the new notification appears from REST data.
3. Click the notification and confirm existing mark-seen/routing behavior still works.

Expected: list refreshes without the socket payload being rendered directly.

- [ ] **Step 5: Verify reconnect behavior**

Manual check:

1. Temporarily interrupt the backend or network connection.
2. Restore the backend/network connection.
3. Trigger one notification event.
4. Confirm the UI refreshes once, not multiple times.

Expected: Socket.IO reconnects without duplicate event listeners or duplicate invalidation behavior.

- [ ] **Step 6: Verify logout cleanup**

Manual check:

1. Login and confirm the socket exists.
2. Logout.
3. Confirm the socket disconnects.
4. Trigger another notification server-side.
5. Confirm the logged-out browser session does not refresh notification data.

Expected: logout/session loss cleans up the socket.

- [ ] **Step 7: Verify REST fallback**

Manual check:

1. Simulate socket failure or block the socket connection.
2. Open the notification popover.
3. Use mark-single-read and mark-all-read.

Expected: existing REST notification center still loads list/count and read mutations still work.

- [ ] **Step 8: Record QA result if closing DoD**

If runtime QA is completed and this task is being closed, create `docs/superpowers/reports/2026-09-25-t3-15-frontend-realtime-notification-qa.md` with:

```md
# T3-15 Frontend Realtime Notification QA Report

## Environment

| Item | Value |
| --- | --- |
| FE branch | feat/t3-15 |
| BE branch | feat/t3-15 |
| FE URL | Record the tested frontend URL |
| BE URL | Record the tested backend URL |
| QA date | 2026-09-25 |

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| Authenticated socket connect | Record Pass, Fail, or Blocked | Record observed evidence |
| Unread badge refresh | Record Pass, Fail, or Blocked | Record observed evidence |
| Notification list refresh | Record Pass, Fail, or Blocked | Record observed evidence |
| Reconnect without duplicate refresh | Record Pass, Fail, or Blocked | Record observed evidence |
| Logout cleanup | Record Pass, Fail, or Blocked | Record observed evidence |
| REST fallback | Record Pass, Fail, or Blocked | Record observed evidence |

## Final Decision

Record Pass, Fail, or Blocked with a concise summary of the runtime QA result.
```

Do not claim runtime QA passed without observed evidence.

---

## Final Checklist

- [ ] `socket.io-client` is installed with pnpm.
- [ ] One global listener is mounted under Redux and Query providers.
- [ ] Socket opens only when authenticated with a non-empty access token.
- [ ] Socket disconnects on cleanup, logout, session loss, or token change.
- [ ] `notification.created` handler validates payload shape.
- [ ] Valid events invalidate notification list and unread-count queries.
- [ ] Invalid payloads do nothing.
- [ ] The listener does not mutate notification rows directly.
- [ ] REST notification list, unread count, mark-single-read, and mark-all-read remain unchanged.
- [ ] `NOTIFICATION_CREATED_EVENT` remains the shared event constant.
- [ ] Static verification passes: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`.
- [ ] Manual QA is recorded or explicitly deferred as blocked.
