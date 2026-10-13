# Risk Learner Sheet Single Source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Do not commit unless explicitly requested.

**Goal:** Refactor `RiskLearnerSheet` to render only from the parent-provided learner row and stop fetching detail data.

**Architecture:** Keep the quick-view sheet as a presentational client component. The learner detail page remains the only UI path that calls the detail endpoint.

**Tech Stack:** Next.js App Router, React, TypeScript, existing risk DTOs and UI components.

---

## Task 1: Refactor Sheet Data Source

**Related skills:** `nextjs`, `test-driven-development`, `verification-before-completion`

**Files:**
- Modify: `components/instructor/risk/risk-learner-sheet.tsx`

- [ ] Remove `Alert`, `AlertDescription`, `AlertTitle`, `Skeleton`, and `useRiskLearnerDetail` imports.
- [ ] Remove `detailQuery` and `latest` fallback logic.
- [ ] Use `const score = learner;` as the only data source.
- [ ] Render the risk body only when `score` exists.
- [ ] Read learner name/email only from `score.learner`.
- [ ] If `score.learner` is missing, render `Không có thông tin học viên` and no enrollment link.
- [ ] Use `score.features`, `score.factors`, `score.score`, `score.band`, `score.calculatedAt`, `score.courseId`, and `score.learnerId` directly.

## Task 2: Verify

**Related skills:** `verification-before-completion`

**Files:**
- Verify: `components/instructor/risk/risk-learner-sheet.tsx`

- [ ] Run from `onlinestudyplatform-fe`: `pnpm exec tsc --noEmit`
- [ ] Inspect diff for only the sheet refactor and docs.
