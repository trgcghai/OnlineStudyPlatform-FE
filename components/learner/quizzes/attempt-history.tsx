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
    <section className="rounded-3xl border p-4">
      <h3 className="font-semibold">Lịch sử làm bài</h3>
      <div className="mt-3 flex flex-col gap-2">
        {attempts.map((attempt) => (
          <div
            key={attempt.attemptId}
            className="grid grid-cols-2 items-center gap-2 rounded-2xl bg-muted/50 p-3 text-sm sm:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <span className="min-w-0 truncate">
              {formatDateTime(attempt.submittedAt)}
            </span>
            <span className="min-w-0 truncate">
              {formatScore(attempt.totalScore)} /{" "}
              {formatScore(attempt.totalPoints)}
            </span>
            <span className="min-w-0 truncate text-xs text-muted-foreground">
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
            <div className="flex flex-wrap items-center gap-2">
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
                variant="outline"
                size="sm"
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
