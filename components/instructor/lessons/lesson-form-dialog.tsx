"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { LessonFileField } from "@/components/instructor/lessons/lesson-file-field";
import {
  useCreateInstructorLesson,
  useUpdateInstructorLesson,
} from "@/hooks/useInstructorLessons";
import { lessonFormSchema, type LessonFormValues } from "@/lib/schemas/lesson";
import type { Lesson } from "@/services/api/lessons";

function extractVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(video.duration));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    video.src = url;
  });
}

interface LessonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  lesson?: Lesson | null;
}

export function LessonFormDialog({
  open,
  onOpenChange,
  courseId,
  lesson,
}: LessonFormDialogProps) {
  const [video, setVideo] = useState<File | null>(null);
  const [material, setMaterial] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { createInstructorLesson, isPending: isCreating } =
    useCreateInstructorLesson();
  const { updateInstructorLesson, isPending: isUpdating } =
    useUpdateInstructorLesson();
  const isPending = isCreating || isUpdating;

  const isEditing = Boolean(lesson);

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      title: lesson?.title ?? "",
      description: lesson?.description ?? "",
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    if (!nextOpen) {
      setVideo(null);
      setMaterial(null);
      setFormError(null);
      reset({ title: "", description: "" });
    }
    onOpenChange(nextOpen);
  }

  async function onSubmit(values: LessonFormValues) {
    setFormError(null);

    let duration: number | undefined;

    if (video) {
      duration = await extractVideoDuration(video);
    }

    const result = isEditing
      ? await updateInstructorLesson(
          lesson!.id,
          courseId,
          values,
          video,
          material,
          duration,
        )
      : await createInstructorLesson(
          courseId,
          values,
          video,
          material,
          duration,
        );

    if (!result.ok) {
      setFormError(result.message ?? "Không thể lưu bài học.");
      return;
    }

    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh sửa bài học" : "Tạo bài học mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cập nhật thông tin và file đính kèm của bài học."
              : "Thêm bài học mới vào khóa học. Bạn có thể tải lên video và tài liệu đính kèm."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {formError && (
              <Alert variant="destructive">
                <AlertTitle>Lỗi</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <Field data-invalid={!!errors.title}>
              <FieldLabel htmlFor="lesson-title" required>
                Tiêu đề bài học
              </FieldLabel>
              <InputGroup>
                <InputGroupInput id="lesson-title" {...register("title")} />
              </InputGroup>
              <FieldError errors={[errors.title]} />
            </Field>

            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="lesson-description">Mô tả</FieldLabel>
              <Textarea
                id="lesson-description"
                rows={3}
                placeholder="Mô tả ngắn gọn nội dung bài học..."
                {...register("description")}
              />
              <FieldError errors={[errors.description]} />
            </Field>

            <LessonFileField
              label="Video bài giảng"
              type="video"
              value={video}
              onChange={setVideo}
              currentUrl={lesson?.videoUrl}
              disabled={isPending}
            />

            <LessonFileField
              label="Tài liệu đính kèm"
              type="material"
              value={material}
              onChange={setMaterial}
              currentUrl={lesson?.materialUrl}
              disabled={isPending}
            />
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner /> Đang lưu...
                </>
              ) : isEditing ? (
                "Lưu thay đổi"
              ) : (
                "Tạo bài học"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
