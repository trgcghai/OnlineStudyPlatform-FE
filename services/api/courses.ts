import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export const COURSE_STATUSES = {
  DRAFT: "Draft",
  PENDING: "Pending",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
} as const;

export type CourseStatus =
  (typeof COURSE_STATUSES)[keyof typeof COURSE_STATUSES];

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string | null;
  status: CourseStatus;
  rejectReason: string | null;
  instructorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseListFilters {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  status?: CourseStatus;
  sortBy?: "createdAt" | "updatedAt" | "title" | "category" | "status";
  sortOrder?: "ASC" | "DESC";
}

export interface CourseListResult {
  items: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCoursePayload {
  title: string;
  description: string;
  category: string;
}

export type UpdateCoursePayload = Partial<CreateCoursePayload>;

function buildCourseListQuery(filters: CourseListFilters): string {
  const params = new URLSearchParams();

  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.q && filters.q.trim().length > 0) params.set("q", filters.q.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.status) params.set("status", filters.status);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

  const query = params.toString();

  return query.length > 0 ? `?${query}` : "";
}

export async function listMyCourses(
  filters: CourseListFilters = {},
): Promise<CourseListResult> {
  const { data } = await axiosClient.get<ApiSuccessResponse<CourseListResult>>(
    `/courses/me${buildCourseListQuery(filters)}`,
  );

  return data.data;
}

export async function getCourse(courseId: string): Promise<Course> {
  const { data } = await axiosClient.get<ApiSuccessResponse<Course>>(
    `/courses/${courseId}`,
  );

  return data.data;
}

export async function createCourse(
  payload: CreateCoursePayload,
): Promise<Course> {
  const { data } = await axiosClient.post<ApiSuccessResponse<Course>>(
    "/courses",
    payload,
  );

  return data.data;
}

export async function updateCourse(
  courseId: string,
  payload: UpdateCoursePayload,
): Promise<Course> {
  const { data } = await axiosClient.patch<ApiSuccessResponse<Course>>(
    `/courses/${courseId}`,
    payload,
  );

  return data.data;
}

export async function requestPublishCourse(courseId: string): Promise<Course> {
  const { data } = await axiosClient.post<ApiSuccessResponse<Course>>(
    `/courses/${courseId}/request-publish`,
  );

  return data.data;
}

export async function uploadCourseThumbnail(
  courseId: string,
  file: File,
): Promise<Course> {
  const formData = new FormData();
  formData.append("thumbnail", file);

  const { data } = await axiosClient.post<ApiSuccessResponse<Course>>(
    `/courses/${courseId}/thumbnail`,
    formData,
  );

  return data.data;
}

export async function deleteCourse(courseId: string): Promise<void> {
  await axiosClient.delete(`/courses/${courseId}`);
}
