import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string | null;
  materialUrl: string | null;
  duration: number;
  position: number;
  courseId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonListResult {
  items: Lesson[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateLessonPayload {
  title: string;
  description?: string;
  duration?: number;
}

export type UpdateLessonPayload = Partial<CreateLessonPayload>;

export async function listLessons(
  courseId: string,
): Promise<LessonListResult> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<LessonListResult>
  >(`/courses/${courseId}/lessons`);

  return data.data;
}

export async function getLesson(lessonId: string): Promise<Lesson> {
  const { data } = await axiosClient.get<ApiSuccessResponse<Lesson>>(
    `/lessons/${lessonId}`,
  );

  return data.data;
}

export async function createLesson(
  courseId: string,
  payload: CreateLessonPayload,
  video?: File | null,
  material?: File | null,
): Promise<Lesson> {
  const formData = new FormData();
  formData.append("title", payload.title);
  if (payload.description) formData.append("description", payload.description);
  if (payload.duration !== undefined)
    formData.append("duration", String(payload.duration));
  if (video) formData.append("video", video);
  if (material) formData.append("material", material);

  const { data } = await axiosClient.post<ApiSuccessResponse<Lesson>>(
    `/courses/${courseId}/lessons`,
    formData,
  );

  return data.data;
}

export async function updateLesson(
  lessonId: string,
  payload: UpdateLessonPayload,
  video?: File | null,
  material?: File | null,
): Promise<Lesson> {
  const formData = new FormData();
  if (payload.title !== undefined) formData.append("title", payload.title);
  if (payload.description !== undefined)
    formData.append("description", payload.description);
  if (payload.duration !== undefined)
    formData.append("duration", String(payload.duration));
  if (video) formData.append("video", video);
  if (material) formData.append("material", material);

  const { data } = await axiosClient.patch<ApiSuccessResponse<Lesson>>(
    `/lessons/${lessonId}`,
    formData,
  );

  return data.data;
}

export async function deleteLesson(lessonId: string): Promise<void> {
  await axiosClient.delete(`/lessons/${lessonId}`);
}

export async function reorderLessons(
  courseId: string,
  orderedIds: string[],
): Promise<Lesson[]> {
  const { data } = await axiosClient.patch<ApiSuccessResponse<Lesson[]>>(
    `/courses/${courseId}/lessons/reorder`,
    { orderedIds },
  );

  return data.data;
}
