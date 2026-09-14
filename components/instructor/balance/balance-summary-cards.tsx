import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatVndAmount } from "@/lib/schemas/payment-config";
import type { InstructorBalanceSummary } from "@/services/api/payment";

const SUMMARY_ITEMS = [
  {
    key: "currentBalance",
    label: "Số dư hiện tại",
    description: "Tổng thay đổi từ lịch sử số dư.",
  },
  {
    key: "totalEarned",
    label: "Tổng thu nhập",
    description: "Doanh thu ròng từ khóa học đã bán.",
  },
  {
    key: "totalWithdrawn",
    label: "Đã rút",
    description: "Yêu cầu rút tiền đã xử lý thành công.",
  },
] as const;

export function BalanceSummaryCards({
  data,
  isLoading,
}: {
  data?: InstructorBalanceSummary;
  isLoading: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {SUMMARY_ITEMS.map((item) => (
        <Card key={item.key}>
          <CardHeader className="space-y-1">
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? <Spinner /> : formatVndAmount(data?.[item.key] ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
