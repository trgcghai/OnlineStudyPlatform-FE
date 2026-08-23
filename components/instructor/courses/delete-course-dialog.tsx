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
import { useDeleteInstructorCourse } from "@/hooks/useInstructorCourses";
import type { Course } from "@/services/api/courses";

interface DeleteCourseDialogProps {
  course: Course | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCourseDialog({
  course,
  onOpenChange,
}: DeleteCourseDialogProps) {
  const { deleteInstructorCourse, isPending } = useDeleteInstructorCourse();

  async function handleConfirm() {
    if (!course) return;

    const result = await deleteInstructorCourse(course.id);

    if (result.ok) {
      onOpenChange(false);
      return;
    }

    toast.add({
      title: result.message ?? "Không thể xóa khóa học.",
      type: "error",
    });
  }

  return (
    <AlertDialog
      open={Boolean(course)}
      onOpenChange={(open) => {
        if (!isPending) onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa khóa học?</AlertDialogTitle>
          <AlertDialogDescription>
            Khóa học{" "}
            <span className="font-medium text-foreground">{course?.title}</span>{" "}
            sẽ bị xóa khỏi danh sách bản nháp của bạn. Thao tác này không thể
            hoàn tác.
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
              "Xóa khóa học"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
