"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  mapLearningError,
  useCompleteLearningLesson,
} from "@/hooks/useLearning";
import type { LearningLesson } from "@/services/api/learning";

export function LessonCompletionButton({
  courseId,
  lesson,
  isSavingWatchProgress,
}: {
  courseId: string;
  lesson: LearningLesson;
  isSavingWatchProgress: boolean;
}) {
  const mutation = useCompleteLearningLesson(courseId);

  return (
    <div className="flex flex-col items-start gap-3">
      {lesson.isCompleted ? (
        <p
          className="flex items-center gap-2 text-sm font-medium text-success"
          role="status"
        >
          <CheckCircle2 className="size-5" aria-hidden="true" />
          Đã hoàn thành bài học
        </p>
      ) : (
        <>
          <Button
            type="button"
            size="lg"
            className="min-h-11"
            disabled={
              mutation.isPending ||
              isSavingWatchProgress ||
              !lesson.isAccessible
            }
            aria-busy={mutation.isPending || isSavingWatchProgress}
            aria-describedby={`completion-help-${lesson.id}`}
            onClick={() => mutation.mutate(lesson.id)}
          >
            {mutation.isPending || isSavingWatchProgress ? (
              <Spinner data-icon="inline-start" aria-label="Đang lưu tiến độ" />
            ) : (
              <CheckCircle2 data-icon="inline-start" aria-hidden="true" />
            )}
            {mutation.isPending
              ? "Đang xác nhận…"
              : isSavingWatchProgress
                ? "Đang lưu tiến độ…"
                : "Đánh dấu hoàn thành"}
          </Button>
          <p
            id={`completion-help-${lesson.id}`}
            className="text-sm text-muted-foreground"
          >
            Bài học chỉ được hoàn thành khi đã xem đủ video và đạt bài quiz nếu
            có.
          </p>
          {mutation.isError && (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertTitle>Chưa thể hoàn thành bài học</AlertTitle>
              <AlertDescription>
                {mapLearningError(mutation.error)}
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
