# Risk Learner Sheet Single Source Design

## Context

`RiskLearnerSheet` currently receives a learner row from the parent table and also fetches learner detail data. The sheet then chooses `detail.latest ?? learner`, which creates two sources of truth and can swap response shapes while the sheet is open.

## Goals

- Make `RiskLearnerSheet` a pure quick-view component.
- Use only the `learner` prop passed from the parent table.
- Keep the detail API call only on the learner detail page.
- Display learner name and email only from `learner.learner`.
- Avoid showing raw learner IDs or enrollment IDs in the sheet.

## Design

Remove `useRiskLearnerDetail` from `RiskLearnerSheet`. The sheet should render from `learner` only. When `learner` is null, the sheet body should not render risk content. When present, assign `const score = learner` and use `score` for all risk values.

The backend now normalizes required risk fields, so the sheet can use `score.features`, `score.factors`, `score.score`, and `score.band` directly. `score.learner` remains optional because enrichment can be absent; if missing, show `Không có thông tin học viên` and do not create an enrollment link. If present, show name and email and link to `/instructor/courses/{courseId}/enrollments?q={email}`.

The detail page remains responsible for calling `useRiskLearnerDetail`.

## Verification

Run frontend typecheck with `pnpm exec tsc --noEmit`.
