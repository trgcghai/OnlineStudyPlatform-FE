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
  cancelWithdrawRequest,
  createWithdrawRequest,
  getAdminPaymentProviderEventDetail,
  getAdminPaymentTransactionDetail,
  getCoursePricing,
  getInstructorBalanceSummary,
  getPaymentConfig,
  getPaymentTransaction,
  listAdminWithdrawRequests,
  listInstructorBalanceHistory,
  listLearnerPaymentTransactions,
  listMyWithdrawRequests,
  listAdminPaymentProviderEvents,
  listAdminPaymentTransactions,
  listPaymentConfigAudits,
  markWithdrawProcessed,
  processWithdrawRequest,
  rejectWithdrawRequest,
  updatePaymentConfig,
  type AdminWithdrawRequestFilters,
  type AdminWithdrawRequestItem,
  type AdminWithdrawPayoutResponse,
  type CancelWithdrawRequestPayload,
  type CreateWithdrawRequestPayload,
  type AdminPaymentTransactionFilters,
  type AdminProviderEventFilters,
  type CheckoutResult,
  type InstructorBalanceHistoryFilters,
  type LearnerPaymentTransactionFilters,
  type MarkWithdrawProcessedPayload,
  type PaymentConfig,
  type PaymentConfigAuditFilters,
  type RejectWithdrawRequestPayload,
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
    if (data.error.message === "Instructor payout account is incomplete") {
      return "Tài khoản nhận tiền của giảng viên chưa đầy đủ. Vui lòng yêu cầu giảng viên cập nhật thông tin.";
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
    if (data.error.message === "Amount exceeds withdrawable balance") {
      const details = Object.fromEntries(
        data.error.details.flatMap((detail) => {
          const [key, value] = detail.split("=");

          return key && value ? [[key, value]] : [];
        }),
      );
      const withdrawableBalance = Number(details.withdrawableBalance);
      const currency = details.currency || "VND";

      if (Number.isFinite(withdrawableBalance) && withdrawableBalance >= 0) {
        return `Số tiền rút vượt quá số dư có thể rút ${withdrawableBalance.toLocaleString("vi-VN")} ${currency}.`;
      }

      return "Số tiền rút vượt quá số dư có thể rút hiện tại.";
    }
    if (
      data.error.message === "Only pending withdraw requests can be cancelled"
    ) {
      return "Chỉ có thể hủy yêu cầu rút tiền đang chờ xử lý.";
    }
    if (
      data.error.message === "Only pending withdraw requests can be rejected"
    ) {
      return "Chỉ có thể từ chối yêu cầu rút tiền đang chờ xử lý.";
    }
    if (
      data.error.message ===
      "Only pending withdraw requests can start processing"
    ) {
      return "Chỉ có thể bắt đầu xử lý yêu cầu rút tiền đang chờ.";
    }
    if (
      data.error.message ===
      "Only processing withdraw requests can be marked processed"
    ) {
      return "Chỉ có thể đánh dấu đã xử lý cho yêu cầu đang xử lý.";
    }

    return data.error.message || "Yêu cầu rút tiền không hợp lệ.";
  }

  if (status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (status === 404) return "Không tìm thấy yêu cầu rút tiền.";

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

export function useInstructorBalanceSummary() {
  return useQuery({
    queryKey: paymentKeys.instructorBalanceSummary(),
    queryFn: getInstructorBalanceSummary,
  });
}

export function useInstructorBalanceHistory(
  filters: InstructorBalanceHistoryFilters,
) {
  return useQuery({
    queryKey: paymentKeys.instructorBalanceHistory(filters),
    queryFn: () => listInstructorBalanceHistory(filters),
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

export function useCancelWithdrawRequest() {
  const queryClient = useQueryClient();

  return useMutation<
    WithdrawRequest,
    unknown,
    { id: string; payload: CancelWithdrawRequestPayload }
  >({
    mutationFn: ({ id, payload }) => cancelWithdrawRequest(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: withdrawKeys.meAll() });
      toast.add({ title: "Đã hủy yêu cầu rút tiền.", type: "success" });
    },
    onError: (error) => {
      toast.add({ title: mapWithdrawError(error), type: "error" });
    },
  });
}

export function useRejectWithdrawRequest() {
  const queryClient = useQueryClient();

  return useMutation<
    AdminWithdrawRequestItem,
    unknown,
    { id: string; payload: RejectWithdrawRequestPayload }
  >({
    mutationFn: ({ id, payload }) => rejectWithdrawRequest(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: withdrawKeys.adminAll() });
      toast.add({ title: "Đã từ chối yêu cầu rút tiền.", type: "success" });
    },
    onError: (error) => {
      toast.add({ title: mapWithdrawError(error), type: "error" });
    },
  });
}

export function useProcessWithdrawRequest() {
  return useMutation<AdminWithdrawPayoutResponse, unknown, string>({
    mutationFn: processWithdrawRequest,
    onError: (error) => {
      toast.add({ title: mapWithdrawError(error), type: "error" });
    },
  });
}

export function useMarkWithdrawProcessed() {
  const queryClient = useQueryClient();

  return useMutation<
    AdminWithdrawRequestItem,
    unknown,
    { id: string; payload: MarkWithdrawProcessedPayload }
  >({
    mutationFn: ({ id, payload }) => markWithdrawProcessed(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: withdrawKeys.adminAll() });
      toast.add({
        title: "Đã ghi nhận yêu cầu rút tiền đã xử lý.",
        type: "success",
      });
    },
    onError: (error) => {
      toast.add({ title: mapWithdrawError(error), type: "error" });
    },
  });
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
