"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RevenueCourseTable } from "@/components/instructor/revenue/revenue-course-table";
import { RevenuePaymentStats } from "@/components/instructor/revenue/revenue-payment-stats";
import { RevenueSummaryCards } from "@/components/instructor/revenue/revenue-summary-cards";
import { useInstructorRevenueReport } from "@/hooks/usePayment";

export default function InstructorPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const filters = {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };
  const reportQuery = useInstructorRevenueReport(filters);

  function clearFilters() {
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Báo cáo</p>
          <h1 className="text-2xl font-bold tracking-tight">
            Doanh thu khóa học
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Theo dõi doanh thu, số lượt mua và tình hình thanh toán của các khóa
            học bạn đang giảng dạy.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lọc thời gian</CardTitle>
          <CardDescription>
            Để trống cả hai trường để xem toàn bộ dữ liệu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
            <label
              className="grid gap-2 text-sm font-medium"
              htmlFor="date-from"
            >
              Từ ngày
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium" htmlFor="date-to">
              Đến ngày
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>
            <Button variant="outline" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      <RevenueSummaryCards
        data={reportQuery.data}
        isLoading={reportQuery.isLoading}
      />
      <RevenueCourseTable
        courses={reportQuery.data?.courses}
        isLoading={reportQuery.isLoading}
        isError={reportQuery.isError}
        onRetry={() => void reportQuery.refetch()}
      />
      <RevenuePaymentStats
        stats={reportQuery.data?.paymentStats}
        isLoading={reportQuery.isLoading}
      />
    </div>
  );
}
