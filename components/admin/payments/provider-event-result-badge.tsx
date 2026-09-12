import { Badge } from "@/components/ui/badge";
import type { AdminProviderEventResult } from "@/services/api/payment";

const RESULT_LABELS: Record<AdminProviderEventResult, string> = {
  processed_paid: "Đã xử lý",
  duplicate_provider_event: "Webhook trùng",
  duplicate_payment: "Thanh toán trùng",
  amount_mismatch: "Sai số tiền",
  expired: "Hết hạn",
  unknown_payment_code: "Mã không khớp",
  ignored_transfer_type: "Bỏ qua",
};

export function ProviderEventResultBadge({
  result,
}: {
  result: AdminProviderEventResult | null;
}) {
  return (
    <Badge variant={result === "processed_paid" ? "default" : "secondary"}>
      {result ? RESULT_LABELS[result] : "Chưa phân loại"}
    </Badge>
  );
}
