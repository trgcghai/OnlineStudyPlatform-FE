# Risk Score Response Normalization Design

## Context

The instructor Learning Risk UI exposed runtime crashes when opening the quick detail sheet. The frontend TypeScript contract expected risk score fields such as `features` and `factors` to always exist, but some runtime API responses can be partial. Examples include missing `factors`, incomplete `features`, or missing enriched learner/course summaries.

The frontend now has defensive guards, but the root contract mismatch should be fixed at the backend response boundary so all consumers receive stable risk score data.

## Goals

- Ensure every backend risk score response has a safe, complete shape.
- Preserve existing real risk values when present.
- Prevent old or partial Mongo risk score documents from crashing frontend consumers.
- Keep frontend guards as a safety net, not as the primary data-contract fix.
- Avoid a broad database migration unless explicitly needed later.

## Non-Goals

- Do not change the risk scoring algorithm.
- Do not rewrite historical risk scores.
- Do not add a Mongo backfill script in this phase.
- Do not change instructor UI layout beyond existing defensive rendering.

## Recommended Approach

Add backend normalization before returning risk score responses from the Risk module.

The normalization layer should ensure:

- `factors` is always an array. If missing or invalid, return `[]`.
- `features` always includes every `RiskFeatures` key.
- Missing or invalid numeric feature values become `0`.
- Missing or invalid numeric score/factor values are handled safely where applicable.
- Existing valid `learner` and `course` enrichment remains unchanged.

The best location is in `RiskService`, close to `enrichScores`, because list and detail endpoints already pass through this service before returning data. This keeps the fix at the API response boundary without changing persistence semantics.

## Affected Backend Flows

- `GET /risk/courses/:courseId/learners`
- `GET /risk/courses/:courseId/learners/:learnerId`
- Any service path that returns `RiskScoreResponse` objects to API consumers after reading persisted scores.

## Data Shape Rules

Default `RiskFeatures` values should include all current feature keys:

- `lastActivityDays`
- `activityCount7d`
- `expectedProgressGap`
- `courseProgressPercent`
- `quizScoreAvgPercent`
- `quizPassRate`
- `watchRatioAvg`
- `abandonedAttemptCount`
- `lateQuizCount`
- `completionVelocity`
- `totalWatchedSeconds`
- `pauseCount`

All defaults should be `0`.

`factors` should default to `[]`. If factors exist, keep valid factor objects and preserve their labels/keys. Numeric values that are missing or invalid should be normalized to `0`.

## Error Handling

Normalization should not throw for partial persisted documents. It should produce a safe response shape. Existing authorization and not-found behavior remains unchanged.

## Testing

Add or update backend unit tests in `src/modules/risk/risk.service.spec.ts`:

- Persistence returns a score with missing `factors`; service returns `factors: []`.
- Persistence returns a score with incomplete `features`; service returns all feature keys with missing values as `0`.
- Existing learner/course enrichment still appears when enrollment data is available.

Verification commands:

- Backend focused test: `pnpm test -- risk.service`
- Backend build if needed: `pnpm build`
- Frontend typecheck after API contract alignment: `pnpm exec tsc --noEmit`

## Rollout

Implement backend normalization first. Keep current frontend defensive guards. If many old Mongo documents are found to be incomplete, plan a separate cleanup task for backfilling or recomputing historical `risk_scores`.
