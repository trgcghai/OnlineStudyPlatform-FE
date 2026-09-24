# T3-03 Frontend Notification Verification Design

## Scope

T3-03 frontend work verifies the existing notification center against the backend business-event integration. It does not expand notification UX, add realtime delivery, or introduce event-specific notification categories.

The current T3-02 notification contract remains unchanged:

- `id`
- `type`
- `title`
- `message`
- `metadata`
- `actionUrl`
- `sentAt`
- `seen`

`type` remains the delivery type (`direct` or `queue`). Frontend verification must not reinterpret it as a business category.

## Event Destination Matrix

| Event | Expected destination |
| --- | --- |
| `essay-submitted` | `/instructor/essay-grading` |
| `essay-graded` | `/learner/courses/:courseId/learn` |
| `withdraw-submitted` | `/admin/withdrawals` |
| `withdraw-status` | `/instructor/withdrawals` |

## Essay-Graded Deep Link Boundary

For T3-03, `essay-graded` only needs course-level deep-link validation:

```text
notification.actionUrl
        ->
/learner/courses/:courseId/learn
        ->
correct course loads
```

T3-03 does not require the learning player to identify or highlight the specific quiz attempt. QA should record whether the current learning page provides enough context for the learner to understand the graded notification.

If attempt-level focus is needed, create a follow-up enhancement instead of expanding T3-03:

```text
Future task
  actionUrl -> ?attemptId=... / ?quizId=...
  learning player focuses relevant attempt
```

## Actor And Recipient Boundaries

QA must verify that notifications are visible only to the intended recipients:

- Essay submitted: instructor receives the notification.
- Essay graded: learner receives the notification.
- Withdrawal submitted: all admins receive the notification.
- Withdrawal status changed: relevant instructor receives the notification.

## Common Notification Behavior

QA must verify the existing notification center behavior remains intact:

- Notification API shape is unchanged.
- Unread count loads and updates correctly.
- Popover list loads paginated notifications.
- Clicking an unread notification marks it seen before navigation.
- Mark-all remains functional.
- Failed mark-seen or mark-all mutations do not corrupt local notification state.

## Architecture

No new frontend architecture is required for T3-03. The existing pieces remain the source of truth:

- `services/api/notifications.ts` owns the REST contract.
- `hooks/useNotifications.ts` owns TanStack Query list/count/mutation behavior.
- `components/notifications/notification-popover.tsx` owns the badge, list, mark-read, mark-all, and `actionUrl` navigation behavior.
- Existing role pages own destination rendering.

## Testing And Verification

Use manual or integration QA against a backend seeded with the four business events. Verification should capture:

- The notification payload returned by the REST API.
- The user role receiving the notification.
- The result after clicking the notification.
- Whether unread count and seen state update after click or mark-all.
- Any mutation failure behavior observed under network or backend error conditions.

No automated frontend test framework exists in this repo. If code changes become necessary after QA, run the standard frontend checks from `onlinestudyplatform-fe/`:

- `pnpm lint`
- `pnpm exec tsc --noEmit`
- `pnpm build`
