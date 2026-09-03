import { CheckCircle2, Clock3, MessageSquareText, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  type LearnerQuiz,
  type LearnerQuizQuestion,
  type QuizAttemptQuestionResult,
  type QuizAttemptResult,
} from "@/services/api/learner-quizzes";
import { QuizQuestionType } from "@/services/api/quizzes";
import {
  formatDuration,
  formatScore,
  getAttemptStatusLabel,
  getQuestionStatusLabel,
} from "@/utils/quizUtil";

function formatSelectedOptions(
  question: LearnerQuizQuestion,
  result: QuizAttemptQuestionResult,
): string {
  const selectedIndexes = result.selectedOptionIndexes ?? [];
  if (selectedIndexes.length === 0) return "Chưa chọn đáp án";

  return selectedIndexes
    .map(
      (optionIndex) =>
        question.options[optionIndex] ?? `Đáp án ${optionIndex + 1}`,
    )
    .join(", ");
}

export default function QuizResultSummary({
  quiz,
  result,
}: {
  quiz: LearnerQuiz;
  result: QuizAttemptResult;
}) {
  const Icon = result.passed ? CheckCircle2 : XCircle;

  return (
    <Card
      className={cn(
        "border-2",
        result.passed ? "border-emerald-500/40" : "border-destructive/40",
      )}
    >
      <CardHeader>
        <Badge
          variant={result.passed ? "secondary" : "destructive"}
          className="w-fit"
        >
          <Icon data-icon="inline-start" aria-hidden="true" />
          {getAttemptStatusLabel(result)}
        </Badge>
        <CardTitle>
          {formatScore(result.totalScore)} / {formatScore(result.totalPoints)}{" "}
          điểm
        </CardTitle>
        <CardDescription>
          Điểm cần đạt: {formatScore(result.passScorePoints)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 text-sm text-muted-foreground">
        <div className="flex flex-col gap-1">
          <p>Đúng: {result.correctCount}</p>
          <p>Sai/chưa đủ: {result.wrongCount}</p>
          <p>Chờ chấm: {result.pendingEssayCount}</p>
        </div>
        {result.isLate && (
          <span className="text-amber-600">
            Nộp muộn {formatDuration(result.lateSeconds)}
          </span>
        )}
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Chi tiết từng câu
            </h3>
            <p className="text-xs text-muted-foreground">
              Xem điểm, trạng thái và phản hồi của giảng viên cho từng câu hỏi.
            </p>
          </div>
          {quiz.questions.map((question, index) => {
            const questionResult = result.questions.find(
              (item) => item.questionId === question.id,
            );

            if (!questionResult) return null;

            return (
              <div
                key={question.id}
                className="rounded-2xl border bg-background/70 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-foreground">
                      Câu {index + 1}: {question.content}
                    </p>
                    <p className="text-sm">
                      {question.type === QuizQuestionType.ESSAY
                        ? questionResult.text || "Chưa nhập câu trả lời"
                        : formatSelectedOptions(question, questionResult)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {getQuestionStatusLabel(questionResult.status)}
                    </Badge>
                    <Badge variant="secondary">
                      {formatScore(questionResult.score)} /{" "}
                      {formatScore(questionResult.maxScore)} điểm
                    </Badge>
                  </div>
                </div>
                {questionResult.status === "pending_grading" && (
                  <div className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    <Clock3
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>Giảng viên đang chấm câu tự luận này.</span>
                  </div>
                )}
                {questionResult.feedback && (
                  <div className="mt-3 rounded-xl bg-muted/70 p-3">
                    <p className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <MessageSquareText
                        className="size-4"
                        aria-hidden="true"
                      />
                      Phản hồi của giảng viên
                    </p>
                    <p className="mt-2 whitespace-pre-wrap">
                      {questionResult.feedback}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
