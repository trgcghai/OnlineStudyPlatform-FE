"use client";

import { Button } from "@/components/ui/button";
import { useSendSmartReminder } from "@/hooks/useRisk";
import type { RiskScore } from "@/services/api/risk";
import { formatRiskPercent, getTopRiskFactor } from "./risk-formatters";

interface SmartReminderActionProps {
  score: RiskScore;
}

export function SmartReminderAction({ score }: SmartReminderActionProps) {
  const { send, isPending, pendingVariables } = useSendSmartReminder();
  const topFactor = getTopRiskFactor(score.factors);
  const isHighRisk = score.band === "high";
  const isSending =
    isPending &&
    pendingVariables?.courseId === score.courseId &&
    pendingVariables?.learnerId === score.learnerId;

  async function handleSend() {
    if (!isHighRisk || isSending) return;
    await send(score.courseId, score.learnerId);
  }

  return (
    <div className="rounded-xl border p-4">
      <div className="space-y-1">
        <p className="font-medium">Gửi Smart Reminder</p>
        <p className="text-sm text-muted-foreground">
          Học viên đang hoàn thành khoảng{" "}
          {formatRiskPercent(score.features?.courseProgressPercent)} và chậm hơn
          kế hoạch khoảng{" "}
          {formatRiskPercent(score.features?.expectedProgressGap)}. Yếu tố
          chính: {topFactor?.label ?? "Chưa có yếu tố nổi bật"}.
        </p>
      </div>

      <Button
        className="mt-4 w-full sm:w-auto"
        disabled={!isHighRisk || isSending}
        onClick={handleSend}
      >
        {isSending ? "Đang gửi..." : "Gửi Smart Reminder"}
      </Button>

      {!isHighRisk && (
        <p className="mt-2 text-sm text-muted-foreground">
          Chỉ gửi Smart Reminder cho học viên rủi ro cao.
        </p>
      )}
    </div>
  );
}
