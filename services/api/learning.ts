import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export type LearningOrder = "free" | "sequential";

export interface LearningCourseSummary {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  learningOrder: LearningOrder;
}

export interface LearningEnrollmentSummary {
  id: string;
  progress: string;
  enrolledAt: string;
  completedAt: string | null;
}

export interface LearningLessonSummary {
  id: string;
  title: string;
  description: string;
  duration: number;
  position: number;
  isAccessible: boolean;
  isCompleted: boolean;
  blockedReason: string | null;
}

export interface LearningCourse {
  course: LearningCourseSummary;
  enrollment: LearningEnrollmentSummary;
  lessons: LearningLessonSummary[];
  firstAccessibleLessonId: string | null;
}

export interface LearningLesson extends LearningLessonSummary {
  courseId: string;
  videoUrl: string | null;
  materialUrl: string | null;
}

export type LessonSummaryStatus = "pending" | "processing" | "ready" | "failed";

export interface LearningLessonAiSummary {
  lessonId: string;
  status: LessonSummaryStatus;
  summaryText: string | null;
  updatedAt: string | null;
}

export type WatchEventType = "opened" | "heartbeat" | "paused" | "completed";

export interface CreateWatchEventPayload {
  idempotencyKey: string;
  eventType: WatchEventType;
  positionSeconds: number;
  watchedSeconds: number;
  durationSeconds: number;
  clientCreatedAt: string;
}

export interface LearningLessonProgress {
  lessonId: string;
  watchedSeconds: number;
  lastPositionSeconds: number;
  watchRatio: number;
  isWatchComplete: boolean;
  isLessonComplete: boolean;
  completedAt: string | null;
}

export interface LearningWatchEventResponse {
  lessonProgress: LearningLessonProgress;
  enrollment: LearningEnrollmentSummary;
}

export type AiChatRole = "user" | "assistant";

export interface AiChatCitation {
  lessonId: string | null;
  lessonTitle: string;
  excerpt: string;
}

export interface AiChatMessage {
  id: string;
  role: AiChatRole;
  content: string;
  inScope: boolean | null;
  similarity: number | null;
  citations: AiChatCitation[];
  createdAt: string;
}

export interface AiChatSession {
  sessionId: string;
  isAiAvailable: boolean;
  messages: AiChatMessage[];
}

export interface AiChatSendResponse extends AiChatSession {
  reply: AiChatMessage;
}

export async function getLearningCourse(
  courseId: string,
): Promise<LearningCourse> {
  const { data } = await axiosClient.get<ApiSuccessResponse<LearningCourse>>(
    `/learning/courses/${courseId}`,
  );

  return data.data;
}

export async function getLearningLesson(
  courseId: string,
  lessonId: string,
): Promise<LearningLesson> {
  const { data } = await axiosClient.get<ApiSuccessResponse<LearningLesson>>(
    `/learning/courses/${courseId}/lessons/${lessonId}`,
  );

  return data.data;
}

export async function getLearningLessonSummary(
  courseId: string,
  lessonId: string,
): Promise<LearningLessonAiSummary> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<LearningLessonAiSummary>
  >(`/learning/courses/${courseId}/lessons/${lessonId}/summary`);

  return data.data;
}

export async function sendLessonWatchEvent(
  courseId: string,
  lessonId: string,
  payload: CreateWatchEventPayload,
): Promise<LearningWatchEventResponse> {
  const { data } = await axiosClient.post<
    ApiSuccessResponse<LearningWatchEventResponse>
  >(`/learning/courses/${courseId}/lessons/${lessonId}/watch-events`, payload);

  return data.data;
}

export async function getCourseChatSession(
  courseId: string,
): Promise<AiChatSession> {
  const { data } = await axiosClient.get<ApiSuccessResponse<AiChatSession>>(
    `/learning/courses/${courseId}/chat`,
  );

  return data.data;
}

export async function sendCourseChatMessage(
  courseId: string,
  question: string,
): Promise<AiChatSendResponse> {
  const { data } = await axiosClient.post<
    ApiSuccessResponse<AiChatSendResponse>
  >(`/learning/courses/${courseId}/chat`, { question });

  return data.data;
}
