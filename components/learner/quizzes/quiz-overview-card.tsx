import { AlertCircle, FileQuestion } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  QUIZ_MAX_ATTEMPTS,
  type LearnerQuiz,
} from "@/services/api/learner-quizzes";
import { formatScore } from "@/utils/quizUtil";
import { isAxiosError } from "axios";
import { mapLearningError } from "@/hooks/useLearning";

function getStartAttemptErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (isAxiosError(error) && error.response?.status === 409) {
    return "Bạn đã dùng hết 3 lượt làm bài.";
  }

  return mapLearningError(error);
}

interface QuizOverviewCardProps {
  attemptsLoading: boolean;
  canStartAttempt: boolean;
  hasAttemptsRemaining: boolean;
  quiz: LearnerQuiz;
  showStartAction: boolean;
  startError: unknown;
  startPending: boolean;
  submittedAttemptCount: number;
  onStartAttempt: () => void;
}

export default function QuizOverviewCard({
  attemptsLoading,
  canStartAttempt,
  hasAttemptsRemaining,
  quiz,
  showStartAction,
  startError,
  startPending,
  submittedAttemptCount,
  onStartAttempt,
}: QuizOverviewCardProps) {
  const startErrorMessage = getStartAttemptErrorMessage(startError);

  return (
    <Card className="border-dashed">
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          <FileQuestion data-icon="inline-start" aria-hidden="true" />
          Bài kiểm tra
        </Badge>
        <CardTitle>{quiz.title}</CardTitle>
        <CardDescription>
          {quiz.description ||
            "Hoàn thành bài kiểm tra để mở khóa tiến độ bài học."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p>Số câu hỏi: {quiz.questions.length}</p>
          <p>Tổng điểm: {formatScore(quiz.totalPoints)}</p>
          <p>Số điểm cần đạt: {formatScore(quiz.passScorePoints)}</p>
          <p>
            Thời gian làm bài:
            {quiz.timeLimitMinutes
              ? ` ${quiz.timeLimitMinutes} phút`
              : " Không giới hạn"}
          </p>
          <p>
            {attemptsLoading
              ? "Đang tải lượt làm bài"
              : `Lượt làm bài: ${submittedAttemptCount}/${QUIZ_MAX_ATTEMPTS}`}
          </p>
        </div>
        {showStartAction && (
          <Button
            type="button"
            className="w-fit"
            onClick={onStartAttempt}
            disabled={startPending || !canStartAttempt}
          >
            {startPending ? "Đang bắt đầu..." : "Bắt đầu làm bài"}
          </Button>
        )}
        {startError ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>Không thể bắt đầu bài kiểm tra</AlertTitle>
            <AlertDescription>{startErrorMessage}</AlertDescription>
          </Alert>
        ) : null}
        {!attemptsLoading && !hasAttemptsRemaining && (
          <Alert>
            <AlertCircle aria-hidden="true" />
            <AlertTitle>Đã hết lượt làm bài</AlertTitle>
            <AlertDescription>
              Bạn đã dùng hết {QUIZ_MAX_ATTEMPTS} lượt làm bài.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
