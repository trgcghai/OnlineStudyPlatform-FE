import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/services/api/payment";

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Đang chờ",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
  refunded: "Đã hoàn tiền",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant={status === "paid" ? "default" : "secondary"}>
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
