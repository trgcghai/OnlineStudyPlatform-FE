import axiosClient, { type ApiSuccessResponse } from "@/services/axios";
import { type QuizAttemptResult } from "@/services/api/learner-quizzes";

export const ESSAY_GRADING_STATUS_FILTERS = {
  PENDING: "pending",
  GRADED: "graded",
  ALL: "all",
} as const;

export type EssayGradingStatusFilter =
  (typeof ESSAY_GRADING_STATUS_FILTERS)[keyof typeof ESSAY_GRADING_STATUS_FILTERS];

export interface EssayGradingLearner {
  id: string;
  name: string;
  email: string;
}

export interface EssayGradingQuestion {
  questionId: string;
  content: string;
  text: string;
  score: number;
  maxScore: number;
  status: "correct" | "partial" | "wrong" | "pending_grading";
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
}

export interface EssayGradingSubmission {
  attemptId: string;
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  quizId: string;
  quizTitle: string;
  learner: EssayGradingLearner;
  submittedAt: string | null;
  totalScore: number;
  totalPoints: number;
  passScore: number;
  passScorePoints: number;
  passed: boolean;
  status: "in_progress" | "passed" | "not_passed" | "abandoned";
  pendingEssayCount: number;
  essays: EssayGradingQuestion[];
}

export interface EssayGradingSubmissionListResult {
  items: EssayGradingSubmission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EssayGradingSubmissionListFilters {
  courseId?: string;
  lessonId?: string;
  status: EssayGradingStatusFilter;
  page: number;
  limit: number;
}

export interface GradeEssayAnswerPayload {
  points: number;
  feedback?: string;
}

export async function listEssayGradingSubmissions(
  filters: EssayGradingSubmissionListFilters,
): Promise<EssayGradingSubmissionListResult> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<EssayGradingSubmissionListResult>
  >("/essay-grading/submissions", {
    params: filters,
  });

  return data.data;
}

export async function gradeEssayAnswer(
  courseId: string,
  quizId: string,
  attemptId: string,
  questionId: string,
  payload: GradeEssayAnswerPayload,
): Promise<QuizAttemptResult> {
  const { data } = await axiosClient.patch<
    ApiSuccessResponse<QuizAttemptResult>
  >(
    `/courses/${courseId}/quizzes/${quizId}/essay-grading/attempts/${attemptId}/essay/${questionId}`,
    payload,
  );

  return data.data;
}
