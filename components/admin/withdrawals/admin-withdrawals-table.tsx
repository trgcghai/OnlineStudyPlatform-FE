"use client";

import { CreditCard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WithdrawStatusBadge } from "@/components/instructor/withdrawals/withdraw-status-badge";
import { formatVndAmount } from "@/lib/schemas/payment-config";
import type { AdminWithdrawRequestItem } from "@/services/api/payment";
import { formatDateTime } from "@/utils/dateTimeUtil";

function AdminWithdrawalRow({ item }: { item: AdminWithdrawRequestItem }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex min-w-52 flex-col">
          <span className="font-medium">{item.instructor.name}</span>
          <span className="text-xs text-muted-foreground">
            {item.instructor.email}
          </span>
        </div>
      </TableCell>
      <TableCell className="font-medium">
        {formatVndAmount(item.amount)}
      </TableCell>
      <TableCell>
        <WithdrawStatusBadge status={item.status} />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDateTime(item.requestedAt)}
      </TableCell>
      <TableCell className="max-w-sm whitespace-normal text-muted-foreground">
        {item.note || "-"}
      </TableCell>
    </TableRow>
  );
}

export function AdminWithdrawalsTable({
  isError,
  isPending,
  items,
  onRefetch,
}: {
  isError: boolean;
  isPending: boolean;
  items: AdminWithdrawRequestItem[];
  onRefetch: () => void;
}) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Không thể tải yêu cầu rút tiền</AlertTitle>
        <AlertDescription>
          Đã xảy ra lỗi khi truy vấn dữ liệu. Vui lòng thử lại.
        </AlertDescription>
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          onClick={onRefetch}
        >
          Thử lại
        </Button>
      </Alert>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Giảng viên</TableHead>
              <TableHead>Số tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày yêu cầu</TableHead>
              <TableHead>Ghi chú</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <CreditCard
                        className="size-6 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </span>
                    <p className="font-medium">Không có yêu cầu nào</p>
                    <p className="text-sm text-muted-foreground">
                      Không tìm thấy yêu cầu rút tiền phù hợp với bộ lọc.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <AdminWithdrawalRow key={item.id} item={item} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
