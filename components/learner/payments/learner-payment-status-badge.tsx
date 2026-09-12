"use client";

import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/services/api/payment";

const STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Đang chờ",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
  refunded: "Đã hoàn tiền",
};

const STATUS_CLASS_NAMES: Record<PaymentStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
  cancelled: "border-muted bg-muted text-muted-foreground",
  expired: "border-orange-200 bg-orange-50 text-orange-700",
  refunded: "border-blue-200 bg-blue-50 text-blue-700",
};

export function LearnerPaymentStatusBadge({
  status,
}: {
  status: PaymentStatus;
}) {
  return (
    <Badge variant="outline" className={STATUS_CLASS_NAMES[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
