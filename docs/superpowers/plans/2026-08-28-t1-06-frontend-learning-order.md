# T1-06 Frontend Learning Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `learningOrder` course setting (sequential/free) to the instructor course form so it round-trips through the existing course APIs.

**Architecture:** Follow existing conventions: types in `services/api/*.ts`, validation/labels in `lib/schemas/course.ts`, and a shadcn `Select` field in `course-form.tsx`. No hooks or API functions change because the form already posts the full `CourseFormValues`.

**Tech Stack:** Next.js 16.3.0 App Router, React 19, TypeScript, Tailwind v4, react-hook-form, zod, shadcn (Base UI), TanStack Query, pnpm.

**Approved Design:** `docs/superpowers/specs/2026-08-28-t1-06-frontend-learning-order-design.md`

**Repository Rules:** Work inside `onlinestudyplatform-fe`. Use pnpm. Do not commit unless the user explicitly asks.

---

## File Structure

- Modify: `services/api/courses.ts`
- Modify: `services/api/public-courses.ts`
- Modify: `lib/schemas/course.ts`
- Modify: `components/instructor/courses/course-form.tsx`

---

### Task 1: Types

**Files:**
- Modify: `services/api/courses.ts`
- Modify: `services/api/public-courses.ts`

- [ ] **Step 1: Add LearningOrder to the course API types**

In `services/api/courses.ts`, add after `CourseStatus`:

```ts
export const COURSE_LEARNING_ORDERS = {
  SEQUENTIAL: "sequential",
  FREE: "free",
} as const;

export type LearningOrder =
  (typeof COURSE_LEARNING_ORDERS)[keyof typeof COURSE_LEARNING_ORDERS];
```

Add `learningOrder: LearningOrder;` to the `Course` interface and
`learningOrder?: LearningOrder;` to `CreateCoursePayload`.

- [ ] **Step 2: Add learningOrder to PublicCourse**

In `services/api/public-courses.ts`, add a `PublicCourseLearningOrder` union
(`"sequential" | "free"`) and `learningOrder: PublicCourseLearningOrder;` to
`PublicCourse`.

- [ ] **Step 3: Typecheck**

```bash
pnpm exec tsc --noEmit
```

Expected: PASS.

---

### Task 2: Schema And Labels

**Files:**
- Modify: `lib/schemas/course.ts`

- [ ] **Step 1: Add learning order constants and labels**

```ts
export const COURSE_LEARNING_ORDERS = [
  "sequential",
  "free",
] as const;

export type CourseLearningOrder = (typeof COURSE_LEARNING_ORDERS)[number];

export const COURSE_LEARNING_ORDER_LABELS: Record<CourseLearningOrder, string> = {
  sequential: "Học theo trình tự",
  free: "Học tự do",
};
```

- [ ] **Step 2: Add the field to the form schema**

Add `learningOrder: z.enum(COURSE_LEARNING_ORDERS),` to `courseFormSchema`.

- [ ] **Step 3: Typecheck**

```bash
pnpm exec tsc --noEmit
```

Expected: PASS.

---

### Task 3: Course Form Field

**Related skills:** `nil` (follow existing Select pattern in the file)

**Files:**
- Modify: `components/instructor/courses/course-form.tsx`

- [ ] **Step 1: Import the labels and default values**

Import `COURSE_LEARNING_ORDERS` and `COURSE_LEARNING_ORDER_LABELS` from
`@/lib/schemas/course`. In `defaultValues`, add:

```ts
learningOrder:
  (course?.learningOrder as CourseFormValues["learningOrder"] | undefined) ??
  "free",
```

- [ ] **Step 2: Add the Select field after the category field**

Replicate the category `Controller` + `Select` pattern with
`name="learningOrder"`, id `course-learning-order`, `aria-label="Hình thức
học"`, and `SelectItem` for each `COURSE_LEARNING_ORDERS` value.

- [ ] **Step 3: Lint and typecheck**

```bash
pnpm lint
pnpm exec tsc --noEmit
```

Expected: PASS.

---

### Task 4: Full Verification

**Files:**
- No code edits unless verification fails.

- [ ] **Step 1: Typecheck**

```bash
pnpm exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 2: Lint**

```bash
pnpm lint
```

Expected: PASS.

- [ ] **Step 3: Build**

```bash
pnpm build
```

Expected: PASS.

---

## Manual Smoke Checklist

- Create a course and confirm "Hình thức học" defaults to "Học tự do".
- Switch the setting to "Học theo trình tự", save, and reopen to confirm it
  persists from the backend `learningOrder` value.
- Edit an existing course and confirm the current value pre-selects.

## Completion Criteria

- `learningOrder` is typed and exposed on `Course` / `PublicCourse`.
- Course form has a "Hình thức học" select that validates with zod and
  round-trips on create and edit.
- `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build` all pass.
