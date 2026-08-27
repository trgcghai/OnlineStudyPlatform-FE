# T1-09 Frontend Enrollment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Each task lists additional related skills to load before editing that task.

**Goal:** Build the frontend enrollment flow so Learners can enroll from public course detail, continue into the future learning route, and view enrolled courses with progress.

**Architecture:** Keep backend calls in `services/api`, TanStack Query hooks in `hooks`, route UI in `app`, and query keys in `lib/query-keys.ts`. Course detail uses backend `isEnrolled` from the existing public detail request and a single enrollment mutation.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript strict mode, TanStack Query, Redux auth state, Tailwind CSS v4, shared `axiosClient`, Base UI/shadcn-style local components.

---

## Required Context

- Approved spec: `docs/superpowers/specs/2026-08-27-t1-09-frontend-enrollment-design.md`
- Repo rules: `AGENTS.md`
- Local Next 16 docs read before planning: `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`, `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`, `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md`
- Do not use npm, yarn, or bun. Use `pnpm` only.
- Do not add frontend unit test commands because this repo has no test script or frontend test framework.
- Do not commit unless the user explicitly asks.

## File Structure

- `services/api/enrollments.ts`: typed enrollment API functions and response interfaces.
- `hooks/useEnrollments.ts`: TanStack Query hooks, mutation wrapper, cache invalidation, and Vietnamese error mapping.
- `services/api/public-courses.ts`: add optional `isEnrolled` to `PublicCourse`.
- `lib/query-keys.ts`: add stable enrollment query keys.
- `app/(public)/courses/[courseId]/course-detail-client.tsx`: replace the current CTA with auth-aware enrollment and continue-learning actions.
- `app/(learner)/learner/courses/page.tsx`: Learner My Courses page using `GET /enrollments/me`.
- `app/(learner)/layout.tsx`: add `Khóa học của tôi` navigation and loosen main layout centering so list pages render naturally.

---

### Task 1: Enrollment API Types And Query Keys

**Related skills:** `test-driven-development`, `vercel-react-best-practices`

**Files:**
- Create: `services/api/enrollments.ts`
- Modify: `services/api/public-courses.ts`
- Modify: `lib/query-keys.ts`

- [ ] **Step 1: Record the FE testing constraint**

Use the repo rule from `AGENTS.md`: there is no frontend test script or test framework. For this implementation, use typecheck, lint, build, and manual smoke checks as the verification path.

- [ ] **Step 2: Add optional enrollment state to public course type**

In `services/api/public-courses.ts`, update `PublicCourse`:

```ts
export interface PublicCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string | null;
  instructorId: string;
  instructor?: PublicCourseInstructorSummary;
  isEnrolled?: boolean;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 3: Add enrollment query keys**

In `lib/query-keys.ts`, append after `publicCourseKeys`:

```ts
export const enrollmentKeys = {
  all: ["enrollments"] as const,
  mine: () => [...enrollmentKeys.all, "mine"] as const,
};
```

- [ ] **Step 4: Create typed enrollment API module**

Create `services/api/enrollments.ts`:

```ts
import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export interface EnrollmentCourseInstructor {
  id: string;
  name: string;
}

export interface EnrollmentCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string | null;
  instructorId: string;
  instructor?: EnrollmentCourseInstructor;
}

export interface Enrollment {
  id: string;
  learnerId: string;
  courseId: string;
  progress: string;
  completedAt: string | null;
  enrolledAt: string;
  course?: EnrollmentCourse;
}

export async function enrollInCourse(courseId: string): Promise<Enrollment> {
  const { data } = await axiosClient.post<ApiSuccessResponse<Enrollment>>(
    `/courses/${courseId}/enrollments`,
  );

  return data.data;
}

export async function listMyEnrollments(): Promise<Enrollment[]> {
  const { data } = await axiosClient.get<ApiSuccessResponse<Enrollment[]>>(
    "/enrollments/me",
  );

  return data.data;
}
```

- [ ] **Step 5: Verify Task 1 types**

Run: `pnpm exec tsc --noEmit`

Expected: TypeScript completes with no errors from the new enrollment API module or query key exports.

---

### Task 2: Enrollment Query Hooks

**Related skills:** `test-driven-development`, `vercel-react-best-practices`, `systematic-debugging`

**Files:**
- Create: `hooks/useEnrollments.ts`

- [ ] **Step 1: Create hook with error mapping and cache invalidation**

Create `hooks/useEnrollments.ts`:

```ts
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { GENERIC_ERROR_MESSAGE, NETWORK_ERROR_MESSAGE } from "@/constants/constants";
import { enrollmentKeys, publicCourseKeys } from "@/lib/query-keys";
import {
  enrollInCourse,
  listMyEnrollments,
  type Enrollment,
} from "@/services/api/enrollments";
import { isApiErrorResponse } from "@/services/axios";

export interface EnrollmentMutationResult {
  ok: boolean;
  data?: Enrollment;
  message?: string;
  alreadyEnrolled?: boolean;
}

export function mapEnrollmentError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return GENERIC_ERROR_MESSAGE;
  }

  if (status === 400) return data.error.message || "Khóa học chưa thể đăng ký.";
  if (status === 401) return "Vui lòng đăng nhập để đăng ký khóa học.";
  if (status === 403) return "Chỉ tài khoản học viên mới có thể đăng ký khóa học.";
  if (status === 404) return "Khóa học không tồn tại hoặc chưa được xuất bản.";
  if (status === 409) return "Bạn đã đăng ký khóa học này.";

  return data.error.message || GENERIC_ERROR_MESSAGE;
}

function isAlreadyEnrolledError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 409;
}

export function useMyEnrollments() {
  return useQuery({
    queryKey: enrollmentKeys.mine(),
    queryFn: listMyEnrollments,
  });
}

export function useEnrollInCourse() {
  const queryClient = useQueryClient();
  const mutation = useMutation<Enrollment, unknown, string>({
    mutationFn: enrollInCourse,
    onSuccess: async (enrollment) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: enrollmentKeys.mine() }),
        queryClient.invalidateQueries({
          queryKey: publicCourseKeys.detail(enrollment.courseId),
        }),
      ]);
      toast.add({ title: "Đã đăng ký khóa học.", type: "success" });
    },
  });

  async function enroll(courseId: string): Promise<EnrollmentMutationResult> {
    try {
      const enrollment = await mutation.mutateAsync(courseId);
      return { ok: true, data: enrollment };
    } catch (error) {
      return {
        ok: false,
        message: mapEnrollmentError(error),
        alreadyEnrolled: isAlreadyEnrolledError(error),
      };
    }
  }

  return { enroll, isPending: mutation.isPending, pendingCourseId: mutation.variables };
}
```

- [ ] **Step 2: Verify hook module compiles**

Run: `pnpm exec tsc --noEmit`

Expected: TypeScript completes with no errors from `hooks/useEnrollments.ts`.

---

### Task 3: Course Detail Enrollment CTA

**Related skills:** `frontend-design`, `vercel-react-best-practices`, `nextjs`, `test-driven-development`

**Files:**
- Modify: `app/(public)/courses/[courseId]/course-detail-client.tsx`

- [ ] **Step 1: Add imports for auth, router, button, toast, and enrollment hook**

At the top of `course-detail-client.tsx`, adjust imports to include:

```ts
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useAppSelector } from "@/lib/hooks";
import { selectIsAuthenticated, selectUserRole } from "@/lib/features/authSlice";
import { USER_ROLES } from "@/services/api/users";
import { useEnrollInCourse } from "@/hooks/useEnrollments";
```

Replace the existing `buttonVariants`-only import from `@/components/ui/button`.

- [ ] **Step 2: Add derived auth/enrollment values inside the component**

Inside `CourseDetailClient`, after `const course = courseQuery.data;`, add:

```ts
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const userRole = useAppSelector(selectUserRole);
  const { enroll, isPending } = useEnrollInCourse();
  const isLearner = userRole === USER_ROLES.LEARNER;
  const learnHref = course ? `/learner/courses/${course.id}/learn` : "/learner/courses";
```

- [ ] **Step 3: Add enrollment click handler**

Add the handler before the first `if` return:

```ts
  async function handleEnroll() {
    if (!course) return;

    const result = await enroll(course.id);

    if (result.ok || result.alreadyEnrolled) {
      if (result.alreadyEnrolled && result.message) {
        toast.add({ title: result.message, type: "info" });
      }
      router.push(`/learner/courses/${course.id}/learn`);
      return;
    }

    toast.add({
      title: result.message ?? "Không thể đăng ký khóa học.",
      type: "error",
    });
  }
```

- [ ] **Step 4: Replace current CTA block**

Replace lines that currently render the enrollment-unavailable paragraph and register/sign-in links with this branch-based CTA:

```tsx
          <h2 className="text-xl font-semibold">Sẵn sàng bắt đầu?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ghi danh để lưu khóa học vào lộ trình học tập và theo dõi tiến độ của bạn.
          </p>
          <div className="mt-5 grid gap-3">
            {!isAuthenticated ? (
              <>
                <Link href="/register" className={buttonVariants({ size: "lg" })}>
                  Tạo tài khoản
                </Link>
                <Link
                  href="/signin"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  Đăng nhập
                </Link>
              </>
            ) : isLearner && course.isEnrolled ? (
              <Link href={learnHref} className={buttonVariants({ size: "lg" })}>
                Tiếp tục học
              </Link>
            ) : isLearner ? (
              <Button type="button" size="lg" onClick={handleEnroll} disabled={isPending}>
                {isPending ? "Đang đăng ký..." : "Đăng ký khóa học"}
              </Button>
            ) : (
              <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                Chỉ tài khoản học viên mới có thể đăng ký khóa học này.
              </div>
            )}
          </div>
```

- [ ] **Step 5: Verify course detail compiles**

Run: `pnpm exec tsc --noEmit`

Expected: TypeScript completes with no errors. `components/ui/toast.tsx` supports `type: "info"`, so keep the duplicate-enrollment toast as `info`.

---

### Task 4: Learner My Courses Page

**Related skills:** `frontend-design`, `vercel-react-best-practices`, `nextjs`, `test-driven-development`

**Files:**
- Create: `app/(learner)/learner/courses/page.tsx`

- [ ] **Step 1: Create client page shell**

Create `app/(learner)/learner/courses/page.tsx` with a client component because it uses TanStack Query:

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, CalendarDays, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyEnrollments } from "@/hooks/useEnrollments";
import type { Enrollment } from "@/services/api/enrollments";
import { formatDate } from "@/utils/dateTimeUtil";

function formatProgress(progress: string): string {
  const value = Number(progress);
  if (!Number.isFinite(value)) return "0%";

  return `${Math.min(Math.max(value, 0), 100).toLocaleString("vi-VN", {
    maximumFractionDigits: 2,
  })}%`;
}

function getProgressValue(progress: string): number {
  const value = Number(progress);
  if (!Number.isFinite(value)) return 0;

  return Math.min(Math.max(value, 0), 100);
}

function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  const course = enrollment.course;
  const progressValue = getProgressValue(enrollment.progress);
  const progressLabel = formatProgress(enrollment.progress);
  const learnHref = `/learner/courses/${enrollment.courseId}/learn`;

  return (
    <article className="grid gap-5 rounded-3xl border bg-card p-5 shadow-sm md:grid-cols-[220px_1fr]">
      <div className="overflow-hidden rounded-2xl bg-muted">
        {course?.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            className="aspect-video h-full w-full object-cover"
            width={440}
            height={248}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center bg-linear-to-br from-primary/15 via-muted to-secondary/20">
            <BookOpen className="size-10 text-primary" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="space-y-3">
          <Badge variant="secondary" className="w-fit">
            {course?.category ?? "Khóa học"}
          </Badge>
          <div>
            <h2 className="line-clamp-2 text-2xl font-semibold tracking-tight">
              {course?.title ?? "Khóa học đang cập nhật"}
            </h2>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <GraduationCap className="size-4" aria-hidden="true" />
                {course?.instructor?.name ?? "Giảng viên đang cập nhật"}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4" aria-hidden="true" />
                Đăng ký {formatDate(enrollment.enrolledAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Tiến độ</span>
            <span className="text-muted-foreground">{progressLabel}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
        <div>
          <Link href={learnHref} className={buttonVariants()}>
            Tiếp tục học
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function LearnerCoursesPage() {
  const enrollmentsQuery = useMyEnrollments();
  const enrollments = enrollmentsQuery.data ?? [];

  if (enrollmentsQuery.isLoading) {
    return (
      <div className="w-full max-w-6xl space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">Lộ trình học tập</p>
          <h1 className="text-3xl font-bold tracking-tight">Khóa học của tôi</h1>
        </div>
        <div className="grid gap-4">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (enrollmentsQuery.isError) {
    return (
      <div className="w-full max-w-3xl rounded-3xl border bg-card p-8 text-center shadow-sm">
        <BookOpen className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-semibold">Không tải được khóa học</h1>
        <p className="mt-2 text-muted-foreground">
          Vui lòng thử lại sau hoặc đăng nhập lại nếu phiên làm việc đã hết hạn.
        </p>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="w-full max-w-3xl rounded-3xl border bg-card p-8 text-center shadow-sm">
        <BookOpen className="mx-auto size-10 text-primary" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-semibold">Bạn chưa đăng ký khóa học nào.</h1>
        <p className="mt-2 text-muted-foreground">
          Khám phá danh sách khóa học đã xuất bản và bắt đầu lộ trình đầu tiên của bạn.
        </p>
        <Link href="/courses" className={buttonVariants({ className: "mt-6" })}>
          Khám phá khóa học
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Lộ trình học tập</p>
        <h1 className="text-3xl font-bold tracking-tight">Khóa học của tôi</h1>
        <p className="mt-2 text-muted-foreground">
          Theo dõi tiến độ và tiếp tục các khóa học bạn đã đăng ký.
        </p>
      </div>
      <div className="grid gap-4">
        {enrollments.map((enrollment) => (
          <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify My Courses page compiles**

Run: `pnpm exec tsc --noEmit`

Expected: TypeScript completes with no route or component errors.

---

### Task 5: Learner Navigation Layout

**Related skills:** `frontend-design`, `vercel-react-best-practices`, `nextjs`

**Files:**
- Modify: `app/(learner)/layout.tsx`

- [ ] **Step 1: Add courses nav link and layout-friendly main classes**

Change `app/(learner)/layout.tsx` to include a My Courses link and allow full-width pages:

```tsx
import Link from "next/link";
import { AuthGuard } from "@/components/auth/auth-guard";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationPopover } from "@/components/notifications/notification-popover";
import { USER_ROLES } from "@/services/api/users";
import { BookOpen, CircleUserRound, GraduationCap } from "lucide-react";

const LEARNER_ROLES = [USER_ROLES.LEARNER] as const;

export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={LEARNER_ROLES}>
      <div className="flex min-h-full flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <GraduationCap className="size-4 text-muted-foreground" aria-hidden="true" />
            Người học
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/learner/courses"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <BookOpen className="size-4" aria-hidden="true" />
              Khóa học của tôi
            </Link>
            <NotificationPopover />
            <Link
              href="/profile"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <CircleUserRound className="size-4" aria-hidden="true" />
              Hồ sơ
            </Link>
            <LogoutButton />
          </div>
        </header>
        <main className="flex flex-1 justify-center p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
```

- [ ] **Step 2: Verify learner layout compiles**

Run: `pnpm exec tsc --noEmit`

Expected: TypeScript completes with no layout errors.

---

### Task 6: Full Verification And Manual Smoke Checks

**Related skills:** `verification-before-completion`, `systematic-debugging`, `requesting-code-review`

**Files:**
- Verify all files touched in Tasks 1-5.

- [ ] **Step 1: Run lint**

Run: `pnpm lint`

Expected: ESLint completes without errors. If formatting or lint rules flag class ordering, imports, or unsupported toast type, fix the smallest affected code and rerun.

- [ ] **Step 2: Run production build**

Run: `pnpm build`

Expected: Next.js production build and typecheck complete successfully.

- [ ] **Step 3: Smoke check anonymous public course detail**

Run: `pnpm dev`

Manual check: open `/courses/:courseId` in a logged-out browser session.

Expected: page shows `Tạo tài khoản` and `Đăng nhập`, not `Đăng ký khóa học`.

- [ ] **Step 4: Smoke check Learner enrollment**

With backend running and a published course available, sign in as a Learner and open `/courses/:courseId`.

Expected before click: page shows `Đăng ký khóa học`.

Action: click `Đăng ký khóa học`.

Expected after click: success toast appears and browser navigates to `/learner/courses/:courseId/learn`.

- [ ] **Step 5: Smoke check enrolled state and My Courses**

Open `/courses/:courseId` again as the same Learner.

Expected: page shows `Tiếp tục học`.

Open `/learner/courses`.

Expected: enrolled course appears with title, instructor, category, enrollment date, progress bar, and `Tiếp tục học` link.

- [ ] **Step 6: Smoke check non-Learner roles**

Sign in as Instructor or Admin and open `/courses/:courseId`.

Expected: page shows the message `Chỉ tài khoản học viên mới có thể đăng ký khóa học này.` and no enrollment button.

- [ ] **Step 7: Summarize results**

In the final implementation response, include:

```md
Verification:
- `pnpm lint`: passed or failed with exact reason
- `pnpm build`: passed or failed with exact reason
- Manual smoke checks: completed or not run, with reason
```

---

## Plan Self-Review

- Spec coverage: course detail CTA, authenticated `isEnrolled`, enrollment mutation, `/learner/courses`, learner nav, redirect to `/learner/courses/:courseId/learn`, and verification are covered.
- Type consistency: `Enrollment.progress` is a string, `completedAt` is `string | null`, `enrolledAt` is a string, and `course` is optional to tolerate backend relation shape changes.
- Scope control: learning player, progress tracking, completion, certificates, and cancellation remain outside T1-09.
- Test constraint: TDD was checked, but the repo has no frontend test framework; plan uses `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build`, and manual smoke checks instead of adding a test framework.
