"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatVndAmount } from "@/lib/schemas/payment-config";
import type { WithdrawRequestList } from "@/services/api/payment";
import { WithdrawStatusBadge } from "./withdraw-status-badge";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function InstructorWithdrawalsTable({
  data,
  isLoading,
  isError,
  onRetry,
  page,
  limit,
  onPageChange,
  onPageSizeChange,
}: {
  data?: WithdrawRequestList;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
}) {
  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử yêu cầu</CardTitle>
        <CardDescription>
          Các yêu cầu mới nhất được hiển thị trước. Trạng thái xử lý do quản trị
          viên cập nhật ở các giai đoạn sau.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center">
            <p className="font-medium">Không tải được yêu cầu rút tiền</p>
            <p className="text-sm text-muted-foreground">
              Vui lòng kiểm tra kết nối và thử lại.
            </p>
            <Button type="button" variant="outline" onClick={onRetry}>
              Tải lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <p className="font-medium">Chưa có yêu cầu rút tiền</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Khi tạo yêu cầu, thông tin sẽ xuất hiện tại đây để bạn theo dõi.
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày yêu cầu</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {formatVndAmount(item.amount)}
                    </TableCell>
                    <TableCell>
                      <WithdrawStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>{formatDateTime(item.requestedAt)}</TableCell>
                    <TableCell className="max-w-sm whitespace-normal text-muted-foreground">
                      {item.note || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              page={data?.page ?? page}
              totalPages={data?.totalPages ?? 1}
              totalItems={data?.total ?? 0}
              pageSize={data?.limit ?? limit}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
