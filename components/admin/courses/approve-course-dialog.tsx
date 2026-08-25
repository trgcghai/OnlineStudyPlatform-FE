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
import { useApproveCourse } from "@/hooks/useAdminCourseApprovals";
import type { CourseApproval } from "@/services/api/courses";

interface ApproveCourseDialogProps {
  course: CourseApproval | null;
  onOpenChange: (open: boolean) => void;
}

export function ApproveCourseDialog({
  course,
  onOpenChange,
}: ApproveCourseDialogProps) {
  const { approveCourse, isPending } = useApproveCourse();

  async function handleApprove() {
    if (!course) return;

    const result = await approveCourse(course.id);
    if (result.ok) {
      onOpenChange(false);
      return;
    }

    toast.add({
      title: result.message ?? "Không thể duyệt khóa học.",
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
          <AlertDialogTitle>Duyệt khóa học?</AlertDialogTitle>
          <AlertDialogDescription>
            Khóa học{" "}
            <span className="font-medium text-foreground">{course?.title}</span>{" "}
            sẽ chuyển sang trạng thái đã xuất bản và học viên có thể đăng ký
            khi chức năng ghi danh sẵn sàng.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleApprove();
            }}
          >
            {isPending ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Đang duyệt...
              </>
            ) : (
              "Duyệt khóa học"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
