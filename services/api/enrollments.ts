import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export interface EnrollmentCourseInstructor {
  id: string;
  name: string;
}

export interface EnrollmentCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string | null;
  instructorId: string;
  instructor?: EnrollmentCourseInstructor;
}

export interface Enrollment {
  id: string;
  learnerId: string;
  courseId: string;
  progress: string;
  completedAt: string | null;
  enrolledAt: string;
  course?: EnrollmentCourse;
}

export type CourseEnrollmentCompletionStatus =
  "not_started" | "in_progress" | "completed";

export interface CourseEnrollmentLearner {
  id: string;
  name: string;
  email: string;
}

export interface CourseEnrollmentQuizSummary {
  bestScore: number | null;
  latestAttemptAt: string | null;
  passed: boolean | null;
}

export interface CourseEnrollmentListItem {
  enrollmentId: string;
  learner: CourseEnrollmentLearner;
  enrolledAt: string;
  progress: string;
  completionStatus: CourseEnrollmentCompletionStatus;
  completedAt: string | null;
  lastActivityAt: string | null;
  quizSummary: CourseEnrollmentQuizSummary;
}

export interface CourseEnrollmentListFilters {
  page?: number;
  limit?: number;
  q?: string;
}

export interface CourseEnrollmentListResult {
  items: CourseEnrollmentListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function buildCourseEnrollmentListQuery(
  filters: CourseEnrollmentListFilters,
): string {
  const params = new URLSearchParams();

  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.q && filters.q.trim().length > 0) {
    params.set("q", filters.q.trim());
  }

  const query = params.toString();

  return query.length > 0 ? `?${query}` : "";
}

export async function enrollInCourse(courseId: string): Promise<Enrollment> {
  const { data } = await axiosClient.post<ApiSuccessResponse<Enrollment>>(
    `/courses/${courseId}/enrollments`,
  );

  return data.data;
}

export async function listMyEnrollments(): Promise<Enrollment[]> {
  const { data } =
    await axiosClient.get<ApiSuccessResponse<Enrollment[]>>("/enrollments/me");

  return data.data;
}

export async function listCourseEnrollments(
  courseId: string,
  filters: CourseEnrollmentListFilters = {},
): Promise<CourseEnrollmentListResult> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<CourseEnrollmentListResult>
  >(
    `/courses/${courseId}/enrollments${buildCourseEnrollmentListQuery(filters)}`,
  );

  return data.data;
}
