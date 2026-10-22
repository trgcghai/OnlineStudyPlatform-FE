import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatVndAmount } from "@/lib/schemas/payment-config";
import type {
  InstructorRevenuePaymentStat,
  PaymentStatus,
} from "@/services/api/payment";

const STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Đang chờ",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
  refunded: "Đã hoàn tiền",
};

export function RevenuePaymentStats({
  stats,
  isLoading,
}: {
  stats?: InstructorRevenuePaymentStat[];
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thống kê thanh toán</CardTitle>
        <CardDescription>
          Số giao dịch và giá trị theo trạng thái thanh toán.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <span className="text-sm text-muted-foreground">Đang tải...</span>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {stats?.map((stat) => (
              <div
                key={stat.status}
                className="rounded-xl border bg-muted/20 p-4"
              >
                <p className="text-sm text-muted-foreground">
                  {STATUS_LABELS[stat.status]}
                </p>
                <p className="mt-2 text-xl font-semibold">
                  {stat.transactionCount.toLocaleString("vi-VN")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatVndAmount(stat.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
