# T3-03 Frontend Notification Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify the existing frontend notification center against T3-03 backend business-event notifications without expanding notification UX.

**Architecture:** This is a QA-first frontend task. The implementation artifact is a written QA report that records route, recipient, API-contract, unread-state, and mutation-failure evidence; product code changes are out of scope unless verification finds a blocking defect.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, Axios, NestJS backend notification APIs.

---

## Scope Boundary

T3-03 frontend defaults to verification only. Do not add notification categories, realtime subscriptions, learning-player attempt focus, new filters, or event-specific UI labels.

If QA finds that `/learner/courses/:courseId/learn` loads the correct course but does not provide enough context for the learner to understand an essay-graded notification, record a future enhancement instead of changing T3-03:

```text
Future enhancement: essay-graded actionUrl can include ?attemptId=... / ?quizId=..., and the learning player can focus the relevant quiz attempt.
```

## File Structure

- Read: `docs/superpowers/specs/2026-09-24-t3-03-frontend-notification-verification-design.md` for approved scope.
- Read: `services/api/notifications.ts` for the REST notification contract.
- Read: `hooks/useNotifications.ts` for query and mutation behavior.
- Read: `components/notifications/notification-popover.tsx` for badge, list, mark-read, mark-all, and navigation behavior.
- Read: `app/(instructor)/instructor/essay-grading/page.tsx` for essay-submitted destination.
- Read: `app/(learning)/learner/courses/[courseId]/learn/page.tsx` and `app/(learning)/learner/courses/[courseId]/learn/learning-player-client.tsx` for essay-graded destination.
- Read: `app/(admin)/admin/withdrawals/page.tsx` for withdrawal-submitted destination.
- Read: `app/(instructor)/instructor/withdrawals/page.tsx` for withdrawal-status destination.
- Create: `docs/superpowers/reports/2026-09-24-t3-03-frontend-notification-qa.md` with the completed QA evidence.

---

### Task 1: Confirm Scope And Runtime Preconditions

**Related skills:** `writing-plans` has already produced this plan. Use `executing-plans` or `subagent-driven-development` to execute it. Use `nextjs` before any frontend code edit becomes necessary.

**Files:**
- Read: `docs/superpowers/specs/2026-09-24-t3-03-frontend-notification-verification-design.md`
- Read: `AGENTS.md`
- Read: `package.json`

- [ ] **Step 1: Confirm the current branch and worktree state**

Run from `onlinestudyplatform-fe/`:

```bash
git branch --show-current
git status --short
```

Expected:

```text
feat/t3-03
```

`git status --short` may show the plan/spec/report files. Do not revert unrelated user changes.

- [ ] **Step 2: Read the approved design scope**

Open:

```text
docs/superpowers/specs/2026-09-24-t3-03-frontend-notification-verification-design.md
```

Confirm the executor understands these boundaries:

```text
Default scope: QA/verification only.
No notification UX expansion.
No realtime subscription work.
Essay-graded verifies course-level deep link only.
Attempt-level focus is a future enhancement if needed.
```

- [ ] **Step 3: Confirm package commands**

Open `AGENTS.md` and `package.json`, then confirm these commands are available from `onlinestudyplatform-fe/`:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Expected:

```text
The repo has no frontend test script. Use lint, typecheck, build, and manual/integration QA evidence.
```

---

### Task 2: Create The QA Report Skeleton

**Related skills:** Use `executing-plans` or `subagent-driven-development` for task execution. Use `verification-before-completion` before marking the report complete.

**Files:**
- Create: `docs/superpowers/reports/2026-09-24-t3-03-frontend-notification-qa.md`

- [ ] **Step 1: Verify the report directory parent exists**

Run from `onlinestudyplatform-fe/`:

```bash
Test-Path -LiteralPath "docs/superpowers"
```

Expected:

```text
True
```

- [ ] **Step 2: Create the report file**

Create `docs/superpowers/reports/2026-09-24-t3-03-frontend-notification-qa.md` with this content:

```markdown
# T3-03 Frontend Notification QA Report

## Scope

T3-03 frontend verification confirms that the existing notification center works with backend business-event notifications. This report does not request notification UX expansion unless a blocking defect prevents the approved T3-03 behavior.

## Environment

| Item | Value |
| --- | --- |
| FE branch | feat/t3-03 |
| BE branch | feat/t3-03 |
| FE base URL | Pending execution |
| BE base URL | Pending execution |
| QA date | 2026-09-24 |

## Notification Contract

Expected fields: `id`, `type`, `title`, `message`, `metadata`, `actionUrl`, `sentAt`, `seen`.

| Check | Result | Evidence |
| --- | --- | --- |
| API shape unchanged | Pending execution | Pending execution |
| `type` is `direct` or `queue` | Pending execution | Pending execution |
| `metadata` remains an object | Pending execution | Pending execution |
| `actionUrl` is string or null | Pending execution | Pending execution |

## Event Destination Matrix

| Event | Recipient boundary | Expected destination | Result | Evidence |
| --- | --- | --- | --- | --- |
| `essay-submitted` | Instructor receives notification | `/instructor/essay-grading` | Pending execution | Pending execution |
| `essay-graded` | Learner receives notification | `/learner/courses/:courseId/learn` | Pending execution | Pending execution |
| `withdraw-submitted` | All admins receive notification | `/admin/withdrawals` | Pending execution | Pending execution |
| `withdraw-status` | Relevant instructor receives notification | `/instructor/withdrawals` | Pending execution | Pending execution |

## Essay-Graded Course-Level Deep Link

| Check | Result | Evidence |
| --- | --- | --- |
| `actionUrl` includes the expected course id | Pending execution | Pending execution |
| Clicking the notification loads `/learner/courses/:courseId/learn` | Pending execution | Pending execution |
| The loaded learning page is for the correct course | Pending execution | Pending execution |
| The page provides enough context for the learner to understand the graded notification | Pending execution | Pending execution |

## Common Notification Behavior

| Check | Result | Evidence |
| --- | --- | --- |
| Unread count loads | Pending execution | Pending execution |
| Popover list loads paginated notifications | Pending execution | Pending execution |
| Clicking an unread notification marks it seen before navigation | Pending execution | Pending execution |
| Mark-all remains functional | Pending execution | Pending execution |
| Failed mark-seen mutation does not corrupt local state | Pending execution | Pending execution |
| Failed mark-all mutation does not corrupt local state | Pending execution | Pending execution |

## Future Enhancements

Record attempt-level or quiz-level focusing needs here only if course-level deep linking passes but the learner lacks enough context.

| Enhancement | Reason | Triggering evidence |
| --- | --- | --- |
| None recorded | Pending execution | Pending execution |

## Final Decision

Pending execution.
```

- [ ] **Step 3: Confirm the report file exists**

Run from `onlinestudyplatform-fe/`:

```bash
Test-Path -LiteralPath "docs/superpowers/reports/2026-09-24-t3-03-frontend-notification-qa.md"
```

Expected:

```text
True
```

---

### Task 3: Verify Static Frontend Contract And Route Coverage

**Related skills:** Use `nextjs` before editing Next.js files if a defect requires a code change. Use `systematic-debugging` if observed behavior contradicts the code or spec.

**Files:**
- Read: `services/api/notifications.ts`
- Read: `hooks/useNotifications.ts`
- Read: `components/notifications/notification-popover.tsx`
- Read: `app/(instructor)/instructor/essay-grading/page.tsx`
- Read: `app/(learning)/learner/courses/[courseId]/learn/page.tsx`
- Read: `app/(admin)/admin/withdrawals/page.tsx`
- Read: `app/(instructor)/instructor/withdrawals/page.tsx`
- Modify: `docs/superpowers/reports/2026-09-24-t3-03-frontend-notification-qa.md`

- [ ] **Step 1: Confirm the notification contract**

Read `services/api/notifications.ts` and confirm `NotificationItem` contains exactly these required properties:

```ts
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
```

Expected:

```text
The FE contract matches the T3-02/T3-03 contract and does not rename fields to content/time/isRead.
```

- [ ] **Step 2: Confirm notification hooks preserve list/count/mutation behavior**

Read `hooks/useNotifications.ts` and confirm these calls remain wired:

```text
useNotificationsList -> listMyNotifications({ page, limit: 10 })
useUnreadNotificationCount -> countUnreadNotifications
useMarkNotificationSeen -> markNotificationSeen and invalidates list + unread count
useMarkAllNotificationsSeen -> markAllNotificationsSeen and invalidates list + unread count
```

Expected:

```text
The hooks support unread count, paginated popover list, mark-one, and mark-all behavior.
```

- [ ] **Step 3: Confirm popover navigation behavior**

Read `components/notifications/notification-popover.tsx` and confirm `handleOpenNotification` marks unseen notifications first, then navigates to `notification.actionUrl`:

```ts
async function handleOpenNotification(notification: NotificationItem) {
  if (!notification.seen) {
    await markSeen(notification.id);
  }

  if (notification.actionUrl) {
    router.push(notification.actionUrl);
  }
}
```

Expected:

```text
Unread click marks seen before route navigation.
```

- [ ] **Step 4: Confirm destination routes exist**

Verify these files exist:

```text
app/(instructor)/instructor/essay-grading/page.tsx
app/(learning)/learner/courses/[courseId]/learn/page.tsx
app/(admin)/admin/withdrawals/page.tsx
app/(instructor)/instructor/withdrawals/page.tsx
```

Expected:

```text
All T3-03 event destinations are implemented routes.
```

- [ ] **Step 5: Update the report with static findings**

In `docs/superpowers/reports/2026-09-24-t3-03-frontend-notification-qa.md`, replace the relevant `Pending execution` cells with concise evidence such as:

```text
Pass: NotificationItem in services/api/notifications.ts exposes id/type/title/message/metadata/actionUrl/sentAt/seen.
Pass: notification-popover.tsx awaits markSeen before router.push(actionUrl).
Pass: all four destination route files exist.
```

Expected:

```text
The report records static FE contract and route coverage evidence.
```

---

### Task 4: Verify Event Payloads And Recipient Boundaries

**Related skills:** Use `systematic-debugging` if an event is missing, duplicated, sent to the wrong user, or carries the wrong `actionUrl`. Use `verification-before-completion` before marking backend-event verification complete.

**Files:**
- Modify: `docs/superpowers/reports/2026-09-24-t3-03-frontend-notification-qa.md`

- [ ] **Step 1: Start the backend and frontend in the normal local environment**

Use the project-local setup already used for this repo. From `online-study-platform-be/`, run the backend with reachable database/cache/object-store dependencies. From `onlinestudyplatform-fe/`, run:

```bash
pnpm dev
```

Expected:

```text
FE is reachable in the browser and can call the backend through NEXT_PUBLIC_API_URL.
```

- [ ] **Step 2: Trigger `essay-submitted`**

As a learner, submit a quiz attempt that has at least one essay answer requiring manual grading.

Expected notification evidence:

```text
Recipient: instructor for the course.
Event: essay-submitted.
actionUrl: /instructor/essay-grading.
Non-recipient learner does not receive the instructor notification.
```

- [ ] **Step 3: Trigger `essay-graded`**

As the instructor, grade the final pending essay for the learner attempt.

Expected notification evidence:

```text
Recipient: learner who submitted the attempt.
Event: essay-graded.
actionUrl: /learner/courses/<courseId>/learn.
Non-recipient instructor does not receive the learner notification.
```

- [ ] **Step 4: Trigger `withdraw-submitted`**

As an instructor, create a withdrawal request.

Expected notification evidence:

```text
Recipient: every admin user.
Event: withdraw-submitted.
actionUrl: /admin/withdrawals.
The requesting instructor does not receive the admin notification.
```

- [ ] **Step 5: Trigger `withdraw-status`**

As an admin, reject, process, or mark processed for the withdrawal request.

Expected notification evidence:

```text
Recipient: instructor who owns the withdrawal request.
Event: withdraw-status.
actionUrl: /instructor/withdrawals.
Unrelated instructors do not receive the notification.
```

- [ ] **Step 6: Update the event destination matrix in the report**

For each event row, replace `Pending execution` with one of these exact result values:

```text
Pass
Fail
Blocked
```

Use the Evidence column to record:

```text
Observed recipient role/user.
Observed actionUrl.
Observed clicked destination.
Any user who incorrectly received or did not receive the notification.
```

Expected:

```text
The report contains recipient-boundary and actionUrl evidence for all four T3-03 events.
```

---

### Task 5: Verify Essay-Graded Course-Level Deep Link

**Related skills:** Use `systematic-debugging` if the URL has the wrong course id or the learning page loads a different course. Use `nextjs` before making any code change. Use `nuqs` only if a future enhancement introduces query-state handling; do not use it for T3-03 verification-only work.

**Files:**
- Read: `app/(learning)/learner/courses/[courseId]/learn/page.tsx`
- Read: `app/(learning)/learner/courses/[courseId]/learn/learning-player-client.tsx`
- Modify: `docs/superpowers/reports/2026-09-24-t3-03-frontend-notification-qa.md`

- [ ] **Step 1: Capture the graded attempt's course id**

From the grading workflow or notification payload, record the course id used in the `essay-graded` notification.

Expected evidence format:

```text
Course id from event: <actual-course-id>
Observed actionUrl: /learner/courses/<actual-course-id>/learn
```

- [ ] **Step 2: Click the learner notification**

As the learner recipient, open the notification popover and click the `essay-graded` notification.

Expected:

```text
Browser navigates to /learner/courses/<actual-course-id>/learn.
The learning player loads the same course represented by <actual-course-id>.
```

- [ ] **Step 3: Decide whether context is sufficient**

On the loaded learning page, determine whether a learner can understand why they arrived there after receiving a graded-essay notification.

Use this decision rule:

```text
If the correct course loads and the page provides enough course/lesson/quiz context, record Pass.
If the correct course loads but there is no clear quiz/attempt context, record Pass for T3-03 and add a future enhancement row.
If the wrong course loads or the page cannot load, record Fail.
```

- [ ] **Step 4: Update the essay-graded section of the report**

Update these rows:

```text
actionUrl includes the expected course id
Clicking the notification loads /learner/courses/:courseId/learn
The loaded learning page is for the correct course
The page provides enough context for the learner to understand the graded notification
```

If context is insufficient but course-level navigation works, add this future enhancement row:

```markdown
| Add essay-graded attempt or quiz focus with `?attemptId=...` / `?quizId=...` | The course-level page loads correctly, but the learner may not immediately know which quiz attempt was graded. | T3-03 essay-graded QA |
```

Expected:

```text
T3-03 remains passed when the correct course loads, even if attempt-level focus is recorded for later.
```

---

### Task 6: Verify Common Notification Behavior

**Related skills:** Use `systematic-debugging` for unexpected unread-count, pagination, navigation, or mutation-state behavior. Use `verification-before-completion` before marking QA complete.

**Files:**
- Modify: `docs/superpowers/reports/2026-09-24-t3-03-frontend-notification-qa.md`

- [ ] **Step 1: Verify unread count**

Log in as a user with at least one unread notification.

Expected:

```text
The bell badge displays the unread count.
If count is greater than 9, the badge displays 9+.
```

- [ ] **Step 2: Verify popover list and pagination**

Open the notification popover. If the user has more than 10 notifications, scroll to the bottom.

Expected:

```text
The first page loads.
The list shows title, message, and sentAt.
Scrolling loads the next page when hasNextPage is true.
```

- [ ] **Step 3: Verify unread click marks seen before navigation**

Click an unread notification with an `actionUrl`.

Expected:

```text
The notification is marked seen.
The unread count decreases after query invalidation.
The browser navigates to the notification actionUrl.
```

- [ ] **Step 4: Verify mark-all**

Open the popover as a user with multiple unread notifications and click the mark-all button.

Expected:

```text
All currently unread notifications become seen after query invalidation.
Unread count becomes 0.
No route navigation occurs.
```

- [ ] **Step 5: Verify failed mutation state does not corrupt local state**

Use browser devtools network blocking, backend shutdown, or an expired session to force one mark-seen or mark-all request to fail.

Expected:

```text
The local notification list does not falsely persist a seen state after a failed mark-seen request.
The local unread count does not falsely persist as 0 after a failed mark-all request.
The user can retry after the backend/network recovers.
```

- [ ] **Step 6: Update the common behavior section of the report**

For each common behavior row, record:

```text
Result: Pass, Fail, or Blocked.
Evidence: role used, notification id or event, observed UI/API behavior.
```

Expected:

```text
The report documents all common notification behavior checks.
```

---

### Task 7: Run Frontend Verification Commands

**Related skills:** Use `verification-before-completion` before claiming checks pass. Use `systematic-debugging` if any command fails.

**Files:**
- Modify: `docs/superpowers/reports/2026-09-24-t3-03-frontend-notification-qa.md`

- [ ] **Step 1: Run lint**

Run from `onlinestudyplatform-fe/`:

```bash
pnpm lint
```

Expected:

```text
Command exits 0.
```

- [ ] **Step 2: Run typecheck**

Run from `onlinestudyplatform-fe/`:

```bash
pnpm exec tsc --noEmit
```

Expected:

```text
Command exits 0.
```

- [ ] **Step 3: Run production build**

Run from `onlinestudyplatform-fe/`:

```bash
pnpm build
```

Expected:

```text
Command exits 0.
```

- [ ] **Step 4: Record command results in the report**

Append this section to `docs/superpowers/reports/2026-09-24-t3-03-frontend-notification-qa.md` and replace each result with the observed exit status and summary:

```markdown
## Frontend Commands

| Command | Result | Evidence |
| --- | --- | --- |
| `pnpm lint` | Pending execution | Pending execution |
| `pnpm exec tsc --noEmit` | Pending execution | Pending execution |
| `pnpm build` | Pending execution | Pending execution |
```

Expected:

```text
The report contains reproducible command evidence.
```

---

### Task 8: Finalize QA Decision And Handoff

**Related skills:** Use `verification-before-completion` before claiming T3-03 frontend verification is complete. Use `finishing-a-development-branch` only after implementation and verification are complete and the user asks how to integrate the branch.

**Files:**
- Modify: `docs/superpowers/reports/2026-09-24-t3-03-frontend-notification-qa.md`
- Read: `docs/superpowers/reports/2026-09-24-t3-03-frontend-notification-qa.md`

- [ ] **Step 1: Set the final decision**

At the bottom of the report, replace `Pending execution.` under `## Final Decision` with exactly one of these outcomes:

```text
Pass: T3-03 frontend verification passed with no product code changes required.
Fail: T3-03 frontend verification found blocking issues that must be fixed before completion.
Blocked: T3-03 frontend verification could not complete because required runtime data or services were unavailable.
```

- [ ] **Step 2: If failing, classify each issue**

For each failing item, add a short issue list under `## Final Decision` using this format:

```markdown
- Blocking defect: <specific observed behavior>. Required before T3-03 completion because <reason>.
- Follow-up enhancement: <specific observed behavior>. Not required for T3-03 because course-level behavior passed.
```

Only classify attempt-level `essay-graded` focusing as a follow-up enhancement when the correct course-level deep link works.

- [ ] **Step 3: Review the report for unresolved pending cells**

Search the report for:

```text
Pending execution
```

Expected:

```text
No `Pending execution` remains after QA is complete.
```

- [ ] **Step 4: Check final git status**

Run from `onlinestudyplatform-fe/`:

```bash
git status --short
```

Expected:

```text
Only intended T3-03 frontend docs/report files are modified or untracked unless the user made unrelated changes.
```

- [ ] **Step 5: Report results to the user**

Summarize:

```text
QA final decision.
Commands run and result.
Each event destination result.
Essay-graded course-level deep-link result.
Any blocking defects.
Any follow-up enhancements.
```

Expected:

```text
The user can decide whether T3-03 frontend is complete, needs fixes, or is blocked by runtime setup.
```

---

## Self-Review

- Spec coverage: Covered verification-only scope, event destination matrix, actor/recipient boundaries, common notification behavior, essay-graded course-level deep link, and future enhancement boundary.
- Placeholder scan: The plan contains `Pending execution` only inside the QA report skeleton as an initial state that execution steps explicitly replace. There are no unresolved plan instructions such as TBD or TODO.
- Type consistency: Notification fields match `NotificationItem`; event names and URLs match the approved design spec.
