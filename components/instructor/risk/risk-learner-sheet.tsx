"use client";

import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useRiskLearnerDetail } from "@/hooks/useRisk";
import type { RiskScore } from "@/services/api/risk";
import { RiskFactorBreakdown } from "./risk-factor-breakdown";
import { RiskFeatureTable } from "./risk-feature-table";
import {
  formatRiskDate,
  formatRiskScore,
  RISK_BAND_BADGE_VARIANTS,
  RISK_BAND_LABELS,
} from "./risk-formatters";
import { SmartReminderAction } from "./smart-reminder-action";

interface RiskLearnerSheetProps {
  learner: RiskScore | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RiskLearnerSheet({
  learner,
  open,
  onOpenChange,
}: RiskLearnerSheetProps) {
  const detailQuery = useRiskLearnerDetail(
    learner?.courseId ?? "",
    learner?.learnerId ?? "",
    open && Boolean(learner),
  );
  const latest = detailQuery.data?.latest ?? learner;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Chi tiết nhanh Learning Risk</SheetTitle>
          <SheetDescription>
            Xem nhanh điểm rủi ro, yếu tố chính và đường dẫn đến trang chi tiết.
          </SheetDescription>
        </SheetHeader>

        {!latest && <Skeleton className="mt-6 h-40 w-full" />}

        {detailQuery.isError && (
          <Alert variant="destructive" className="mx-6 mt-6">
            <AlertTitle>Không thể tải chi tiết</AlertTitle>
            <AlertDescription>
              Vui lòng đóng bảng này và thử lại.
            </AlertDescription>
          </Alert>
        )}

        {latest && (
          <div className="flex flex-col gap-5 px-6 pb-6">
            <div className="rounded-2xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Học viên</p>
                  <p className="font-medium">{latest.learnerId}</p>
                  <p className="text-xs text-muted-foreground">
                    Enrollment: {latest.enrollmentId}
                  </p>
                </div>
                <Badge variant={RISK_BAND_BADGE_VARIANTS[latest.band]}>
                  {RISK_BAND_LABELS[latest.band]}
                </Badge>
              </div>
              <p className="mt-4 text-3xl font-bold">
                {formatRiskScore(latest.score)}
              </p>
              <p className="text-sm text-muted-foreground">
                Cập nhật: {formatRiskDate(latest.calculatedAt)}
              </p>
            </div>

            <section className="flex flex-col gap-3">
              <h3 className="font-semibold">Yếu tố rủi ro chính</h3>
              <RiskFactorBreakdown factors={latest.factors} limit={3} />
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="font-semibold">Chỉ số nổi bật</h3>
              <RiskFeatureTable features={latest.features} compact />
            </section>

            <SmartReminderAction score={latest} />

            <Button
              nativeButton={false}
              render={
                <Link
                  href={`/instructor/risk/${latest.courseId}/learners/${latest.learnerId}`}
                />
              }
            >
              Xem chi tiết
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
