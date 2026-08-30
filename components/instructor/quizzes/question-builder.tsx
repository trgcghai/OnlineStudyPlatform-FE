"use client";

import { GripVertical, PencilLine, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionFormDialog } from "@/components/instructor/quizzes/question-form-dialog";
import { DeleteQuestionDialog } from "@/components/instructor/quizzes/delete-question-dialog";
import {
  useInstructorQuiz,
  useReorderInstructorQuestions,
} from "@/hooks/useInstructorQuizzes";
import { QUIZ_QUESTION_TYPE_LABELS } from "@/lib/schemas/quiz";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/services/api/quizzes";

interface SortableQuestionRowProps {
  question: QuizQuestion;
  index: number;
  onEdit: (question: QuizQuestion) => void;
  onDelete: (question: QuizQuestion) => void;
}

function SortableQuestionRow({
  question,
  index,
  onEdit,
  onDelete,
}: SortableQuestionRowProps) {
  const { isDragging, ref, handleRef } = useSortable({
    id: question.id,
    index,
    plugins: [],
  });

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-card p-4",
        isDragging && "opacity-50",
      )}
    >
      <button
        type="button"
        ref={handleRef}
        className="mt-0.5 inline-flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
        aria-label="Kéo để sắp xếp"
      >
        <GripVertical className="size-4" />
      </button>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">
            {index + 1}.
          </span>
          <Badge variant="secondary">
            {QUIZ_QUESTION_TYPE_LABELS[question.type]}
          </Badge>
          <Badge variant="outline">{question.points} điểm</Badge>
        </div>
        <p className="whitespace-pre-wrap text-sm">{question.content}</p>
      </div>

      <div className="flex shrink-0 gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(question)}
          aria-label={`Chỉnh sửa câu hỏi ${index + 1}`}
        >
          <PencilLine />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(question)}
          aria-label={`Xóa câu hỏi ${index + 1}`}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}

interface QuestionBuilderProps {
  quizId: string;
  courseId: string;
  lessonId: string;
}

export function QuestionBuilder({
  quizId,
  courseId,
  lessonId,
}: QuestionBuilderProps) {
  const [adding, setAdding] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(
    null,
  );
  const [deletingQuestion, setDeletingQuestion] = useState<QuizQuestion | null>(
    null,
  );
  const [addDialogKey, setAddDialogKey] = useState(0);

  const { data: quiz, isError, isPending, refetch } = useInstructorQuiz(quizId);
  const { reorderInstructorQuestions } = useReorderInstructorQuestions();

  const questions = quiz?.questions ?? [];

  function openAddDialog() {
    setAddDialogKey((prev) => prev + 1);
    setAdding(true);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (event.canceled) return;
    const sourceId = event.operation.source?.id;
    const targetId = event.operation.target?.id;
    if (!sourceId || !targetId || sourceId === targetId) return;

    const oldIndex = questions.findIndex((q) => q.id === sourceId);
    const newIndex = questions.findIndex((q) => q.id === targetId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...questions];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    reorderInstructorQuestions(
      quizId,
      courseId,
      lessonId,
      reordered.map((q) => q.id),
    );
  }

  if (!quiz) {
    if (isError) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Không thể tải bài kiểm tra</AlertTitle>
          <AlertDescription>
            Đã xảy ra lỗi khi truy vấn dữ liệu. Vui lòng thử lại.
          </AlertDescription>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => refetch()}
          >
            Thử lại
          </Button>
        </Alert>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-16 w-full rounded-xl"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{isPending ? "Đang tải..." : quiz.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {quiz.description || "Không có mô tả"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Tổng điểm: {quiz.totalPoints}</Badge>
            <Badge variant="outline">
              Điểm đạt: {quiz.passScore}% ({quiz.passScorePoints} điểm)
            </Badge>
            <Button size="sm" onClick={openAddDialog}>
              <Plus /> Thêm câu hỏi
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="flex flex-col gap-3">
        {questions.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center">
            <p className="font-medium">Chưa có câu hỏi</p>
            <p className="text-sm text-muted-foreground">
              Thêm câu hỏi trắc nghiệm hoặc tự luận để bắt đầu xây dựng bài kiểm
              tra.
            </p>
            <Button size="sm" className="mt-2" onClick={openAddDialog}>
              <Plus /> Thêm câu hỏi
            </Button>
          </div>
        )}

        {questions.length > 0 && (
          <DragDropProvider onDragEnd={handleDragEnd}>
            <div className="flex flex-col gap-3">
              {questions.map((question, index) => (
                <SortableQuestionRow
                  key={question.id}
                  question={question}
                  index={index}
                  onEdit={setEditingQuestion}
                  onDelete={setDeletingQuestion}
                />
              ))}
            </div>
          </DragDropProvider>
        )}
      </div>

      <QuestionFormDialog
        key={`add-${addDialogKey}`}
        open={adding}
        onOpenChange={setAdding}
        quizId={quizId}
        courseId={courseId}
        lessonId={lessonId}
      />

      <QuestionFormDialog
        key={editingQuestion?.id ?? "none"}
        open={Boolean(editingQuestion)}
        onOpenChange={(open) => {
          if (!open) setEditingQuestion(null);
        }}
        quizId={quizId}
        courseId={courseId}
        lessonId={lessonId}
        question={editingQuestion}
      />

      <DeleteQuestionDialog
        question={deletingQuestion}
        courseId={courseId}
        lessonId={lessonId}
        onOpenChange={(open) => {
          if (!open) setDeletingQuestion(null);
        }}
      />
    </div>
  );
}
