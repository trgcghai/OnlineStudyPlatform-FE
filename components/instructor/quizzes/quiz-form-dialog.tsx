"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
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
import {
  useCreateInstructorQuiz,
  useUpdateInstructorQuiz,
} from "@/hooks/useInstructorQuizzes";
import { quizFormSchema, type QuizFormValues } from "@/lib/schemas/quiz";
import type { QuizSummary } from "@/services/api/quizzes";

interface QuizFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  lessonId: string;
  quiz?: QuizSummary | null;
}

export function QuizFormDialog({
  open,
  onOpenChange,
  courseId,
  lessonId,
  quiz,
}: QuizFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const { createInstructorQuiz, isPending: isCreating } =
    useCreateInstructorQuiz();
  const { updateInstructorQuiz, isPending: isUpdating } =
    useUpdateInstructorQuiz();
  const isPending = isCreating || isUpdating;

  const isEditing = Boolean(quiz);

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: quiz?.title ?? "",
      description: quiz?.description ?? "",
      timeLimitMinutes: quiz?.timeLimitMinutes
        ? String(quiz.timeLimitMinutes)
        : "",
      passScore: quiz?.passScore ?? 70,
    },
  });

  useEffect(() => {
    if (quiz) {
      reset({
        title: quiz.title,
        description: quiz.description ?? "",
        timeLimitMinutes: quiz.timeLimitMinutes
          ? String(quiz.timeLimitMinutes)
          : "",
        passScore: quiz.passScore,
      });
    }
  }, [quiz, reset]);

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    if (nextOpen && !quiz) {
      reset({
        title: "",
        description: "",
        timeLimitMinutes: "",
        passScore: 70,
      });
    }
    if (!nextOpen) {
      setFormError(null);
    }
    onOpenChange(nextOpen);
  }

  async function onSubmit(values: QuizFormValues) {
    setFormError(null);

    const result = isEditing
      ? await updateInstructorQuiz(quiz!.id, courseId, lessonId, values)
      : await createInstructorQuiz(courseId, lessonId, values);

    if (!result.ok) {
      setFormError(result.message ?? "Không thể lưu bài kiểm tra.");
      return;
    }

    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl!">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh sửa bài kiểm tra" : "Tạo bài kiểm tra mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cập nhật thông tin chung của bài kiểm tra."
              : "Thiết lập thông tin chung rồi thêm câu hỏi cho bài kiểm tra."}
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
              <FieldLabel htmlFor="quiz-title" required>
                Tiêu đề bài kiểm tra
              </FieldLabel>
              <InputGroup>
                <InputGroupInput id="quiz-title" {...register("title")} />
              </InputGroup>
              <FieldError errors={[errors.title]} />
            </Field>

            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="quiz-description">Mô tả</FieldLabel>
              <Textarea
                id="quiz-description"
                rows={3}
                placeholder="Mô tả ngắn gọn về bài kiểm tra..."
                {...register("description")}
              />
              <FieldError errors={[errors.description]} />
            </Field>

            <Field data-invalid={!!errors.timeLimitMinutes}>
              <FieldLabel htmlFor="quiz-time-limit">
                Thời gian làm bài (phút)
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="quiz-time-limit"
                  type="number"
                  min={0}
                  placeholder="Không giới hạn nếu để trống"
                  {...register("timeLimitMinutes")}
                />
              </InputGroup>
              <FieldError errors={[errors.timeLimitMinutes]} />
            </Field>

            <Field data-invalid={!!errors.passScore}>
              <FieldLabel htmlFor="quiz-pass-score" required>
                Điểm đạt (%)
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="quiz-pass-score"
                  type="number"
                  min={1}
                  max={100}
                  {...register("passScore", { valueAsNumber: true })}
                />
              </InputGroup>
              <FieldError errors={[errors.passScore]} />
            </Field>
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
                "Tạo bài kiểm tra"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
