"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  const score = learner;

  if (!score) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Chi tiết nhanh Learning Risk</SheetTitle>
            <SheetDescription>
              Xem nhanh điểm rủi ro, yếu tố chính và đường dẫn đến trang chi
              tiết.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const learnerSummary = score.learner;
  let learnerContent = (
    <p className="font-medium">Không có thông tin học viên</p>
  );

  if (learnerSummary) {
    const learnerEmail = learnerSummary.email.trim();
    learnerContent = (
      <Link
        href={`/instructor/courses/${score.courseId}/enrollments?q=${encodeURIComponent(
          learnerEmail,
        )}`}
        className="block rounded-md underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <p className="font-medium">{learnerSummary.name}</p>
        <p className="text-xs text-muted-foreground">{learnerEmail}</p>
      </Link>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl!">
        <SheetHeader>
          <SheetTitle>Chi tiết nhanh Learning Risk</SheetTitle>
          <SheetDescription>
            Xem nhanh điểm rủi ro, các chỉ số nổi bật và yếu tố chính.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-6 pb-6">
          <div className="rounded-2xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Học viên</p>
                {learnerContent}
              </div>
              <Badge variant={RISK_BAND_BADGE_VARIANTS[score.band]}>
                {RISK_BAND_LABELS[score.band]}
              </Badge>
            </div>
            <p className="mt-4 text-3xl font-bold">
              {formatRiskScore(score.score)}
            </p>
            <p className="text-sm text-muted-foreground">
              Cập nhật: {formatRiskDate(score.calculatedAt)}
            </p>
          </div>

          <section className="flex flex-col gap-3">
            <h3 className="font-semibold">Yếu tố rủi ro chính</h3>
            <RiskFactorBreakdown factors={score.factors} limit={3} />
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="font-semibold">Chỉ số nổi bật</h3>
            <RiskFeatureTable features={score.features} compact />
          </section>

          <SmartReminderAction score={score} />

          <Button
            nativeButton={false}
            render={
              <Link
                href={`/instructor/risk/${score.courseId}/learners/${score.learnerId}`}
              />
            }
          >
            Xem chi tiết
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
