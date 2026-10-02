import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from "@/constants/constants";
import { riskModelKeys } from "@/lib/query-keys";
import {
  getRiskModelStatus,
  trainRiskModel,
  type RiskModelTrainingResult,
} from "@/services/api/risk-model";
import { isApiErrorResponse } from "@/services/axios";

const LOW_SAMPLE_MESSAGE =
  "Chưa đủ dữ liệu risk_scores để train model. Cần ít nhất 10 mẫu.";

export function mapRiskModelError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) return NETWORK_ERROR_MESSAGE;

  const { status, data } = error.response;
  if (!isApiErrorResponse(data)) return GENERIC_ERROR_MESSAGE;

  if (status === 400) return data.error.message || LOW_SAMPLE_MESSAGE;
  if (status === 403) return "Bạn không có quyền quản lý Risk Model.";

  return data.error.message || GENERIC_ERROR_MESSAGE;
}

export function useRiskModelStatus() {
  return useQuery({
    queryKey: riskModelKeys.active(),
    queryFn: getRiskModelStatus,
  });
}

export function useTrainRiskModel() {
  const queryClient = useQueryClient();
  const mutation = useMutation<RiskModelTrainingResult, unknown, void>({
    mutationFn: trainRiskModel,
    onSuccess: async (model) => {
      await queryClient.invalidateQueries({ queryKey: riskModelKeys.active() });
      toast.add({
        title: `Đã train Risk Model ${model.modelVersion}.`,
        type: "success",
      });
    },
  });

  async function train() {
    try {
      const data = await mutation.mutateAsync();

      return { ok: true as const, data };
    } catch (error) {
      return { ok: false as const, message: mapRiskModelError(error) };
    }
  }

  return {
    train,
    isPending: mutation.isPending,
  };
}
