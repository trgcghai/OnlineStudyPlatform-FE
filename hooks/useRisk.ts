import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from "@/constants/constants";
import { riskKeys } from "@/lib/query-keys";
import {
  getRiskLearnerDetail,
  getRiskSummary,
  listRiskLearners,
  recomputeCourseRisk,
  type RiskLearnerFilters,
  type RiskRecomputeResult,
} from "@/services/api/risk";
import { isApiErrorResponse } from "@/services/axios";

export function mapRiskError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) return NETWORK_ERROR_MESSAGE;

  const { status, data } = error.response;
  if (!isApiErrorResponse(data)) return GENERIC_ERROR_MESSAGE;

  if (status === 403) {
    return "Bạn không có quyền xem phân tích rủi ro cho khóa học này.";
  }
  if (status === 404) return "Không tìm thấy dữ liệu rủi ro cho khóa học này.";

  return data.error.message || GENERIC_ERROR_MESSAGE;
}

export function useRiskSummary(courseId: string) {
  return useQuery({
    queryKey: riskKeys.summary(courseId),
    queryFn: () => getRiskSummary(courseId),
    enabled: courseId.trim().length > 0,
  });
}

export function useRiskLearners(courseId: string, filters: RiskLearnerFilters) {
  return useQuery({
    queryKey: riskKeys.learners(courseId, filters),
    queryFn: () => listRiskLearners(courseId, filters),
    enabled: courseId.trim().length > 0,
  });
}

export function useRiskLearnerDetail(
  courseId: string,
  learnerId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: riskKeys.learnerDetail(courseId, learnerId),
    queryFn: () => getRiskLearnerDetail(courseId, learnerId),
    enabled:
      enabled && courseId.trim().length > 0 && learnerId.trim().length > 0,
  });
}

export function useRecomputeCourseRisk() {
  const queryClient = useQueryClient();
  const mutation = useMutation<RiskRecomputeResult, unknown, string>({
    mutationFn: recomputeCourseRisk,
    onSuccess: async (_result, courseId) => {
      await queryClient.invalidateQueries({
        queryKey: riskKeys.course(courseId),
      });
      toast.add({
        title: "Đã tính lại điểm rủi ro cho khóa học.",
        type: "success",
      });
    },
  });

  async function recompute(courseId: string) {
    try {
      const data = await mutation.mutateAsync(courseId);
      return { ok: true as const, data };
    } catch (error) {
      return { ok: false as const, message: mapRiskError(error) };
    }
  }

  return {
    recompute,
    isPending: mutation.isPending,
    pendingCourseId: mutation.variables,
  };
}
