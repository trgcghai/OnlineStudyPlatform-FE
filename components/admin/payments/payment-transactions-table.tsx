"use client";

import Link from "next/link";
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
import { formatVndAmount } from "@/lib/schemas/payment-config";
import type { AdminPaymentTransactionItem } from "@/services/api/payment";
import { formatDateTime } from "@/utils/dateTimeUtil";
import { PaymentStatusBadge } from "./payment-status-badge";

export function PaymentTransactionsTable({
  isError,
  isPending,
  items,
  onRefetch,
}: {
  isError: boolean;
  isPending: boolean;
  items: AdminPaymentTransactionItem[];
  onRefetch: () => void;
}) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Không thể tải giao dịch thanh toán</AlertTitle>
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
    <div className="overflow-hidden rounded-2xl border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã thanh toán</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Số tiền</TableHead>
              <TableHead>Học viên</TableHead>
              <TableHead>Khóa học</TableHead>
              <TableHead>Provider TX</TableHead>
              <TableHead>Tạo lúc</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <CreditCard className="size-10 text-muted-foreground" />
                    <p className="font-medium">Không có giao dịch nào</p>
                    <p className="text-sm text-muted-foreground">
                      Không tìm thấy giao dịch phù hợp với bộ lọc.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex min-w-48 flex-col">
                      <span className="font-medium">
                        {transaction.paymentCode}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {transaction.id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={transaction.status} />
                  </TableCell>
                  <TableCell>{formatVndAmount(transaction.amount)}</TableCell>
                  <TableCell>
                    {transaction.learner ? (
                      <div className="flex min-w-44 flex-col">
                        <span>{transaction.learner.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {transaction.learner.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{transaction.course?.title ?? "-"}</TableCell>
                  <TableCell>
                    {transaction.providerTransactionId ?? "-"}
                  </TableCell>
                  <TableCell>{formatDateTime(transaction.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={
                        <Link
                          href={`/admin/payments/transactions/${transaction.id}`}
                        />
                      }
                    >
                      Chi tiết
                    </Button>
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
