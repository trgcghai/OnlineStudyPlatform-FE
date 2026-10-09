"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { RiskFactorBreakdown } from "@/components/instructor/risk/risk-factor-breakdown";
import { RiskFeatureTable } from "@/components/instructor/risk/risk-feature-table";
import {
  formatRiskDate,
  formatRiskScore,
  getTopRiskFactor,
  RISK_BAND_BADGE_VARIANTS,
  RISK_BAND_LABELS,
} from "@/components/instructor/risk/risk-formatters";
import { SmartReminderPlaceholder } from "@/components/instructor/risk/smart-reminder-placeholder";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRiskLearnerDetail } from "@/hooks/useRisk";

export default function RiskLearnerDetailPage() {
  const params = useParams<{ courseId: string; learnerId: string }>();
  const { courseId, learnerId } = params;
  const detailQuery = useRiskLearnerDetail(courseId, learnerId);
  const latest = detailQuery.data?.latest ?? null;
  const history = detailQuery.data?.history ?? [];

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        nativeButton={false}
        render={<Link href={`/instructor/risk?courseId=${courseId}`} />}
      >
        <ArrowLeft className="size-4" /> Quay lại Learning Risk
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Chi tiết rủi ro học viên</h1>
        <p className="text-sm text-muted-foreground">
          Xem điểm rủi ro mới nhất, yếu tố giải thích và lịch sử chấm điểm của
          học viên.
        </p>
      </div>

      {detailQuery.isPending && <Skeleton className="h-96 w-full" />}

      {detailQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Không thể tải chi tiết rủi ro</AlertTitle>
          <AlertDescription>
            Vui lòng thử lại hoặc quay lại danh sách Learning Risk.
          </AlertDescription>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => detailQuery.refetch()}
          >
            Thử lại
          </Button>
        </Alert>
      )}

      {!detailQuery.isPending && !detailQuery.isError && !latest && (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="font-medium">
            Chưa có điểm rủi ro mới nhất cho học viên này.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Điểm rủi ro sẽ xuất hiện sau khi hệ thống tính toán cho khóa học.
          </p>
        </div>
      )}

      {latest && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>{latest.learnerId}</CardTitle>
                  <CardDescription>
                    Enrollment: {latest.enrollmentId}
                  </CardDescription>
                </div>
                <Badge variant={RISK_BAND_BADGE_VARIANTS[latest.band]}>
                  {RISK_BAND_LABELS[latest.band]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div>
                <p className="text-sm text-muted-foreground">Điểm rủi ro</p>
                <p className="text-3xl font-bold">
                  {formatRiskScore(latest.score)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nguồn</p>
                <p className="font-medium">{latest.source}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Phiên bản chấm điểm
                </p>
                <p className="font-medium">{latest.scoringVersion}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Phiên bản đặc trưng
                </p>
                <p className="font-medium">{latest.featureVersion}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cập nhật</p>
                <p className="font-medium">
                  {formatRiskDate(latest.calculatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
            <Card>
              <CardHeader>
                <CardTitle>Yếu tố giải thích</CardTitle>
                <CardDescription>
                  Các yếu tố đóng góp vào điểm rủi ro.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RiskFactorBreakdown factors={latest.factors} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hành động hỗ trợ</CardTitle>
                <CardDescription>
                  Chuẩn bị gửi nhắc nhở thông minh ở T3-06.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SmartReminderPlaceholder />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Chỉ số đầu vào</CardTitle>
              <CardDescription>
                Giá trị đặc trưng được dùng để tính điểm rủi ro.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RiskFeatureTable features={latest.features} />
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử điểm rủi ro</CardTitle>
          <CardDescription>
            Theo dõi thay đổi điểm rủi ro theo thời gian.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có lịch sử điểm rủi ro.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thời điểm</TableHead>
                      <TableHead>Điểm</TableHead>
                      <TableHead>Mức rủi ro</TableHead>
                      <TableHead>Nguồn</TableHead>
                      <TableHead>Yếu tố chính</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => {
                      const topFactor = getTopRiskFactor(item.factors);

                      return (
                        <TableRow
                          key={`${item.calculatedAt}-${item.scoringVersion}`}
                        >
                          <TableCell>
                            {formatRiskDate(item.calculatedAt)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatRiskScore(item.score)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={RISK_BAND_BADGE_VARIANTS[item.band]}
                            >
                              {RISK_BAND_LABELS[item.band]}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.source}</TableCell>
                          <TableCell>
                            {topFactor?.label ?? "Chưa có yếu tố nổi bật"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
