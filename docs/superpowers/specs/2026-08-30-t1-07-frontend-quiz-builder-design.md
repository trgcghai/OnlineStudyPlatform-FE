# T1-07 Frontend Quiz Builder Design

## Goal

Give the Instructor a quiz builder per lesson: create a quiz (title,
description, time limit, pass score %, attached to a lesson), then build its
question list with two question types (MCQ with options/correct answers/points,
essay with points only), supporting add/edit/delete and drag-to-reorder of
questions, plus edit/delete of the quiz itself. The UI mirrors the backend
server returned by the T1-07 backend work.

## Sources

- Task: `ba/tasks/phase-1-lms-core/T1-07-quiz-builder.md`
- Backend design: `online-study-platform-be/docs/superpowers/specs/2026-08-30-t1-07-backend-quiz-builder-design.md`
- Backend API (lesson-scoped + manage routes): `online-study-platform-be/src/modules/quizzes/quizzes.controller.ts`
- FE conventions: `services/api/lessons.ts`, `hooks/useInstructorLessons.ts`,
  `lib/schemas/lesson.ts`, `lib/query-keys.ts`,
  `components/instructor/lessons/lesson-list.tsx`,
  `app/(instructor)/instructor/courses/[id]/lessons/page.tsx`

## Current Context

`services/api/lessons.ts` defines a lesson API layer that returns
`ApiSuccessResponse<T>` envelopes; `hooks/useInstructorLessons.ts` wraps it
with TanStack Query queries/mutations, `mapLessonError`, toast notifications,
and `instructorLessonKeys` invalidation. `lesson-list.tsx` renders lessons in a
drag-reorderable table using `@dnd-kit/react` sortable. There is no quiz code
in the frontend yet.

## Design Decisions

### 1. API layer — `services/api/quizzes.ts`

Expose typed functions wrapping `axiosClient` and returning `data.data`:

- `listQuizzes(courseId, lessonId)` → `QuizSummary[]`
  (`GET /courses/:courseId/lessons/:lessonId/quiz`)
- `createQuiz(courseId, lessonId, payload)` → `Quiz`
  (`POST /courses/:courseId/lessons/:lessonId/quiz`)
- `getQuiz(quizId)` → `Quiz` (`GET /quizzes/:id`)
- `updateQuiz(quizId, payload)` → `Quiz` (`PATCH /quizzes/:id`)
- `deleteQuiz(quizId)` → `void` (`DELETE /quizzes/:id`)
- `addQuestion(quizId, payload)` → `QuizQuestion` (`POST /quizzes/:quizId/questions`)
- `reorderQuestions(quizId, orderedIds)` → `QuizQuestion[]`
  (`PATCH /quizzes/:quizId/questions/reorder`)
- `updateQuestion(questionId, payload)` → `QuizQuestion` (`PATCH /questions/:id`)
- `deleteQuestion(questionId)` → `void` (`DELETE /questions/:id`)

Types: `QuizQuestionType` enum (`MCQ`/`ESSAY`), `Quiz`, `QuizSummary`,
`QuizQuestion`, and payload types. `QuizQuestionType` is exported as a value
(not type-only) because components use `QuizQuestionType.MCQ` as a runtime
default value.

### 2. Validation and labels — `lib/schemas/quiz.ts`

- `quizFormSchema`: `title` (required), `description` (optional), and numeric
  `passScore`. `timeLimitMinutes` is kept as a **string** field so the empty
  input means "no limit" while a filled value must parse to a whole minutes
  number within `1`–`600`. `passScore` and question `points` are real numbers
  wired with RHF `valueAsNumber` to avoid `z.coerce` inference friction.
- `questionFormSchema`: `type`, `content`, `points`, `options`, and
  `correctAnswers` with a `superRefine` gate: MCQ requires 2–10 non-empty
  options, at least one in-range correct answer; ESSAY ignores options.
- Labels: `QUIZ_QUESTION_TYPE_LABELS` (MCQ → "Trắc nghiệm", ESSAY → "Tự luận").

### 3. Query keys and hooks — `lib/query-keys.ts` + `hooks/useInstructorQuizzes.ts`

- Add `instructorQuizKeys` mirroring `instructorLessonKeys`:
  `list(courseId, lessonId)` and `detail(quizId)`.
- `useInstructorQuizzes(courseId, lessonId)` — list query.
- `useInstructorQuiz(quizId)` — detail query (builder data, includes questions).
- Mutation hooks: `useCreateInstructorQuiz`, `useUpdateInstructorQuiz`,
  `useDeleteInstructorQuiz`, `useAddInstructorQuestion`,
  `useUpdateInstructorQuestion`, `useDeleteInstructorQuestion`,
  `useReorderInstructorQuestions`. Each returns an async executor returning
  `{ ok, data?, message? }` and invalidates the relevant query keys. Question
  mutations invalidate both the `detail` (questions) and the `list` (question
  count / totals) keys.
- `mapQuizError`: 403 → no permission, 404 → not found/deleted, 409 →
  attempts-blocked message (backend `ATTEMPTS_BLOCKED_*` strings surface
  through `data.error.message`), 400/other → backend message or generic.

### 4. Components

- `quiz-list.tsx`: lists `QuizSummary` for the lesson with create/edit/delete
  and a "Xây dựng" (build) action. Hosts `QuizFormDialog` and
  `DeleteQuizDialog`.
- `quiz-form-dialog.tsx`: create/edit metadata form (title, description, time
  limit, pass score). Uses the RHF reset-in-effect pattern already used by
  `lesson-form-dialog` for edit seeding.
- `delete-quiz-dialog.tsx`: confirm delete; surfaces the 409 attempts-blocked
  message on failure.
- `question-builder.tsx`: renders the build view for a quiz — summary card
  (title, description, total points, pass score points), a
  drag-reorderable question list (`@dnd-kit/react` sortable, mirroring
  `lesson-list.tsx`), and add/edit/delete question actions.
- `question-form-dialog.tsx`: create/edit a single question. A type `Select`
  (`items={QUIZ_QUESTION_TYPE_LABELS}`) switches MCQ/ESSAY; MCQ renders an
  options editor with a "Đúng" checkbox per option plus add/remove; ESSAY shows
  an explanatory alert. Options/correct-answer state is local React state
  (not RHF arrays); the dialog is remounted via a `key` from the parent so
  state re-initializes fresh per open/with each edited question, and options
  are cleared synchronously when switching to ESSAY. On submit the payload is
  re-validated with `questionFormSchema` and MCQ/ESSAY shapes are produced.
- `delete-question-dialog.tsx`: confirm per-question delete.

### 5. Route and navigation

- New route page `app/(instructor)/instructor/courses/[id]/lessons/[lessonId]/quiz/page.tsx`
  (Client Component, `useParams<{ id: string; lessonId: string }>()`),
  loading the course for the header and toggling between `QuizList` (default)
  and `QuestionBuilder` (when a quiz is selected).
- Entry point: an icon button in each lesson row of
  `components/instructor/lessons/lesson-list.tsx` linking to the quiz page,
  using the existing Button-wrapping-Link pattern (no `asChild`; Button is a
  Base UI primitive).

## File Structure

- Add: `services/api/quizzes.ts`
- Add: `lib/schemas/quiz.ts`
- Modify: `lib/query-keys.ts`
- Add: `hooks/useInstructorQuizzes.ts`
- Add: `components/instructor/quizzes/{quiz-list,quiz-form-dialog,delete-quiz-dialog,question-builder,question-form-dialog,delete-question-dialog}.tsx`
- Add: `app/(instructor)/instructor/courses/[id]/lessons/[lessonId]/quiz/page.tsx`
- Modify: `components/instructor/lessons/lesson-list.tsx`

## Out Of Scope

- Learner taking the quiz, auto-grading, and result reporting (T1-12).
- Manual essay grading flow (T1-14).
- Enforcing pass score / total points server-side beyond what the backend does.

## Validation

- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm build`
