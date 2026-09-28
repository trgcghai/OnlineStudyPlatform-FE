import { useQuery } from "@tanstack/react-query";
import { recommendationKeys } from "@/lib/query-keys";
import { listMyCourseRecommendations } from "@/services/api/recommendations";

export function useMyCourseRecommendations(limit = 8, enabled = true) {
  return useQuery({
    queryKey: recommendationKeys.mine(limit),
    queryFn: () => listMyCourseRecommendations(limit),
    enabled,
  });
}
