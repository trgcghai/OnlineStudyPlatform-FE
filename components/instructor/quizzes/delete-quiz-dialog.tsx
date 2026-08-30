"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteInstructorQuiz } from "@/hooks/useInstructorQuizzes";
import type { QuizSummary } from "@/services/api/quizzes";

interface DeleteQuizDialogProps {
  quiz: QuizSummary | null;
  courseId: string;
  lessonId: string;
  onOpenChange: (open: boolean) => void;
}

export function DeleteQuizDialog({
  quiz,
  courseId,
  lessonId,
  onOpenChange,
}: DeleteQuizDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const { deleteInstructorQuiz, isPending } = useDeleteInstructorQuiz();

  function handleOpenChange(open: boolean) {
    if (isPending) return;
    if (!open) onOpenChange(false);
  }

  async function handleDelete() {
    if (!quiz) return;
    setError(null);

    const result = await deleteInstructorQuiz(quiz.id, courseId, lessonId);

    if (!result.ok) {
      setError(
        result.message ?? "Không thể xóa bài kiểm tra. Vui lòng thử lại.",
      );
      return;
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={Boolean(quiz)} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Xóa bài kiểm tra</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa bài kiểm tra &quot;{quiz?.title}&quot;
            không? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Không thể xóa bài kiểm tra</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? <Spinner /> : null}
            {isPending ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
