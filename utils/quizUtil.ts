import { EssayGradingSubmission } from "@/services/api/essay-grading";
import {
  QuizAttemptQuestionStatus,
  QuizAttemptResult,
} from "@/services/api/learner-quizzes";
import { formatDate } from "@/utils/dateTimeUtil";

function formatScore(value: number): string {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatDateTime(value: string | null): string {
  if (!value) return "Chưa nộp";

  return formatDate(value);
}

function getAttemptStatusLabel(
  result: QuizAttemptResult | EssayGradingSubmission,
): string {
  if (result.pendingEssayCount > 0 && !result.passed) return "Chờ chấm";

  return result.passed ? "Đạt" : "Chưa đạt";
}

function getQuestionStatusLabel(status: QuizAttemptQuestionStatus): string {
  if (status === "correct") return "Đúng";
  if (status === "partial") return "Đúng một phần";
  if (status === "pending_grading") return "Chờ chấm";

  return "Chưa đúng";
}

function getBestAttemptId(attempts: QuizAttemptResult[]): string | null {
  if (attempts.length === 0) return null;

  if (attempts.every((a) => a.pendingEssayCount > 0)) return null;

  return attempts.reduce((best, attempt) => {
    if (attempt.totalScore > best.totalScore) return attempt;
    if (attempt.totalScore < best.totalScore) return best;

    const attemptSubmittedAt = attempt.submittedAt
      ? new Date(attempt.submittedAt).getTime()
      : 0;
    const bestSubmittedAt = best.submittedAt
      ? new Date(best.submittedAt).getTime()
      : 0;

    return attemptSubmittedAt > bestSubmittedAt ? attempt : best;
  }, attempts[0]).attemptId;
}

export {
  formatScore,
  formatDuration,
  formatDateTime,
  getAttemptStatusLabel,
  getQuestionStatusLabel,
  getBestAttemptId,
};
