# T1-01 Frontend Design - Course CRUD + Ownership

## Context

`T1-01` implements the frontend part of Instructor Course CRUD.

Source task: `ba/tasks/phase-1-lms-core/T1-01-course-crud.md`

Backend spec: `online-study-platform-be/docs/superpowers/specs/2026-08-23-t1-01-backend-course-crud-design.md`

Traceability: `US-020 S1/S3`, `FR-20`, `UC07`

Status transitions beyond initial `Draft`, publish request, lessons, quizzes, and enrollment implementation are out of scope.

## Scope Decisions

| Decision | Choice |
|---|---|
| Main UX | Separate pages for list, create, and edit |
| Create thumbnail flow | One submit button chains `POST /courses` then optional `POST /courses/:id/thumbnail` |
| Create success redirect | Redirect to `/instructor/courses` list |
| Shared form | Use one form component for create and edit pages |
| Category source | Frontend constants only, no admin-config dependency |
| Delete disabled by enrollment | Backend does not expose enrollment count yet; handle `409 Conflict` now and add disabled tooltip later when count exists |

## Routes

| Route | Purpose |
|---|---|
| `/instructor/courses` | Instructor course list with search/filter/pagination and create/edit/delete actions |
| `/instructor/courses/new` | Create metadata plus optional thumbnail in one submit flow |
| `/instructor/courses/[id]/edit` | Edit metadata and replace thumbnail |

All routes live under the existing Instructor layout, which already uses `AuthGuard` with `UserRole.INSTRUCTOR`.

## Files

Create these files:

| File | Purpose |
|---|---|
| `services/api/courses.ts` | Course types and API calls through the shared axios instance |
| `hooks/useInstructorCourses.ts` | React Query hooks for list, detail, create, update, delete, thumbnail upload |
| `lib/schemas/course.ts` | Course form schema, course categories, labels, constants |
| `components/instructor/courses/course-form.tsx` | Shared create/edit form |
| `components/instructor/courses/course-thumbnail-field.tsx` | Dropzone, preview, validation, selected-file state UI |
| `components/instructor/courses/delete-course-dialog.tsx` | Confirm delete dialog |
| `app/(instructor)/instructor/courses/new/page.tsx` | Create page |
| `app/(instructor)/instructor/courses/[id]/edit/page.tsx` | Edit page |

Modify:

| File | Change |
|---|---|
| `app/(instructor)/instructor/courses/page.tsx` | Replace placeholder with list page |
| `app/(instructor)/layout.tsx` | If needed, adjust `main` layout so list/form pages are not vertically centered |

## API Contract

Use `services/axios.ts`; do not import raw axios.

| Action | API Call |
|---|---|
| List my courses | `GET /courses/me?page&limit&q&category&status&sortBy&sortOrder` |
| Get detail | `GET /courses/:id` |
| Create | `POST /courses` |
| Update | `PATCH /courses/:id` |
| Upload thumbnail | `POST /courses/:id/thumbnail` with `thumbnail` form field |
| Delete | `DELETE /courses/:id` |

## Course Types

| Field | Type |
|---|---|
| `id` | `string` |
| `title` | `string` |
| `description` | `string` |
| `category` | `string` |
| `thumbnail` | `string | null` |
| `status` | `"Draft" | "Pending" | "Published"` |
| `instructorId` | `string` |
| `createdAt` | `string` |
| `updatedAt` | `string` |

List return shape:

```ts
{
  items: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

## List Page Design

The existing placeholder at `/instructor/courses` becomes the management page.

Controls:

| Control | Behavior |
|---|---|
| Search | Applies `q` to title/description search |
| Category filter | Uses local category constants |
| Status filter | Supports all statuses, default all |
| Pagination | Uses backend `page`, `limit`, `totalPages` |
| Create button | Navigates to `/instructor/courses/new` |

Rows/cards show:

| Field | Display |
|---|---|
| Thumbnail | Image if present, otherwise placeholder |
| Title | Course title |
| Category | Badge/text |
| Status | Vietnamese label badge |
| Updated/created date | Use existing date formatting utility |
| Actions | Edit, delete |

For `T1-01`, a responsive table/card hybrid is acceptable: table on desktop, stacked cards on narrow screens if the existing table does not fit well.

## Create Page Design

Form fields:

| Field | Behavior |
|---|---|
| Title | Required |
| Description | Required textarea |
| Category | Required select from local constants |
| Thumbnail | Optional image selection with preview |

Submit flow:

1. Validate form locally.
2. Call `POST /courses` with title, description, category.
3. If thumbnail was selected, call `POST /courses/:id/thumbnail`.
4. If both succeed, show success toast and redirect to `/instructor/courses`.
5. If metadata succeeds but thumbnail upload fails, keep the created course, show warning toast, and redirect to `/instructor/courses` so the Draft still appears. The Instructor can open edit to retry thumbnail.

## Edit Page Design

Load `GET /courses/:id` by route param.

Behavior:

| Case | Behavior |
|---|---|
| Loading | Skeleton/form loading state |
| `404` | Show not-found style message with back-to-list action |
| `403` | Show “Bạn không có quyền quản lý khóa học này.” with back-to-list action |
| Save metadata only | `PATCH /courses/:id` |
| Save with new thumbnail | `PATCH /courses/:id`, then `POST /courses/:id/thumbnail` |
| Thumbnail upload fails after metadata save | Metadata remains saved; show warning and keep user on edit page |

## Delete Design

List action opens `DeleteCourseDialog`.

Behavior:

| Case | Behavior |
|---|---|
| Confirm delete | Calls `DELETE /courses/:id` |
| Success | Toast and invalidate course list |
| `403` | Toast: “Bạn không có quyền xóa khóa học này.” |
| `409` | Toast: “Không thể xóa khóa học đã có học viên đăng ký.” |
| Other error | Generic retry message |

The task card mentions disabled delete with tooltip when enrollments exist. Because the current backend does not expose enrollment count, this frontend version handles the backend conflict response. When enrollment count is added, update the list item to disable delete and show a tooltip before the user clicks.

## Error Handling

Map backend errors into Vietnamese UI copy.

| Status | Message |
|---|---|
| `400` | Form-specific validation message or generic invalid input |
| `403` | “Bạn không có quyền quản lý khóa học này.” |
| `404` | “Khóa học không tồn tại hoặc đã bị xóa.” |
| `409` | “Không thể xóa khóa học đã có học viên đăng ký.” |
| Network/no response | “Không thể kết nối đến máy chủ. Vui lòng thử lại.” |

## Validation

Use a local schema in `lib/schemas/course.ts`.

| Field | Rule |
|---|---|
| `title` | Trimmed, 2-150 chars |
| `description` | Trimmed, 1-5000 chars |
| `category` | One of local category constants |
| `thumbnail` | Optional JPEG/PNG/WebP/GIF, max 5MB |

Course categories start as frontend constants. Suggested initial labels:

| Value | Label |
|---|---|
| `Programming` | Lập trình |
| `Data` | Dữ liệu |
| `Design` | Thiết kế |
| `Business` | Kinh doanh |
| `Language` | Ngoại ngữ |
| `Other` | Khác |

## Testing And Verification

No frontend test framework is installed.

Verification commands:

```bash
pnpm build
pnpm lint
```

Manual verification checklist:

| Scenario | Expected Result |
|---|---|
| Instructor opens `/instructor/courses` | List page loads |
| Create metadata only | Draft appears in list |
| Create metadata plus thumbnail | Draft appears in list with thumbnail |
| Edit metadata | Changes persist after reload/list refresh |
| Replace thumbnail | New thumbnail appears |
| Delete owned course | Course removed from list |
| Non-owner/forbidden API response | Vietnamese 403 message shown |
| Delete conflict | Vietnamese 409 message shown |
