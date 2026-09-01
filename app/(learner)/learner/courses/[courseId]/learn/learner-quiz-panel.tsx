"use client";

import { useEffect, useRef, useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import {
  QUIZ_MAX_ATTEMPTS,
  submitQuizAttemptKeepalive,
  type LearnerQuiz,
  type LearnerQuizQuestion,
  type QuizAttemptQuestionStatus,
  type QuizAttemptResult,
  type SubmitQuizAnswerPayload,
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

function getBestAttemptId(attempts: QuizAttemptResult[]): string | null {
  if (attempts.length === 0) return null;

  return attempts.reduce((best, attempt) => {
    if (attempt.totalScore > best.totalScore) return attempt;
    if (attempt.totalScore < best.totalScore) return best;

    const attemptSubmittedAt = attempt.submittedAt
      ? new Date(attempt.submittedAt).getTime()
      : 0;
    const bestSubmittedAt = best.submittedAt
      ? new Date(best.submittedAt).getTime()
      : 0;

    return attemptSubmittedAt > bestSubmittedAt ? attempt : best;
  }, attempts[0]).attemptId;
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

function getStartAttemptErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (isAxiosError(error) && error.response?.status === 409) {
    return "Bạn đã dùng hết 3 lượt làm bài.";
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
      <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
        <p>Đúng: {result.correctCount}</p>
        <p>Sai/chưa đủ: {result.wrongCount}</p>
        <p>Chờ chấm: {result.pendingEssayCount}</p>
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

  const bestAttemptId = getBestAttemptId(attempts);

  return (
    <section className="rounded-3xl border p-4">
      <h3 className="font-semibold">Lịch sử làm bài</h3>
      <div className="mt-3 flex flex-col gap-2">
        {attempts.map((attempt) => (
          <div
            key={attempt.attemptId}
            className="grid grid-cols-2 items-center gap-2 rounded-2xl bg-muted/50 p-3 text-sm sm:grid-cols-4"
          >
            <span className="min-w-0 truncate">
              {formatDateTime(attempt.submittedAt)}
            </span>
            <span className="min-w-0 truncate">
              {formatScore(attempt.totalScore)} /{" "}
              {formatScore(attempt.totalPoints)}
            </span>
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {attempt.isLate ? (
                <span className="text-amber-600">
                  Muộn {formatDuration(attempt.lateSeconds)}
                </span>
              ) : attempt.pendingEssayCount > 0 ? (
                `${attempt.pendingEssayCount} câu chờ chấm`
              ) : (
                "Đúng hạn"
              )}
            </span>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={attempt.passed ? "secondary" : "destructive"}
                className={cn(
                  "justify-self-start",
                  attempt.passed &&
                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
                )}
              >
                {getAttemptStatusLabel(attempt)}
              </Badge>
              {attempt.attemptId === bestAttemptId ? (
                <Badge variant="outline">Kết quả tốt nhất</Badge>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LearnerQuizQuestionOptions({
  question,
  answer,
  disabled,
  onToggleOption,
  onSelectSingleOption,
  onUpdateEssay,
}: {
  question: LearnerQuizQuestion;
  answer: SubmitQuizAnswerPayload | undefined;
  disabled: boolean;
  onToggleOption: (questionId: string, optionIndex: number) => void;
  onSelectSingleOption: (questionId: string, optionIndex: number) => void;
  onUpdateEssay: (questionId: string, text: string) => void;
}) {
  if (question.type === QuizQuestionType.ESSAY) {
    return (
      <Textarea
        value={answer?.text ?? ""}
        disabled={disabled}
        placeholder="Nhập câu trả lời tự luận của bạn"
        className="min-h-32"
        onChange={(event) => onUpdateEssay(question.id, event.target.value)}
      />
    );
  }

  if (!question.isMultipleChoice) {
    const selectedOption = answer?.selectedOptionIndexes?.[0];

    return (
      <RadioGroup
        value={selectedOption === undefined ? "" : String(selectedOption)}
        className="flex flex-col gap-3"
        onValueChange={(value) =>
          onSelectSingleOption(question.id, Number(value))
        }
      >
        {question.options.map((option, optionIndex) => {
          const optionId = `${question.id}-${optionIndex}`;
          const checked = selectedOption === optionIndex;

          return (
            <Label
              key={optionId}
              htmlFor={optionId}
              className={cn(
                "rounded-2xl border p-3",
                checked && "border-primary bg-primary/10",
                disabled && "opacity-80",
              )}
            >
              <RadioGroupItem
                id={optionId}
                value={String(optionIndex)}
                disabled={disabled}
              />
              <span>{option}</span>
            </Label>
          );
        })}
      </RadioGroup>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {question.options.map((option, optionIndex) => {
        const optionId = `${question.id}-${optionIndex}`;
        const selectedOptionIndexes = answer?.selectedOptionIndexes ?? [];
        const maxSelectableOptions = question.maxSelectableOptions ?? 1;
        const checked = Boolean(selectedOptionIndexes.includes(optionIndex));
        const optionDisabled =
          disabled ||
          (!checked && selectedOptionIndexes.length >= maxSelectableOptions);

        return (
          <Label
            key={optionId}
            htmlFor={optionId}
            className={cn(
              "rounded-2xl border p-3",
              checked && "border-primary bg-primary/10",
              optionDisabled && "opacity-80",
            )}
          >
            <Checkbox
              id={optionId}
              checked={checked}
              disabled={optionDisabled}
              onCheckedChange={() => onToggleOption(question.id, optionIndex)}
            />
            <span>{option}</span>
          </Label>
        );
      })}
    </div>
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
  const submittedAttemptCount = attemptsQuery.data?.length ?? 0;
  const hasAttemptsRemaining = submittedAttemptCount < QUIZ_MAX_ATTEMPTS;
  const canStartAttempt = hasAttemptsRemaining && !attemptsQuery.isLoading;
  const startErrorMessage = getStartAttemptErrorMessage(startMutation.error);
  const activeAttemptRef = useRef(activeAttempt);
  const answersRef = useRef(answers);
  const resultRef = useRef(result);
  const autoSubmitStartedRef = useRef(false);

  useEffect(() => {
    activeAttemptRef.current = activeAttempt;
  }, [activeAttempt]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  useEffect(() => {
    function autoSubmitActiveAttempt() {
      const attempt = activeAttemptRef.current;
      if (!attempt || resultRef.current || autoSubmitStartedRef.current) return;

      autoSubmitStartedRef.current = true;
      submitQuizAttemptKeepalive(
        courseId,
        lessonId,
        quiz.id,
        attempt.attemptId,
        {
          answers: Object.values(answersRef.current),
        },
      );
    }

    function handlePageHide() {
      autoSubmitActiveAttempt();
    }

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      autoSubmitActiveAttempt();
    };
  }, [courseId, lessonId, quiz.id]);

  async function startAttempt() {
    setResult(null);
    setErrors({});
    setAnswers(buildInitialAnswers(quiz));
    const started = await startMutation.mutateAsync(quiz.id);
    autoSubmitStartedRef.current = false;
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

  function selectSingleOption(questionId: string, optionIndex: number) {
    setAnswers((current) => ({
      ...current,
      [questionId]: {
        questionId,
        selectedOptionIndexes: [optionIndex],
      },
    }));
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
    activeAttemptRef.current = null;
    autoSubmitStartedRef.current = true;
    setActiveAttempt(null);
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
              {attemptsQuery.isLoading
                ? "Đang tải lượt làm bài"
                : `Lượt làm bài: ${submittedAttemptCount}/${QUIZ_MAX_ATTEMPTS}`}
            </p>
          </div>
          {!activeAttempt && !result && hasAttemptsRemaining ? (
            <Button
              type="button"
              className="w-fit"
              onClick={startAttempt}
              disabled={startMutation.isPending || !canStartAttempt}
            >
              {startMutation.isPending ? "Đang bắt đầu..." : "Bắt đầu làm bài"}
            </Button>
          ) : null}
          {startMutation.isError ? (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertTitle>Không thể bắt đầu bài kiểm tra</AlertTitle>
              <AlertDescription>{startErrorMessage}</AlertDescription>
            </Alert>
          ) : null}
          {!attemptsQuery.isLoading && !hasAttemptsRemaining ? (
            <Alert>
              <AlertCircle aria-hidden="true" />
              <AlertTitle>Đã hết lượt làm bài</AlertTitle>
              <AlertDescription>
                Bạn đã dùng hết {QUIZ_MAX_ATTEMPTS} lượt làm bài.
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {activeAttempt && !result && remainingSeconds ? (
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl border p-3 text-sm",
            isOverdue
              ? "border-amber-500/50 text-amber-700"
              : "text-muted-foreground",
          )}
        >
          <Clock3 aria-hidden="true" className="size-4" />
          {isOverdue ? (
            <span>
              Đã quá thời gian {formatDuration(Math.abs(remainingSeconds))}.
            </span>
          ) : (
            <span>Còn lại {formatDuration(remainingSeconds)}.</span>
          )}
        </div>
      ) : null}

      {result ? <QuizResultSummary result={result} /> : null}

      {result && !result.passed && hasAttemptsRemaining ? (
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
              onClick={startAttempt}
              disabled={startMutation.isPending || attemptsQuery.isLoading}
            >
              {startMutation.isPending ? "Đang bắt đầu..." : "Làm lại bài tập"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

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
                  <LearnerQuizQuestionOptions
                    question={question}
                    answer={answer}
                    disabled={isFormDisabled}
                    onToggleOption={toggleOption}
                    onSelectSingleOption={selectSingleOption}
                    onUpdateEssay={updateEssay}
                  />
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
