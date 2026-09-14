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
    key: "totalBalance",
    label: "Tổng số dư",
    description: "Toàn bộ số dư từ doanh thu và rút tiền đã xử lý.",
  },
  {
    key: "withdrawableBalance",
    label: "Có thể rút",
    description: "Số dư đã qua thời gian giữ tiền và có thể rút.",
  },
  {
    key: "nonWithdrawableBalance",
    label: "Chờ khả dụng",
    description: "Doanh thu còn trong thời gian giữ tiền.",
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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
