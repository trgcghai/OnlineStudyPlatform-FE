# T1-09 Frontend Enrollment Design

## Goal

Implement the frontend for T1-09 so Learners can enroll from public course detail, authenticated course detail shows enrolled state from backend `isEnrolled`, and Learners can view their enrolled courses with progress.

## Sources

- Task: `ba/tasks/phase-1-lms-core/T1-09-enrollment.md`
- Backend implementation: `online-study-platform-be` branch `feat/t1-09`
- Frontend context: `app/(public)/courses/[courseId]/course-detail-client.tsx`, `services/api/public-courses.ts`, `hooks/usePublicCourses.ts`, `lib/query-keys.ts`, `app/(learner)/layout.tsx`

## Current Context

The public course detail page is client-rendered and already fetches `GET /courses/public/:id` through `usePublishedCourse`. The shared `axiosClient` attaches the persisted bearer token when a user is authenticated, so the backend can return `isEnrolled` for authenticated Learners without a separate FE status request.

The current detail page still shows placeholder registration/sign-in CTAs that say enrollment is not open. There is a Learner route group and guarded learner layout, but there is no `/learner/courses` page yet.

## Chosen Approach

Use backend `isEnrolled` on public course detail plus a dedicated enrollment mutation.

This keeps FE state simple:

- `GET /courses/public/:id` remains the course detail query.
- `PublicCourse.isEnrolled?: boolean` is optional because anonymous backend responses omit it.
- `POST /courses/:courseId/enrollments` is called only by authenticated Learners.
- `GET /enrollments/me` powers the Learner My Courses page.

After a successful enrollment, the frontend redirects immediately to `/learner/courses/:courseId/learn`, matching UC14. T1-10 owns the actual learning player page; T1-09 only wires the link target.

## Course Detail Behavior

Modify `app/(public)/courses/[courseId]/course-detail-client.tsx`.

CTA rules:

- Anonymous user: show `Tạo tài khoản` and `Đăng nhập` links.
- Authenticated Learner with `course.isEnrolled === true`: show `Tiếp tục học`, linking to `/learner/courses/${course.id}/learn`.
- Authenticated Learner with `course.isEnrolled !== true`: show `Đăng ký khóa học` button.
- Authenticated Admin or Instructor: show a short Vietnamese message that enrollment is only available for learner accounts.

Enrollment button behavior:

- Disable while mutation is pending.
- On success, show success toast and redirect to `/learner/courses/${course.id}/learn`.
- On duplicate conflict, show `Bạn đã đăng ký khóa học này` and still treat the next action as continue learning if backend/frontend state is refreshed.
- On published-only or missing course errors, show a friendly Vietnamese error.
- On network errors, show the existing network error message constant.

## API Layer

Create `services/api/enrollments.ts`.

Types:

- `EnrollmentCourseInstructor`
- `EnrollmentCourse`
- `Enrollment`

Functions:

- `enrollInCourse(courseId: string): Promise<Enrollment>` calls `POST /courses/:courseId/enrollments`.
- `listMyEnrollments(): Promise<Enrollment[]>` calls `GET /enrollments/me`.

Update `services/api/public-courses.ts`:

- Add `isEnrolled?: boolean` to `PublicCourse`.

## Query Hooks

Update `lib/query-keys.ts`:

- Add `enrollmentKeys.all`.
- Add `enrollmentKeys.mine()`.

Create `hooks/useEnrollments.ts`:

- `useMyEnrollments()` fetches `listMyEnrollments()`.
- `useEnrollInCourse()` mutates `enrollInCourse(courseId)`.
- On enrollment success, invalidate `enrollmentKeys.mine()` and `publicCourseKeys.detail(courseId)`.
- Map backend errors to Vietnamese strings using existing `isAxiosError`, `isApiErrorResponse`, `GENERIC_ERROR_MESSAGE`, and `NETWORK_ERROR_MESSAGE` patterns.

## My Courses Page

Create `app/(learner)/learner/courses/page.tsx`.

The page is inside the Learner route group, so `app/(learner)/layout.tsx` already wraps it with `AuthGuard` for Learner role.

Page states:

- Loading: render skeleton cards.
- Error: render a friendly error block.
- Empty: show `Bạn chưa đăng ký khóa học nào.` and link to `/courses`.
- Loaded: render each enrollment with course thumbnail or fallback icon, title, category, instructor name, progress percentage, enrollment date, and `Tiếp tục học` link.

Progress display:

- Backend returns decimal progress as a string, for example `0.00`.
- Convert with `Number(enrollment.progress)` for display only.
- Show percentage with at most two decimals and a visual progress bar.

## Learner Navigation

Modify `app/(learner)/layout.tsx`:

- Add a nav link to `/learner/courses` labelled `Khóa học của tôi`.
- Keep existing `Hồ sơ`, notifications, and logout actions.

## Files To Touch

- Create: `services/api/enrollments.ts`
- Create: `hooks/useEnrollments.ts`
- Create: `app/(learner)/learner/courses/page.tsx`
- Modify: `services/api/public-courses.ts`
- Modify: `lib/query-keys.ts`
- Modify: `app/(public)/courses/[courseId]/course-detail-client.tsx`
- Modify: `app/(learner)/layout.tsx`

## Verification

Before implementation, read relevant local Next 16 docs from `node_modules/next/dist/docs/` because the FE repo requires it before writing Next.js code.

Run from `onlinestudyplatform-fe`:

```bash
pnpm lint
pnpm build
```

No frontend test framework is configured, so do not invent test commands.

Manual smoke flow:

- Anonymous user opens `/courses/:courseId` and sees sign-in/register CTAs.
- Learner opens `/courses/:courseId` before enrollment and sees `Đăng ký khóa học`.
- Learner clicks enroll and is redirected to `/learner/courses/:courseId/learn`.
- Learner revisits `/courses/:courseId` and sees `Tiếp tục học`.
- Learner opens `/learner/courses` and sees the enrolled course with progress `0.00%`.
- Instructor/Admin opens `/courses/:courseId` and does not see the enrollment button.

## Out Of Scope

- Learning player implementation at `/learner/courses/:courseId/learn`.
- Lesson progress tracking.
- Course completion and certificates.
- Enrollment cancellation.
- Frontend automated tests, because no test framework is installed.
