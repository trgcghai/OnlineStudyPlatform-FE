import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RiskSummary } from "@/services/api/risk";
import { formatRiskDate, formatRiskPercent } from "./risk-formatters";

interface RiskSummaryCardsProps {
  summary: RiskSummary;
}

export function RiskSummaryCards({ summary }: RiskSummaryCardsProps) {
  const cards = [
    {
      label: "Đã chấm điểm",
      value: summary.totalScoredLearners.toLocaleString("vi-VN"),
    },
    { label: "Rủi ro cao", value: summary.highCount.toLocaleString("vi-VN") },
    {
      label: "Rủi ro trung bình",
      value: summary.mediumCount.toLocaleString("vi-VN"),
    },
    {
      label: "Tỷ lệ rủi ro cao",
      value: formatRiskPercent(summary.highRiskPercentage),
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
      <p className="text-sm text-muted-foreground md:col-span-2 xl:col-span-4">
        Cập nhật gần nhất: {formatRiskDate(summary.latestCalculatedAt)}
      </p>
    </div>
  );
}
