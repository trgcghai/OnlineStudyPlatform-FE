import { QuizQuestionType } from "@/services/api/quizzes";
import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export enum QuizAttemptStatus {
  IN_PROGRESS = "in_progress",
  PASSED = "passed",
  NOT_PASSED = "not_passed",
}

export interface LearnerQuizQuestion {
  id: string;
  quizId: string;
  type: QuizQuestionType;
  content: string;
  options: string[];
  isMultipleChoice: boolean;
  maxSelectableOptions: number | null;
  points: number;
  position: number;
}

export interface LearnerQuiz {
  id: string;
  lessonId: string;
  courseId: string;
  title: string;
  description: string;
  timeLimitMinutes: number | null;
  passScore: number;
  totalPoints: number;
  passScorePoints: number;
  questions: LearnerQuizQuestion[];
}

export interface LearnerQuizLoadResponse {
  quiz: LearnerQuiz | null;
}

export interface QuizAttemptStartResponse {
  attemptId: string;
  quiz: LearnerQuiz;
  startedAt: string;
  timeLimitMinutes: number | null;
}

export type QuizAttemptQuestionStatus =
  "correct" | "partial" | "wrong" | "pending_grading";

export interface QuizAttemptQuestionResult {
  questionId: string;
  type: QuizQuestionType;
  selectedOptionIndexes?: number[];
  text?: string;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  status: QuizAttemptQuestionStatus;
}

export interface QuizAttemptResult {
  attemptId: string;
  quizId: string;
  startedAt: string;
  submittedAt: string | null;
  timeLimitMinutes: number | null;
  isLate: boolean;
  lateSeconds: number;
  totalScore: number;
  totalPoints: number;
  passScore: number;
  passScorePoints: number;
  passed: boolean;
  status: QuizAttemptStatus;
  correctCount: number;
  wrongCount: number;
  pendingEssayCount: number;
  questions: QuizAttemptQuestionResult[];
}

export interface SubmitQuizAnswerPayload {
  questionId: string;
  selectedOptionIndexes?: number[];
  text?: string;
}

export interface SubmitQuizAttemptPayload {
  answers: SubmitQuizAnswerPayload[];
}

export async function getLearnerQuiz(
  courseId: string,
  lessonId: string,
): Promise<LearnerQuizLoadResponse> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<LearnerQuizLoadResponse>
  >(`/learning/courses/${courseId}/lessons/${lessonId}/quiz`);

  return data.data;
}

export async function startQuizAttempt(
  courseId: string,
  lessonId: string,
  quizId: string,
): Promise<QuizAttemptStartResponse> {
  const { data } = await axiosClient.post<
    ApiSuccessResponse<QuizAttemptStartResponse>
  >(
    `/learning/courses/${courseId}/lessons/${lessonId}/quiz/${quizId}/attempts`,
  );

  return data.data;
}

export async function submitQuizAttempt(
  courseId: string,
  lessonId: string,
  quizId: string,
  attemptId: string,
  payload: SubmitQuizAttemptPayload,
): Promise<QuizAttemptResult> {
  const { data } = await axiosClient.post<
    ApiSuccessResponse<QuizAttemptResult>
  >(
    `/learning/courses/${courseId}/lessons/${lessonId}/quiz/${quizId}/attempts/${attemptId}/submit`,
    payload,
  );

  return data.data;
}

export async function listQuizAttempts(
  courseId: string,
  lessonId: string,
  quizId: string,
): Promise<QuizAttemptResult[]> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<QuizAttemptResult[]>
  >(
    `/learning/courses/${courseId}/lessons/${lessonId}/quiz/${quizId}/attempts`,
  );

  return data.data;
}
