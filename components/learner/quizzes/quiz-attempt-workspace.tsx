"use client";

import { isAxiosError } from "axios";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { mapLearningError } from "@/hooks/useLearning";
import {
  useQuizAttemptSession,
  type QuizAnswers,
} from "@/hooks/useQuizAttemptSession";
import { type LearnerQuiz } from "@/services/api/learner-quizzes";
import QuizOverviewCard from "@/components/learner/quizzes/quiz-overview-card";
import QuizTimerBanner from "@/components/learner/quizzes/quiz-time-banner";
import QuizResultSummary from "@/components/learner/quizzes/quiz-result-summary";
import QuizQuestionCard from "@/components/learner/quizzes/quiz-question-card";
import AttemptHistory from "@/components/learner/quizzes/attempt-history";
import SubmitQuizDialog from "@/components/learner/quizzes/submit-quiz-dialog";

function getSubmitErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (isAxiosError(error) && error.response?.status === 409) {
    return "Lượt làm bài này đã được nộp. Vui lòng tải lại lịch sử làm bài.";
  }

  return mapLearningError(error);
}

interface QuizAttemptWorkspaceProps {
  courseId: string;
  lessonId: string;
  quiz: LearnerQuiz;
}

export function QuizAttemptWorkspace({
  courseId,
  lessonId,
  quiz,
}: QuizAttemptWorkspaceProps) {
  const session = useQuizAttemptSession({ courseId, lessonId, quiz });
  const submitErrorMessage = getSubmitErrorMessage(
    session.submitMutation.error,
  );

  return (
    <div className="flex flex-col gap-5">
      <QuizOverviewCard
        attemptsLoading={session.attemptsQuery.isLoading}
        canStartAttempt={session.canStartAttempt}
        hasAttemptsRemaining={session.hasAttemptsRemaining}
        showStartAction={
          !session.activeAttempt &&
          !session.result &&
          session.hasAttemptsRemaining
        }
        quiz={quiz}
        startError={session.startMutation.error}
        startPending={session.startMutation.isPending}
        submittedAttemptCount={session.submittedAttemptCount}
        onStartAttempt={session.startAttempt}
      />

      {session.activeAttempt && !session.result && (
        <QuizTimerBanner
          isOverdue={session.isOverdue}
          remainingSeconds={session.remainingSeconds}
        />
      )}

      {session.result && <QuizResultSummary result={session.result} />}

      {session.result &&
        !session.result.passed &&
        session.hasAttemptsRemaining && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Bạn chưa đạt điểm yêu cầu.</p>
                <p className="text-sm text-muted-foreground">
                  Bạn có thể làm lại để cải thiện kết quả.
                </p>
              </div>
              <Button
                type="button"
                onClick={session.startAttempt}
                disabled={
                  session.startMutation.isPending ||
                  session.attemptsQuery.isLoading
                }
              >
                {session.startMutation.isPending
                  ? "Đang bắt đầu..."
                  : "Làm lại bài tập"}
              </Button>
            </CardContent>
          </Card>
        )}

      {session.activeAttempt && (
        <div className="flex flex-col gap-4">
          {quiz.questions.map((question, index) => (
            <QuizQuestionCard
              key={question.id}
              answer={(session.answers as QuizAnswers)[question.id]}
              disabled={session.isFormDisabled}
              error={session.errors[question.id]}
              index={index}
              question={question}
              result={session.result}
              onToggleOption={session.toggleOption}
              onSelectSingleOption={session.selectSingleOption}
              onUpdateEssay={session.updateEssay}
            />
          ))}

          {!session.result && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {submitErrorMessage && (
                <Alert variant="destructive" className="sm:max-w-xl">
                  <AlertCircle aria-hidden="true" />
                  <AlertTitle>Không thể nộp bài</AlertTitle>
                  <AlertDescription>{submitErrorMessage}</AlertDescription>
                </Alert>
              )}
              <Button
                type="button"
                className="self-start sm:ml-auto"
                disabled={session.submitMutation.isPending}
                onClick={session.requestSubmit}
              >
                {session.submitMutation.isPending ? "Đang nộp..." : "Nộp bài"}
              </Button>
            </div>
          )}
        </div>
      )}

      {session.attemptsQuery.isLoading ? (
        <Skeleton className="h-28 rounded-3xl" />
      ) : (
        session.attemptsQuery.data && (
          <AttemptHistory attempts={session.attemptsQuery.data} />
        )
      )}

      <SubmitQuizDialog
        open={session.confirmOpen}
        pending={session.submitMutation.isPending}
        onOpenChange={session.setConfirmOpen}
        onSubmit={session.confirmSubmit}
      />
    </div>
  );
}
