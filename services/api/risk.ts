import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export type RiskBand = "low" | "medium" | "high";
export type RiskSource = "heuristic" | "ai";

export interface RiskFeatures {
  lastActivityDays: number;
  activityCount7d: number;
  expectedProgressGap: number;
  courseProgressPercent: number;
  quizScoreAvgPercent: number;
  quizPassRate: number;
  watchRatioAvg: number;
  abandonedAttemptCount: number;
  lateQuizCount: number;
  completionVelocity: number;
  totalWatchedSeconds: number;
  pauseCount: number;
}

export interface RiskFactor {
  key: string;
  label: string;
  contribution: number;
  value: number;
}

export interface RiskScore {
  learnerId: string;
  courseId: string;
  enrollmentId: string;
  calculatedAt: string;
  score: number;
  band: RiskBand;
  featureVersion: string;
  scoringVersion: string;
  source: RiskSource;
  features: RiskFeatures;
  factors: RiskFactor[];
}

export interface RiskSummary {
  totalScoredLearners: number;
  lowCount: number;
  mediumCount: number;
  highCount: number;
  highRiskPercentage: number;
  latestCalculatedAt: string | null;
}

export interface RiskLearnerFilters {
  threshold?: number;
  band?: RiskBand;
}

export interface RiskLearnerListResult {
  learners: RiskScore[];
}

export interface RiskLearnerDetail {
  latest: RiskScore | null;
  history: RiskScore[];
}

export interface RiskRecomputeResult {
  processed: number;
  succeeded: number;
  failed: number;
}

export interface RiskReminderResult {
  enqueued: true;
}

function buildRiskLearnerQuery(filters: RiskLearnerFilters): string {
  const params = new URLSearchParams();

  if (typeof filters.threshold === "number") {
    params.set(
      "threshold",
      String(Math.min(Math.max(filters.threshold, 0), 100)),
    );
  }
  if (filters.band) params.set("band", filters.band);

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export async function getRiskSummary(courseId: string): Promise<RiskSummary> {
  const { data } = await axiosClient.get<ApiSuccessResponse<RiskSummary>>(
    `/risk/courses/${courseId}/summary`,
  );

  return data.data;
}

export async function listRiskLearners(
  courseId: string,
  filters: RiskLearnerFilters = {},
): Promise<RiskLearnerListResult> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<RiskLearnerListResult>
  >(`/risk/courses/${courseId}/learners${buildRiskLearnerQuery(filters)}`);

  return data.data;
}

export async function getRiskLearnerDetail(
  courseId: string,
  learnerId: string,
): Promise<RiskLearnerDetail> {
  const { data } = await axiosClient.get<ApiSuccessResponse<RiskLearnerDetail>>(
    `/risk/courses/${courseId}/learners/${learnerId}`,
  );

  return data.data;
}

export async function recomputeCourseRisk(
  courseId: string,
): Promise<RiskRecomputeResult> {
  const { data } = await axiosClient.post<
    ApiSuccessResponse<RiskRecomputeResult>
  >(`/risk/courses/${courseId}/recompute`);

  return data.data;
}

export async function sendSmartReminder(
  courseId: string,
  learnerId: string,
): Promise<RiskReminderResult> {
  const { data } = await axiosClient.post<
    ApiSuccessResponse<RiskReminderResult>
  >(`/risk/courses/${courseId}/learners/${learnerId}/reminder`);

  return data.data;
}
