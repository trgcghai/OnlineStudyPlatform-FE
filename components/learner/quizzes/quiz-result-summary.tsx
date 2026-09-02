import { CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type QuizAttemptResult } from "@/services/api/learner-quizzes";
import {
  formatDuration,
  formatScore,
  getAttemptStatusLabel,
} from "@/utils/quizUtil";

export default function QuizResultSummary({
  result,
}: {
  result: QuizAttemptResult;
}) {
  const Icon = result.passed ? CheckCircle2 : XCircle;

  return (
    <Card
      className={cn(
        "border-2",
        result.passed ? "border-emerald-500/40" : "border-destructive/40",
      )}
    >
      <CardHeader>
        <Badge
          variant={result.passed ? "secondary" : "destructive"}
          className="w-fit"
        >
          <Icon data-icon="inline-start" aria-hidden="true" />
          {getAttemptStatusLabel(result)}
        </Badge>
        <CardTitle>
          {formatScore(result.totalScore)} / {formatScore(result.totalPoints)}{" "}
          điểm
        </CardTitle>
        <CardDescription>
          Điểm cần đạt: {formatScore(result.passScorePoints)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
        <p>Đúng: {result.correctCount}</p>
        <p>Sai/chưa đủ: {result.wrongCount}</p>
        <p>Chờ chấm: {result.pendingEssayCount}</p>
        {result.isLate ? (
          <span className="text-amber-600">
            Nộp muộn {formatDuration(result.lateSeconds)}
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
