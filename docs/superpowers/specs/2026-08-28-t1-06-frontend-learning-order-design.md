# T1-06 Frontend Learning Order Design

## Goal

Give the Instructor a course setting to choose `sequential` or `free` learning
order, matching the backend `learning_order` field added in T1-06 BE. The
setting is edited on the course form (create and edit) and the chosen value
round-trips through the existing course API.

## Sources

- Task: `ba/tasks/phase-1-lms-core/T1-06-learning-order.md`
- Backend design: `online-study-platform-be/docs/superpowers/specs/2026-08-28-t1-06-backend-learning-order-design.md`
- Backlog: `ba/03-user-stories-backlog.md` US-022
- Existing FE course types/hooks/forms: `services/api/courses.ts`,
  `services/api/public-courses.ts`, `lib/schemas/course.ts`,
  `components/instructor/courses/course-form.tsx`

## Current Context

`services/api/courses.ts::Course` has no ordering field. The instructor course
form (`course-form.tsx`) exposes title, description, category, and thumbnail
using react-hook-form + zod validation and shadcn `Select` components. The form
is shared between create and edit modes and posts title/description/category
through `createCourse`/`updateCourse`.

## Design Decisions

### 1. Type additions

- `services/api/courses.ts`: add `COURSE_LEARNING_ORDERS = { SEQUENTIAL:
  'sequential', FREE: 'free' }`, a `LearningOrder` union, `learningOrder:
  LearningOrder` on `Course`, and `learningOrder?: LearningOrder` on
  `CreateCoursePayload` (and therefore `UpdateCoursePayload`).
- `services/api/public-courses.ts`: add `learningOrder` to `PublicCourse` so
  the public detail shape matches the backend `PublicCourseResponse`.

### 2. Schema, labels, and validation

- `lib/schemas/course.ts`: add `COURSE_LEARNING_ORDERS`,
  `CourseLearningOrder` type, `COURSE_LEARNING_ORDER_LABELS`
  (`sequential: "Học theo trình tự"`, `free: "Học tự do"`), and a
  `learningOrder: z.enum(COURSE_LEARNING_ORDERS)` field on
  `courseFormSchema`. `CourseFormValues` picks it up automatically.

### 3. UI

Add a "Hình thức học" `Select` field to `course-form.tsx` after the category
field, using the same `Controller` + `Select`/`SelectTrigger`/`SelectContent`/
`SelectItem` pattern already used for category. Default to `free` on create and
to the course's current value on edit.

Both create and edit submissions already forward the whole `CourseFormValues`
object, so `learningOrder` is sent to the backend automatically — no hook or
API function changes are required.

## File Structure

- Modify: `services/api/courses.ts`
- Modify: `services/api/public-courses.ts`
- Modify: `lib/schemas/course.ts`
- Modify: `components/instructor/courses/course-form.tsx`

## Out Of Scope

- Learner lesson-flow gating UI (T1-10).
- Enforcing order client-side; the backend is authoritative.

## Validation

- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm build`
