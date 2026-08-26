import { useQuery } from "@tanstack/react-query";
import {
  getPublishedCourse,
  listLatestPublishedCourses,
  listPublishedCourseSuggestions,
  listPublishedCourses,
  type PublicCourseListFilters,
} from "@/services/api/public-courses";

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

export function usePublishedCoursesList(filters: PublicCourseListFilters) {
  return useQuery({
    queryKey: publicCourseKeys.list(filters),
    queryFn: () => listPublishedCourses(filters),
  });
}

export function usePublishedCourseSuggestions(limit = 8) {
  return useQuery({
    queryKey: publicCourseKeys.suggestion(limit),
    queryFn: () => listPublishedCourseSuggestions(limit),
  });
}

export function useLatestPublishedCourses(limit = 8) {
  return useQuery({
    queryKey: publicCourseKeys.latest(limit),
    queryFn: () => listLatestPublishedCourses(limit),
  });
}

export function usePublishedCourse(courseId: string) {
  const normalizedCourseId = courseId.trim();

  return useQuery({
    queryKey: publicCourseKeys.detail(normalizedCourseId),
    queryFn: () => getPublishedCourse(normalizedCourseId),
    enabled: normalizedCourseId.length > 0,
  });
}
