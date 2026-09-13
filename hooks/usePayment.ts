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
  createWithdrawRequest,
  createPaymentCheckout,
  getAdminPaymentProviderEventDetail,
  getAdminPaymentTransactionDetail,
  getCoursePricing,
  getPaymentConfig,
  getPaymentTransaction,
  listAdminWithdrawRequests,
  listLearnerPaymentTransactions,
  listMyWithdrawRequests,
  listAdminPaymentProviderEvents,
  listAdminPaymentTransactions,
  listPaymentConfigAudits,
  updatePaymentConfig,
  type AdminWithdrawRequestFilters,
  type CreateWithdrawRequestPayload,
  type AdminPaymentTransactionFilters,
  type AdminProviderEventFilters,
  type CheckoutResult,
  type LearnerPaymentTransactionFilters,
  type PaymentConfig,
  type PaymentConfigAuditFilters,
  type UpdatePaymentConfigPayload,
  type WithdrawRequest,
  type WithdrawRequestFilters,
} from "@/services/api/payment";
import { withdrawKeys } from "@/lib/query-keys";
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

export function mapWithdrawError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return GENERIC_ERROR_MESSAGE;
  }

  if (status === 400) {
    if (data.error.message === "Instructor payout account is required") {
      return "Vui lòng cấu hình tài khoản nhận tiền trước khi tạo yêu cầu rút tiền.";
    }
    if (data.error.message === "Amount is below minimum withdrawal amount") {
      const details = Object.fromEntries(
        data.error.details.flatMap((detail) => {
          const [key, value] = detail.split("=");

          return key && value ? [[key, value]] : [];
        }),
      );
      const minimum = Number(details.minimumWithdrawalAmount);
      const currency = details.currency || "VND";

      if (Number.isFinite(minimum) && minimum > 0) {
        return `Số tiền rút thấp hơn mức tối thiểu ${minimum.toLocaleString("vi-VN")} ${currency}.`;
      }

      return "Số tiền rút thấp hơn mức tối thiểu đang được cấu hình.";
    }

    return data.error.message || "Yêu cầu rút tiền không hợp lệ.";
  }

  if (status === 403) return "Bạn không có quyền thực hiện thao tác này.";

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

export function useLearnerPaymentTransactions(
  filters: LearnerPaymentTransactionFilters,
) {
  return useQuery({
    queryKey: paymentKeys.learnerTransactions(filters),
    queryFn: () => listLearnerPaymentTransactions(filters),
  });
}

export function useMyWithdrawRequests(filters: WithdrawRequestFilters) {
  return useQuery({
    queryKey: withdrawKeys.me(filters),
    queryFn: () => listMyWithdrawRequests(filters),
  });
}

export function useAdminWithdrawRequests(filters: AdminWithdrawRequestFilters) {
  return useQuery({
    queryKey: withdrawKeys.admin(filters),
    queryFn: () => listAdminWithdrawRequests(filters),
  });
}

export function useCreateWithdrawRequest() {
  const queryClient = useQueryClient();

  return useMutation<WithdrawRequest, unknown, CreateWithdrawRequestPayload>({
    mutationFn: createWithdrawRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: withdrawKeys.meAll() });
      toast.add({ title: "Đã tạo yêu cầu rút tiền.", type: "success" });
    },
    onError: (error) => {
      toast.add({ title: mapWithdrawError(error), type: "error" });
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

export function useAdminPaymentTransactions(
  filters: AdminPaymentTransactionFilters,
) {
  return useQuery({
    queryKey: paymentKeys.adminTransactions(filters),
    queryFn: () => listAdminPaymentTransactions(filters),
  });
}

export function useAdminPaymentTransactionDetail(transactionId: string) {
  return useQuery({
    queryKey: paymentKeys.adminTransactionDetail(transactionId),
    queryFn: () => getAdminPaymentTransactionDetail(transactionId),
    enabled: transactionId.trim().length > 0,
  });
}

export function useAdminPaymentProviderEvents(
  filters: AdminProviderEventFilters,
) {
  return useQuery({
    queryKey: paymentKeys.adminProviderEvents(filters),
    queryFn: () => listAdminPaymentProviderEvents(filters),
  });
}

export function useAdminPaymentProviderEventDetail(eventId: string) {
  return useQuery({
    queryKey: paymentKeys.adminProviderEventDetail(eventId),
    queryFn: () => getAdminPaymentProviderEventDetail(eventId),
    enabled: eventId.trim().length > 0,
  });
}
