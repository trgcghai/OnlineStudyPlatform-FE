# T3-03 Frontend Notification QA Report

## Scope

T3-03 frontend verification confirms that the existing notification center works with backend business-event notifications. This report does not request notification UX expansion unless a blocking defect prevents the approved T3-03 behavior.

## Environment

| Item | Value |
| --- | --- |
| FE branch | feat/t3-03 |
| BE branch | feat/t3-03 |
| FE base URL | `http://localhost:3000` responded with HTTP 200 |
| BE base URL | `http://localhost:3001/health` blocked; BE container fails startup during TypeORM schema sync |
| QA date | 2026-09-24 |

## Runtime Blocker

Runtime event QA could not run because the BE service did not become healthy. `docker compose up -d be` started the container, but `GET http://localhost:3001/health` failed. `docker compose logs --tail=120 be` showed TypeORM failing to add a foreign key on `payment_transactions.course_id` because existing data references a missing `courses.id`:

```text
QueryFailedError: insert or update on table "payment_transactions" violates foreign key constraint "FK_b85bf4d83a0116cc8fbca8bd94f"
detail: Key (course_id)=(e1c85b73-c8e1-4c53-b802-9fabaa5e84c0) is not present in table "courses".
query: ALTER TABLE "payment_transactions" ADD CONSTRAINT "FK_b85bf4d83a0116cc8fbca8bd94f" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION
```

No database cleanup or schema workaround was applied because T3-03 frontend scope is verification-only and should not mutate unrelated local data.

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
| `essay-submitted` | Instructor receives notification | `/instructor/essay-grading` | Blocked | Runtime event could not be triggered because BE health failed on startup. Static route file exists. |
| `essay-graded` | Learner receives notification | `/learner/courses/:courseId/learn` | Blocked | Runtime event could not be triggered because BE health failed on startup. Static route file exists. |
| `withdraw-submitted` | All admins receive notification | `/admin/withdrawals` | Blocked | Runtime event could not be triggered because BE health failed on startup. Static route file exists. |
| `withdraw-status` | Relevant instructor receives notification | `/instructor/withdrawals` | Blocked | Runtime event could not be triggered because BE health failed on startup. Static route file exists. |

## Essay-Graded Course-Level Deep Link

| Check | Result | Evidence |
| --- | --- | --- |
| `actionUrl` includes the expected course id | Blocked | Runtime `essay-graded` notification could not be generated because BE health failed on startup. |
| Clicking the notification loads `/learner/courses/:courseId/learn` | Blocked | Runtime click-through could not be tested because BE health failed on startup. |
| The loaded learning page is for the correct course | Blocked | Runtime course load could not be tested because BE health failed on startup. Static learning route accepts `courseId`. |
| The page provides enough context for the learner to understand the graded notification | Blocked | Requires runtime `essay-graded` click-through and correct course data. |

## Common Notification Behavior

| Check | Result | Evidence |
| --- | --- | --- |
| Unread count loads | Blocked | Requires healthy BE notification API; BE health failed on startup. |
| Popover list loads paginated notifications | Blocked | Requires healthy BE notification API; BE health failed on startup. |
| Clicking an unread notification marks it seen before navigation | Blocked | Runtime click-through requires healthy BE notification API; static code awaits `markSeen` before navigation. |
| Mark-all remains functional | Blocked | Requires healthy BE notification API; BE health failed on startup. |
| Failed mark-seen mutation does not corrupt local state | Blocked | Requires runtime UI/API session; BE health failed on startup before authenticated QA could run. |
| Failed mark-all mutation does not corrupt local state | Blocked | Requires runtime UI/API session; BE health failed on startup before authenticated QA could run. |

## Future Enhancements

Record attempt-level or quiz-level focusing needs here only if course-level deep linking passes but the learner lacks enough context.

| Enhancement | Reason | Triggering evidence |
| --- | --- | --- |
| None recorded | Course-level `essay-graded` runtime QA did not run, so no attempt-level context enhancement can be justified from this QA pass. | Runtime blocked by BE startup failure. |

## Frontend Commands

| Command | Result | Evidence |
| --- | --- | --- |
| `pnpm lint` | Pass | Command exited 0; output: `$ eslint`. |
| `pnpm exec tsc --noEmit` | Pass | Command exited 0 with no output. |
| `pnpm build` | Pass | Command exited 0; Next.js 16.3.6 compiled successfully and generated 29 static pages. |

## Final Decision

Blocked: T3-03 frontend runtime verification could not complete because the BE service is unavailable due to a local database FK violation during TypeORM schema synchronization.

- Blocking runtime dependency: BE health failed after `docker compose up -d be`; event generation, recipient-boundary checks, click-through QA, and mutation-state QA require a healthy BE notification API.
- Static frontend verification passed: notification contract, hooks, popover navigation order, and destination route files match the approved T3-03 frontend scope.
- Frontend commands passed: `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build` all exited 0.
- Follow-up enhancement: none recorded from this QA pass because `essay-graded` course-level runtime deep-link verification did not run.
