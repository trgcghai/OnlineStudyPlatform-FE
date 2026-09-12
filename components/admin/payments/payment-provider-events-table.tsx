"use client";

import Link from "next/link";
import { Eye, RadioTower } from "lucide-react";
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
import type { AdminProviderEventItem } from "@/services/api/payment";
import { formatDateTime } from "@/utils/dateTimeUtil";
import { PaymentStatusBadge } from "./payment-status-badge";
import { ProviderEventResultBadge } from "./provider-event-result-badge";

function PaymentProviderEventRow({ event }: { event: AdminProviderEventItem }) {
  return (
    <TableRow>
      <TableCell>
        <ProviderEventResultBadge result={event.result} />
      </TableCell>
      <TableCell>
        <span className="font-mono text-xs text-muted-foreground">
          {event.providerTransactionId}
        </span>
      </TableCell>
      <TableCell>
        <span className="font-medium">{event.reportedPaymentCode ?? "-"}</span>
      </TableCell>
      <TableCell className="font-medium">
        {formatVndAmount(event.transferAmount)}
      </TableCell>
      <TableCell>{event.transferType}</TableCell>
      <TableCell>{event.gateway ?? "-"}</TableCell>
      <TableCell>
        {event.paymentTransaction ? (
          <div className="flex min-w-44 flex-col gap-1">
            <span className="font-medium">
              {event.paymentTransaction.paymentCode}
            </span>
            <PaymentStatusBadge status={event.paymentTransaction.status} />
          </div>
        ) : (
          <span className="text-muted-foreground">Không khớp</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDateTime(event.receivedAt)}
      </TableCell>
      <TableCell className="text-right">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Xem chi tiết sự kiện ${event.providerTransactionId}`}
                nativeButton={false}
                render={
                  <Link href={`/admin/payments/provider-events/${event.id}`} />
                }
              >
                <Eye />
              </Button>
            }
          />
          <TooltipContent>
            <p>Xem chi tiết sự kiện</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

export function PaymentProviderEventsTable({
  isError,
  isPending,
  items,
  onRefetch,
}: {
  isError: boolean;
  isPending: boolean;
  items: AdminProviderEventItem[];
  onRefetch: () => void;
}) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Không thể tải sự kiện nhà cung cấp</AlertTitle>
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
              <TableHead>Kết quả</TableHead>
              <TableHead>Provider TX</TableHead>
              <TableHead>Mã báo cáo</TableHead>
              <TableHead>Số tiền</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead>Giao dịch liên kết</TableHead>
              <TableHead>Nhận lúc</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={9}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <RadioTower
                        className="size-6 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </span>
                    <p className="font-medium">Không có sự kiện nào</p>
                    <p className="text-sm text-muted-foreground">
                      Không tìm thấy sự kiện phù hợp với bộ lọc.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((event) => (
                <PaymentProviderEventRow key={event.id} event={event} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
