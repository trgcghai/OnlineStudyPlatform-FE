# Risk Score Response Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Do not commit unless the user explicitly requests it.

**Goal:** Normalize backend risk score responses so list/detail API consumers always receive safe `features` and `factors` shapes.

**Architecture:** Add response-boundary normalization inside the NestJS Risk service, close to `enrichScores`, without changing Mongo persistence semantics or the risk scoring algorithm. Unit tests cover partial persisted risk documents and verify that enrichment still works.

**Tech Stack:** NestJS 11, TypeScript, Jest, Mongoose risk score documents, TypeORM enrollment/course/user relations, Next.js frontend typecheck for consumer validation.

---

## File Structure

- Modify `online-study-platform-be/src/modules/risk/risk.service.ts`: add normalization helpers and apply them before returning list/detail responses.
- Modify `online-study-platform-be/src/modules/risk/risk.service.spec.ts`: add tests for partial persisted documents and existing enrichment behavior.
- Verify `onlinestudyplatform-fe`: run TypeScript check to ensure frontend consumers still compile.

## Task 1: Add Failing Tests For Partial Risk Scores

**Related skills:** `test-driven-development`, `nestjs-best-practices`, `systematic-debugging`

**Files:**
- Modify: `online-study-platform-be/src/modules/risk/risk.service.spec.ts`

- [ ] **Step 1: Locate the existing `getLearners` enrichment test**

Find the test around the existing assertion that `getLearners` returns enriched learner and course data. Keep the new tests near that test because they exercise the same response-boundary behavior.

- [ ] **Step 2: Add a test for missing factors**

Add this test in the `RiskService` describe block. Reuse existing test setup variables from the file, including `service`, `persistenceService`, `coursesRepository`, and `enrollmentsRepository`.

```ts
it('normalizes missing factors before returning learner risk scores', async () => {
  coursesRepository.findOne.mockResolvedValue({
    id: 'course-1',
    instructorId: 'instructor-1',
  });
  persistenceService.findLatestByCourse.mockResolvedValue([
    {
      learnerId: 'learner-1',
      courseId: 'course-1',
      enrollmentId: 'enrollment-1',
      calculatedAt: new Date('2026-10-12T02:00:00Z'),
      score: 82.4,
      band: RiskBand.HIGH,
      featureVersion: 'dropout_features_v1',
      scoringVersion: 'dropout-xgb-v1',
      source: 'ai',
      features: {
        lastActivityDays: 1,
        activityCount7d: 5,
        expectedProgressGap: 25,
        courseProgressPercent: 40,
        quizScoreAvgPercent: 70,
        quizPassRate: 0.5,
        watchRatioAvg: 0.5,
        abandonedAttemptCount: 1,
        lateQuizCount: 0,
        completionVelocity: 0.1,
        totalWatchedSeconds: 100,
        pauseCount: 0,
      },
    } as RiskScoreResponse,
  ]);
  enrollmentsRepository.find.mockResolvedValue([]);

  const result = await service.getLearners('course-1', 'instructor-1', {});

  expect(result.learners[0].factors).toEqual([]);
});
```

- [ ] **Step 3: Add a test for incomplete features and invalid factor numbers**

Add this test after the missing factors test.

```ts
it('normalizes incomplete features and factor numeric values', async () => {
  coursesRepository.findOne.mockResolvedValue({
    id: 'course-1',
    instructorId: 'instructor-1',
  });
  persistenceService.findLatestByCourse.mockResolvedValue([
    {
      learnerId: 'learner-1',
      courseId: 'course-1',
      enrollmentId: 'enrollment-1',
      calculatedAt: new Date('2026-10-12T02:00:00Z'),
      score: 82.4,
      band: RiskBand.HIGH,
      featureVersion: 'dropout_features_v1',
      scoringVersion: 'dropout-xgb-v1',
      source: 'ai',
      features: {
        courseProgressPercent: 40,
      },
      factors: [
        {
          key: 'courseProgressPercent',
          label: 'Course progress percent',
          contribution: undefined,
          value: 40,
        },
      ],
    } as unknown as RiskScoreResponse,
  ]);
  enrollmentsRepository.find.mockResolvedValue([]);

  const result = await service.getLearners('course-1', 'instructor-1', {});
  const score = result.learners[0];

  expect(score.features).toEqual({
    lastActivityDays: 0,
    activityCount7d: 0,
    expectedProgressGap: 0,
    courseProgressPercent: 40,
    quizScoreAvgPercent: 0,
    quizPassRate: 0,
    watchRatioAvg: 0,
    abandonedAttemptCount: 0,
    lateQuizCount: 0,
    completionVelocity: 0,
    totalWatchedSeconds: 0,
    pauseCount: 0,
  });
  expect(score.factors).toEqual([
    {
      key: 'courseProgressPercent',
      label: 'Course progress percent',
      contribution: 0,
      value: 40,
    },
  ]);
});
```

- [ ] **Step 4: Add a detail endpoint normalization test**

Add this test to ensure `getLearnerDetail` also returns normalized history/latest scores.

```ts
it('normalizes learner detail latest and history scores', async () => {
  coursesRepository.findOne.mockResolvedValue({
    id: 'course-1',
    instructorId: 'instructor-1',
  });
  persistenceService.findHistory.mockResolvedValue([
    {
      learnerId: 'learner-1',
      courseId: 'course-1',
      enrollmentId: 'enrollment-1',
      calculatedAt: new Date('2026-10-12T02:00:00Z'),
      score: 82.4,
      band: RiskBand.HIGH,
      featureVersion: 'dropout_features_v1',
      scoringVersion: 'dropout-xgb-v1',
      source: 'ai',
      features: undefined,
      factors: undefined,
    } as unknown as RiskScoreResponse,
  ]);
  enrollmentsRepository.find.mockResolvedValue([]);

  const result = await service.getLearnerDetail(
    'course-1',
    'learner-1',
    'instructor-1',
  );

  expect(result.latest?.factors).toEqual([]);
  expect(result.latest?.features.courseProgressPercent).toBe(0);
  expect(result.history[0].factors).toEqual([]);
});
```

- [ ] **Step 5: Run the focused test and confirm RED**

Run from `online-study-platform-be`:

```bash
pnpm test -- risk.service
```

Expected: tests fail because normalization helpers do not exist yet. The failure should show missing/undefined `factors` or incomplete `features`, not setup errors.

## Task 2: Implement Risk Score Normalization

**Related skills:** `nestjs-best-practices`, `test-driven-development`, `systematic-debugging`

**Files:**
- Modify: `online-study-platform-be/src/modules/risk/risk.service.ts`

- [ ] **Step 1: Add default feature constants near existing risk constants**

Add this constant near the existing module-level constants in `risk.service.ts`.

```ts
const DEFAULT_RISK_FEATURES: RiskFeatures = {
  lastActivityDays: 0,
  activityCount7d: 0,
  expectedProgressGap: 0,
  courseProgressPercent: 0,
  quizScoreAvgPercent: 0,
  quizPassRate: 0,
  watchRatioAvg: 0,
  abandonedAttemptCount: 0,
  lateQuizCount: 0,
  completionVelocity: 0,
  totalWatchedSeconds: 0,
  pauseCount: 0,
};
```

If `RiskFeatures` is not imported, update the existing import from `./dto/risk.dto` to include it.

- [ ] **Step 2: Add numeric normalization helper**

Add this private method inside `RiskService` before `enrichScores`.

```ts
private normalizeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
```

- [ ] **Step 3: Add features normalization helper**

Add this private method inside `RiskService` after `normalizeNumber`.

```ts
private normalizeFeatures(features: unknown): RiskFeatures {
  const source =
    features && typeof features === 'object'
      ? (features as Partial<RiskFeatures>)
      : {};

  return {
    lastActivityDays: this.normalizeNumber(source.lastActivityDays),
    activityCount7d: this.normalizeNumber(source.activityCount7d),
    expectedProgressGap: this.normalizeNumber(source.expectedProgressGap),
    courseProgressPercent: this.normalizeNumber(source.courseProgressPercent),
    quizScoreAvgPercent: this.normalizeNumber(source.quizScoreAvgPercent),
    quizPassRate: this.normalizeNumber(source.quizPassRate),
    watchRatioAvg: this.normalizeNumber(source.watchRatioAvg),
    abandonedAttemptCount: this.normalizeNumber(source.abandonedAttemptCount),
    lateQuizCount: this.normalizeNumber(source.lateQuizCount),
    completionVelocity: this.normalizeNumber(source.completionVelocity),
    totalWatchedSeconds: this.normalizeNumber(source.totalWatchedSeconds),
    pauseCount: this.normalizeNumber(source.pauseCount),
  };
}
```

- [ ] **Step 4: Add factor normalization helper**

Add this private method inside `RiskService` after `normalizeFeatures`.

```ts
private normalizeFactors(
  factors: unknown,
): RiskScoreResponse['factors'] {
  if (!Array.isArray(factors)) return [];

  return factors
    .filter(
      (factor): factor is Partial<RiskScoreResponse['factors'][number]> =>
        Boolean(factor) && typeof factor === 'object',
    )
    .map((factor) => ({
      key: typeof factor.key === 'string' ? factor.key : '',
      label: typeof factor.label === 'string' ? factor.label : '',
      contribution: this.normalizeNumber(factor.contribution),
      value: this.normalizeNumber(factor.value),
    }));
}
```

- [ ] **Step 5: Add score normalization helper**

Add this private method inside `RiskService` after `normalizeFactors`.

```ts
private normalizeScore(score: RiskScoreResponse): RiskScoreResponse {
  return {
    ...score,
    features: this.normalizeFeatures(score.features),
    factors: this.normalizeFactors(score.factors),
  };
}
```

- [ ] **Step 6: Apply normalization in `enrichScores`**

At the start of `enrichScores`, normalize the incoming scores before enrichment lookup.

Replace:

```ts
if (scores.length === 0) return scores;

const enrollmentIds = [...new Set(scores.map((score) => score.enrollmentId))];
```

With:

```ts
const normalizedScores = scores.map((score) => this.normalizeScore(score));
if (normalizedScores.length === 0) return normalizedScores;

const enrollmentIds = [
  ...new Set(normalizedScores.map((score) => score.enrollmentId)),
];
```

Then replace the final map source:

```ts
return scores.map((score) => {
```

With:

```ts
return normalizedScores.map((score) => {
```

- [ ] **Step 7: Run the focused test and confirm GREEN**

Run from `online-study-platform-be`:

```bash
pnpm test -- risk.service
```

Expected: all `risk.service` tests pass.

## Task 3: Validate Existing Enrichment Contract

**Related skills:** `nestjs-best-practices`, `systematic-debugging`, `verification-before-completion`

**Files:**
- Review: `online-study-platform-be/src/modules/risk/risk.service.ts`
- Review: `online-study-platform-be/src/modules/risk/risk.service.spec.ts`

- [ ] **Step 1: Confirm enrichment still uses normalized scores**

Read the final `enrichScores` method and verify it follows this data flow:

```ts
scores -> normalizeScore -> enrollment lookup -> add learner/course -> return
```

Expected: missing enrollment still returns the normalized score, not the original partial score.

- [ ] **Step 2: Confirm no scoring algorithm changes**

Inspect `scoreLearnerCourse` and `recomputeLearnerCourse`.

Expected: no changes to AI prediction, score calculation, or feature extraction logic.

- [ ] **Step 3: Run backend build**

Run from `online-study-platform-be`:

```bash
pnpm build
```

Expected: Nest build succeeds with no TypeScript errors.

## Task 4: Frontend Consumer Verification

**Related skills:** `nextjs`, `verification-before-completion`

**Files:**
- Verify: `onlinestudyplatform-fe/services/api/risk.ts`
- Verify: `onlinestudyplatform-fe/components/instructor/risk/*`

- [ ] **Step 1: Run frontend typecheck**

Run from `onlinestudyplatform-fe`:

```bash
pnpm exec tsc --noEmit
```

Expected: command exits successfully with no TypeScript errors.

- [ ] **Step 2: Inspect FE defensive guards remain intact**

Confirm these frontend safety checks still exist:

```ts
Array.isArray(factors)
typeof score === "number"
features?.[key]
```

Expected: frontend remains defensive even though backend now normalizes responses.

## Task 5: Final Diff Review

**Related skills:** `verification-before-completion`

**Files:**
- Review: backend changed files
- Review: plan/spec files

- [ ] **Step 1: Inspect backend diff**

Run from `online-study-platform-be`:

```bash
git diff -- src/modules/risk/risk.service.ts src/modules/risk/risk.service.spec.ts
```

Expected: diff only includes normalization helpers, normalization usage in `enrichScores`, and focused tests.

- [ ] **Step 2: Inspect frontend/root doc diff**

Run from `onlinestudyplatform-fe`:

```bash
git diff -- docs/superpowers/specs/2026-10-13-risk-score-response-normalization-design.md docs/superpowers/plans/2026-10-13-risk-score-response-normalization.md
```

Expected: diff only includes the approved spec and this implementation plan.

- [ ] **Step 3: Report verification evidence**

Final response must include exact verification commands run and their outcomes:

```text
pnpm test -- risk.service
pnpm build
pnpm exec tsc --noEmit
```

Do not state the work is complete unless all required verification commands have been run and passed.

## Self-Review Checklist

- Spec coverage: backend response normalization, feature defaults, factor defaults, enrichment preservation, no migration, and FE verification are all covered.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: `RiskFeatures`, `RiskScoreResponse`, `features`, and `factors` match the backend DTO names.
- Scope check: plan is limited to backend response normalization plus verification; no algorithm or data migration changes are included.
