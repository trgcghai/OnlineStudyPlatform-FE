"use client";

import { ReceiptText } from "lucide-react";
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
import { formatVndAmount } from "@/lib/schemas/payment-config";
import type { LearnerPaymentTransactionItem } from "@/services/api/payment";
import { formatDateTime } from "@/utils/dateTimeUtil";
import { LearnerPaymentStatusBadge } from "./learner-payment-status-badge";

export function LearnerPaymentsTable({
  isError,
  isPending,
  items,
  onRefetch,
}: {
  isError: boolean;
  isPending: boolean;
  items: LearnerPaymentTransactionItem[];
  onRefetch: () => void;
}) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Không thể tải lịch sử thanh toán</AlertTitle>
        <AlertDescription>
          Vui lòng thử lại sau hoặc đăng nhập lại nếu phiên làm việc đã hết hạn.
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
              <TableHead>Khóa học</TableHead>
              <TableHead>Số tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Ngày thanh toán</TableHead>
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
                      <ReceiptText
                        className="size-6 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </span>
                    <p className="font-medium">
                      Bạn chưa có giao dịch thanh toán nào
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Các giao dịch khóa học trả phí sẽ xuất hiện tại đây.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex min-w-60 flex-col">
                      <span className="font-medium">
                        {transaction.courseTitle}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {transaction.id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatVndAmount(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <LearnerPaymentStatusBadge status={transaction.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(transaction.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {transaction.paidAt
                      ? formatDateTime(transaction.paidAt)
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
