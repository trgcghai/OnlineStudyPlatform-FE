import axiosClient, { type ApiSuccessResponse } from "@/services/axios";
import type { Lesson } from "@/services/api/lessons";
import type { QuizSummary } from "@/services/api/quizzes";

export interface AdminCourseLessonItem {
  lesson: Lesson;
  quiz: QuizSummary | null;
}

export interface AdminCourseContentListResult {
  items: AdminCourseLessonItem[];
  total: number;
  courseId: string;
  courseTitle: string;
}

export async function listAdminCourseLessons(
  courseId: string,
): Promise<AdminCourseContentListResult> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<AdminCourseContentListResult>
  >(`/admin/courses/${courseId}/lessons`);

  return data.data;
}
