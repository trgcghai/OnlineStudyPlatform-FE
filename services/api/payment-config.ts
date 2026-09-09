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
    await axiosClient.get<ApiSuccessResponse<PaymentConfig>>("/payment/config");

  return data.data;
}

export async function updatePaymentConfig(
  payload: UpdatePaymentConfigPayload,
): Promise<PaymentConfig> {
  const { data } = await axiosClient.put<ApiSuccessResponse<PaymentConfig>>(
    "/payment/config",
    payload,
  );

  return data.data;
}

export async function listPaymentConfigAudits(
  filters: PaymentConfigAuditFilters = {},
): Promise<PaymentConfigAuditList> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<PaymentConfigAuditList>
  >(`/payment/config/audits${buildPaymentConfigAuditQuery(filters)}`);

  return data.data;
}
