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
