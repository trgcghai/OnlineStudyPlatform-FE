"use client";

import { useState } from "react";
import { BalanceHistoryTable } from "@/components/instructor/balance/balance-history-table";
import { BalanceSummaryCards } from "@/components/instructor/balance/balance-summary-cards";
import {
  useInstructorBalanceHistory,
  useInstructorBalanceSummary,
} from "@/hooks/usePayment";

const DEFAULT_PAGE_SIZE = 10;

export default function InstructorBalancePage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const filters = { page, limit };
  const summaryQuery = useInstructorBalanceSummary();
  const historyQuery = useInstructorBalanceHistory(filters);

  function handlePageSizeChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Doanh thu</p>
          <h1 className="text-2xl font-bold tracking-tight">
            Số dư giảng viên
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Theo dõi số dư được tính từ lịch sử doanh thu khóa học và các yêu
            cầu rút tiền đã xử lý.
          </p>
        </div>
      </div>

      <BalanceSummaryCards
        data={summaryQuery.data}
        isLoading={summaryQuery.isLoading}
      />

      <BalanceHistoryTable
        data={historyQuery.data}
        isLoading={historyQuery.isLoading}
        isError={historyQuery.isError}
        onRetry={() => void historyQuery.refetch()}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
