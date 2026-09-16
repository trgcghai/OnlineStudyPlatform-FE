"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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
import { Textarea } from "@/components/ui/textarea";
import { useCancelWithdrawRequest } from "@/hooks/usePayment";
import { formatVndAmount } from "@/lib/schemas/payment-config";
import type {
  WithdrawRequest,
  WithdrawRequestList,
} from "@/services/api/payment";
import { WithdrawStatusBadge } from "./withdraw-status-badge";
import { X } from "lucide-react";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function CancelWithdrawRequestDialog({ item }: { item: WithdrawRequest }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cancelMutation = useCancelWithdrawRequest();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (reason.length > 500) {
      setError("Lý do tối đa 500 ký tự.");
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        id: item.id,
        payload: { reason: reason.trim() || undefined },
      });
    } catch {
      return;
    }
    setReason("");
    setError(null);
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setReason("");
          setError(null);
        }
      }}
    >
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <X className="size-4" aria-hidden="true" />
        Hủy yêu cầu
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hủy yêu cầu rút tiền</DialogTitle>
          <DialogDescription>
            Yêu cầu {formatVndAmount(item.amount)} sẽ chuyển sang trạng thái đã
            hủy. Bạn có thể để trống lý do.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor={`cancelWithdrawReason-${item.id}`}>
              Lý do hủy
            </FieldLabel>
            <Textarea
              id={`cancelWithdrawReason-${item.id}`}
              rows={4}
              maxLength={500}
              placeholder="Ví dụ: tôi muốn điều chỉnh lại số tiền rút"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (error) setError(null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500 ký tự
            </p>
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={cancelMutation.isPending}
            >
              Đóng
            </Button>
            <Button type="submit" disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? <Spinner /> : null}
              {cancelMutation.isPending ? "Đang hủy..." : "Xác nhận hủy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
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
                  <TableHead>Thao tác</TableHead>
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
                    <TableCell>
                      {item.status === "pending" ? (
                        <CancelWithdrawRequestDialog item={item} />
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
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
