import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/services/api/admin-dashboard";
import { adminDashboardKeys } from "@/lib/query-keys";

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminDashboardKeys.detail(),
    queryFn: getAdminDashboard,
  });
}
