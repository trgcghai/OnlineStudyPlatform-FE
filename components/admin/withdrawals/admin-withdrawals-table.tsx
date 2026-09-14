"use client";

import { useState, type FormEvent } from "react";
import { CreditCard, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
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
import { WithdrawStatusBadge } from "@/components/instructor/withdrawals/withdraw-status-badge";
import { useRejectWithdrawRequest } from "@/hooks/usePayment";
import { formatVndAmount } from "@/lib/schemas/payment-config";
import type { AdminWithdrawRequestItem } from "@/services/api/payment";
import { formatDateTime } from "@/utils/dateTimeUtil";

function RejectWithdrawRequestDialog({
  item,
}: {
  item: AdminWithdrawRequestItem;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rejectMutation = useRejectWithdrawRequest();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      setError("Vui lòng nhập lý do từ chối.");
      return;
    }
    if (normalizedReason.length > 500) {
      setError("Lý do tối đa 500 ký tự.");
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        id: item.id,
        payload: { reason: normalizedReason },
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
        Từ chối
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Từ chối yêu cầu rút tiền</DialogTitle>
          <DialogDescription>
            Yêu cầu {formatVndAmount(item.amount)} của {item.instructor.name} sẽ
            chuyển sang trạng thái bị từ chối.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor={`rejectWithdrawReason-${item.id}`} required>
              Lý do từ chối
            </FieldLabel>
            <Textarea
              id={`rejectWithdrawReason-${item.id}`}
              rows={4}
              maxLength={500}
              placeholder="Ví dụ: thông tin tài khoản nhận tiền chưa hợp lệ"
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
              disabled={rejectMutation.isPending}
            >
              Đóng
            </Button>
            <Button type="submit" disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? <Spinner /> : null}
              {rejectMutation.isPending
                ? "Đang từ chối..."
                : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
      <TableCell>
        {item.status === "pending" ? (
          <RejectWithdrawRequestDialog item={item} />
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
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
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
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
