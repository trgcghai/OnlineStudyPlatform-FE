import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from "@/constants/constants";
import { adminPaymentConfigKeys } from "@/lib/query-keys";
import {
  getPaymentConfig,
  listPaymentConfigAudits,
  updatePaymentConfig,
  type PaymentConfig,
  type PaymentConfigAuditFilters,
  type UpdatePaymentConfigPayload,
} from "@/services/api/payment-config";
import { isApiErrorResponse } from "@/services/axios";

export interface PaymentConfigFailure {
  formError: string;
}

export interface PaymentConfigResult {
  ok: boolean;
  failure?: PaymentConfigFailure;
}

function mapPaymentConfigError(error: unknown): PaymentConfigFailure {
  if (!isAxiosError(error) || !error.response) {
    return { formError: NETWORK_ERROR_MESSAGE };
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return { formError: GENERIC_ERROR_MESSAGE };
  }

  if (status === 403) {
    return { formError: "Bạn không có quyền thực hiện thao tác này." };
  }

  if (status === 400) {
    return {
      formError:
        data.error.message || "Dữ liệu cấu hình thanh toán không hợp lệ.",
    };
  }

  return { formError: data.error.message || GENERIC_ERROR_MESSAGE };
}

export function usePaymentConfig() {
  return useQuery({
    queryKey: adminPaymentConfigKeys.detail(),
    queryFn: getPaymentConfig,
  });
}

export function usePaymentConfigAudits(
  filters: PaymentConfigAuditFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: adminPaymentConfigKeys.audits(filters),
    queryFn: () => listPaymentConfigAudits(filters),
    enabled,
  });
}

export function useUpdatePaymentConfig() {
  const queryClient = useQueryClient();
  const mutation = useMutation<
    PaymentConfig,
    unknown,
    UpdatePaymentConfigPayload
  >({
    mutationFn: updatePaymentConfig,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminPaymentConfigKeys.all,
      });
      toast.add({ title: "Đã lưu cấu hình thanh toán.", type: "success" });
    },
  });

  async function updateConfig(
    payload: UpdatePaymentConfigPayload,
  ): Promise<PaymentConfigResult> {
    try {
      await mutation.mutateAsync(payload);
      return { ok: true };
    } catch (error) {
      return { ok: false, failure: mapPaymentConfigError(error) };
    }
  }

  return { updateConfig, isPending: mutation.isPending };
}
