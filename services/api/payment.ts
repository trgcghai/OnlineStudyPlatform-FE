import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export type PaymentConfigCurrency = "VND";

export interface PaymentConfig {
  id: string;
  platformFeePercent: number;
  currency: PaymentConfigCurrency;
  allowedPrices: number[];
  freeCourseLimit: number | null;
  minimumWithdrawalAmount: number;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePaymentConfigPayload {
  platformFeePercent: number;
  currency: PaymentConfigCurrency;
  allowedPrices: number[];
  freeCourseLimit: number | null;
  minimumWithdrawalAmount: number;
}

export interface PaymentConfigSnapshot extends UpdatePaymentConfigPayload {
  updatedById: string | null;
}

export interface PaymentConfigAudit {
  id: string;
  configId: string;
  actorEmail: string;
  previousValue: PaymentConfigSnapshot;
  newValue: PaymentConfigSnapshot;
  changedFields: Array<keyof PaymentConfigSnapshot>;
  createdAt: string;
}

export interface PaymentConfigAuditFilters {
  page?: number;
  limit?: number;
}

export interface PaymentConfigAuditList {
  items: PaymentConfigAudit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CoursePricingReference {
  currency: PaymentConfigCurrency;
  allowedPrices: number[];
}

export type PaymentStatus =
  "pending" | "paid" | "failed" | "cancelled" | "expired" | "refunded";

export interface PaymentTransaction {
  id: string;
  learnerId: string;
  courseId: string;
  amount: number;
  currency: "VND";
  status: PaymentStatus;
  paymentCode: string;
  provider: string;
  providerTransactionId: string | null;
  providerGateway: string | null;
  providerReferenceCode: string | null;
  expiresAt: string;
  paidAt: string | null;
  createdAt: string;
}

export interface CheckoutResult extends PaymentTransaction {
  bankAccount: string;
  bankHolder: string;
  bankCode: string;
  qrImageUrl: string;
}

function buildPaymentConfigAuditQuery(
  filters: PaymentConfigAuditFilters = {},
): string {
  const params = new URLSearchParams();

  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();

  return query.length > 0 ? `?${query}` : "";
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  const { data } =
    await axiosClient.get<ApiSuccessResponse<PaymentConfig>>(
      "/payments/config",
    );

  return data.data;
}

export async function updatePaymentConfig(
  payload: UpdatePaymentConfigPayload,
): Promise<PaymentConfig> {
  const { data } = await axiosClient.put<ApiSuccessResponse<PaymentConfig>>(
    "/payments/config",
    payload,
  );

  return data.data;
}

export async function listPaymentConfigAudits(
  filters: PaymentConfigAuditFilters = {},
): Promise<PaymentConfigAuditList> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<PaymentConfigAuditList>
  >(`/payments/config/audits${buildPaymentConfigAuditQuery(filters)}`);

  return data.data;
}

export async function getCoursePricing(): Promise<CoursePricingReference> {
  const { data } =
    await axiosClient.get<ApiSuccessResponse<CoursePricingReference>>(
      "/payments/pricing",
    );

  return data.data;
}

export async function createPaymentCheckout(
  courseId: string,
): Promise<CheckoutResult> {
  const { data } = await axiosClient.post<ApiSuccessResponse<CheckoutResult>>(
    "/payments/checkout",
    { courseId },
  );

  return data.data;
}

export async function getPaymentTransaction(
  transactionId: string,
): Promise<CheckoutResult> {
  const { data } = await axiosClient.get<ApiSuccessResponse<CheckoutResult>>(
    `/payments/transactions/${transactionId}`,
  );

  return data.data;
}

export async function cancelPaymentTransaction(
  transactionId: string,
): Promise<CheckoutResult> {
  const { data } = await axiosClient.post<ApiSuccessResponse<CheckoutResult>>(
    `/payments/transactions/${transactionId}/cancel`,
  );

  return data.data;
}
