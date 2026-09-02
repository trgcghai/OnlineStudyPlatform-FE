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
import { useDeleteInstructorQuestion } from "@/hooks/useInstructorQuizzes";
import type { QuizQuestion } from "@/services/api/quizzes";

interface DeleteQuestionDialogProps {
  question: QuizQuestion | null;
  courseId: string;
  lessonId: string;
  onOpenChange: (open: boolean) => void;
}

export function DeleteQuestionDialog({
  question,
  courseId,
  lessonId,
  onOpenChange,
}: DeleteQuestionDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const { deleteInstructorQuestion, isPending } = useDeleteInstructorQuestion();

  function handleOpenChange(open: boolean) {
    if (isPending) return;
    if (!open) onOpenChange(false);
  }

  async function handleDelete() {
    if (!question) return;
    setError(null);

    const result = await deleteInstructorQuestion(question, courseId, lessonId);

    if (!result.ok) {
      setError(result.message ?? "Không thể xóa câu hỏi. Vui lòng thử lại.");
      return;
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={Boolean(question)} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Xóa câu hỏi</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa câu hỏi này không? Hành động này không thể
            hoàn tác.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Không thể xóa câu hỏi</AlertTitle>
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
            {isPending && <Spinner />}
            {isPending ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
