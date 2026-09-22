"use client";

import { useMemo } from "react";
import { CreditCard } from "lucide-react";
import { useQueryStates } from "nuqs";
import {
  LearnerPaymentFilters,
  type LearnerPaymentStatusFilter,
} from "@/components/learner/payments/learner-payment-filters";
import { LearnerPaymentsTable } from "@/components/learner/payments/learner-payments-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { useLearnerPaymentTransactions } from "@/hooks/usePayment";
import { useClampUrlPage } from "@/hooks/useClampUrlPage";
import {
  limitParser,
  pageParser,
  paymentStatusFilterParser,
  URL_FILTER_HISTORY,
} from "@/lib/search-params/filter-parsers";
import type { LearnerPaymentTransactionFilters } from "@/services/api/payment";

const DEFAULT_PAGE_SIZE = 10;

export default function LearnerPaymentsPage() {
  const [filtersState, setFiltersState] = useQueryStates(
    {
      status: paymentStatusFilterParser,
      page: pageParser,
      limit: limitParser(DEFAULT_PAGE_SIZE),
    },
    { history: URL_FILTER_HISTORY },
  );

  const filters = useMemo<LearnerPaymentTransactionFilters>(
    () => ({
      status: filtersState.status || undefined,
      page: filtersState.page,
      limit: filtersState.limit,
    }),
    [filtersState],
  );

  const paymentsQuery = useLearnerPaymentTransactions(filters);
  const items = paymentsQuery.data?.items ?? [];
  const totalPages = paymentsQuery.data?.totalPages ?? 0;
  const totalItems = paymentsQuery.data?.total ?? 0;

  useClampUrlPage({
    page: filtersState.page,
    totalPages,
    enabled: !paymentsQuery.isPending && !paymentsQuery.isError,
    onPageChange: (page) => {
      void setFiltersState({ page });
    },
  });

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <CreditCard className="size-4" aria-hidden="true" />
          Lịch sử thanh toán
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Thanh toán của tôi
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Xem lại các giao dịch thanh toán khóa học của bạn. Trang này chỉ hiển
          thị thông tin tổng quan và không chứa dữ liệu ngân hàng hoặc nhà cung
          cấp thanh toán.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
          <CardDescription>
            Danh sách giao dịch được sắp xếp từ mới nhất đến cũ nhất.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <LearnerPaymentFilters
            status={filtersState.status as LearnerPaymentStatusFilter}
            onStatusChange={(status) => {
              void setFiltersState({ status, page: 1 });
            }}
          />

          <LearnerPaymentsTable
            isError={paymentsQuery.isError}
            isPending={paymentsQuery.isPending}
            items={items}
            onRefetch={() => void paymentsQuery.refetch()}
          />

          {!paymentsQuery.isError && !paymentsQuery.isPending && (
            <Pagination
              page={filtersState.page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={filtersState.limit}
              onPageChange={(page) => {
                void setFiltersState({ page });
              }}
              onPageSizeChange={(limit) => {
                void setFiltersState({ limit, page: 1 });
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
