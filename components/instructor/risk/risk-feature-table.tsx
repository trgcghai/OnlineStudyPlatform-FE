import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RiskFeatures } from "@/services/api/risk";
import { formatRiskScore, RISK_FEATURE_LABELS } from "./risk-formatters";

const FEATURE_KEYS = Object.keys(RISK_FEATURE_LABELS) as Array<
  keyof RiskFeatures
>;

interface RiskFeatureTableProps {
  features?: Partial<RiskFeatures> | null;
  compact?: boolean;
}

export function RiskFeatureTable({
  features,
  compact = false,
}: RiskFeatureTableProps) {
  const keys = compact
    ? ([
        "lastActivityDays",
        "expectedProgressGap",
        "courseProgressPercent",
        "quizScoreAvgPercent",
        "watchRatioAvg",
      ] as Array<keyof RiskFeatures>)
    : FEATURE_KEYS;

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chỉ số</TableHead>
            <TableHead className="text-right">Giá trị</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((key) => (
            <TableRow key={key}>
              <TableCell>{RISK_FEATURE_LABELS[key]}</TableCell>
              <TableCell className="text-right font-medium">
                {formatRiskScore(features?.[key])}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
