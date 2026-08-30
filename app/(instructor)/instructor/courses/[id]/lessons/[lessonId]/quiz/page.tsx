"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionBuilder } from "@/components/instructor/quizzes/question-builder";
import { QuizList } from "@/components/instructor/quizzes/quiz-list";
import {
  mapCourseError,
  useInstructorCourse,
} from "@/hooks/useInstructorCourses";
import type { QuizSummary } from "@/services/api/quizzes";

export default function CourseQuizPage() {
  const params = useParams<{ id: string; lessonId: string }>();
  const courseId = params.id;
  const lessonId = params.lessonId;
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  const { data, error, isError, isPending, refetch } =
    useInstructorCourse(courseId);

  function handleBuild(quiz: QuizSummary) {
    setSelectedQuizId(quiz.id);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <Button variant="ghost" size="sm" className="w-fit">
        <Link
          href={`/instructor/courses/${courseId}/lessons`}
          className="flex items-center gap-2"
        >
          <ArrowLeft /> Quay lại bài học
        </Link>
      </Button>

      {isPending ? <Skeleton className="h-96 w-full" /> : null}

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Không thể tải khóa học</AlertTitle>
          <AlertDescription>{mapCourseError(error)}</AlertDescription>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => refetch()}
          >
            Thử lại
          </Button>
        </Alert>
      )}

      {data && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">{data.title}</h1>
            <p className="text-sm text-muted-foreground">
              Quản lý bài kiểm tra cho bài học
            </p>
          </div>

          {selectedQuizId ? (
            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setSelectedQuizId(null)}
              >
                <ArrowLeft /> Quay lại danh sách bài kiểm tra
              </Button>
              <QuestionBuilder
                key={selectedQuizId}
                quizId={selectedQuizId}
                courseId={courseId}
                lessonId={lessonId}
              />
            </div>
          ) : (
            <QuizList
              courseId={courseId}
              lessonId={lessonId}
              onBuild={handleBuild}
            />
          )}
        </div>
      )}
    </div>
  );
}
