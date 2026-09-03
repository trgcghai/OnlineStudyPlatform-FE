import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export enum QuizQuestionType {
  MCQ = "MCQ",
  ESSAY = "ESSAY",
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  type: QuizQuestionType;
  content: string;
  options: string[];
  correctAnswers: number[];
  points: number;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  lessonId: string;
  courseId: string;
  title: string;
  description: string;
  timeLimitMinutes: number | null;
  passScore: number;
  totalPoints: number;
  passScorePoints: number;
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizSummary {
  id: string;
  lessonId: string;
  courseId: string;
  title: string;
  description: string;
  timeLimitMinutes: number | null;
  passScore: number;
  totalPoints: number;
  passScorePoints: number;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionPayload {
  type: QuizQuestionType;
  content: string;
  points: number;
  options?: string[];
  correctAnswers?: number[];
}

export interface CreateQuizPayload {
  title: string;
  description?: string;
  timeLimitMinutes?: number | null;
  passScore?: number;
  questions?: CreateQuestionPayload[];
}

export type UpdateQuizPayload = Partial<{
  title: string;
  description: string;
  timeLimitMinutes: number | null;
  passScore: number;
}>;

export type UpdateQuestionPayload = Partial<CreateQuestionPayload>;

export async function getLessonQuiz(
  courseId: string,
  lessonId: string,
): Promise<QuizSummary | null> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<QuizSummary | null>
  >(`/courses/${courseId}/lessons/${lessonId}/quiz`);

  return data.data;
}

export async function createQuiz(
  courseId: string,
  lessonId: string,
  payload: CreateQuizPayload,
): Promise<Quiz> {
  const { data } = await axiosClient.post<ApiSuccessResponse<Quiz>>(
    `/courses/${courseId}/lessons/${lessonId}/quiz`,
    payload,
  );

  return data.data;
}

export async function getQuiz(quizId: string): Promise<Quiz> {
  const { data } = await axiosClient.get<ApiSuccessResponse<Quiz>>(
    `/quizzes/${quizId}`,
  );

  return data.data;
}

export async function updateQuiz(
  quizId: string,
  payload: UpdateQuizPayload,
): Promise<Quiz> {
  const { data } = await axiosClient.patch<ApiSuccessResponse<Quiz>>(
    `/quizzes/${quizId}`,
    payload,
  );

  return data.data;
}

export async function deleteQuiz(quizId: string): Promise<void> {
  await axiosClient.delete(`/quizzes/${quizId}`);
}

export async function addQuestion(
  quizId: string,
  payload: CreateQuestionPayload,
): Promise<QuizQuestion> {
  const { data } = await axiosClient.post<ApiSuccessResponse<QuizQuestion>>(
    `/quizzes/${quizId}/questions`,
    payload,
  );

  return data.data;
}

export async function reorderQuestions(
  quizId: string,
  orderedIds: string[],
): Promise<QuizQuestion[]> {
  const { data } = await axiosClient.patch<ApiSuccessResponse<QuizQuestion[]>>(
    `/quizzes/${quizId}/questions/reorder`,
    { orderedIds },
  );

  return data.data;
}

export async function updateQuestion(
  questionId: string,
  payload: UpdateQuestionPayload,
): Promise<QuizQuestion> {
  const { data } = await axiosClient.patch<ApiSuccessResponse<QuizQuestion>>(
    `/questions/${questionId}`,
    payload,
  );

  return data.data;
}

export async function deleteQuestion(questionId: string): Promise<void> {
  await axiosClient.delete(`/questions/${questionId}`);
}
