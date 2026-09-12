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

export interface AdminPaymentList<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminPaymentPersonSummary {
  id: string;
  name: string;
  email: string;
}

export interface AdminPaymentCourseSummary {
  id: string;
  title: string;
}

export interface AdminPaymentTransactionFilters {
  status?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  learnerId?: string;
  courseId?: string;
  amountMin?: number;
  amountMax?: number;
  page?: number;
  limit?: number;
}

export interface AdminPaymentTransactionItem extends PaymentTransaction {
  updatedAt: string;
  learner: AdminPaymentPersonSummary | null;
  course: AdminPaymentCourseSummary | null;
}

export type AdminProviderEventResult =
  | "processed_paid"
  | "duplicate_provider_event"
  | "duplicate_payment"
  | "amount_mismatch"
  | "expired"
  | "unknown_payment_code"
  | "ignored_transfer_type";

export interface AdminProviderEventFilters {
  result?: AdminProviderEventResult;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  transferType?: string;
  paymentStatus?: PaymentStatus;
  gateway?: string;
  page?: number;
  limit?: number;
}

export interface AdminProviderEventItem {
  id: string;
  provider: string;
  providerTransactionId: string;
  paymentTransactionId: string | null;
  reportedPaymentCode: string | null;
  transferAmount: number;
  transferType: string;
  gateway: string | null;
  providerReferenceCode: string | null;
  result: AdminProviderEventResult | null;
  reason: string | null;
  receivedAt: string;
  processedAt: string | null;
  createdAt: string;
  paymentTransaction: Pick<
    PaymentTransaction,
    "id" | "paymentCode" | "status"
  > | null;
}

export interface AdminPaymentAuditItem {
  id: string;
  fromStatus: PaymentStatus | null;
  toStatus: PaymentStatus;
  actorType: string;
  actorId: string | null;
  providerTransactionId: string | null;
  reason: string | null;
  createdAt: string;
}

export interface AdminPaymentTransactionDetail extends AdminPaymentTransactionItem {
  audits: AdminPaymentAuditItem[];
  providerEvents: Array<
    Pick<
      AdminProviderEventItem,
      | "id"
      | "result"
      | "providerTransactionId"
      | "reportedPaymentCode"
      | "transferAmount"
      | "transferType"
      | "gateway"
      | "receivedAt"
      | "processedAt"
    >
  >;
}

export interface AdminProviderEventDetail extends Omit<
  AdminProviderEventItem,
  "paymentTransaction"
> {
  paymentTransaction: Pick<
    PaymentTransaction,
    | "id"
    | "paymentCode"
    | "status"
    | "courseId"
    | "learnerId"
    | "amount"
    | "currency"
  > | null;
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

function buildPaymentAdminQuery(filters: object = {}): string {
  const params = new URLSearchParams();

  Object.entries(filters as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

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

export async function listAdminPaymentTransactions(
  filters: AdminPaymentTransactionFilters = {},
): Promise<AdminPaymentList<AdminPaymentTransactionItem>> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<AdminPaymentList<AdminPaymentTransactionItem>>
  >(`/payments/admin/transactions${buildPaymentAdminQuery(filters)}`);

  return data.data;
}

export async function getAdminPaymentTransactionDetail(
  transactionId: string,
): Promise<AdminPaymentTransactionDetail> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<AdminPaymentTransactionDetail>
  >(`/payments/admin/transactions/${transactionId}`);

  return data.data;
}

export async function listAdminPaymentProviderEvents(
  filters: AdminProviderEventFilters = {},
): Promise<AdminPaymentList<AdminProviderEventItem>> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<AdminPaymentList<AdminProviderEventItem>>
  >(`/payments/admin/provider-events${buildPaymentAdminQuery(filters)}`);

  return data.data;
}

export async function getAdminPaymentProviderEventDetail(
  eventId: string,
): Promise<AdminProviderEventDetail> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<AdminProviderEventDetail>
  >(`/payments/admin/provider-events/${eventId}`);

  return data.data;
}
