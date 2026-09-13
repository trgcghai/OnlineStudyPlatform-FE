"use client";

import { type ComponentType, useMemo } from "react";
import { CreditCard, RadioTower, ReceiptText, ShieldCheck } from "lucide-react";
import { useQueryStates } from "nuqs";
import {
  PaymentProviderEventFilters,
  type ProviderEventPaymentStatusFilter,
  type ProviderEventResultFilter,
} from "@/components/admin/payments/payment-provider-event-filters";
import { PaymentProviderEventsTable } from "@/components/admin/payments/payment-provider-events-table";
import {
  PaymentTransactionFilters,
  type PaymentStatusFilter,
} from "@/components/admin/payments/payment-transaction-filters";
import { PaymentTransactionsTable } from "@/components/admin/payments/payment-transactions-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAdminPaymentProviderEvents,
  useAdminPaymentTransactions,
} from "@/hooks/usePayment";
import { useClampUrlPage } from "@/hooks/useClampUrlPage";
import { useDebounce } from "@/hooks/useDebounce";
import {
  debouncedStringParser,
  limitParser,
  optionalStringParser,
  pageParser,
  paymentStatusFilterParser,
  providerEventResultFilterParser,
  searchParser,
  URL_FILTER_HISTORY,
  URL_SEARCH_DEBOUNCE_MS,
} from "@/lib/search-params/filter-parsers";
import type {
  AdminPaymentTransactionFilters,
  AdminProviderEventFilters,
  PaymentStatus,
} from "@/services/api/payment";

const DEFAULT_PAGE_SIZE = 10;
const TRANSACTIONS_TAB = "transactions";
const PROVIDER_EVENTS_TAB = "provider-events";

function parseAmount(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const amount = Number(value);

  return Number.isFinite(amount) && amount >= 0 ? amount : undefined;
}

function PaymentOverviewCard({
  description,
  icon: Icon,
  title,
  value,
}: {
  description: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="truncate text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPaymentsPage() {
  const [filtersState, setFiltersState] = useQueryStates(
    {
      tab: optionalStringParser,
      txStatus: paymentStatusFilterParser,
      txFrom: optionalStringParser,
      txTo: optionalStringParser,
      txSearch: searchParser,
      txLearnerId: debouncedStringParser,
      txCourseId: debouncedStringParser,
      txAmountMin: optionalStringParser,
      txAmountMax: optionalStringParser,
      txPage: pageParser,
      txLimit: limitParser(DEFAULT_PAGE_SIZE),
      eventResult: providerEventResultFilterParser,
      eventFrom: optionalStringParser,
      eventTo: optionalStringParser,
      eventSearch: searchParser,
      eventTransferType: debouncedStringParser,
      eventPaymentStatus: paymentStatusFilterParser,
      eventGateway: optionalStringParser,
      eventPage: pageParser,
      eventLimit: limitParser(DEFAULT_PAGE_SIZE),
    },
    { history: URL_FILTER_HISTORY },
  );

  const activeTab =
    filtersState.tab === PROVIDER_EVENTS_TAB
      ? PROVIDER_EVENTS_TAB
      : TRANSACTIONS_TAB;
  const debouncedTxSearch = useDebounce(
    filtersState.txSearch,
    URL_SEARCH_DEBOUNCE_MS,
  );
  const debouncedTxLearnerId = useDebounce(
    filtersState.txLearnerId,
    URL_SEARCH_DEBOUNCE_MS,
  );
  const debouncedTxCourseId = useDebounce(
    filtersState.txCourseId,
    URL_SEARCH_DEBOUNCE_MS,
  );
  const debouncedTxAmountMin = useDebounce(
    filtersState.txAmountMin,
    URL_SEARCH_DEBOUNCE_MS,
  );
  const debouncedTxAmountMax = useDebounce(
    filtersState.txAmountMax,
    URL_SEARCH_DEBOUNCE_MS,
  );
  const debouncedEventSearch = useDebounce(
    filtersState.eventSearch,
    URL_SEARCH_DEBOUNCE_MS,
  );
  const debouncedEventTransferType = useDebounce(
    filtersState.eventTransferType,
    URL_SEARCH_DEBOUNCE_MS,
  );
  const debouncedEventGateway = useDebounce(
    filtersState.eventGateway,
    URL_SEARCH_DEBOUNCE_MS,
  );

  const transactionFilters = useMemo<AdminPaymentTransactionFilters>(
    () => ({
      status: filtersState.txStatus || undefined,
      dateFrom: filtersState.txFrom || undefined,
      dateTo: filtersState.txTo || undefined,
      search: debouncedTxSearch || undefined,
      learnerId: debouncedTxLearnerId || undefined,
      courseId: debouncedTxCourseId || undefined,
      amountMin: parseAmount(debouncedTxAmountMin),
      amountMax: parseAmount(debouncedTxAmountMax),
      page: filtersState.txPage,
      limit: filtersState.txLimit,
    }),
    [
      debouncedTxAmountMax,
      debouncedTxAmountMin,
      debouncedTxCourseId,
      debouncedTxLearnerId,
      debouncedTxSearch,
      filtersState,
    ],
  );

  const providerEventFilters = useMemo<AdminProviderEventFilters>(
    () => ({
      result: filtersState.eventResult || undefined,
      dateFrom: filtersState.eventFrom || undefined,
      dateTo: filtersState.eventTo || undefined,
      search: debouncedEventSearch || undefined,
      transferType: debouncedEventTransferType || undefined,
      paymentStatus: filtersState.eventPaymentStatus || undefined,
      gateway: debouncedEventGateway || undefined,
      page: filtersState.eventPage,
      limit: filtersState.eventLimit,
    }),
    [
      debouncedEventGateway,
      debouncedEventSearch,
      debouncedEventTransferType,
      filtersState,
    ],
  );

  const transactionsQuery = useAdminPaymentTransactions(transactionFilters);
  const providerEventsQuery =
    useAdminPaymentProviderEvents(providerEventFilters);
  const transactions = transactionsQuery.data?.items ?? [];
  const providerEvents = providerEventsQuery.data?.items ?? [];
  const transactionStatusCounts = transactions.reduce<
    Partial<Record<PaymentStatus, number>>
  >((counts, transaction) => {
    counts[transaction.status] = (counts[transaction.status] ?? 0) + 1;
    return counts;
  }, {});
  const unmatchedProviderEventCount = providerEvents.filter(
    (event) => !event.paymentTransaction,
  ).length;

  useClampUrlPage({
    page: filtersState.txPage,
    totalPages: transactionsQuery.data?.totalPages ?? 0,
    enabled:
      activeTab === TRANSACTIONS_TAB &&
      !transactionsQuery.isPending &&
      !transactionsQuery.isError,
    onPageChange: (page) => {
      void setFiltersState({ txPage: page });
    },
  });

  useClampUrlPage({
    page: filtersState.eventPage,
    totalPages: providerEventsQuery.data?.totalPages ?? 0,
    enabled:
      activeTab === PROVIDER_EVENTS_TAB &&
      !providerEventsQuery.isPending &&
      !providerEventsQuery.isError,
    onPageChange: (page) => {
      void setFiltersState({ eventPage: page });
    },
  });

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Chế độ chỉ xem
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Thanh toán
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Theo dõi giao dịch thanh toán và ledger sự kiện SePay theo cùng
            luồng quản trị hiện có.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PaymentOverviewCard
          icon={CreditCard}
          title="Giao dịch"
          value={transactionsQuery.data?.total ?? 0}
          description="Tổng giao dịch theo bộ lọc"
        />
        <PaymentOverviewCard
          icon={ReceiptText}
          title="Đã thanh toán"
          value={transactionStatusCounts.paid ?? 0}
          description="Trong trang giao dịch hiện tại"
        />
        <PaymentOverviewCard
          icon={RadioTower}
          title="Sự kiện provider"
          value={providerEventsQuery.data?.total ?? 0}
          description="Tổng sự kiện theo bộ lọc"
        />
        <PaymentOverviewCard
          icon={ShieldCheck}
          title="Chưa khớp"
          value={unmatchedProviderEventCount}
          description="Trong trang sự kiện hiện tại"
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(tab) => void setFiltersState({ tab })}
        className="flex flex-col gap-4"
      >
        <TabsList className="w-fit">
          <TabsTrigger value={TRANSACTIONS_TAB}>
            <CreditCard className="size-4" aria-hidden="true" />
            Giao dịch thanh toán
          </TabsTrigger>
          <TabsTrigger value={PROVIDER_EVENTS_TAB}>
            <RadioTower className="size-4" aria-hidden="true" />
            Sự kiện nhà cung cấp
          </TabsTrigger>
        </TabsList>

        <TabsContent value={TRANSACTIONS_TAB} className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Giao dịch thanh toán</CardTitle>
              <CardDescription>
                Xem trạng thái checkout, học viên và khóa học liên quan.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <PaymentTransactionFilters
                amountMax={filtersState.txAmountMax}
                amountMin={filtersState.txAmountMin}
                courseId={filtersState.txCourseId}
                dateFrom={filtersState.txFrom}
                dateTo={filtersState.txTo}
                learnerId={filtersState.txLearnerId}
                search={filtersState.txSearch}
                status={filtersState.txStatus as PaymentStatusFilter}
                onAmountMaxChange={(value) =>
                  void setFiltersState({ txAmountMax: value, txPage: 1 })
                }
                onAmountMinChange={(value) =>
                  void setFiltersState({ txAmountMin: value, txPage: 1 })
                }
                onCourseIdChange={(value) =>
                  void setFiltersState({ txCourseId: value, txPage: 1 })
                }
                onDateFromChange={(value) =>
                  void setFiltersState({ txFrom: value, txPage: 1 })
                }
                onDateToChange={(value) =>
                  void setFiltersState({ txTo: value, txPage: 1 })
                }
                onLearnerIdChange={(value) =>
                  void setFiltersState({ txLearnerId: value, txPage: 1 })
                }
                onSearchChange={(value) =>
                  void setFiltersState({ txSearch: value, txPage: 1 })
                }
                onStatusChange={(value) =>
                  void setFiltersState({ txStatus: value, txPage: 1 })
                }
              />
              <PaymentTransactionsTable
                isError={transactionsQuery.isError}
                isPending={transactionsQuery.isPending}
                items={transactions}
                onRefetch={() => void transactionsQuery.refetch()}
              />
              {!transactionsQuery.isError && !transactionsQuery.isPending && (
                <Pagination
                  page={filtersState.txPage}
                  totalPages={transactionsQuery.data?.totalPages ?? 0}
                  totalItems={transactionsQuery.data?.total ?? 0}
                  pageSize={filtersState.txLimit}
                  onPageChange={(page) =>
                    void setFiltersState({ txPage: page })
                  }
                  onPageSizeChange={(limit) =>
                    void setFiltersState({ txLimit: limit, txPage: 1 })
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value={PROVIDER_EVENTS_TAB} className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Sự kiện nhà cung cấp</CardTitle>
              <CardDescription>
                Xem ledger webhook SePay, bao gồm sự kiện chưa khớp giao dịch.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <PaymentProviderEventFilters
                dateFrom={filtersState.eventFrom}
                dateTo={filtersState.eventTo}
                gateway={filtersState.eventGateway}
                paymentStatus={
                  filtersState.eventPaymentStatus as ProviderEventPaymentStatusFilter
                }
                result={filtersState.eventResult as ProviderEventResultFilter}
                search={filtersState.eventSearch}
                transferType={filtersState.eventTransferType}
                onDateFromChange={(value) =>
                  void setFiltersState({ eventFrom: value, eventPage: 1 })
                }
                onDateToChange={(value) =>
                  void setFiltersState({ eventTo: value, eventPage: 1 })
                }
                onGatewayChange={(value) =>
                  void setFiltersState({ eventGateway: value, eventPage: 1 })
                }
                onPaymentStatusChange={(value) =>
                  void setFiltersState({
                    eventPaymentStatus: value,
                    eventPage: 1,
                  })
                }
                onResultChange={(value) =>
                  void setFiltersState({ eventResult: value, eventPage: 1 })
                }
                onSearchChange={(value) =>
                  void setFiltersState({ eventSearch: value, eventPage: 1 })
                }
                onTransferTypeChange={(value) =>
                  void setFiltersState({
                    eventTransferType: value,
                    eventPage: 1,
                  })
                }
              />
              <PaymentProviderEventsTable
                isError={providerEventsQuery.isError}
                isPending={providerEventsQuery.isPending}
                items={providerEvents}
                onRefetch={() => void providerEventsQuery.refetch()}
              />
              {!providerEventsQuery.isError &&
                !providerEventsQuery.isPending && (
                  <Pagination
                    page={filtersState.eventPage}
                    totalPages={providerEventsQuery.data?.totalPages ?? 0}
                    totalItems={providerEventsQuery.data?.total ?? 0}
                    pageSize={filtersState.eventLimit}
                    onPageChange={(page) =>
                      void setFiltersState({ eventPage: page })
                    }
                    onPageSizeChange={(limit) =>
                      void setFiltersState({ eventLimit: limit, eventPage: 1 })
                    }
                  />
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
