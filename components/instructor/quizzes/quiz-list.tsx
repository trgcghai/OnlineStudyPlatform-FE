"use client";

import { ListChecks, PencilLine, Plus, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteQuizDialog } from "@/components/instructor/quizzes/delete-quiz-dialog";
import { QuizFormDialog } from "@/components/instructor/quizzes/quiz-form-dialog";
import { useInstructorLessonQuiz } from "@/hooks/useInstructorQuizzes";
import type { QuizSummary } from "@/services/api/quizzes";

interface QuizListProps {
  courseId: string;
  lessonId: string;
  onBuild: (quiz: QuizSummary) => void;
}

export function QuizList({ courseId, lessonId, onBuild }: QuizListProps) {
  const [creating, setCreating] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizSummary | null>(null);
  const [deletingQuiz, setDeletingQuiz] = useState<QuizSummary | null>(null);

  const {
    data: quiz,
    isError,
    isPending,
    refetch,
  } = useInstructorLessonQuiz(courseId, lessonId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bài kiểm tra</CardTitle>
        <CardDescription>
          Quản lý bài kiểm tra gắn với bài học này. Mỗi bài học chỉ có một bài
          kiểm tra.
        </CardDescription>
        {!quiz && (
          <CardAction>
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus /> Tạo bài kiểm tra
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isError && (
          <Alert variant="destructive">
            <AlertTitle>Không thể tải danh sách bài kiểm tra</AlertTitle>
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
        )}

        {isPending && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-14 w-full rounded-lg"
                aria-hidden="true"
              />
            ))}
          </div>
        )}

        {!isError && !isPending && !quiz && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <ListChecks
              className="size-10 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="font-medium">Chưa có bài kiểm tra</p>
            <p className="text-sm text-muted-foreground">
              Tạo bài kiểm tra đầu tiên để kiểm tra kiến thức của học viên.
            </p>
            <Button
              size="sm"
              className="mt-2"
              onClick={() => setCreating(true)}
            >
              <Plus /> Tạo bài kiểm tra
            </Button>
          </div>
        )}

        {!isError && !isPending && quiz && (
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 flex-col gap-1">
              <span className="font-medium">{quiz.title}</span>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">Tổng điểm: {quiz.totalPoints}</Badge>
                <Badge variant="outline">Điểm đạt: {quiz.passScore}%</Badge>
                <span>{quiz.questionCount} câu hỏi</span>
                {quiz.timeLimitMinutes && (
                  <span>{quiz.timeLimitMinutes} phút</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => onBuild(quiz)}
                aria-label={`Xây dựng câu hỏi cho ${quiz.title}`}
              >
                <Settings2 /> Xây dựng
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingQuiz(quiz)}
                aria-label={`Chỉnh sửa ${quiz.title}`}
              >
                <PencilLine /> Sửa
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeletingQuiz(quiz)}
                aria-label={`Xóa ${quiz.title}`}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        )}

        <QuizFormDialog
          open={creating}
          onOpenChange={setCreating}
          courseId={courseId}
          lessonId={lessonId}
        />

        <QuizFormDialog
          open={Boolean(editingQuiz)}
          onOpenChange={(open) => {
            if (!open) setEditingQuiz(null);
          }}
          courseId={courseId}
          lessonId={lessonId}
          quiz={editingQuiz}
        />

        <DeleteQuizDialog
          quiz={deletingQuiz}
          courseId={courseId}
          lessonId={lessonId}
          onOpenChange={(open) => {
            if (!open) setDeletingQuiz(null);
          }}
        />
      </CardContent>
    </Card>
  );
}
