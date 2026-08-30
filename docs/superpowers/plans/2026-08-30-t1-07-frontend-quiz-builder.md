# T1-07 Frontend Quiz Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Instructor quiz builder per lesson — create/edit/delete a quiz (title, description, time limit, pass score %) and build its question list (MCQ options + correct answers + points, essay points only) with add/edit/delete and drag-to-reorder, wired to the T1-07 backend.

**Architecture:** Follow existing FE conventions: typed API functions in `services/api/*.ts` returning `data.data`, TanStack Query hooks in `hooks/` with `instructorQuizKeys`, zod+react-hook-form validation in `lib/schemas/*.ts`, shadcn (Base UI) components, and `@dnd-kit/react` sortable for reorder (mirror `lesson-list.tsx`).

**Tech Stack:** Next.js 16.3.0 App Router, React 19, TypeScript, Tailwind v4, react-hook-form, zod, shadcn (Base UI), TanStack Query, `@dnd-kit/react`, pnpm.

**Approved Design:** `docs/superpowers/specs/2026-08-30-t1-07-frontend-quiz-builder-design.md`

**Repository Rules:** Work inside `onlinestudyplatform-fe`. Use pnpm. Do not commit unless the user explicitly asks.

---

## File Structure

- Add: `services/api/quizzes.ts`
- Add: `lib/schemas/quiz.ts`
- Modify: `lib/query-keys.ts`
- Add: `hooks/useInstructorQuizzes.ts`
- Add: `components/instructor/quizzes/{quiz-list,quiz-form-dialog,delete-quiz-dialog,question-builder,question-form-dialog,delete-question-dialog}.tsx`
- Modify: `components/instructor/lessons/lesson-list.tsx`
- Add: `app/(instructor)/instructor/courses/[id]/lessons/[lessonId]/quiz/page.tsx`

---

### Task 1: API Layer

**Files:**
- Add: `services/api/quizzes.ts`

- [ ] **Step 1: Define types and functions**

Add the `QuizQuestionType` enum, `Quiz`, `QuizSummary`, `QuizQuestion`, and the
payload types, plus the nine functions (`listQuizzes`, `createQuiz`, `getQuiz`,
`updateQuiz`, `deleteQuiz`, `addQuestion`, `reorderQuestions`,
`updateQuestion`, `deleteQuestion`) matching the backend routes. Export
`QuizQuestionType` as a value (components use `QuizQuestionType.MCQ`).

- [ ] **Step 2: Typecheck**

```bash
pnpm exec tsc --noEmit
```

Expected: PASS.

---

### Task 2: Validation And Labels

**Files:**
- Add: `lib/schemas/quiz.ts`

- [ ] **Step 1: Add constants and labels**

Add `QUIZ_QUESTION_TYPES`, `QUIZ_QUESTION_TYPE_LABELS`, and numeric bounds
(`QUIZ_TIME_LIMIT_MIN/MAX`, `QUIZ_PASS_SCORE_MIN/MAX`, `QUIZ_OPTION_COUNT_MIN/MAX`,
`QUIZ_POINTS_MIN/MAX`).

- [ ] **Step 2: Add `quizFormSchema`**

`title` required, `description` optional, `timeLimitMinutes` as a string
refined to empty-or-whole-1–600, numeric `passScore` (int, 1–100).

- [ ] **Step 3: Add `questionFormSchema`**

`type`, `content`, numeric `points`, `options: string[]`, `correctAnswers:
number[]`; `superRefine` gates MCQ (2–10 non-empty options, ≥1 in-range correct
answer).

- [ ] **Step 4: Typecheck**

```bash
pnpm exec tsc --noEmit
```

Expected: PASS.

---

### Task 3: Query Keys And Hooks

**Files:**
- Modify: `lib/query-keys.ts`
- Add: `hooks/useInstructorQuizzes.ts`

- [ ] **Step 1: Add `instructorQuizKeys`**

`list(courseId, lessonId)` and `detail(quizId)` mirroring `instructorLessonKeys`.

- [ ] **Step 2: Add `mapQuizError` and queries**

`useInstructorQuizzes(courseId, lessonId)` and `useInstructorQuiz(quizId)`.

- [ ] **Step 3: Add mutation hooks**

Create/update/delete quiz and add/update/delete/reorder question executors
returning `{ ok, data?, message? }` and invalidating `list` and/or `detail`
keys. Question mutations invalidate both.

- [ ] **Step 4: Typecheck**

```bash
pnpm exec tsc --noEmit
```

Expected: PASS.

---

### Task 4: Dialog And List Components

**Files:**
- Add: `components/instructor/quizzes/quiz-form-dialog.tsx`
- Add: `components/instructor/quizzes/delete-quiz-dialog.tsx`
- Add: `components/instructor/quizzes/quiz-list.tsx`

- [ ] **Step 1: Quiz form dialog**

Create/edit metadata form (title, description, time limit, pass score) with
RHF reset-in-effect for edit seeding, `valueAsNumber` on pass score, and
error alert.

- [ ] **Step 2: Delete quiz dialog**

Confirm delete; surface 409 attempts-blocked message from `mapQuizError`.

- [ ] **Step 3: Quiz list**

List `QuizSummary` with Xây dựng / Sửa / Xóa actions and the create button.

- [ ] **Step 4: Typecheck + lint**

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: PASS.

---

### Task 5: Question Components

**Files:**
- Add: `components/instructor/quizzes/question-form-dialog.tsx`
- Add: `components/instructor/quizzes/delete-question-dialog.tsx`
- Add: `components/instructor/quizzes/question-builder.tsx`

- [ ] **Step 1: Question form dialog**

Type `Select` (`QuizQuestionType` via `items={QUIZ_QUESTION_TYPE_LABELS}`)
switching MCQ/ESSAY; MCQ renders options editor + correct-answer checkboxes;
ESSAY shows an explanatory alert. Options/correct-answer state local;
re-validate with `questionFormSchema` on submit. Remount via parent `key`.

- [ ] **Step 2: Delete question dialog**

Confirm per-question delete, surface errors.

- [ ] **Step 3: Question builder**

Summary card (title, total points, pass score points), drag-reorderable
question list with `@dnd-kit/react` (mirror sortable pattern from
`lesson-list.tsx`), and add/edit/delete actions. Host both dialog types with a
`key` so state re-initializes per open/edited question.

- [ ] **Step 4: Typecheck + lint**

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: PASS.

---

### Task 6: Route And Navigation

**Files:**
- Add: `app/(instructor)/instructor/courses/[id]/lessons/[lessonId]/quiz/page.tsx`
- Modify: `components/instructor/lessons/lesson-list.tsx`

- [ ] **Step 1: Quiz page**

Client Component with `useParams<{ id: string; lessonId: string }>()`, loads the
course for the header, and toggles between `QuizList` and `QuestionBuilder`
based on a selected-quiz id (with back buttons).

- [ ] **Step 2: Lesson row entry**

Add a quiz icon button in `SortableLessonRow` (Button wrapping Link, no
`asChild`) linking to the quiz page.

- [ ] **Step 3: Typecheck + lint**

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: PASS.

---

### Task 7: Full Verification

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

- From a lesson row, open the quiz page; create a quiz (title, time limit,
  pass score).
- Build a question MCQ with 2+ options and a correct answer; add an essay
  question; verify total points and pass-score points update in the summary.
- Switch an MCQ question to ESSAY and confirm options clear.
- Drag questions to reorder and confirm order persists after reload.
- Delete a quiz and confirm the 409 blocking message appears once it has
  attempts (if applicable).

## Completion Criteria

- Instructor can create/edit/delete a lesson-attached quiz and build its
  question list (MCQ options + correct answers + points, essay points only)
  with add/edit/delete and drag-to-reorder.
- `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build` all pass.
