# nuqs URL Filter State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist existing filter/search/pagination state in URL query params with nuqs so reload/share keeps the same filtered views.

**Architecture:** Add `NuqsAdapter` once at the app root, create a shared parser module for reusable query-state definitions, then refactor each existing filter page to use `useQueryStates` as the source of truth. Keep toolbars controlled by props and keep all URL updates as `history: "replace"` with default params omitted.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, TanStack Query, nuqs 2.10.1, existing shared UI components.

---

## File Structure

- Modify: `app/layout.tsx`
  - Wrap existing providers with `NuqsAdapter`.
- Create: `lib/search-params/filter-parsers.ts`
  - Shared nuqs parser constants/factories for `q`, `page`, `limit`, and enum-like filters.
- Modify: `app/(public)/courses/page.tsx`
  - Replace local catalog filter state with URL-backed query state.
- Modify: `app/(admin)/admin/users/page.tsx`
  - Replace local user filter state with URL-backed query state.
- Modify: `app/(admin)/admin/courses/approvals/page.tsx`
  - Replace local approval filter state with URL-backed query state.
- Modify: `app/(instructor)/instructor/courses/page.tsx`
  - Replace local instructor course filter state with URL-backed query state.
- Modify: `app/(instructor)/instructor/courses/[id]/enrollments/page.tsx`
  - Replace local enrollment search/pagination state with URL-backed query state.
- Modify: `components/instructor/essay-grading/essay-grading-workbench.tsx`
  - Replace local selector/filter/pagination state with URL-backed query state and dependency clearing.
- Inspect only: `components/admin/users/admin-users-toolbar.tsx`
  - Confirm the toolbar remains controlled by `search`, `roleFilter`, and `statusFilter` props.
- Inspect only: `components/admin/courses/course-approvals-toolbar.tsx`
  - Confirm the toolbar remains controlled by `search` and `categoryFilter` props.
- Inspect only: `components/instructor/courses/instructor-courses-toolbar.tsx`
  - Confirm the toolbar remains controlled by `search`, `categoryFilter`, and `statusFilter` props.

Do not change backend code for this task.

---

### Task 1: Wire nuqs Adapter

**Related skills:** `nextjs`, `nuqs`, `vercel-react-best-practices`

**Files:**
- Modify: `app/layout.tsx`
- Read before coding: relevant local Next docs under `node_modules/next/dist/docs/` for App Router root layout/provider usage, per `onlinestudyplatform-fe/AGENTS.md`.

- [ ] **Step 1: Confirm nuqs dependency and current provider tree**

Run: `pnpm exec tsc --noEmit`

Expected: current code typechecks before adapter edit.

- [ ] **Step 2: Add `NuqsAdapter` around route children inside existing providers**

Modify `app/layout.tsx` imports:

```tsx
import { NuqsAdapter } from "nuqs/adapters/next/app";
```

Modify the provider tree so the child subtree is wrapped:

```tsx
<ReduxProvider>
  <QueryProvider>
    <NuqsAdapter>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster />
    </NuqsAdapter>
  </QueryProvider>
</ReduxProvider>
```

Keep the existing `ThemeProvider`, `ReduxProvider`, `QueryProvider`, `TooltipProvider`, and `Toaster` order otherwise unchanged.

- [ ] **Step 3: Verify adapter edit**

Run: `pnpm exec tsc --noEmit`

Expected: command exits successfully with no output.

---

### Task 2: Add Shared nuqs Parser Utilities

**Related skills:** `nuqs`, `vercel-react-best-practices`

**Files:**
- Create: `lib/search-params/filter-parsers.ts`

- [ ] **Step 1: Create shared parser module**

Create `lib/search-params/filter-parsers.ts`:

```ts
import {
  debounce,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs";
import { COURSE_CATEGORIES } from "@/lib/schemas/course";
import { COURSE_STATUSES } from "@/services/api/courses";
import { ESSAY_GRADING_STATUS_FILTERS } from "@/services/api/essay-grading";

export const URL_FILTER_HISTORY = "replace" as const;
export const URL_SEARCH_DEBOUNCE_MS = 500;
export const USER_ROLE_FILTER_VALUES = ["Instructor", "Learner"] as const;
export const USER_STATUS_FILTER_VALUES = ["Active", "Inactive"] as const;
export const COURSE_STATUS_FILTER_VALUES = [
  COURSE_STATUSES.DRAFT,
  COURSE_STATUSES.PENDING,
  COURSE_STATUSES.PUBLISHED,
  COURSE_STATUSES.REJECTED,
] as const;
export const ESSAY_GRADING_STATUS_FILTER_VALUES = [
  ESSAY_GRADING_STATUS_FILTERS.PENDING,
  ESSAY_GRADING_STATUS_FILTERS.GRADED,
  ESSAY_GRADING_STATUS_FILTERS.ALL,
] as const;

export const pageParser = parseAsInteger.withDefault(1);

export function limitParser(defaultLimit: number) {
  return parseAsInteger.withDefault(defaultLimit);
}

export const searchParser = parseAsString.withDefault("").withOptions({
  history: URL_FILTER_HISTORY,
  limitUrlUpdates: debounce(URL_SEARCH_DEBOUNCE_MS),
});

export const courseCategoryFilterParser = parseAsStringLiteral([
  "",
  ...COURSE_CATEGORIES,
] as const).withDefault("");

export const courseStatusFilterParser = parseAsStringLiteral([
  "",
  ...COURSE_STATUS_FILTER_VALUES,
] as const).withDefault("");

export const userRoleFilterParser = parseAsStringLiteral([
  "",
  ...USER_ROLE_FILTER_VALUES,
] as const).withDefault("");

export const userStatusFilterParser = parseAsStringLiteral([
  "",
  ...USER_STATUS_FILTER_VALUES,
] as const).withDefault("");

export const essayGradingStatusParser = parseAsStringLiteral(
  ESSAY_GRADING_STATUS_FILTER_VALUES,
).withDefault(ESSAY_GRADING_STATUS_FILTERS.PENDING);
```

- [ ] **Step 2: Verify parser module**

Run: `pnpm exec tsc --noEmit`

Expected: command exits successfully.

---

### Task 3: Refactor Public Course Catalog URL State

**Related skills:** `nextjs`, `nuqs`, `vercel-react-best-practices`

**Files:**
- Modify: `app/(public)/courses/page.tsx`

- [ ] **Step 1: Replace local filter/page state with `useQueryStates`**

Remove `useDebounce` import and local `useState` for `page`, `keyword`, and `categoryFilter`.

Add imports:

```tsx
import { useQueryStates } from "nuqs";
import {
  courseCategoryFilterParser,
  pageParser,
  searchParser,
  URL_FILTER_HISTORY,
} from "@/lib/search-params/filter-parsers";
```

Inside `CoursePage`, add:

```tsx
const [filters, setFilters] = useQueryStates(
  {
    q: searchParser,
    category: courseCategoryFilterParser,
    page: pageParser,
  },
  { history: URL_FILTER_HISTORY },
);
```

- [ ] **Step 2: Build API filters from URL state**

Use `filters` in the existing query:

```tsx
const coursesQuery = usePublishedCoursesList({
  page: filters.page,
  limit: CATALOG_LIMIT,
  q: filters.q || undefined,
  category: filters.category || undefined,
});
```

- [ ] **Step 3: Update input/select/clear callbacks**

Use this input value/change pattern:

```tsx
value={filters.q}
onChange={(event) => {
  void setFilters({ q: event.target.value, page: 1 });
}}
```

Use this category change pattern:

```tsx
onValueChange={(value) => {
  void setFilters({ category: value as CategoryFilter, page: 1 });
}}
```

Use this clear pattern:

```tsx
onClick={() => {
  void setFilters({ q: "", category: ALL_OPTION, page: 1 });
}}
```

Update pagination:

```tsx
page={filters.page}
onPageChange={(nextPage) => {
  void setFilters({ page: nextPage });
}}
```

- [ ] **Step 4: Verify catalog refactor**

Run: `pnpm exec tsc --noEmit`

Expected: command exits successfully.

---

### Task 4: Refactor Admin User Management URL State

**Related skills:** `nextjs`, `nuqs`, `vercel-react-best-practices`

**Files:**
- Modify: `app/(admin)/admin/users/page.tsx`
- Inspect only: `components/admin/users/admin-users-toolbar.tsx`

- [ ] **Step 1: Replace local filter/page state with `useQueryStates`**

Remove `useDebounce` import and local `useState` for `roleFilter`, `statusFilter`, `search`, `page`, and `pageSize`.

Add imports:

```tsx
import { useQueryStates } from "nuqs";
import {
  limitParser,
  pageParser,
  searchParser,
  userRoleFilterParser,
  userStatusFilterParser,
  URL_FILTER_HISTORY,
} from "@/lib/search-params/filter-parsers";
```

Inside `AdminUsersPage`, add:

```tsx
const [filtersState, setFiltersState] = useQueryStates(
  {
    q: searchParser,
    role: userRoleFilterParser,
    status: userStatusFilterParser,
    page: pageParser,
    limit: limitParser(USER_LIST_PAGE_SIZE),
  },
  { history: URL_FILTER_HISTORY },
);
```

- [ ] **Step 2: Build API filters from URL state**

Replace the existing `filters` memo body with:

```tsx
const filters = useMemo<AdminUserFilters>(
  () => ({
    role: filtersState.role || undefined,
    status: filtersState.status || undefined,
    q: filtersState.q || undefined,
    page: filtersState.page,
    limit: filtersState.limit,
  }),
  [filtersState],
);
```

- [ ] **Step 3: Update toolbar and pagination callbacks**

Pass URL state to `AdminUsersToolbar`:

```tsx
<AdminUsersToolbar
  roleFilter={filtersState.role}
  search={filtersState.q}
  statusFilter={filtersState.status}
  onRoleChange={(value) => {
    void setFiltersState({ role: value, page: 1 });
  }}
  onSearchChange={(value) => {
    void setFiltersState({ q: value, page: 1 });
  }}
  onStatusChange={(value) => {
    void setFiltersState({ status: value, page: 1 });
  }}
/>
```

Update pagination:

```tsx
<Pagination
  page={filtersState.page}
  totalPages={totalPages}
  totalItems={totalUsers}
  pageSize={filtersState.limit}
  onPageChange={(nextPage) => {
    void setFiltersState({ page: nextPage });
  }}
  onPageSizeChange={(size) => {
    void setFiltersState({ limit: size, page: 1 });
  }}
/>
```

- [ ] **Step 4: Verify admin user refactor**

Run: `pnpm exec tsc --noEmit`

Expected: command exits successfully.

---

### Task 5: Refactor Admin Course Approvals URL State

**Related skills:** `nextjs`, `nuqs`, `vercel-react-best-practices`

**Files:**
- Modify: `app/(admin)/admin/courses/approvals/page.tsx`
- Inspect only: `components/admin/courses/course-approvals-toolbar.tsx`

- [ ] **Step 1: Replace local query state with `useQueryStates`**

Remove `useDebounce` import and local `useState` for `search`, `categoryFilter`, `page`, and `pageSize`.

Add imports:

```tsx
import { useQueryStates } from "nuqs";
import {
  courseCategoryFilterParser,
  limitParser,
  pageParser,
  searchParser,
  URL_FILTER_HISTORY,
} from "@/lib/search-params/filter-parsers";
```

Inside `AdminCourseApprovalsPage`, add:

```tsx
const [filtersState, setFiltersState] = useQueryStates(
  {
    q: searchParser,
    category: courseCategoryFilterParser,
    page: pageParser,
    limit: limitParser(COURSE_LIST_PAGE_SIZE),
  },
  { history: URL_FILTER_HISTORY },
);
```

- [ ] **Step 2: Build API filters from URL state**

Use:

```tsx
const filters = useMemo<CourseListFilters>(
  () => ({
    page: filtersState.page,
    limit: filtersState.limit,
    q: filtersState.q || undefined,
    category: filtersState.category || undefined,
    sortBy: "updatedAt",
    sortOrder: "DESC",
  }),
  [filtersState],
);
```

- [ ] **Step 3: Update toolbar and pagination callbacks**

Use:

```tsx
const hasActiveFilters =
  Boolean(filtersState.q) || filtersState.category !== ALL_OPTION;

function clearFilters() {
  void setFiltersState({ q: "", category: ALL_OPTION, page: 1 });
}
```

Pass callbacks:

```tsx
onCategoryChange={(value) => {
  void setFiltersState({ category: value, page: 1 });
}}
onSearchChange={(value) => {
  void setFiltersState({ q: value, page: 1 });
}}
```

Update pagination with:

```tsx
<Pagination
  page={filtersState.page}
  totalPages={totalPages}
  totalItems={totalItems}
  pageSize={filtersState.limit}
  onPageChange={(nextPage) => {
    void setFiltersState({ page: nextPage });
  }}
  onPageSizeChange={(size) => {
    void setFiltersState({ limit: size, page: 1 });
  }}
/>
```

- [ ] **Step 4: Verify course approval refactor**

Run: `pnpm exec tsc --noEmit`

Expected: command exits successfully.

---

### Task 6: Refactor Instructor Course Management URL State

**Related skills:** `nextjs`, `nuqs`, `vercel-react-best-practices`

**Files:**
- Modify: `app/(instructor)/instructor/courses/page.tsx`
- Inspect only: `components/instructor/courses/instructor-courses-toolbar.tsx`

- [ ] **Step 1: Replace local query state with `useQueryStates`**

Remove `useDebounce` import and local `useState` for `search`, `categoryFilter`, `statusFilter`, `page`, and `pageSize`.

Keep unrelated local state like `deletingCourse`.

Add imports:

```tsx
import { useQueryStates } from "nuqs";
import {
  courseCategoryFilterParser,
  courseStatusFilterParser,
  limitParser,
  pageParser,
  searchParser,
  URL_FILTER_HISTORY,
} from "@/lib/search-params/filter-parsers";
```

Inside `InstructorCoursesPage`, add:

```tsx
const [filtersState, setFiltersState] = useQueryStates(
  {
    q: searchParser,
    category: courseCategoryFilterParser,
    status: courseStatusFilterParser,
    page: pageParser,
    limit: limitParser(COURSE_LIST_PAGE_SIZE),
  },
  { history: URL_FILTER_HISTORY },
);
```

- [ ] **Step 2: Build API filters from URL state**

Use:

```tsx
const filters = useMemo<CourseListFilters>(
  () => ({
    page: filtersState.page,
    limit: filtersState.limit,
    q: filtersState.q || undefined,
    category: filtersState.category || undefined,
    status: filtersState.status || undefined,
    sortBy: "updatedAt",
    sortOrder: "DESC",
  }),
  [filtersState],
);
```

- [ ] **Step 3: Update toolbar and pagination callbacks**

Use:

```tsx
const hasActiveFilters =
  Boolean(filtersState.q) ||
  filtersState.category !== ALL_OPTION ||
  filtersState.status !== ALL_OPTION;

function clearFilters() {
  void setFiltersState({
    q: "",
    category: ALL_OPTION,
    status: ALL_OPTION,
    page: 1,
  });
}
```

Pass toolbar values and callbacks with:

```tsx
<InstructorCoursesToolbar
  categoryFilter={filtersState.category}
  hasActiveFilters={hasActiveFilters}
  search={filtersState.q}
  statusFilter={filtersState.status}
  onCategoryChange={(value) => {
    void setFiltersState({ category: value, page: 1 });
  }}
  onClearFilters={clearFilters}
  onSearchChange={(value) => {
    void setFiltersState({ q: value, page: 1 });
  }}
  onStatusChange={(value) => {
    void setFiltersState({ status: value, page: 1 });
  }}
/>
```

Update pagination with:

```tsx
<Pagination
  page={filtersState.page}
  totalPages={totalPages}
  totalItems={totalItems}
  pageSize={filtersState.limit}
  onPageChange={(nextPage) => {
    void setFiltersState({ page: nextPage });
  }}
  onPageSizeChange={(size) => {
    void setFiltersState({ limit: size, page: 1 });
  }}
/>
```

- [ ] **Step 4: Verify instructor course refactor**

Run: `pnpm exec tsc --noEmit`

Expected: command exits successfully.

---

### Task 7: Refactor Instructor Enrollment View URL State

**Related skills:** `nextjs`, `nuqs`, `vercel-react-best-practices`

**Files:**
- Modify: `app/(instructor)/instructor/courses/[id]/enrollments/page.tsx`

- [ ] **Step 1: Replace local search/page state with `useQueryStates`**

Remove `useDebounce` import and local `useState` for `search`, `page`, and `pageSize`.

Add imports:

```tsx
import { useQueryStates } from "nuqs";
import {
  limitParser,
  pageParser,
  searchParser,
  URL_FILTER_HISTORY,
} from "@/lib/search-params/filter-parsers";
```

Inside `CourseEnrollmentsPage`, add:

```tsx
const [filtersState, setFiltersState] = useQueryStates(
  {
    q: searchParser,
    page: pageParser,
    limit: limitParser(DEFAULT_PAGE_SIZE),
  },
  { history: URL_FILTER_HISTORY },
);
```

- [ ] **Step 2: Build API filters from URL state**

Use:

```tsx
const filters = useMemo<CourseEnrollmentListFilters>(
  () => ({
    page: filtersState.page,
    limit: filtersState.limit,
    q: filtersState.q || undefined,
  }),
  [filtersState],
);
```

Use:

```tsx
const hasSearch = Boolean(filtersState.q);
```

- [ ] **Step 3: Update input and pagination callbacks**

Use:

```tsx
<Input
  value={filtersState.q}
  onChange={(event) => {
    void setFiltersState({ q: event.target.value, page: 1 });
  }}
  placeholder="Tìm theo tên hoặc email học viên..."
  className="pl-9"
/>
```

Update pagination with:

```tsx
<Pagination
  page={filtersState.page}
  totalPages={totalPages}
  totalItems={totalItems}
  pageSize={filtersState.limit}
  onPageChange={(nextPage) => {
    void setFiltersState({ page: nextPage });
  }}
  onPageSizeChange={(size) => {
    void setFiltersState({ limit: size, page: 1 });
  }}
/>
```

- [ ] **Step 4: Verify enrollment refactor**

Run: `pnpm exec tsc --noEmit`

Expected: command exits successfully.

---

### Task 8: Refactor Essay Grading Selectors and Pagination URL State

**Related skills:** `nextjs`, `nuqs`, `vercel-react-best-practices`

**Files:**
- Modify: `components/instructor/essay-grading/essay-grading-workbench.tsx`
- Read as needed: `components/instructor/essay-grading/essay-grading-selectors.tsx`

- [ ] **Step 1: Inspect current local selector state**

Read `components/instructor/essay-grading/essay-grading-workbench.tsx` and identify the current `courseId`, `lessonId`, `quizId`, and `status` state variables and handlers.

- [ ] **Step 2: Replace selector and pagination state with URL state**

Add imports:

```tsx
import { useQueryStates, parseAsString } from "nuqs";
import {
  essayGradingStatusParser,
  limitParser,
  pageParser,
  URL_FILTER_HISTORY,
} from "@/lib/search-params/filter-parsers";
```

Inside `EssayGradingWorkbench`, add URL state:

```tsx
const [filtersState, setFiltersState] = useQueryStates(
  {
    courseId: parseAsString.withDefault(""),
    lessonId: parseAsString.withDefault(""),
    quizId: parseAsString.withDefault(""),
    status: essayGradingStatusParser,
    page: pageParser,
    limit: limitParser(ESSAY_GRADING_PAGE_SIZE),
  },
  { history: URL_FILTER_HISTORY },
);
```

Use `filtersState.courseId`, `filtersState.lessonId`, `filtersState.quizId`, `filtersState.status`, `filtersState.page`, and `filtersState.limit` wherever the current local state is used.

- [ ] **Step 3: Preserve dependent clearing rules**

Use these selector handlers:

```tsx
function handleCourseChange(value: string) {
  void setFiltersState({ courseId: value, lessonId: "", quizId: "", page: 1 });
}

function handleLessonChange(value: string) {
  void setFiltersState({ lessonId: value, quizId: "", page: 1 });
}

function handleQuizChange(value: string) {
  void setFiltersState({ quizId: value, page: 1 });
}

function handleStatusChange(value: EssayGradingStatusFilter) {
  void setFiltersState({ status: value, page: 1 });
}

function handlePageSizeChange(value: number) {
  setSelectedAttemptId(null);
  void setFiltersState({ limit: value, page: 1 });
}
```

Keep `selectedAttemptId` as local React state. Clear it in selector/page-size handlers as the current component does.

Use `Pagination` with URL-backed values:

```tsx
<Pagination
  page={filtersState.page}
  totalPages={totalPages}
  totalItems={totalItems}
  pageSize={filtersState.limit}
  onPageChange={(nextPage) => {
    void setFiltersState({ page: nextPage });
  }}
  onPageSizeChange={handlePageSizeChange}
/>
```

Use the existing default status `ESSAY_GRADING_STATUS_FILTERS.PENDING`; do not change initial essay grading behavior.

- [ ] **Step 4: Verify essay grading refactor**

Run: `pnpm exec tsc --noEmit`

Expected: command exits successfully.

---

### Task 9: Remove Unused Debounce Hook Imports From Refactored Pages

**Related skills:** `vercel-react-best-practices`

**Files:**
- Modify as needed: refactored page files from Tasks 3-7
- Do not delete: `hooks/useDebounce.ts` unless no remaining consumers exist and the diff is obviously safe.

- [ ] **Step 1: Search for `useDebounce` usage**

Run:

```powershell
Get-ChildItem -Path "app","components","hooks" -Recurse -Include "*.tsx","*.ts" | ForEach-Object { $path = $_.FullName; $content = Get-Content -LiteralPath $path -Raw; if ($content -match "useDebounce") { $path.Replace((Get-Location).Path + '\\','') } }
```

Expected after Tasks 3-7: only `hooks/useDebounce.ts` remains, or other unrelated legitimate consumers remain.

- [ ] **Step 2: Remove only unused imports/state**

If any refactored page still imports `useDebounce`, remove that import and any derived debounced variables.

- [ ] **Step 3: Verify cleanup**

Run: `pnpm exec tsc --noEmit`

Expected: command exits successfully.

---

### Task 10: Full Verification and Manual Test Checklist

**Related skills:** `verification-before-completion`, `requesting-code-review`

**Files:**
- No code edits expected unless verification reveals a defect.

- [ ] **Step 1: Run full FE verification**

Run:

```powershell
pnpm lint
```

Expected: exits successfully.

Run:

```powershell
pnpm exec tsc --noEmit
```

Expected: exits successfully with no output.

Run:

```powershell
pnpm build
```

Expected: Next.js build succeeds and includes the existing routes.

- [ ] **Step 2: Manual test URL persistence**

Test each route:

- `/courses`: set `q`, set category, go to page 2 if available, reload, confirm state persists.
- `/admin/users`: set `q`, role, status, page size, page, reload, confirm state persists.
- `/admin/courses/approvals`: set `q`, category, page size, page, reload, confirm state persists.
- `/instructor/courses`: set `q`, category, status, page size, page, reload, confirm state persists.
- `/instructor/courses/[id]/enrollments`: set `q`, page size, page, reload, confirm state persists.
- `/instructor/essay-grading`: select course, lesson, quiz, status, page size, page, reload, confirm state persists.

- [ ] **Step 3: Manual test clean URL/default clearing**

For each refactored page:

- Clear search and filters.
- Return page to `1`.
- Return page size to default where applicable.
- Confirm default params are omitted from URL.

- [ ] **Step 4: Manual test reset rules**

For list pages:

- Change a filter while on page `2`.
- Confirm URL/page state resets to page `1`.

For essay grading:

- Change `courseId` and confirm `lessonId` and `quizId` disappear from the URL.
- Change `lessonId` and confirm `quizId` disappears from the URL.
- Change `status` and confirm course/lesson/quiz remain.

- [ ] **Step 5: Review final diff/status**

Run:

```powershell
git status --short
```

Expected: only intended frontend files are changed.

Run:

```powershell
git diff --stat
```

Expected: changes are limited to nuqs adapter setup, parser utilities, filter pages, and any necessary toolbar prop cleanup.

Do not commit unless the user explicitly asks.
