import { useQuery } from "@tanstack/react-query";
import { learnerDashboardKeys } from "@/lib/query-keys";
import { getLearnerDashboard } from "@/services/api/learner-dashboard";

export function useLearnerDashboard() {
  return useQuery({
    queryKey: learnerDashboardKeys.detail(),
    queryFn: getLearnerDashboard,
  });
}
