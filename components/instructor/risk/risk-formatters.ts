import type { RiskBand, RiskFactor, RiskFeatures } from "@/services/api/risk";
import { formatDateTime } from "@/utils/dateTimeUtil";

export const RISK_BAND_LABELS: Record<RiskBand, string> = {
  high: "Rủi ro cao",
  medium: "Rủi ro trung bình",
  low: "Rủi ro thấp",
};

export const RISK_BAND_BADGE_VARIANTS: Record<
  RiskBand,
  "default" | "secondary" | "destructive" | "outline"
> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

export const RISK_FEATURE_LABELS: Record<keyof RiskFeatures, string> = {
  lastActivityDays: "Số ngày chưa hoạt động",
  activityCount7d: "Số hoạt động 7 ngày gần nhất",
  expectedProgressGap: "Khoảng cách tiến độ kỳ vọng",
  courseProgressPercent: "Tiến độ khóa học",
  quizScoreAvgPercent: "Điểm quiz trung bình",
  quizPassRate: "Tỷ lệ đạt quiz",
  watchRatioAvg: "Tỷ lệ xem video trung bình",
  abandonedAttemptCount: "Số lượt làm bài bỏ dở",
  lateQuizCount: "Số quiz nộp muộn",
  completionVelocity: "Tốc độ hoàn thành",
  totalWatchedSeconds: "Tổng thời lượng đã xem",
  pauseCount: "Số lần tạm dừng video",
};

export function formatRiskScore(score: number | null | undefined): string {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return "Chưa có dữ liệu";
  }

  return score.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
}

export function formatRiskPercent(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Chưa có dữ liệu";
  }

  return `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
}

export function formatRiskDate(value: string | null): string {
  return value ? formatDateTime(value) : "Chưa có dữ liệu";
}

export function getTopRiskFactor(
  factors: RiskFactor[] | null | undefined,
): RiskFactor | null {
  return sortRiskFactors(factors)[0] ?? null;
}

export function sortRiskFactors(
  factors: RiskFactor[] | null | undefined,
): RiskFactor[] {
  if (!Array.isArray(factors)) return [];

  return [...factors].sort((a, b) => b.contribution - a.contribution);
}
