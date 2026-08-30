"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  useAddInstructorQuestion,
  useUpdateInstructorQuestion,
} from "@/hooks/useInstructorQuizzes";
import {
  QUIZ_QUESTION_TYPE_LABELS,
  QUIZ_QUESTION_TYPES,
  questionFormSchema,
  type QuestionFormValues,
} from "@/lib/schemas/quiz";
import type { QuizQuestion } from "@/services/api/quizzes";
import { QuizQuestionType } from "@/services/api/quizzes";

const OPTION_MARKERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

interface QuestionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string;
  courseId: string;
  lessonId: string;
  question?: QuizQuestion | null;
}

export function QuestionFormDialog({
  open,
  onOpenChange,
  quizId,
  courseId,
  lessonId,
  question,
}: QuestionFormDialogProps) {
  const [options, setOptions] = useState<string[]>(question?.options ?? []);
  const [correctAnswers, setCorrectAnswers] = useState<number[]>(
    question?.correctAnswers ?? [],
  );
  const [typeState, setTypeState] = useState<QuizQuestionType>(
    question?.type ?? QuizQuestionType.MCQ,
  );
  const [formError, setFormError] = useState<string | null>(null);

  const { addInstructorQuestion, isPending: isAdding } =
    useAddInstructorQuestion();
  const { updateInstructorQuestion, isPending: isUpdating } =
    useUpdateInstructorQuestion();
  const isPending = isAdding || isUpdating;
  const isEditing = Boolean(question);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      type: question?.type ?? QuizQuestionType.MCQ,
      content: question?.content ?? "",
      points: question?.points ?? 1,
      options: question?.options ?? [],
      correctAnswers: question?.correctAnswers ?? [],
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    onOpenChange(nextOpen);
  }

  function updateOption(index: number, value: string) {
    const next = [...options];
    next[index] = value;
    setOptions(next);
    setValue("options", next, { shouldValidate: false });
  }

  function addOption() {
    const next = [...options, ""];
    setOptions(next);
    setValue("options", next, { shouldValidate: false });
  }

  function removeOption(index: number) {
    const nextOptions = options.filter((_, i) => i !== index);
    const nextCorrect = correctAnswers
      .filter((i) => i !== index)
      .map((i) => (i > index ? i - 1 : i));
    setOptions(nextOptions);
    setValue("options", nextOptions, { shouldValidate: false });
    setCorrectAnswers(nextCorrect);
    setValue("correctAnswers", nextCorrect, { shouldValidate: false });
  }

  function toggleCorrect(index: number) {
    const next = correctAnswers.includes(index)
      ? correctAnswers.filter((i) => i !== index)
      : [...correctAnswers, index].sort((a, b) => a - b);
    setCorrectAnswers(next);
    setValue("correctAnswers", next, { shouldValidate: false });
  }

  async function onSubmit(values: QuestionFormValues) {
    setFormError(null);

    const result = isEditing
      ? await updateInstructorQuestion(question!, courseId, lessonId, values)
      : await addInstructorQuestion(quizId, courseId, lessonId, values);

    if (!result.ok) {
      setFormError(result.message ?? "Không thể lưu câu hỏi.");
      return;
    }

    handleOpenChange(false);
  }

  const isMcq = typeState === "MCQ";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[min(90vh,720px)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi"}
          </DialogTitle>
          <DialogDescription>
            Thêm câu hỏi trắc nghiệm hoặc tự luận cho bài kiểm tra.
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

            <Field data-invalid={!!errors.type}>
              <FieldLabel required>Loại câu hỏi</FieldLabel>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      const nextType = value as QuizQuestionType;
                      setTypeState(nextType);
                      if (nextType === "ESSAY") {
                        setOptions([]);
                        setCorrectAnswers([]);
                        setValue("options", [], { shouldValidate: false });
                        setValue("correctAnswers", [], {
                          shouldValidate: false,
                        });
                      }
                    }}
                    items={QUIZ_QUESTION_TYPE_LABELS}
                  >
                    <SelectTrigger className="w-full" aria-label="Loại câu hỏi">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUIZ_QUESTION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {QUIZ_QUESTION_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.type]} />
            </Field>

            <Field data-invalid={!!errors.content}>
              <FieldLabel htmlFor="question-content" required>
                Nội dung câu hỏi
              </FieldLabel>
              <Textarea
                id="question-content"
                rows={3}
                {...register("content")}
              />
              <FieldError errors={[errors.content]} />
            </Field>

            <Field data-invalid={!!errors.points}>
              <FieldLabel htmlFor="question-points" required>
                Điểm số
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="question-points"
                  type="number"
                  min={1}
                  {...register("points", { valueAsNumber: true })}
                />
              </InputGroup>
              <FieldError errors={[errors.points]} />
            </Field>

            {isMcq && (
              <>
                <Field data-invalid={!!errors.options}>
                  <div className="flex items-center justify-between">
                    <FieldLabel>Phương án</FieldLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                    >
                      <Plus /> Thêm phương án
                    </Button>
                  </div>
                  <FieldDescription>
                    Chọn ít nhất 2 phương án. Tích vào phương án đúng.
                  </FieldDescription>
                  <div className="flex flex-col gap-2">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-6 shrink-0 text-center text-sm font-semibold text-muted-foreground">
                          {OPTION_MARKERS[index] ?? index + 1}
                        </span>
                        <Input
                          value={option}
                          placeholder={`Phương án ${OPTION_MARKERS[index] ?? index + 1}`}
                          onChange={(e) => updateOption(index, e.target.value)}
                        />
                        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={correctAnswers.includes(index)}
                            onCheckedChange={() => toggleCorrect(index)}
                          />
                          <span className="text-muted-foreground">Đúng</span>
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={options.length <= 2}
                          onClick={() => removeOption(index)}
                          className="text-destructive hover:text-destructive"
                          aria-label={`Xóa phương án ${OPTION_MARKERS[index] ?? ""}`}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    ))}
                    {options.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Chưa có phương án nào.
                      </p>
                    )}
                  </div>
                  <FieldError errors={[errors.options]} />
                  <FieldError errors={[errors.correctAnswers]} />
                </Field>
              </>
            )}

            {!isMcq && (
              <Alert>
                <AlertDescription>
                  Câu hỏi tự luận sẽ được chấm điểm bằng tay. Học viên nhập câu
                  trả lời và giảng viên chấm sau.
                </AlertDescription>
              </Alert>
            )}
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
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
                "Thêm câu hỏi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
