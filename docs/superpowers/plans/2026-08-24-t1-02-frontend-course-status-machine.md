# T1-02 Frontend Course Status Machine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Instructor-facing request-publish actions, `Rejected` status display, and rejection reason feedback for courses.

**Architecture:** Keep API contracts in `services/api/courses.ts`, server-state mutations in `hooks/useInstructorCourses.ts`, validation/labels in `lib/schemas/course.ts`, and UI changes in the existing Instructor list and course form. Do not add dependencies or new routing; reuse TanStack Query invalidation and existing Base UI/shadcn components.

**Tech Stack:** Next.js 16.3 App Router, React 19 client components, TypeScript, TanStack Query, axios, Tailwind CSS v4, existing Base UI/shadcn components.

---

## Scope And Source

Source spec: `docs/superpowers/specs/2026-08-24-t1-02-frontend-course-status-machine-design.md`

Backend endpoint: `POST /courses/:id/request-publish`

Out of scope: Admin approval queue, Admin approve/reject UI, notification UI.

Project rules: read `AGENTS.md` before implementation. Next.js 16 docs may be checked from `node_modules/next/dist/docs/` before changing App Router behavior; this plan only changes client components and does not require route API changes.

## File Structure

- Modify: `services/api/courses.ts` - add `Rejected`, `rejectReason`, and `requestPublishCourse()`.
- Modify: `lib/schemas/course.ts` - add Vietnamese status label for `Rejected`.
- Modify: `hooks/useInstructorCourses.ts` - add request-publish import, mutation hook, success toast, and mutation error mapping.
- Modify: `app/(instructor)/instructor/courses/page.tsx` - add `Rejected` filter support, `Lý do từ chối` column, and list-row request-publish action for `Draft` courses.
- Modify: `components/instructor/courses/course-form.tsx` - add edit-mode status panel and edit-page request-publish action.
- Read-only reference: `app/(instructor)/instructor/courses/[id]/edit/page.tsx` - no change expected because the loaded `course` is already passed into `CourseForm`.

## Task 1: Course API Contract

**Related skills:** `test-driven-development` for type-first change discipline, `nextjs` for project conventions, `verification-before-completion` before claiming success.

**Files:**
- Modify: `services/api/courses.ts`

- [ ] **Step 1: Add the `Rejected` status and `rejectReason` field**

Update the top of `services/api/courses.ts` to include `REJECTED` and `rejectReason`:

```ts
export const COURSE_STATUSES = {
  DRAFT: "Draft",
  PENDING: "Pending",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
} as const;

export type CourseStatus =
  (typeof COURSE_STATUSES)[keyof typeof COURSE_STATUSES];

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string | null;
  status: CourseStatus;
  rejectReason: string | null;
  instructorId: string;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Add request-publish API function**

Append this function after `updateCourse()` and before `uploadCourseThumbnail()`:

```ts
export async function requestPublishCourse(courseId: string): Promise<Course> {
  const { data } = await axiosClient.post<ApiSuccessResponse<Course>>(
    `/courses/${courseId}/request-publish`,
  );

  return data.data;
}
```

- [ ] **Step 3: Typecheck the contract change**

Run from `onlinestudyplatform-fe`:

```bash
pnpm exec tsc --noEmit
```

Expected: current compile errors may appear because labels/UI have not yet been updated for `Rejected`. Do not stop here unless errors are unrelated to the new status exhaustiveness.

## Task 2: Course Labels

**Related skills:** `test-driven-development` for small compile-checked changes, `verification-before-completion` before marking complete.

**Files:**
- Modify: `lib/schemas/course.ts`

- [ ] **Step 1: Add Vietnamese label for rejected courses**

Update `COURSE_STATUS_LABELS`:

```ts
export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  Draft: "Bản nháp",
  Pending: "Chờ duyệt",
  Published: "Đã xuất bản",
  Rejected: "Bị từ chối",
};
```

- [ ] **Step 2: Typecheck labels**

Run from `onlinestudyplatform-fe`:

```bash
pnpm exec tsc --noEmit
```

Expected: no `COURSE_STATUS_LABELS` missing-property error remains. Other task-related errors may remain until later tasks are complete.

## Task 3: Request-Publish Mutation Hook

**Related skills:** `test-driven-development` for mutation API shape, `nextjs` for client-side state conventions, `vercel-react-best-practices` for avoiding unnecessary memoization/callbacks, `systematic-debugging` if mutation or invalidation behaves unexpectedly.

**Files:**
- Modify: `hooks/useInstructorCourses.ts`

- [ ] **Step 1: Import the API function**

Add `requestPublishCourse` to the existing import from `@/services/api/courses`:

```ts
import {
  createCourse,
  deleteCourse,
  getCourse,
  listMyCourses,
  requestPublishCourse,
  updateCourse,
  uploadCourseThumbnail,
  type Course,
  type CourseListFilters,
} from "@/services/api/courses";
```

- [ ] **Step 2: Add request-publish-specific error mapping**

Place this function after `mapCourseError()`:

```ts
export function mapRequestPublishCourseError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return GENERIC_ERROR_MESSAGE;
  }

  if (status === 400) {
    return data.error.message || "Chỉ khóa học bản nháp mới có thể gửi duyệt.";
  }
  if (status === 403) return "Bạn không có quyền quản lý khóa học này.";
  if (status === 404) return "Khóa học không tồn tại hoặc đã bị xóa.";

  return data.error.message || GENERIC_ERROR_MESSAGE;
}
```

- [ ] **Step 3: Add `useRequestPublishCourse()`**

Append this hook after `useUpdateInstructorCourse()` and before `useDeleteInstructorCourse()`:

```ts
export function useRequestPublishCourse() {
  const invalidate = useInvalidateCourses();
  const mutation = useMutation<Course, unknown, string>({
    mutationFn: (courseId) => requestPublishCourse(courseId),
    onSuccess: async (course) => {
      await invalidate(course.id);
      toast.add({
        title: "Đã gửi yêu cầu xuất bản khóa học.",
        type: "success",
      });
    },
  });

  async function requestPublishInstructorCourse(
    courseId: string,
  ): Promise<CourseMutationResult> {
    try {
      const course = await mutation.mutateAsync(courseId);
      return { ok: true, data: course };
    } catch (error) {
      return { ok: false, message: mapRequestPublishCourseError(error) };
    }
  }

  return {
    requestPublishInstructorCourse,
    isPending: mutation.isPending,
    pendingCourseId: mutation.variables,
  };
}
```

- [ ] **Step 4: Typecheck the hook**

Run from `onlinestudyplatform-fe`:

```bash
pnpm exec tsc --noEmit
```

Expected: hook compiles. UI may still need updates to use the hook.

## Task 4: Instructor Course List UI

**Related skills:** `frontend-design` for preserving the existing table language, `ui-ux-pro-max` for accessibility/responsive table implications, `vercel-react-best-practices` for event handlers without unnecessary memoization, `systematic-debugging` if row pending state or filter behavior fails.

**Files:**
- Modify: `app/(instructor)/instructor/courses/page.tsx`

- [ ] **Step 1: Import send icon, toast, and request-publish hook**

Update imports:

```ts
import {
  BookOpen,
  ImageIcon,
  PencilLine,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import {
  useInstructorCoursesList,
  useRequestPublishCourse,
} from "@/hooks/useInstructorCourses";
```

- [ ] **Step 2: Include `Rejected` in status filter items**

Update `STATUS_FILTER_ITEMS`:

```ts
const STATUS_FILTER_ITEMS: Record<StatusFilter, string> = {
  [ALL_OPTION]: "Tất cả trạng thái",
  Draft: COURSE_STATUS_LABELS.Draft,
  Pending: COURSE_STATUS_LABELS.Pending,
  Published: COURSE_STATUS_LABELS.Published,
  Rejected: COURSE_STATUS_LABELS.Rejected,
};
```

- [ ] **Step 3: Wire request-publish state and handler**

Inside `InstructorCoursesPage()`, after the list query, add:

```ts
  const {
    requestPublishInstructorCourse,
    isPending: isRequestingPublish,
    pendingCourseId,
  } = useRequestPublishCourse();
```

Then add this handler near `handleFilterChange()`:

```ts
  async function handleRequestPublish(course: Course) {
    const result = await requestPublishInstructorCourse(course.id);

    if (!result.ok) {
      toast.add({
        title: result.message ?? "Không thể gửi yêu cầu xuất bản khóa học.",
        type: "error",
      });
    }
  }
```

- [ ] **Step 4: Add rejection reason table column**

Update the table header and row/empty col spans:

```tsx
<TableHead>Trạng thái</TableHead>
<TableHead>Lý do từ chối</TableHead>
<TableHead>Cập nhật</TableHead>
```

Change both existing `colSpan={5}` values in table body fallback rows to `colSpan={6}`.

After the status cell, add:

```tsx
<TableCell className="max-w-64 text-sm">
  {course.status === COURSE_STATUSES.REJECTED && course.rejectReason ? (
    <span className="line-clamp-2 text-destructive">
      {course.rejectReason}
    </span>
  ) : (
    <span className="text-muted-foreground">-</span>
  )}
</TableCell>
```

- [ ] **Step 5: Add row request-publish action only for drafts**

Inside the row action `<div className="flex justify-end gap-1">`, before edit/delete buttons, add:

```tsx
{course.status === COURSE_STATUSES.DRAFT ? (
  <Button
    variant="outline"
    size="sm"
    disabled={isRequestingPublish && pendingCourseId === course.id}
    onClick={() => handleRequestPublish(course)}
    aria-label={`Yêu cầu xuất bản ${course.title}`}
  >
    {isRequestingPublish && pendingCourseId === course.id ? (
      "Đang gửi..."
    ) : (
      <>
        <Send className="size-4" aria-hidden="true" />
        Yêu cầu xuất bản
      </>
    )}
  </Button>
) : null}
```

- [ ] **Step 6: Typecheck the list UI**

Run from `onlinestudyplatform-fe`:

```bash
pnpm exec tsc --noEmit
```

Expected: page compiles and `Rejected` can be indexed through `COURSE_STATUS_LABELS`.

## Task 5: Edit Page Status Panel And Action

**Related skills:** `frontend-design` for panel hierarchy and Vietnamese copy, `ui-ux-pro-max` for accessible alert semantics, `vercel-react-best-practices` for simple local handlers, `systematic-debugging` if form submit/request-publish pending states interact incorrectly.

**Files:**
- Modify: `components/instructor/courses/course-form.tsx`
- Reference only: `app/(instructor)/instructor/courses/[id]/edit/page.tsx`

- [ ] **Step 1: Import request-publish hook, labels, statuses, and toast**

Update imports in `course-form.tsx`:

```ts
import { toast } from "@/components/ui/toast";
import {
  useCreateInstructorCourse,
  useRequestPublishCourse,
  useUpdateInstructorCourse,
} from "@/hooks/useInstructorCourses";
import {
  COURSE_CATEGORIES,
  COURSE_CATEGORY_LABELS,
  COURSE_STATUS_LABELS,
  courseFormSchema,
  type CourseFormValues,
} from "@/lib/schemas/course";
import { COURSE_STATUSES, type Course } from "@/services/api/courses";
```

- [ ] **Step 2: Add request-publish state and combined pending state**

Inside `CourseForm()`, after update hook setup, add:

```ts
  const {
    requestPublishInstructorCourse,
    isPending: isRequestingPublish,
  } = useRequestPublishCourse();
  const isPending = isCreating || isUpdating || isRequestingPublish;
```

Remove the old `const isPending = isCreating || isUpdating;` line.

- [ ] **Step 3: Add edit-page request-publish handler**

Place this function after `onSubmit()`:

```ts
  async function handleRequestPublish() {
    if (!course) return;

    setFormError(null);
    const result = await requestPublishInstructorCourse(course.id);

    if (!result.ok) {
      toast.add({
        title: result.message ?? "Không thể gửi yêu cầu xuất bản khóa học.",
        type: "error",
      });
    }
  }
```

- [ ] **Step 4: Add edit status panel before form fields**

Inside `<FieldGroup>`, after the `formError` alert and before the title field, add:

```tsx
{mode === "edit" && course ? (
  <Alert
    variant={
      course.status === COURSE_STATUSES.REJECTED ? "destructive" : "default"
    }
  >
    <AlertTitle>
      {course.status === COURSE_STATUSES.REJECTED
        ? "Khóa học bị từ chối"
        : `Trạng thái: ${COURSE_STATUS_LABELS[course.status]}`}
    </AlertTitle>
    <AlertDescription className="flex flex-col gap-3">
      {course.status === COURSE_STATUSES.DRAFT ? (
        <span>Khóa học đang là bản nháp và có thể gửi Admin duyệt.</span>
      ) : null}
      {course.status === COURSE_STATUSES.PENDING ? (
        <span>Đang chờ Admin duyệt.</span>
      ) : null}
      {course.status === COURSE_STATUSES.PUBLISHED ? (
        <span>Khóa học đã được xuất bản.</span>
      ) : null}
      {course.status === COURSE_STATUSES.REJECTED ? (
        <>
          <span>Lý do: {course.rejectReason ?? "Không có lý do từ chối."}</span>
          <span>
            Cập nhật thông tin khóa học rồi lưu để chuyển về bản nháp trước khi
            gửi duyệt lại.
          </span>
        </>
      ) : null}
      {course.status === COURSE_STATUSES.DRAFT ? (
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          disabled={isPending}
          onClick={handleRequestPublish}
        >
          {isRequestingPublish ? (
            <>
              <Spinner /> Đang gửi...
            </>
          ) : (
            "Yêu cầu xuất bản"
          )}
        </Button>
      ) : null}
    </AlertDescription>
  </Alert>
) : null}
```

- [ ] **Step 5: Preserve rejected resubmission flow**

Do not show a request-publish button for `Rejected`. The panel copy must instruct the Instructor to edit and save first. Existing `onSubmit()` should still call `updateInstructorCourse()`; the backend response will move `Rejected` to `Draft` and clear `rejectReason`.

- [ ] **Step 6: Typecheck the form UI**

Run from `onlinestudyplatform-fe`:

```bash
pnpm exec tsc --noEmit
```

Expected: `course-form.tsx` compiles without duplicate `isPending` declarations or missing imports.

## Task 6: Full Verification

**Related skills:** `verification-before-completion` is required before claiming complete, `systematic-debugging` is required if any command fails.

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run TypeScript typecheck**

Run from `onlinestudyplatform-fe`:

```bash
pnpm exec tsc --noEmit
```

Expected: exits `0`.

- [ ] **Step 2: Run lint**

Run from `onlinestudyplatform-fe`:

```bash
pnpm lint
```

Expected: exits `0`. If lint reports autofixable issues, apply minimal fixes and rerun.

- [ ] **Step 3: Run production build**

Run from `onlinestudyplatform-fe`:

```bash
pnpm build
```

Expected: exits `0` and completes the Next.js production build/typecheck path.

- [ ] **Step 4: Manual browser verification**

With backend running and Instructor auth available, verify:

| Scenario | Expected result |
|---|---|
| Draft row request publish | Status refreshes to `Pending`; success toast shown |
| Draft edit request publish | Edit page refreshes to `Pending`; success toast shown |
| Pending/Published/Rejected list rows | No request-publish action shown |
| Rejected list row | `Lý do từ chối` column shows reason |
| Non-rejected list row | `Lý do từ chối` column shows muted `-` |
| Rejected edit page | Alert shows rejection reason and save-first instruction |
| Save rejected course | Backend response changes status to `Draft`; reason clears after refresh |
| Request publish error | Vietnamese error message shown; list/detail invalidation does not claim success |

## Self-Review

- Spec coverage: Tasks cover API contract, hook, labels, list filter/status/column/action, edit page status panel/action, rejected resubmission copy, and verification. Admin approval and notifications remain out of scope as specified.
- Placeholder scan: No unresolved markers, generic filler instructions, or undefined task references remain.
- Type consistency: Status literal is `Rejected`; API field is `rejectReason`; mutation function exposed to UI is `requestPublishInstructorCourse`; backend endpoint path is `/courses/${courseId}/request-publish`.
