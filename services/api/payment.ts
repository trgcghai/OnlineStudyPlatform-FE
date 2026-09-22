import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export type PaymentConfigCurrency = "VND";

export interface PaymentConfig {
  id: string;
  platformFeePercent: number;
  currency: PaymentConfigCurrency;
  allowedPrices: number[];
  freeCourseLimit: number | null;
  minimumWithdrawalAmount: number;
  earningHoldDays: number;
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
  earningHoldDays: number;
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

export type WithdrawRequestStatus =
  "pending" | "processing" | "processed" | "cancelled" | "rejected";

export interface PaymentTransaction {
  id: string;
  learnerId: string;
  orderId: string;
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
  orderItems: PaymentOrderItem[];
}

export interface PaymentOrderItem {
  id: string;
  courseId: string;
  courseTitle: string;
  instructorName: string | null;
  unitPrice: number;
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

export interface AdminPaymentOrderSummary {
  id: string;
  totalAmount: number;
  itemCount: number;
  items: PaymentOrderItem[];
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
  order: AdminPaymentOrderSummary | null;
}

export interface LearnerPaymentTransactionFilters {
  status?: PaymentStatus;
  page?: number;
  limit?: number;
}

export interface LearnerPaymentTransactionItem {
  id: string;
  courseTitle: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
  paidAt: string | null;
}

export type InstructorBalanceLedgerType = "earning_credit" | "withdraw_debit";

export interface InstructorBalanceSummary {
  totalBalance: number;
  currentBalance: number;
  withdrawableBalance: number;
  nonWithdrawableBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  currency: PaymentConfigCurrency;
}

export interface InstructorBalanceHistoryFilters {
  page?: number;
  limit?: number;
}

export interface InstructorBalanceHistoryItem {
  id: string;
  type: InstructorBalanceLedgerType;
  amountDelta: number;
  currency: PaymentConfigCurrency;
  grossAmount: number | null;
  platformFeeAmount: number | null;
  netAmount: number | null;
  description: string;
  availableAt: string | null;
  createdAt: string;
  course: { id: string; title: string } | null;
  paymentTransactionId: string | null;
  withdrawRequestId: string | null;
}

export interface InstructorBalanceHistoryList {
  items: InstructorBalanceHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WithdrawRequest {
  id: string;
  instructorId: string;
  amount: number;
  currency: PaymentConfigCurrency;
  status: WithdrawRequestStatus;
  requestedAt: string;
  note: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  rejectReason: string | null;
  rejectedAt: string | null;
  processingAt: string | null;
  processedAt: string | null;
  payoutReference: string | null;
  payoutDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWithdrawRequestPayload {
  amount: number;
  note?: string;
}

export interface CancelWithdrawRequestPayload {
  reason?: string;
}

export interface RejectWithdrawRequestPayload {
  reason: string;
}

export interface MarkWithdrawProcessedPayload {
  payoutReference?: string;
}

export interface WithdrawRequestFilters {
  page?: number;
  limit?: number;
}

export interface WithdrawRequestList {
  items: WithdrawRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminWithdrawRequestFilters {
  instructorEmail?: string;
  status?: WithdrawRequestStatus;
  requestedAtFrom?: string;
  requestedAtTo?: string;
  amountSort?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface AdminWithdrawRequestItem {
  id: string;
  amount: number;
  currency: PaymentConfigCurrency;
  status: WithdrawRequestStatus;
  requestedAt: string;
  note: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  rejectReason: string | null;
  rejectedAt: string | null;
  processingAt: string | null;
  processedAt: string | null;
  payoutReference: string | null;
  payoutDescription: string | null;
  createdAt: string;
  updatedAt: string;
  instructor: {
    name: string;
    email: string;
  };
}

export interface AdminWithdrawRequestList {
  items: AdminWithdrawRequestItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminWithdrawPayoutResponse extends AdminWithdrawRequestItem {
  payoutDescription: string;
  qrImageUrl: string;
  payoutAccount: {
    bankName: string;
    bankCode: string;
    bankAccountNumber: string;
    accountHolderName: string;
  };
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
    | "orderId"
    | "orderItems"
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

export async function listLearnerPaymentTransactions(
  filters: LearnerPaymentTransactionFilters = {},
): Promise<AdminPaymentList<LearnerPaymentTransactionItem>> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<AdminPaymentList<LearnerPaymentTransactionItem>>
  >(`/payments/transactions${buildPaymentAdminQuery(filters)}`);

  return data.data;
}

export async function getInstructorBalanceSummary(): Promise<InstructorBalanceSummary> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<InstructorBalanceSummary>
  >("/payments/instructor/balance/summary");

  return data.data;
}

export async function listInstructorBalanceHistory(
  filters: InstructorBalanceHistoryFilters = {},
): Promise<InstructorBalanceHistoryList> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<InstructorBalanceHistoryList>
  >(`/payments/instructor/balance/history${buildPaymentAdminQuery(filters)}`);

  return data.data;
}

export async function createWithdrawRequest(
  payload: CreateWithdrawRequestPayload,
): Promise<WithdrawRequest> {
  const { data } = await axiosClient.post<ApiSuccessResponse<WithdrawRequest>>(
    "/withdraw",
    payload,
  );

  return data.data;
}

export async function listMyWithdrawRequests(
  filters: WithdrawRequestFilters = {},
): Promise<WithdrawRequestList> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<WithdrawRequestList>
  >(`/withdraw/me${buildPaymentAdminQuery(filters)}`);

  return data.data;
}

export async function listAdminWithdrawRequests(
  filters: AdminWithdrawRequestFilters = {},
): Promise<AdminWithdrawRequestList> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<AdminWithdrawRequestList>
  >(`/withdraw/admin${buildPaymentAdminQuery(filters)}`);

  return data.data;
}

export async function cancelWithdrawRequest(
  id: string,
  payload: CancelWithdrawRequestPayload,
): Promise<WithdrawRequest> {
  const { data } = await axiosClient.post<ApiSuccessResponse<WithdrawRequest>>(
    `/withdraw/${id}/cancel`,
    payload,
  );

  return data.data;
}

export async function rejectWithdrawRequest(
  id: string,
  payload: RejectWithdrawRequestPayload,
): Promise<AdminWithdrawRequestItem> {
  const { data } = await axiosClient.post<
    ApiSuccessResponse<AdminWithdrawRequestItem>
  >(`/withdraw/${id}/reject`, payload);

  return data.data;
}

export async function processWithdrawRequest(
  id: string,
): Promise<AdminWithdrawPayoutResponse> {
  const { data } = await axiosClient.post<
    ApiSuccessResponse<AdminWithdrawPayoutResponse>
  >(`/withdraw/${id}/process`);

  return data.data;
}

export async function markWithdrawProcessed(
  id: string,
  payload: MarkWithdrawProcessedPayload,
): Promise<AdminWithdrawRequestItem> {
  const { data } = await axiosClient.post<
    ApiSuccessResponse<AdminWithdrawRequestItem>
  >(`/withdraw/${id}/mark-processed`, payload);

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
