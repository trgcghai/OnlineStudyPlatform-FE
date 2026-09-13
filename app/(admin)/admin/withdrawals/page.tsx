"use client";

import { useMemo } from "react";
import { useQueryStates } from "nuqs";
import { AdminWithdrawalFilters } from "@/components/admin/withdrawals/admin-withdrawal-filters";
import { AdminWithdrawalsTable } from "@/components/admin/withdrawals/admin-withdrawals-table";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { useAdminWithdrawRequests } from "@/hooks/usePayment";
import { useClampUrlPage } from "@/hooks/useClampUrlPage";
import { useDebounce } from "@/hooks/useDebounce";
import {
  amountSortParser,
  limitParser,
  optionalStringParser,
  pageParser,
  URL_FILTER_HISTORY,
  URL_SEARCH_DEBOUNCE_MS,
  withdrawStatusFilterParser,
} from "@/lib/search-params/filter-parsers";
import type { AdminWithdrawRequestFilters } from "@/services/api/payment";

const DEFAULT_PAGE_SIZE = 10;

export default function AdminWithdrawalsPage() {
  const [filtersState, setFiltersState] = useQueryStates(
    {
      instructorEmail: optionalStringParser,
      status: withdrawStatusFilterParser,
      requestedAtFrom: optionalStringParser,
      requestedAtTo: optionalStringParser,
      amountSort: amountSortParser,
      page: pageParser,
      limit: limitParser(DEFAULT_PAGE_SIZE),
    },
    { history: URL_FILTER_HISTORY },
  );
  const debouncedInstructorEmail = useDebounce(
    filtersState.instructorEmail,
    URL_SEARCH_DEBOUNCE_MS,
  );

  const withdrawFilters = useMemo<AdminWithdrawRequestFilters>(
    () => ({
      instructorEmail: debouncedInstructorEmail || undefined,
      status: filtersState.status,
      requestedAtFrom: filtersState.requestedAtFrom || undefined,
      requestedAtTo: filtersState.requestedAtTo || undefined,
      amountSort: filtersState.amountSort,
      page: filtersState.page,
      limit: filtersState.limit,
    }),
    [
      debouncedInstructorEmail,
      filtersState.amountSort,
      filtersState.limit,
      filtersState.page,
      filtersState.requestedAtFrom,
      filtersState.requestedAtTo,
      filtersState.status,
    ],
  );

  const withdrawalsQuery = useAdminWithdrawRequests(withdrawFilters);
  const list = withdrawalsQuery.data;

  useClampUrlPage({
    page: filtersState.page,
    totalPages: list?.totalPages ?? 1,
    enabled: Boolean(list),
    onPageChange: (page) => void setFiltersState({ page }),
  });

  function setFilter(values: Partial<typeof filtersState>) {
    void setFiltersState({ ...values, page: 1 });
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Thanh toán</p>
        <h1 className="text-2xl font-bold tracking-tight">Yêu cầu rút tiền</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Theo dõi các yêu cầu rút tiền của giảng viên. Giai đoạn này chỉ hiển
          thị danh sách và bộ lọc, chưa có thao tác xử lý yêu cầu.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <AdminWithdrawalFilters
            instructorEmail={filtersState.instructorEmail}
            status={filtersState.status}
            requestedAtFrom={filtersState.requestedAtFrom}
            requestedAtTo={filtersState.requestedAtTo}
            amountSort={filtersState.amountSort}
            onInstructorEmailChange={(instructorEmail) =>
              setFilter({ instructorEmail })
            }
            onStatusChange={(status) => setFilter({ status })}
            onRequestedAtFromChange={(requestedAtFrom) =>
              setFilter({ requestedAtFrom })
            }
            onRequestedAtToChange={(requestedAtTo) =>
              setFilter({ requestedAtTo })
            }
            onAmountSortChange={(amountSort) => setFilter({ amountSort })}
            onClear={() =>
              void setFiltersState({
                instructorEmail: "",
                status: "pending",
                requestedAtFrom: "",
                requestedAtTo: "",
                amountSort: "desc",
                page: 1,
              })
            }
          />

          <AdminWithdrawalsTable
            items={list?.items ?? []}
            isPending={withdrawalsQuery.isPending}
            isError={withdrawalsQuery.isError}
            onRefetch={() => void withdrawalsQuery.refetch()}
          />

          <Pagination
            page={list?.page ?? filtersState.page}
            totalPages={list?.totalPages ?? 1}
            totalItems={list?.total ?? 0}
            pageSize={list?.limit ?? filtersState.limit}
            onPageChange={(page) => void setFiltersState({ page })}
            onPageSizeChange={(limit) =>
              void setFiltersState({ limit, page: 1 })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
