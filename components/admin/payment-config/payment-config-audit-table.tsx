"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePaymentConfigAudits } from "@/hooks/useAdminPaymentConfig";
import {
  formatVndAmount,
  PAYMENT_CONFIG_FIELD_LABELS,
} from "@/lib/schemas/payment-config";
import type {
  PaymentConfigAudit,
  PaymentConfigSnapshot,
} from "@/services/api/payment-config";
import { formatDateTime } from "@/utils/dateTimeUtil";

interface PaymentConfigAuditTableProps {
  enabled: boolean;
}

function formatAuditValue(
  field: keyof PaymentConfigSnapshot,
  value: PaymentConfigSnapshot[keyof PaymentConfigSnapshot],
): string {
  if (field === "allowedPrices" && Array.isArray(value)) {
    return value.map((price) => formatVndAmount(price)).join(", ");
  }

  if (field === "platformFeePercent" && typeof value === "number") {
    return `${value}%`;
  }

  if (field === "minimumWithdrawalAmount" && typeof value === "number") {
    return formatVndAmount(value);
  }

  if (field === "freeCourseLimit") {
    return value === null ? "Không giới hạn" : String(value);
  }

  if (value === null) return "-";

  return String(value);
}

function AuditChangeSummary({ audit }: { audit: PaymentConfigAudit }) {
  return (
    <div className="flex min-w-96 flex-col gap-2 whitespace-normal">
      {audit.changedFields.map((field) => (
        <div key={field} className="rounded-xl bg-muted/40 p-3">
          <div className="font-medium">
            {PAYMENT_CONFIG_FIELD_LABELS[field] ?? field}
          </div>
          <div className="mt-1 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
            <span>
              Trước: {formatAuditValue(field, audit.previousValue[field])}
            </span>
            <span>Sau: {formatAuditValue(field, audit.newValue[field])}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PaymentConfigAuditTable({
  enabled,
}: PaymentConfigAuditTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, isLoading, isError } = usePaymentConfigAudits(
    { page, limit: pageSize },
    enabled,
  );

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử thay đổi</CardTitle>
        <CardDescription>
          Theo dõi các lần cập nhật cấu hình thanh toán của quản trị viên.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertTitle>Không tải được lịch sử thay đổi</AlertTitle>
            <AlertDescription>
              Vui lòng thử lại hoặc kiểm tra quyền truy cập của tài khoản.
            </AlertDescription>
          </Alert>
        ) : !data?.items.length ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Chưa có thay đổi cấu hình nào được ghi nhận.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Người cập nhật</TableHead>
                <TableHead>Thay đổi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell>{formatDateTime(audit.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {audit.actorEmail ? audit.actorEmail : "Không xác định"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <AuditChangeSummary audit={audit} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!isError && !isLoading && data && data.items.length > 0 && (
          <Pagination
            page={page}
            totalPages={data.totalPages}
            totalItems={data.total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </CardContent>
    </Card>
  );
}
