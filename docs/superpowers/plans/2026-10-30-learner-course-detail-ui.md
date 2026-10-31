# Learner Course Detail UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the learner-facing course detail page with a clearer course-first editorial hierarchy while preserving existing behavior and API usage.

**Architecture:** Keep the existing `CourseDetailClient` query, state, handlers, route, and conditional action branches. Rework only its rendered presentation into a course-cover/action row with equal desktop heights, course title and metadata beneath, then description and native collapsible lesson outline side by side on desktop and stacked on small screens. The action panel is non-sticky. Use existing design tokens and UI primitives.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, existing shadcn/Base UI components and Lucide icons.

**Spec:** `docs/superpowers/specs/2026-10-30-learner-course-detail-ui-design.md`

## Global Constraints

- Frontend only; do not modify backend or AI repositories.
- Continue using `usePublishedCourse` and the existing enrollment/cart hooks and API data.
- Do not change route behavior, state transitions, authorization/role gates, enrollment/payment logic, or error/loading behavior.
- Do not add endpoints, data fields, testimonials, ratings, instructor details, dependencies, or new interactions.
- Do not change shared global theme tokens or redesign unrelated pages.
- Keep current Vietnamese copy and existing action labels and payment messaging.
- Make the lesson outline the only new interaction; implement it with native keyboard-accessible disclosure semantics.

## Review Focus

- Long course titles and metadata at narrow widths: check wrapping and hierarchy at 375px.
- Missing thumbnail: preserve the current fallback and confirm the hero remains balanced.
- Empty lesson list: retain the current empty message in the curriculum section.
- Long lesson titles: ensure sequence markers remain aligned and text wraps without overflow.
- Role, enrollment, and price combinations: verify every existing CTA/alert branch is still present and in its original condition.

---

### Task 1: Redesign the course detail presentation

**Files:**
- Modify: `app/(public)/courses/[courseId]/course-detail-client.tsx`
- Reference: `hooks/usePublicCourses.ts`, `hooks/useCart.ts`, `hooks/useEnrollments.ts`, `services/api/courses.ts`

**Deliverable:** The page places the course cover and existing action/price card in the same desktop grid row, with the card stretched to the cover height and its contents spaced as a flex column. The action card is not sticky. The category, title, and existing instructor/update metadata sit beneath the cover. Description and a native, open-by-default collapsible ordered lesson outline appear side by side on desktop and stacked on small screens.

- [x] **Step 1: Read the relevant local Next.js guidance before editing**

  From `node_modules/next/dist/docs/`, read the current App Router client-component and Image guidance relevant to the existing page. Preserve the current client boundary and `Image` usage unless the docs require a correction for this UI-only change.

- [x] **Step 2: Restructure only the rendered page layout**

  In `CourseDetailClient`, update the JSX and Tailwind classes to implement the approved course-first hierarchy. Keep the existing query, derived course/lesson data, event handlers, local `paymentRequired` state, action conditions, button labels, toast behavior, links, loading/error branches, and thumbnail fallback unchanged. Use existing theme tokens; add no dependencies or new interaction state.

- [x] **Step 3: Review the responsive and state variants**

  Review the responsive classes at 375px, 768px, 1024px, and 1440px. Check long title and lesson wrapping, thumbnail-present and fallback layouts, empty lessons, light and dark themes, visible keyboard focus, native disclosure semantics, and all existing action branches. Confirm the action card is non-sticky and the description and lessons stack on small screens.

  Execution note: Browser preview could not be started because `next dev` fails with `spawn EPERM`; responsive layout was reviewed statically, with no rendered screenshot claim.

- [x] **Step 4: Run focused static checks**

  Run: `pnpm exec eslint 'app/(public)/courses/[courseId]/course-detail-client.tsx'`
  Expected: no lint errors.

  Run: `pnpm exec tsc --noEmit`
  Expected: typecheck succeeds.

### Task 2: Review the frontend-only change

**Files:**
- Review: `app/(public)/courses/[courseId]/course-detail-client.tsx`

- [x] **Step 1: Check the final diff against the design constraints**

  Confirm only frontend presentation changed; no API calls, hooks, handlers, route behavior, conditions, copy, or backend/AI files changed. Confirm headings are sequential and semantic, theme tokens work in light/dark mode, and focus styling remains visible.
