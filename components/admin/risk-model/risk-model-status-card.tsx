import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RiskModelInfo } from "@/services/api/risk-model";
import { formatDateTime } from "@/utils/dateTimeUtil";

interface RiskModelStatusCardProps {
  model: RiskModelInfo | null;
}

export function RiskModelStatusCard({ model }: RiskModelStatusCardProps) {
  if (!model) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chưa có model active</CardTitle>
          <CardDescription>
            Hãy train model sau khi hệ thống đã có đủ dữ liệu risk_scores
            heuristic.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const metrics = Object.entries(model.metrics);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{model.modelName}</CardTitle>
            <CardDescription>Phiên bản {model.modelVersion}</CardDescription>
          </div>
          <Badge variant={model.isActive ? "default" : "secondary"}>
            {model.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Feature version</p>
            <p className="font-medium">{model.featureVersion}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sample count</p>
            <p className="font-medium">
              {model.sampleCount.toLocaleString("vi-VN")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Trained at</p>
            <p className="font-medium">{formatDateTime(model.trainedAt)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Artifact</p>
            <p className="truncate font-medium" title={model.artifactPath}>
              {model.artifactPath}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <p className="font-medium">Metrics</p>
          {metrics.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Chưa có metric.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.map(([key, value]) => (
                <div key={key} className="rounded-xl bg-muted/50 p-3">
                  <p className="text-sm text-muted-foreground">
                    {key.toUpperCase()}
                  </p>
                  <p className="text-xl font-semibold">
                    {value.toLocaleString("vi-VN", {
                      maximumFractionDigits: 3,
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
