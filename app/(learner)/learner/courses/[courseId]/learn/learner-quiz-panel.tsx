"use client";

import { AlertCircle } from "lucide-react";
import { QuizAttemptWorkspace } from "@/components/learner/quizzes/quiz-attempt-workspace";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { mapLearningError } from "@/hooks/useLearning";
import { useLearnerQuiz } from "@/hooks/useLearnerQuizzes";

interface LearnerQuizPanelProps {
  courseId: string;
  lessonId: string;
}

export function LearnerQuizPanel({
  courseId,
  lessonId,
}: LearnerQuizPanelProps) {
  const quizQuery = useLearnerQuiz(courseId, lessonId);

  if (quizQuery.isLoading) {
    return <Skeleton className="h-64 rounded-3xl" />;
  }

  if (quizQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>Không tải được bài kiểm tra</AlertTitle>
        <AlertDescription>{mapLearningError(quizQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  if (!quizQuery.data?.quiz) {
    return null;
  }

  return (
    <QuizAttemptWorkspace
      key={quizQuery.data.quiz.id}
      courseId={courseId}
      lessonId={lessonId}
      quiz={quizQuery.data.quiz}
    />
  );
}
