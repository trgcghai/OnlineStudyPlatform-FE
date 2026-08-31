"use client";

import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileQuestion,
  XCircle,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { mapLearningError } from "@/hooks/useLearning";
import {
  useLearnerQuiz,
  useLearnerQuizAttempts,
  useStartQuizAttempt,
  useSubmitQuizAttempt,
} from "@/hooks/useLearnerQuizzes";
import { cn } from "@/lib/utils";
import type {
  LearnerQuiz,
  QuizAttemptQuestionStatus,
  QuizAttemptResult,
  SubmitQuizAnswerPayload,
} from "@/services/api/learner-quizzes";
import { QuizQuestionType } from "@/services/api/quizzes";

interface LearnerQuizPanelProps {
  courseId: string;
  lessonId: string;
}

type QuizAnswers = Record<string, SubmitQuizAnswerPayload>;

function formatScore(value: number): string {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatDateTime(value: string | null): string {
  if (!value) return "Chưa nộp";

  return new Date(value).toLocaleString("vi-VN");
}

function getAttemptStatusLabel(result: QuizAttemptResult): string {
  if (result.pendingEssayCount > 0 && !result.passed) return "Chờ chấm";

  return result.passed ? "Đạt" : "Chưa đạt";
}

function getQuestionStatusLabel(status: QuizAttemptQuestionStatus): string {
  if (status === "correct") return "Đúng";
  if (status === "partial") return "Đúng một phần";
  if (status === "pending_grading") return "chờ chấm";

  return "Chưa đúng";
}

function buildInitialAnswers(quiz: LearnerQuiz): QuizAnswers {
  return Object.fromEntries(
    quiz.questions.map((question) => [
      question.id,
      question.type === QuizQuestionType.MCQ
        ? { questionId: question.id, selectedOptionIndexes: [] }
        : { questionId: question.id, text: "" },
    ]),
  );
}

function validateAnswers(
  quiz: LearnerQuiz,
  answers: QuizAnswers,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const question of quiz.questions) {
    const answer = answers[question.id];
    if (
      question.type === QuizQuestionType.MCQ &&
      !answer?.selectedOptionIndexes?.length
    ) {
      errors[question.id] = "Chọn ít nhất một đáp án.";
    }
    if (question.type === QuizQuestionType.ESSAY && !answer?.text?.trim()) {
      errors[question.id] = "Nhập câu trả lời tự luận.";
    }
  }

  return errors;
}

function getSubmitErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (isAxiosError(error) && error.response?.status === 409) {
    return "Lượt làm bài này đã được nộp. Vui lòng tải lại lịch sử làm bài.";
  }

  return mapLearningError(error);
}

function useRemainingSeconds(
  startedAt: string | null,
  timeLimitMinutes: number | null,
  stopped: boolean,
): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt || !timeLimitMinutes || stopped) return;

    const interval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, [startedAt, timeLimitMinutes, stopped]);

  if (!startedAt || !timeLimitMinutes) return null;

  const deadline = new Date(startedAt).getTime() + timeLimitMinutes * 60 * 1000;

  return Math.ceil((deadline - now) / 1000);
}

function QuizResultSummary({ result }: { result: QuizAttemptResult }) {
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
      <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
        <span>Đúng: {result.correctCount}</span>
        <span>Sai/chưa đủ: {result.wrongCount}</span>
        <span>Chờ chấm: {result.pendingEssayCount}</span>
        {result.isLate ? (
          <span className="text-amber-600">
            Nộp muộn {formatDuration(result.lateSeconds)}
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AttemptHistory({ attempts }: { attempts: QuizAttemptResult[] }) {
  if (attempts.length === 0) return null;

  return (
    <section className="rounded-3xl border p-4">
      <h3 className="font-semibold">Lịch sử làm bài</h3>
      <div className="mt-3 flex flex-col gap-2">
        {attempts.map((attempt) => (
          <div
            key={attempt.attemptId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-muted/50 p-3 text-sm"
          >
            <span>{formatDateTime(attempt.submittedAt)}</span>
            <span>
              {formatScore(attempt.totalScore)} /{" "}
              {formatScore(attempt.totalPoints)}
            </span>
            {attempt.isLate ? (
              <span className="text-xs text-amber-600">
                Muộn {formatDuration(attempt.lateSeconds)}
              </span>
            ) : null}
            <Badge variant={attempt.passed ? "secondary" : "outline"}>
              {getAttemptStatusLabel(attempt)}
            </Badge>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuizAttemptWorkspace({
  courseId,
  lessonId,
  quiz,
}: {
  courseId: string;
  lessonId: string;
  quiz: LearnerQuiz;
}) {
  const [activeAttempt, setActiveAttempt] = useState<{
    attemptId: string;
    startedAt: string;
    timeLimitMinutes: number | null;
  } | null>(null);
  const [answers, setAnswers] = useState<QuizAnswers>(() =>
    buildInitialAnswers(quiz),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const attemptsQuery = useLearnerQuizAttempts(courseId, lessonId, quiz.id);
  const startMutation = useStartQuizAttempt(courseId, lessonId);
  const submitMutation = useSubmitQuizAttempt(
    courseId,
    lessonId,
    quiz.id,
    activeAttempt?.attemptId ?? null,
  );
  const remainingSeconds = useRemainingSeconds(
    activeAttempt?.startedAt ?? null,
    activeAttempt?.timeLimitMinutes ?? null,
    Boolean(result),
  );
  const isOverdue = remainingSeconds !== null && remainingSeconds <= 0;
  const isFormDisabled =
    !activeAttempt || Boolean(result) || submitMutation.isPending;
  const submitErrorMessage = getSubmitErrorMessage(submitMutation.error);

  async function startAttempt() {
    setResult(null);
    setErrors({});
    setAnswers(buildInitialAnswers(quiz));
    const started = await startMutation.mutateAsync(quiz.id);
    setActiveAttempt({
      attemptId: started.attemptId,
      startedAt: started.startedAt,
      timeLimitMinutes: started.timeLimitMinutes,
    });
  }

  function toggleOption(questionId: string, optionIndex: number) {
    setAnswers((current) => {
      const selected = new Set(
        current[questionId]?.selectedOptionIndexes ?? [],
      );
      if (selected.has(optionIndex)) selected.delete(optionIndex);
      else selected.add(optionIndex);

      return {
        ...current,
        [questionId]: {
          questionId,
          selectedOptionIndexes: [...selected].sort((a, b) => a - b),
        },
      };
    });
  }

  function updateEssay(questionId: string, text: string) {
    setAnswers((current) => ({
      ...current,
      [questionId]: { questionId, text },
    }));
  }

  function requestSubmit() {
    const nextErrors = validateAnswers(quiz, answers);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setConfirmOpen(true);
  }

  async function confirmSubmit() {
    const submitted = await submitMutation.mutateAsync({
      answers: Object.values(answers),
    });
    setResult(submitted);
    setConfirmOpen(false);
  }

  function renderQuestionResult(questionId: string) {
    const questionResult = result?.questions.find(
      (item) => item.questionId === questionId,
    );
    if (!questionResult) return null;

    return (
      <div className="mt-3 rounded-2xl bg-muted/60 p-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {getQuestionStatusLabel(questionResult.status)}
          </Badge>
          <span className="text-muted-foreground">
            {formatScore(questionResult.score)} /{" "}
            {formatScore(questionResult.maxScore)} điểm
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
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
          <div className="grid gap-3 text-sm sm:grid-cols-4">
            <span>{quiz.questions.length} câu hỏi</span>
            <span>{formatScore(quiz.totalPoints)} điểm</span>
            <span>Cần đạt {formatScore(quiz.passScorePoints)} điểm</span>
            <span>
              {quiz.timeLimitMinutes
                ? `${quiz.timeLimitMinutes} phút`
                : "Không giới hạn thời gian"}
            </span>
          </div>
          {!activeAttempt && !result ? (
            <Button
              type="button"
              className="w-fit"
              onClick={startAttempt}
              disabled={startMutation.isPending}
            >
              {startMutation.isPending ? "Đang bắt đầu..." : "Bắt đầu làm bài"}
            </Button>
          ) : null}
          {startMutation.isError ? (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertTitle>Không thể bắt đầu bài kiểm tra</AlertTitle>
              <AlertDescription>
                {mapLearningError(startMutation.error)}
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {activeAttempt && !result ? (
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl border p-3 text-sm",
            isOverdue
              ? "border-amber-500/50 text-amber-700"
              : "text-muted-foreground",
          )}
        >
          <Clock3 aria-hidden="true" className="size-4" />
          {remainingSeconds === null ? (
            <span>Bài làm không giới hạn thời gian.</span>
          ) : isOverdue ? (
            <span>
              Đã quá thời gian {formatDuration(Math.abs(remainingSeconds))}.
            </span>
          ) : (
            <span>Còn lại {formatDuration(remainingSeconds)}.</span>
          )}
        </div>
      ) : null}

      {result ? <QuizResultSummary result={result} /> : null}

      {activeAttempt ? (
        <div className="flex flex-col gap-4">
          {quiz.questions.map((question, index) => {
            const answer = answers[question.id];
            const error = errors[question.id];

            return (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      Câu {index + 1}: {question.content}
                    </CardTitle>
                    <Badge variant="outline">
                      {formatScore(question.points)} điểm
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {question.type === QuizQuestionType.MCQ ? (
                    <div className="flex flex-col gap-3">
                      {question.options.map((option, optionIndex) => {
                        const checkboxId = `${question.id}-${optionIndex}`;
                        const checked = Boolean(
                          answer?.selectedOptionIndexes?.includes(optionIndex),
                        );

                        return (
                          <Label
                            key={checkboxId}
                            htmlFor={checkboxId}
                            className={cn(
                              "rounded-2xl border p-3",
                              checked && "border-primary bg-primary/10",
                              isFormDisabled && "opacity-80",
                            )}
                          >
                            <Checkbox
                              id={checkboxId}
                              checked={checked}
                              disabled={isFormDisabled}
                              onCheckedChange={() =>
                                toggleOption(question.id, optionIndex)
                              }
                            />
                            <span>{option}</span>
                          </Label>
                        );
                      })}
                    </div>
                  ) : (
                    <Textarea
                      value={answer?.text ?? ""}
                      disabled={isFormDisabled}
                      placeholder="Nhập câu trả lời tự luận của bạn"
                      className="min-h-32"
                      onChange={(event) =>
                        updateEssay(question.id, event.target.value)
                      }
                    />
                  )}
                  {error ? (
                    <p className="text-sm text-destructive">{error}</p>
                  ) : null}
                  {renderQuestionResult(question.id)}
                </CardContent>
              </Card>
            );
          })}

          {!result ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {submitErrorMessage ? (
                <Alert variant="destructive" className="sm:max-w-xl">
                  <AlertCircle aria-hidden="true" />
                  <AlertTitle>Không thể nộp bài</AlertTitle>
                  <AlertDescription>{submitErrorMessage}</AlertDescription>
                </Alert>
              ) : null}
              <Button
                type="button"
                className="self-start sm:ml-auto"
                disabled={submitMutation.isPending}
                onClick={requestSubmit}
              >
                {submitMutation.isPending ? "Đang nộp..." : "Nộp bài"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {attemptsQuery.isLoading ? (
        <Skeleton className="h-28 rounded-3xl" />
      ) : attemptsQuery.data ? (
        <AttemptHistory attempts={attemptsQuery.data} />
      ) : null}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận nộp bài</DialogTitle>
            <DialogDescription>
              Sau khi nộp, bạn không thể chỉnh sửa câu trả lời của lượt làm bài
              này.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Hủy</DialogClose>
            <Button
              type="button"
              onClick={confirmSubmit}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? "Đang nộp..." : "Nộp bài"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
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
