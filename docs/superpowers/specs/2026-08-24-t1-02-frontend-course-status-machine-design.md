# T1-02 Frontend Design - Course Status Machine

## Context

`T1-02` adds the Instructor-facing frontend for course publication requests and rejected-course feedback.

Source task: `ba/tasks/phase-1-lms-core/T1-02-course-status-machine.md`

Root note: `T1-02-course-status-machine-notes.md`

Backend endpoint: `POST /courses/:id/request-publish`

Traceability: `US-020 S2`, `FR-20`, `BR-01`, `UC07`

This frontend task does not build the Admin approval queue or Admin approve/reject UI. Those belong to `T1-03`.

## Scope Decisions

| Decision | Choice |
|---|---|
| Request publish locations | Both course list row and edit page |
| Rejection reason in list | Separate `Lý do từ chối` table column |
| Rejection reason in edit | Alert/status panel above the form content |
| Status model | Add distinct `Rejected` status |
| Resubmission UX | Rejected course must be edited/saved first; backend moves it to `Draft` |
| Notification UI | Out of scope; backend queues notification |

## API Contract

Use the shared `axiosClient` from `services/axios.ts`.

| Action | API Call | Result |
|---|---|---|
| Request publish | `POST /courses/:id/request-publish` | Returns updated `Course` with `status: "Pending"` |

Extend frontend course shape:

```ts
export const COURSE_STATUSES = {
  DRAFT: "Draft",
  PENDING: "Pending",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
} as const;

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

Add API function:

```ts
export async function requestPublishCourse(courseId: string): Promise<Course> {
  const { data } = await axiosClient.post<ApiSuccessResponse<Course>>(
    `/courses/${courseId}/request-publish`,
  );

  return data.data;
}
```

## React Query Hook

Add `useRequestPublishCourse()` to `hooks/useInstructorCourses.ts`.

Behavior:

1. Calls `requestPublishCourse(courseId)`.
2. On success, invalidates all Instructor course lists and the affected detail query.
3. Shows success toast: `Đã gửi yêu cầu xuất bản khóa học.`
4. Returns `{ ok, data?, message? }` like the existing create/update/delete hooks.

Error mapping:

| Backend status | UI message |
|---|---|
| `400` | Backend message, fallback `Chỉ khóa học bản nháp mới có thể gửi duyệt.` |
| `403` | `Bạn không có quyền quản lý khóa học này.` |
| `404` | `Khóa học không tồn tại hoặc đã bị xóa.` |
| Network | `Không thể kết nối đến máy chủ. Vui lòng thử lại.` |
| Other | Existing generic message |

## List Page Design

File: `app/(instructor)/instructor/courses/page.tsx`

Changes:

| Area | Design |
|---|---|
| Status filter | Include `Rejected` |
| Status badge | Use `COURSE_STATUS_LABELS.Rejected = "Bị từ chối"` |
| Rejection reason column | Add table column `Lý do từ chối` |
| Rejection reason value | If `status === "Rejected"` and `rejectReason` exists, show reason; otherwise muted `-` |
| Actions | Add `Yêu cầu xuất bản` only for `Draft` rows |
| Pending state | Disable only the row being submitted when request-publish mutation is pending |

The existing title/description column remains unchanged. Rejection reason must not be displayed under the title.

Recommended action layout:

- Keep edit and delete icon buttons.
- Add a compact text button or icon+text button for `Draft` rows.
- Use accessible label: `Yêu cầu xuất bản ${course.title}`.

## Edit Page / Form Design

Files:

- `app/(instructor)/instructor/courses/[id]/edit/page.tsx`
- `components/instructor/courses/course-form.tsx`

Add an edit-mode status panel using the loaded `course` data.

Panel behavior:

| Status | UI |
|---|---|
| `Draft` | Show current status and a `Yêu cầu xuất bản` button |
| `Pending` | Show helper text `Đang chờ Admin duyệt.` |
| `Published` | Show helper text `Khóa học đã được xuất bản.` |
| `Rejected` | Show destructive/warning alert with `rejectReason`; explain that saving changes moves course back to Draft |

Rejected course copy:

```text
Khóa học bị từ chối
Lý do: {rejectReason}
Cập nhật thông tin khóa học rồi lưu để chuyển về bản nháp trước khi gửi duyệt lại.
```

Request-publish button from edit page:

- Visible only when `course.status === "Draft"`.
- Calls the same `useRequestPublishCourse()` hook.
- On success, invalidates detail/list and keeps the user on the edit page with refreshed `Pending` status.
- Disabled while request-publish or save mutation is pending.

## Resubmission Flow

Rejected courses are not directly submitted from the frontend.

Flow:

1. Instructor opens a `Rejected` course.
2. UI shows `rejectReason` and explains that edits are required first.
3. Instructor edits metadata and saves.
4. Backend returns updated course with `status: "Draft"` and `rejectReason: null`.
5. Instructor can then click `Yêu cầu xuất bản` from list or edit page.

## Files

Modify:

| File | Change |
|---|---|
| `services/api/courses.ts` | Add `Rejected`, `rejectReason`, `requestPublishCourse` |
| `lib/schemas/course.ts` | Add Vietnamese label for `Rejected` |
| `hooks/useInstructorCourses.ts` | Add request-publish mutation hook |
| `app/(instructor)/instructor/courses/page.tsx` | Add column, status label/filter, row action |
| `components/instructor/courses/course-form.tsx` | Add edit status panel and edit-page request-publish action |

No new dependency is required.

## Verification

No frontend test framework is configured.

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Manual checklist:

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
