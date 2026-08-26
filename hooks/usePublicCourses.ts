import { useQuery } from "@tanstack/react-query";
import {
  getPublishedCourse,
  listLatestPublishedCourses,
  listPublishedCourseSuggestions,
  listPublishedCourses,
  type PublicCourseListFilters,
} from "@/services/api/public-courses";
import { publicCourseKeys } from "@/lib/query-keys";

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
