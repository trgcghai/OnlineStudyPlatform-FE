"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useRejectCourse } from "@/hooks/useAdminCourseApprovals";
import type { CourseApproval } from "@/services/api/courses";

interface RejectCourseDialogProps {
  course: CourseApproval | null;
  onOpenChange: (open: boolean) => void;
}

export function RejectCourseDialog({
  course,
  onOpenChange,
}: RejectCourseDialogProps) {
  const { rejectCourse, isPending } = useRejectCourse();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;

    if (!nextOpen) {
      setReason("");
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  async function handleReject() {
    if (!course) return;

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError("Vui lòng nhập lý do từ chối.");
      return;
    }

    const result = await rejectCourse(course.id, trimmedReason);
    if (result.ok) {
      handleOpenChange(false);
      return;
    }

    toast.add({
      title: result.message ?? "Không thể từ chối khóa học.",
      type: "error",
    });
  }

  return (
    <Dialog open={Boolean(course)} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Từ chối khóa học</DialogTitle>
          <DialogDescription>
            Nhập lý do để giảng viên biết cần chỉnh sửa nội dung nào cho khóa
            học{" "}
            <span className="font-medium text-foreground">{course?.title}</span>.
          </DialogDescription>
        </DialogHeader>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="reject-reason" required>
            Lý do từ chối
          </FieldLabel>
          <Textarea
            id="reject-reason"
            rows={5}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError(null);
            }}
            disabled={isPending}
            aria-invalid={Boolean(error)}
          />
          <FieldError>{error}</FieldError>
        </Field>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
          >
            Hủy
          </Button>
          <Button type="button" disabled={isPending} onClick={handleReject}>
            {isPending ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Đang từ chối...
              </>
            ) : (
              "Từ chối khóa học"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
