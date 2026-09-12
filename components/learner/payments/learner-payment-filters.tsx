"use client";

import { SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaymentStatus } from "@/services/api/payment";

export type LearnerPaymentStatusFilter = "" | PaymentStatus;

const STATUS_LABELS: Record<LearnerPaymentStatusFilter, string> = {
  "": "Tất cả trạng thái",
  pending: "Đang chờ",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
  refunded: "Đã hoàn tiền",
};

export function LearnerPaymentFilters({
  status,
  onStatusChange,
}: {
  status: LearnerPaymentStatusFilter;
  onStatusChange: (value: LearnerPaymentStatusFilter) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-background text-muted-foreground">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-medium">Bộ lọc thanh toán</p>
          <p className="text-xs text-muted-foreground">
            Lọc lịch sử giao dịch theo trạng thái thanh toán.
          </p>
        </div>
      </div>

      <Select
        value={status}
        onValueChange={(value) =>
          onStatusChange(value as LearnerPaymentStatusFilter)
        }
        items={STATUS_LABELS}
      >
        <SelectTrigger
          className="w-full bg-background sm:w-56"
          aria-label="Lọc trạng thái thanh toán"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(STATUS_LABELS) as LearnerPaymentStatusFilter[]).map(
            (value) => (
              <SelectItem key={value || "all"} value={value}>
                {STATUS_LABELS[value]}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
