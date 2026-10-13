import { Badge } from "@/components/ui/badge";
import type { RiskFactor } from "@/services/api/risk";
import { formatRiskScore, sortRiskFactors } from "./risk-formatters";

interface RiskFactorBreakdownProps {
  factors?: RiskFactor[] | null;
  limit?: number;
}

export function RiskFactorBreakdown({
  factors,
  limit,
}: RiskFactorBreakdownProps) {
  const factorCount = Array.isArray(factors) ? factors.length : 0;
  const visibleFactors = sortRiskFactors(factors).slice(
    0,
    limit ?? factorCount,
  );

  if (visibleFactors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Chưa có yếu tố nổi bật.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {visibleFactors.map((factor) => (
        <div key={factor.key} className="rounded-xl border p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{factor.label}</p>
              <p className="text-sm text-muted-foreground">
                Giá trị: {formatRiskScore(factor.value)}
              </p>
            </div>
            <Badge variant="secondary">
              +{formatRiskScore(factor.contribution)}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
