# Instructor Risk Learner Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace raw learner/enrollment identifiers on the instructor Learning Risk page with learner name/email and an enrollment-management link.

**Architecture:** This is a frontend-only rendering change. The backend already returns optional `learner` and `course` summaries; the frontend API type will be updated to match that response, and the existing risk learners table will consume those fields with safe fallbacks.

**Tech Stack:** Next.js App Router, React, TypeScript, TanStack Query, Tailwind CSS, existing shadcn/Base UI table and button components.

---

## File Structure

- Modify `services/api/risk.ts`: add optional `learner` and `course` summary types to `RiskScore`.
- Modify `components/instructor/risk/risk-learners-table.tsx`: render learner name/email, remove enrollment ID, and link learner info to the enrollments page filtered by learner email.

### Task 1: Update Risk API Types

**Files:**
- Modify: `services/api/risk.ts`

- [ ] **Step 1: Add frontend summary interfaces**

Add these interfaces above `RiskScore`:

```ts
export interface RiskLearnerSummary {
  id: string;
  name: string;
  email: string;
}

export interface RiskCourseSummary {
  id: string;
  title: string;
}
```

- [ ] **Step 2: Add optional summaries to `RiskScore`**

Update `RiskScore` to include:

```ts
learner?: RiskLearnerSummary;
course?: RiskCourseSummary;
```

Expected result:

```ts
export interface RiskScore {
  learnerId: string;
  courseId: string;
  enrollmentId: string;
  learner?: RiskLearnerSummary;
  course?: RiskCourseSummary;
  calculatedAt: string;
  score: number;
  band: RiskBand;
  featureVersion: string;
  scoringVersion: string;
  source: RiskSource;
  features: RiskFeatures;
  factors: RiskFactor[];
}
```

### Task 2: Render Learner Name/Email Link

**Files:**
- Modify: `components/instructor/risk/risk-learners-table.tsx`

- [ ] **Step 1: Import `Link`**

Add the Next.js link import:

```ts
import Link from "next/link";
```

- [ ] **Step 2: Build display values per row**

Inside `items.map`, after `topFactor`, derive stable display values:

```ts
const learnerName = item.learner?.name?.trim() || "Không rõ học viên";
const learnerEmail = item.learner?.email?.trim() || "Chưa có email";
const enrollmentHref = item.learner?.email?.trim()
  ? `/instructor/courses/${item.courseId}/enrollments?q=${encodeURIComponent(
      item.learner.email.trim(),
    )}`
  : null;
const courseTitle = item.course?.title?.trim() || course.title;
```

- [ ] **Step 3: Replace learner cell**

Replace the learner cell so it no longer renders `item.learnerId` or `item.enrollmentId`:

```tsx
<TableCell>
  {enrollmentHref ? (
    <Link
      href={enrollmentHref}
      className="flex flex-col rounded-md underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="font-medium">{learnerName}</span>
      <span className="text-xs text-muted-foreground">{learnerEmail}</span>
    </Link>
  ) : (
    <div className="flex flex-col">
      <span className="font-medium">{learnerName}</span>
      <span className="text-xs text-muted-foreground">{learnerEmail}</span>
    </div>
  )}
</TableCell>
```

- [ ] **Step 4: Prefer enriched course title**

Replace the course title cell content with:

```tsx
{courseTitle}
```

### Task 3: Verify

**Files:**
- Verify: `services/api/risk.ts`
- Verify: `components/instructor/risk/risk-learners-table.tsx`

- [ ] **Step 1: Run TypeScript check**

Run from `onlinestudyplatform-fe`:

```bash
pnpm exec tsc --noEmit
```

Expected: command exits successfully with no TypeScript errors.

- [ ] **Step 2: Inspect diff**

Run from `onlinestudyplatform-fe`:

```bash
git diff -- services/api/risk.ts components/instructor/risk/risk-learners-table.tsx docs/superpowers/specs/2026-10-12-instructor-risk-learner-display-design.md docs/superpowers/plans/2026-10-12-instructor-risk-learner-display.md
```

Expected: diff only includes the approved type, UI, spec, and plan changes.
