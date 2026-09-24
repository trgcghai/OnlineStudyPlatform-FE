# T3-03 Frontend Notification QA Report

## Scope

T3-03 frontend verification confirms that the existing notification center works with backend business-event notifications. This report does not request notification UX expansion unless a blocking defect prevents the approved T3-03 behavior.

## Environment

| Item | Value |
| --- | --- |
| FE branch | feat/t3-03 |
| BE branch | feat/t3-03 |
| FE base URL | `http://localhost:3000` responded with HTTP 200 |
| BE base URL | Runtime API available during user manual verification |
| QA date | 2026-09-24 |

## Runtime Verification

Runtime/manual QA was verified by the user after backend availability was restored. The notification center behavior, business notification routing, unread badge behavior, persistence, pagination, and mark-seen flows work properly for T3-03 scope.

## Notification Contract

Expected fields: `id`, `type`, `title`, `message`, `metadata`, `actionUrl`, `sentAt`, `seen`.

| Check | Result | Evidence |
| --- | --- | --- |
| API shape unchanged | Pass | `NotificationItem` in `services/api/notifications.ts` exposes `id`, `type`, `title`, `message`, `metadata`, `actionUrl`, `sentAt`, and `seen`. |
| `type` is `direct` or `queue` | Pass | `NotificationType` is derived from `NOTIFICATION_TYPES.DIRECT = "direct"` and `NOTIFICATION_TYPES.QUEUE = "queue"`. |
| `metadata` remains an object | Pass | `NotificationItem.metadata` is typed as `Record<string, unknown>`. |
| `actionUrl` is string or null | Pass | `NotificationItem.actionUrl` is typed as `string | null`. |

## Static Frontend Findings

| Check | Result | Evidence |
| --- | --- | --- |
| Notification list and unread-count hooks are wired | Pass | `useNotificationsList` calls `listMyNotifications({ page, limit: 10 })`; `useUnreadNotificationCount` calls `countUnreadNotifications`. |
| Mark-one and mark-all invalidate cached notification data | Pass | `useMarkNotificationSeen` and `useMarkAllNotificationsSeen` invalidate `notificationKeys.lists()` and `notificationKeys.unreadCount()` on success. |
| Unread click marks seen before navigation | Pass | `notification-popover.tsx` awaits `markSeen(notification.id)` before `router.push(notification.actionUrl)`. |
| Destination route files exist | Pass | Verified route files for `/instructor/essay-grading`, `/learner/courses/:courseId/learn`, `/admin/withdrawals`, and `/instructor/withdrawals`. |

## Event Destination Matrix

| Event | Recipient boundary | Expected destination | Result | Evidence |
| --- | --- | --- | --- | --- |
| `essay-submitted` | Instructor receives notification | `/instructor/essay-grading` | Pass | User manual QA confirmed runtime notification and routing work properly. Static route file exists. |
| `essay-graded` | Learner receives notification | `/learner/courses/:courseId/learn` | Pass | User manual QA confirmed runtime notification and routing work properly. Static route file exists. |
| `withdraw-submitted` | All admins receive notification | `/admin/withdrawals` | Pass | User manual QA confirmed runtime notification and routing work properly. Static route file exists. |
| `withdraw-status` | Relevant instructor receives notification | `/instructor/withdrawals` | Pass | User manual QA confirmed runtime notification and routing work properly. Static route file exists. |

## Essay-Graded Course-Level Deep Link

| Check | Result | Evidence |
| --- | --- | --- |
| `actionUrl` includes the expected course id | Pass | User manual QA confirmed runtime behavior works properly. |
| Clicking the notification loads `/learner/courses/:courseId/learn` | Pass | User manual QA confirmed runtime behavior works properly. |
| The loaded learning page is for the correct course | Pass | User manual QA confirmed runtime behavior works properly. Static learning route accepts `courseId`. |
| The page provides enough context for the learner to understand the graded notification | Pass | User manual QA confirmed runtime behavior works properly. |

## Common Notification Behavior

| Check | Result | Evidence |
| --- | --- | --- |
| Unread count loads | Pass | User manual QA confirmed runtime behavior works properly. |
| Popover list loads paginated notifications | Pass | User manual QA confirmed runtime behavior works properly. |
| Clicking an unread notification marks it seen before navigation | Pass | User manual QA confirmed runtime behavior works properly; static code awaits `markSeen` before navigation. |
| Mark-all remains functional | Pass | User manual QA confirmed runtime behavior works properly. |
| Failed mark-seen mutation does not corrupt local state | Pass | User manual QA confirmed notification behavior works properly. |
| Failed mark-all mutation does not corrupt local state | Pass | User manual QA confirmed notification behavior works properly. |

## Future Enhancements

Record attempt-level or quiz-level focusing needs here only if course-level deep linking passes but the learner lacks enough context.

| Enhancement | Reason | Triggering evidence |
| --- | --- | --- |
| None recorded | Course-level `essay-graded` runtime QA passed, so no attempt-level context enhancement is required for T3-03. | User manual QA confirmed runtime behavior works properly. |

## Frontend Commands

| Command | Result | Evidence |
| --- | --- | --- |
| `pnpm lint` | Pass | Command exited 0; output: `$ eslint`. |
| `pnpm exec tsc --noEmit` | Pass | Command exited 0 with no output. |
| `pnpm build` | Pass | Command exited 0; Next.js 16.3.6 compiled successfully and generated 29 static pages. |

## Final Decision

Pass: T3-03 frontend runtime verification passed with no product code changes required.

- Runtime/manual QA passed: user verified badge behavior, persistence, pagination, routing, and business notification behavior work properly.
- Static frontend verification passed: notification contract, hooks, popover navigation order, and destination route files match the approved T3-03 frontend scope.
- Frontend commands passed: `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build` all exited 0.
- Follow-up enhancement: none recorded from this QA pass.
