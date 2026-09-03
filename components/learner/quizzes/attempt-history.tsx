"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type LearnerQuiz,
  type QuizAttemptResult,
} from "@/services/api/learner-quizzes";
import {
  formatDateTime,
  formatDuration,
  formatScore,
  getAttemptStatusLabel,
  getBestAttemptId,
} from "@/utils/quizUtil";
import QuizResultSummary from "@/components/learner/quizzes/quiz-result-summary";

interface AttemptHistoryProps {
  attempts: QuizAttemptResult[];
  quiz: LearnerQuiz;
}

export default function AttemptHistory({
  attempts,
  quiz,
}: AttemptHistoryProps) {
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(
    null,
  );

  if (attempts.length === 0) return null;

  const bestAttemptId = getBestAttemptId(attempts);
  const selectedAttempt =
    attempts.find((attempt) => attempt.attemptId === selectedAttemptId) ?? null;

  return (
    <section className="rounded-3xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">Lịch sử làm bài</h3>
        <p className="text-sm text-muted-foreground">
          Chọn một lượt làm bài để xem điểm từng câu và phản hồi của giảng viên.
        </p>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {attempts.map((attempt) => (
          <div
            key={attempt.attemptId}
            className={cn(
              "grid grid-cols-2 items-center gap-3 rounded-2xl border p-3 text-sm transition-colors sm:grid-cols-[1fr_1fr_1fr_300px]",
              selectedAttemptId === attempt.attemptId
                ? "border-primary/40 bg-primary/5"
                : "border-transparent bg-muted/45 hover:bg-muted/70",
            )}
          >
            <div className="min-w-0">
              <p className="truncate font-medium">
                {formatDateTime(attempt.submittedAt)}
              </p>
              <p className="text-xs text-muted-foreground">Thời gian nộp</p>
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {formatScore(attempt.totalScore)} /{" "}
                {formatScore(attempt.totalPoints)}
              </p>
              <p className="text-xs text-muted-foreground">Điểm số</p>
            </div>
            <span className="min-w-0 truncate text-sm text-muted-foreground">
              {attempt.isLate ? (
                <span className="text-amber-600">
                  Muộn {formatDuration(attempt.lateSeconds)}
                </span>
              ) : attempt.pendingEssayCount > 0 ? (
                `${attempt.pendingEssayCount} câu chờ chấm`
              ) : (
                "Đúng hạn"
              )}
            </span>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <Badge
                variant={attempt.passed ? "secondary" : "destructive"}
                className={cn(
                  "justify-self-start",
                  attempt.passed &&
                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
                )}
              >
                {getAttemptStatusLabel(attempt)}
              </Badge>
              {attempt.attemptId === bestAttemptId && (
                <Badge variant="default">Kết quả tốt nhất</Badge>
              )}
              <Button
                type="button"
                variant={
                  selectedAttemptId === attempt.attemptId
                    ? "default"
                    : "outline"
                }
                size="xs"
                onClick={() =>
                  setSelectedAttemptId((current) =>
                    current === attempt.attemptId ? null : attempt.attemptId,
                  )
                }
              >
                {selectedAttemptId === attempt.attemptId
                  ? "Ẩn chi tiết"
                  : "Xem chi tiết"}
              </Button>
            </div>
          </div>
        ))}
      </div>
      {selectedAttempt && (
        <div className="mt-4">
          <QuizResultSummary quiz={quiz} result={selectedAttempt} />
        </div>
      )}
    </section>
  );
}
