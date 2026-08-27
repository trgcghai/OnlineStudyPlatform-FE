import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export const PUBLIC_COURSE_SORT_FIELDS = {
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
  TITLE: "title",
  CATEGORY: "category",
} as const;

export type PublicCourseSortField =
  (typeof PUBLIC_COURSE_SORT_FIELDS)[keyof typeof PUBLIC_COURSE_SORT_FIELDS];

export type PublicCourseSortOrder = "ASC" | "DESC";

export interface PublicCourseInstructorSummary {
  id: string;
  name: string;
}

export interface PublicCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string | null;
  instructorId: string;
  instructor?: PublicCourseInstructorSummary;
  isEnrolled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicCourseListFilters {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  sortBy?: PublicCourseSortField;
  sortOrder?: PublicCourseSortOrder;
}

export interface PublicCourseListResult {
  items: PublicCourse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function buildPublicCourseListQuery(filters: PublicCourseListFilters): string {
  const params = new URLSearchParams();

  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.q && filters.q.trim().length > 0)
    params.set("q", filters.q.trim());
  if (filters.category && filters.category.trim().length > 0) {
    params.set("category", filters.category.trim());
  }
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

function buildLimitQuery(limit?: number): string {
  if (!limit) return "";

  const params = new URLSearchParams({ limit: String(Math.min(limit, 20)) });
  return `?${params.toString()}`;
}

export async function listPublishedCourses(
  filters: PublicCourseListFilters = {},
): Promise<PublicCourseListResult> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<PublicCourseListResult>
  >(`/courses/public${buildPublicCourseListQuery(filters)}`);

  return data.data;
}

export async function listPublishedCourseSuggestions(
  limit?: number,
): Promise<PublicCourse[]> {
  const { data } = await axiosClient.get<ApiSuccessResponse<PublicCourse[]>>(
    `/courses/public/suggestion${buildLimitQuery(limit)}`,
  );

  return data.data;
}

export async function listLatestPublishedCourses(
  limit?: number,
): Promise<PublicCourse[]> {
  const { data } = await axiosClient.get<ApiSuccessResponse<PublicCourse[]>>(
    `/courses/public/latest${buildLimitQuery(limit)}`,
  );

  return data.data;
}

export async function getPublishedCourse(
  courseId: string,
): Promise<PublicCourse> {
  const { data } = await axiosClient.get<ApiSuccessResponse<PublicCourse>>(
    `/courses/public/${courseId}`,
  );

  return data.data;
}
