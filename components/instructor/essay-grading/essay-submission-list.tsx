"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EssayGradingSubmission } from "@/services/api/essay-grading";
import { formatDateTime, getAttemptStatusLabel } from "@/utils/quizUtil";

interface EssaySubmissionListProps {
  submissions: EssayGradingSubmission[];
  selectedAttemptId: string | null;
  onSelect: (submission: EssayGradingSubmission) => void;
}

export function EssaySubmissionList({
  submissions,
  selectedAttemptId,
  onSelect,
}: EssaySubmissionListProps) {
  return (
    <div className="flex flex-col gap-3">
      {submissions.map((submission) => {
        const selected = submission.attemptId === selectedAttemptId;

        return (
          <Button
            key={submission.attemptId}
            type="button"
            variant="ghost"
            className={cn(
              "h-auto scroll-mt-24 justify-start rounded-2xl border p-4 text-left hover:bg-muted/70 border-border transition-all",
              selected && "border-primary bg-primary/5",
            )}
            onClick={() => onSelect(submission)}
          >
            <span className="flex w-full flex-col gap-3">
              <span className="flex flex-col gap-1">
                <span className="font-medium">
                  {submission.learner.name || "Học viên"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {submission.learner.email || submission.learner.id}
                </span>
              </span>
              <span className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {getAttemptStatusLabel(submission)}
                </Badge>
                <Badge
                  variant={submission.passed ? "secondary" : "destructive"}
                >
                  {submission.passed ? "Đạt" : "Chưa đạt"}
                </Badge>
              </span>
              <span className="grid gap-1 text-sm text-muted-foreground">
                <span className="truncate line-clamp-1">
                  Khóa học: {submission.courseTitle}
                </span>
                <span className="truncate line-clamp-1">
                  Bài học: {submission.lessonTitle}
                </span>
                <span className="truncate line-clamp-1">
                  Bài kiểm tra: {submission.quizTitle}
                </span>
                <span className="truncate line-clamp-1">
                  Nộp: {formatDateTime(submission.submittedAt)}
                </span>
              </span>
            </span>
          </Button>
        );
      })}
    </div>
  );
}
