"use client";

import Link from "next/link";
import { CreditCard, Eye } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatVndAmount } from "@/lib/schemas/payment-config";
import type { AdminPaymentTransactionItem } from "@/services/api/payment";
import { formatDateTime } from "@/utils/dateTimeUtil";
import { PaymentStatusBadge } from "./payment-status-badge";

function PaymentTransactionRow({
  transaction,
}: {
  transaction: AdminPaymentTransactionItem;
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex min-w-48 flex-col">
          <span className="font-medium">{transaction.paymentCode}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {transaction.id}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <PaymentStatusBadge status={transaction.status} />
      </TableCell>
      <TableCell className="font-medium">
        {formatVndAmount(transaction.amount)}
      </TableCell>
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
      <TableCell>
        <span className="line-clamp-2 min-w-52">
          {transaction.course?.title ?? "-"}
        </span>
      </TableCell>
      <TableCell>
        <span className="font-mono text-xs text-muted-foreground">
          {transaction.providerTransactionId ?? "-"}
        </span>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDateTime(transaction.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Xem chi tiết giao dịch ${transaction.paymentCode}`}
                nativeButton={false}
                render={
                  <Link
                    href={`/admin/payments/transactions/${transaction.id}`}
                  />
                }
              >
                <Eye />
              </Button>
            }
          />
          <TooltipContent>
            <p>Xem chi tiết giao dịch</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

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
    <div className="overflow-hidden rounded-2xl border bg-card">
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
                    <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <CreditCard
                        className="size-6 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </span>
                    <p className="font-medium">Không có giao dịch nào</p>
                    <p className="text-sm text-muted-foreground">
                      Không tìm thấy giao dịch phù hợp với bộ lọc.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((transaction) => (
                <PaymentTransactionRow
                  key={transaction.id}
                  transaction={transaction}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
