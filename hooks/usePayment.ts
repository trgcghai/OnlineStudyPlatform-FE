import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from "@/constants/constants";
import { paymentKeys } from "@/lib/query-keys";
import {
  cancelPaymentTransaction,
  createPaymentCheckout,
  getCoursePricing,
  getPaymentConfig,
  getPaymentTransaction,
  listPaymentConfigAudits,
  updatePaymentConfig,
  type CheckoutResult,
  type PaymentConfig,
  type PaymentConfigAuditFilters,
  type UpdatePaymentConfigPayload,
} from "@/services/api/payment";
import { isApiErrorResponse } from "@/services/axios";

function mapCoursePricingError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return GENERIC_ERROR_MESSAGE;
  }

  if (status === 403) {
    return "Chỉ giảng viên mới xem được danh sách giá khóa học.";
  }

  return data.error.message || GENERIC_ERROR_MESSAGE;
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

export function mapPaymentError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return GENERIC_ERROR_MESSAGE;
  }

  if (status === 400) return data.error.message || "Yêu cầu không hợp lệ.";
  if (status === 401) return "Vui lòng đăng nhập để tiếp tục thanh toán.";
  if (status === 403)
    return "Chỉ tài khoản học viên mới có thể thực hiện thanh toán.";
  if (status === 404) return "Không tìm thấy giao dịch thanh toán.";
  if (status === 409) return "Bạn đã đăng ký khóa học này.";

  return data.error.message || GENERIC_ERROR_MESSAGE;
}

export function useCoursePricing() {
  return useQuery({
    queryKey: paymentKeys.pricing(),
    queryFn: getCoursePricing,
    retry: false,
  });
}

export function formatCoursePricingError(error: unknown): string {
  return mapCoursePricingError(error);
}

export interface PaymentConfigFailure {
  formError: string;
}

export interface PaymentConfigResult {
  ok: boolean;
  failure?: PaymentConfigFailure;
}

export function usePaymentConfig() {
  return useQuery({
    queryKey: paymentKeys.config(),
    queryFn: getPaymentConfig,
  });
}

export function usePaymentConfigAudits(
  filters: PaymentConfigAuditFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: paymentKeys.configAudits(filters),
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
        queryKey: paymentKeys.config(),
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

export function usePaymentTransaction(transactionId: string) {
  return useQuery({
    queryKey: paymentKeys.transaction(transactionId),
    queryFn: () => getPaymentTransaction(transactionId),
    enabled: transactionId.trim().length > 0,
    refetchInterval: (query) => {
      const state = query.state.data;
      return state && state.status === "pending" ? 5000 : false;
    },
  });
}

export function useCreatePaymentCheckout() {
  const mutation = useMutation<CheckoutResult, unknown, string>({
    mutationFn: createPaymentCheckout,
    onError: (error) => {
      toast.add({ title: mapPaymentError(error), type: "error" });
    },
  });

  return mutation;
}

export function useCancelPaymentTransaction(transactionId: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation<CheckoutResult, unknown, string>({
    mutationFn: cancelPaymentTransaction,
    onSuccess: async (transaction) => {
      await queryClient.invalidateQueries({
        queryKey: paymentKeys.transaction(transactionId),
      });
      toast.add({ title: "Đã hủy giao dịch.", type: "info" });
      void transaction;
    },
  });

  return mutation;
}
