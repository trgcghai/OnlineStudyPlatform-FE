"use client";

import { LoaderCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toast";
import { useDeleteInstructorLesson } from "@/hooks/useInstructorLessons";
import type { Lesson } from "@/services/api/lessons";

interface DeleteLessonDialogProps {
  lesson: Lesson | null;
  courseId: string;
  onOpenChange: (open: boolean) => void;
}

export function DeleteLessonDialog({
  lesson,
  courseId,
  onOpenChange,
}: DeleteLessonDialogProps) {
  const { deleteInstructorLesson, isPending } = useDeleteInstructorLesson();

  async function handleConfirm() {
    if (!lesson) return;

    const result = await deleteInstructorLesson(lesson.id, courseId);

    if (result.ok) {
      onOpenChange(false);
      return;
    }

    toast.add({
      title: result.message ?? "Không thể xóa bài học.",
      type: "error",
    });
  }

  return (
    <AlertDialog
      open={Boolean(lesson)}
      onOpenChange={(open) => {
        if (!isPending) onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa bài học?</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa bài học{" "}
            <span className="font-medium text-foreground">
              {lesson?.title}
            </span>
            ? Bài học sẽ bị xóa khỏi khóa học cùng tất cả file video và tài
            liệu đính kèm. Thao tác này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {isPending ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Đang xóa...
              </>
            ) : (
              "Xóa bài học"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
