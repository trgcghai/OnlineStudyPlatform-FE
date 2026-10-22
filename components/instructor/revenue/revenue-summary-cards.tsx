import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatVndAmount } from "@/lib/schemas/payment-config";
import type { InstructorRevenueReport } from "@/services/api/payment";

export function RevenueSummaryCards({
  data,
  isLoading,
}: {
  data?: InstructorRevenueReport;
  isLoading: boolean;
}) {
  const items = [
    {
      label: "Doanh thu gộp",
      value: formatVndAmount(data?.summary.grossRevenue ?? 0),
      description: "Tổng giá trị các lượt mua đã thanh toán.",
    },
    {
      label: "Doanh thu thực nhận",
      value: formatVndAmount(data?.summary.netRevenue ?? 0),
      description: "Doanh thu sau khi trừ phí nền tảng.",
    },
    {
      label: "Số lượt mua",
      value: (data?.summary.purchaseCount ?? 0).toLocaleString("vi-VN"),
      description: "Số khóa học được mua thành công.",
    },
    {
      label: "Phí nền tảng",
      value: formatVndAmount(data?.summary.platformFee ?? 0),
      description: "Tổng phí được khấu trừ từ doanh thu.",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="space-y-1">
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? <Spinner /> : item.value}
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
