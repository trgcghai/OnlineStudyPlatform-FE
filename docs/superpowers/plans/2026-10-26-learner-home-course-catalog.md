# Learner Home and Course Catalog UI Implementation Plan

> **For agentic workers:** Implement task-by-task in the existing frontend branch.

**Goal:** Redesign `/` as a learner-aware home and `/courses` as a more engaging catalog, using existing frontend APIs only.

**Architecture:** Keep both pages in the public route group. On `/`, branch presentation by the existing Redux auth state and use `useLearnerDashboard` only for learners; retain recommendation and latest-course hooks. On `/courses`, preserve `nuqs` URL state, existing API query, category filter, and pagination while improving visual hierarchy and responsive layout.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, TanStack Query, Redux Toolkit, nuqs, existing shadcn/Base UI components.

**Spec:** Approved design proposal in the conversation: learner-first home with visitor discovery fallback; visual catalog; frontend-only and existing APIs only.

## Global Constraints

- Do not add or change backend work or API endpoints.
- Reuse the existing learner dashboard, recommendation, latest course, and public catalog hooks.
- Keep interface copy in Vietnamese, matching current product language.
- Maintain responsive layout, visible focus states, and reduced-motion-safe interactions.
- Do not add tests or test frameworks; no FE test script is configured.

## Review Focus

- Learner dashboard loading, error, and empty enrollment states remain clear.
- Visitor, learner, and non-learner experiences do not invoke learner-only dashboard data.
- Search, category, clear filters, and pagination keep their existing URL-backed behavior.
- Long course titles, missing thumbnails, and small viewport layouts remain usable.
- No displayed progress or activity is fabricated; learner metrics come from the existing dashboard response.

---

### Task 1: Learner-aware home page

**Files:**
- Modify: `app/(public)/page.tsx`
- Reference: `hooks/useLearnerDashboard.ts`, `services/api/learner-dashboard.ts`, `components/courses/public-course-section.tsx`

**Deliverable:** A signed-in learner sees a greeting, continue-learning focus, real dashboard summaries, enrolled progress and recent activity, followed by recommendations and latest courses. A learner with no enrollments gets a discovery prompt. Visitors and other roles retain course discovery. Use the existing `/learner/dashboard` endpoint through its hook only.

**Check:** Inspect loading, error, empty, visitor, and learner branches in code; confirm every learner-specific displayed value maps to the existing API response.

### Task 2: More visual public course catalog

**Files:**
- Modify: `app/(public)/courses/page.tsx`
- Reuse: `components/courses/public-course-card.tsx`, existing filters and pagination components

**Deliverable:** Add a stronger catalog introduction, clearer result context and filter presentation, and responsive grid hierarchy while keeping query semantics and card navigation unchanged. Use course data already returned by the public catalog query.

**Check:** Inspect URL state updates for search, category, reset, and pagination, and review layout for loading, error, empty, and populated states.

### Task 3: Final implementation review

- Review only the frontend diff for accidental API or behavior changes.
- Check responsive classes, keyboard focus, and reduced-motion behavior.
- Run no tests or build commands unless requested by the user.
