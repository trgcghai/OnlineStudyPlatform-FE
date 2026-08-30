import type { CourseListFilters } from "@/services/api/courses";
import type { PublicCourseListFilters } from "@/services/api/public-courses";
import type { AdminUserFilters } from "@/services/api/users";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const userKeys = {
  all: ["users"] as const,
  me: () => [...userKeys.all, "me"] as const,
};

export const adminUserKeys = {
  all: ["admin-users"] as const,
  list: (filters: AdminUserFilters) =>
    [...adminUserKeys.all, "list", filters] as const,
};

export const adminCourseApprovalKeys = {
  all: ["admin-course-approvals"] as const,
  list: (filters: CourseListFilters) =>
    [...adminCourseApprovalKeys.all, "list", filters] as const,
};

export const instructorCourseKeys = {
  all: ["instructor-courses"] as const,
  list: (filters: CourseListFilters) =>
    [...instructorCourseKeys.all, "list", filters] as const,
  detail: (courseId: string) =>
    [...instructorCourseKeys.all, "detail", courseId] as const,
};

export const instructorLessonKeys = {
  all: ["instructor-lessons"] as const,
  list: (courseId: string) =>
    [...instructorLessonKeys.all, "list", courseId] as const,
  detail: (lessonId: string) =>
    [...instructorLessonKeys.all, "detail", lessonId] as const,
};

export const instructorQuizKeys = {
  all: ["instructor-quizzes"] as const,
  list: (courseId: string, lessonId: string) =>
    [...instructorQuizKeys.all, "list", courseId, lessonId] as const,
  detail: (quizId: string) =>
    [...instructorQuizKeys.all, "detail", quizId] as const,
};

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export const publicCourseKeys = {
  all: ["public-courses"] as const,
  list: (filters: PublicCourseListFilters) =>
    [...publicCourseKeys.all, "list", filters] as const,
  suggestion: (limit: number) =>
    [...publicCourseKeys.all, "suggestion", limit] as const,
  latest: (limit: number) =>
    [...publicCourseKeys.all, "latest", limit] as const,
  detail: (courseId: string) =>
    [...publicCourseKeys.all, "detail", courseId] as const,
};

export const enrollmentKeys = {
  all: ["enrollments"] as const,
  mine: () => [...enrollmentKeys.all, "mine"] as const,
};

export const learningKeys = {
  all: ["learning"] as const,
  course: (courseId: string) =>
    [...learningKeys.all, "course", courseId] as const,
  lesson: (courseId: string, lessonId: string) =>
    [...learningKeys.all, "lesson", courseId, lessonId] as const,
};
