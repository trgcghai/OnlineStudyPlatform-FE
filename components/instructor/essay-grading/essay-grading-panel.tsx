"use client";

import { useMemo, useState } from "react";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGradeEssayAnswer } from "@/hooks/useEssayGrading";
import type { EssayGradingSubmission } from "@/services/api/essay-grading";
import { formatScore, getQuestionStatusLabel } from "@/utils/quizUtil";

interface EssayGradingPanelProps {
  submission: EssayGradingSubmission | null;
}

export function EssayGradingPanel({ submission }: EssayGradingPanelProps) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );

  const selectedEssay = submission?.essays.length
    ? (submission.essays.find(
        (essay) => essay.questionId === selectedQuestionId,
      ) ??
      submission.essays.find((essay) => essay.status === "pending_grading") ??
      submission.essays[0])
    : null;

  if (!submission || !selectedEssay) {
    return (
      <Card className="h-full border-dashed">
        <CardContent className="flex min-h-64 items-center justify-center text-center text-sm text-muted-foreground">
          Chọn một lượt nộp để xem câu trả lời và nhập điểm.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {getQuestionStatusLabel(selectedEssay.status)}
          </Badge>
          <Badge variant="secondary">
            {formatScore(selectedEssay.score)} /{" "}
            {formatScore(selectedEssay.maxScore)} điểm
          </Badge>
        </div>
        <CardTitle className="text-lg">{selectedEssay.content}</CardTitle>
        <CardDescription>
          {submission.learner.name || submission.learner.email || "Học viên"} -{" "}
          {submission.courseTitle} / {submission.lessonTitle} /{" "}
          {submission.quizTitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {submission.essays.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {submission.essays.map((essay, index) => (
              <Button
                key={essay.questionId}
                type="button"
                size="sm"
                variant={
                  essay.questionId === selectedEssay.questionId
                    ? "default"
                    : "outline"
                }
                onClick={() => setSelectedQuestionId(essay.questionId)}
              >
                Câu tự luận {index + 1}
              </Button>
            ))}
          </div>
        )}

        <section className="rounded-2xl bg-muted/60 p-4">
          <h3 className="text-sm font-medium">Bài làm của học viên</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
            {selectedEssay.text || "Học viên chưa nhập câu trả lời."}
          </p>
        </section>
        <EssayGradingForm
          key={`${submission.attemptId}-${selectedEssay.questionId}-${selectedEssay.score}-${selectedEssay.feedback ?? ""}`}
          courseId={submission.courseId}
          lessonId={submission.lessonId}
          quizId={submission.quizId}
          attemptId={submission.attemptId}
          questionId={selectedEssay.questionId}
          initialPoints={selectedEssay.score}
          initialFeedback={selectedEssay.feedback ?? ""}
          maxScore={selectedEssay.maxScore}
        />
      </CardContent>
    </Card>
  );
}

function EssayGradingForm({
  courseId,
  lessonId,
  quizId,
  attemptId,
  questionId,
  initialPoints,
  initialFeedback,
  maxScore,
}: {
  courseId: string;
  lessonId: string;
  quizId: string;
  attemptId: string;
  questionId: string;
  initialPoints: number;
  initialFeedback: string;
  maxScore: number;
}) {
  const [points, setPoints] = useState(() => String(initialPoints));
  const [feedback, setFeedback] = useState(() => initialFeedback);
  const [error, setError] = useState<string | null>(null);
  const { gradeEssay, isPending } = useGradeEssayAnswer();

  const validationError = useMemo(() => {
    if (points.trim().length === 0) return "Vui lòng nhập điểm.";

    const numericPoints = Number(points);
    if (!Number.isFinite(numericPoints)) return "Điểm phải là số.";
    if (numericPoints < 0) return "Điểm không được nhỏ hơn 0.";
    if (numericPoints > maxScore) {
      return `Điểm không được vượt quá ${formatScore(maxScore)}.`;
    }
    if (feedback.length > 2000) {
      return "Phản hồi không được vượt quá 2000 ký tự.";
    }

    return null;
  }, [feedback.length, maxScore, points]);

  async function handleSave() {
    if (validationError) {
      setError(validationError);
      return;
    }

    const result = await gradeEssay({
      courseId,
      lessonId,
      quizId,
      attemptId,
      questionId,
      payload: {
        points: Number(points),
        feedback: feedback.trim(),
      },
    });

    setError(
      result.ok ? null : (result.message ?? "Không thể lưu điểm tự luận."),
    );
  }

  return (
    <>
      <Field>
        <FieldLabel required>Điểm</FieldLabel>
        <Input
          type="number"
          min={0}
          max={maxScore}
          step="0.25"
          value={points}
          onChange={(event) => setPoints(event.target.value)}
        />
        {error && validationError && <FieldError>{error}</FieldError>}
      </Field>

      <Field>
        <FieldLabel>Phản hồi</FieldLabel>
        <Textarea
          value={feedback}
          rows={6}
          maxLength={2000}
          onChange={(event) => setFeedback(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {feedback.length}/2000 ký tự
        </p>
      </Field>

      {error && !validationError && (
        <Alert variant="destructive">
          <AlertTitle>Không thể lưu điểm</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="button"
        className="self-start"
        disabled={isPending}
        onClick={handleSave}
      >
        {isPending ? "Đang lưu..." : "Lưu điểm"}
      </Button>
    </>
  );
}
