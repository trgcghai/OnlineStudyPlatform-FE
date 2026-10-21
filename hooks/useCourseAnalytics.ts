import { useQuery } from "@tanstack/react-query";
import {
  getCourseAnalytics,
  type AnalyticsRange,
} from "@/services/api/analytics";
import { instructorAnalyticsKeys } from "@/lib/query-keys";

export function useCourseAnalytics(
  courseId: string,
  range: AnalyticsRange | null,
) {
  const validRange = Boolean(
    range?.from && range.to &&
      Number.isFinite(Date.parse(range.from)) &&
      Number.isFinite(Date.parse(range.to)) &&
      Date.parse(range.from) < Date.parse(range.to),
  );

  return useQuery({
    queryKey: instructorAnalyticsKeys.course(
      courseId,
      range?.from ?? "",
      range?.to ?? "",
    ),
    queryFn: () => getCourseAnalytics(courseId, range!),
    enabled: courseId.trim().length > 0 && validRange,
  });
}
