"use client";

import { useState } from "react";
import { CreateWithdrawRequestDialog } from "@/components/instructor/withdrawals/create-withdraw-request-dialog";
import { InstructorWithdrawalsTable } from "@/components/instructor/withdrawals/instructor-withdrawals-table";
import { useMyWithdrawRequests } from "@/hooks/usePayment";

const DEFAULT_PAGE_SIZE = 10;

export default function InstructorWithdrawalsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const filters = { page, limit };
  const withdrawalsQuery = useMyWithdrawRequests(filters);

  function handlePageSizeChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Doanh thu</p>
          <h1 className="text-2xl font-bold tracking-tight">Rút tiền</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Tạo yêu cầu rút tiền bằng tài khoản nhận tiền đã cấu hình và theo
            dõi trạng thái xử lý từ quản trị viên.
          </p>
        </div>
        <CreateWithdrawRequestDialog />
      </div>

      <InstructorWithdrawalsTable
        data={withdrawalsQuery.data}
        isLoading={withdrawalsQuery.isLoading}
        isError={withdrawalsQuery.isError}
        onRetry={() => void withdrawalsQuery.refetch()}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
