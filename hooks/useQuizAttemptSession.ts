"use client";

import { useEffect, useRef, useState } from "react";
import {
  useLearnerQuizAttempts,
  useStartQuizAttempt,
  useSubmitQuizAttempt,
} from "@/hooks/useLearnerQuizzes";
import {
  QUIZ_MAX_ATTEMPTS,
  submitQuizAttemptKeepalive,
  type LearnerQuiz,
  type QuizAttemptResult,
  type SubmitQuizAnswerPayload,
} from "@/services/api/learner-quizzes";
import { QuizQuestionType } from "@/services/api/quizzes";

export type QuizAnswers = Record<string, SubmitQuizAnswerPayload>;

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

export function useRemainingSeconds(
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

export function useQuizAttemptSession({
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
  const activeAttemptRef = useRef(activeAttempt);
  const answersRef = useRef(answers);
  const resultRef = useRef(result);
  const autoSubmitStartedRef = useRef(false);
  const submittedAttemptCount = attemptsQuery.data?.length ?? 0;

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

    window.addEventListener("pagehide", autoSubmitActiveAttempt);

    return () => {
      window.removeEventListener("pagehide", autoSubmitActiveAttempt);
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

  return {
    activeAttempt,
    answers,
    attemptsQuery,
    canStartAttempt:
      submittedAttemptCount < QUIZ_MAX_ATTEMPTS && !attemptsQuery.isLoading,
    confirmOpen,
    errors,
    hasAttemptsRemaining: submittedAttemptCount < QUIZ_MAX_ATTEMPTS,
    isFormDisabled:
      !activeAttempt || Boolean(result) || submitMutation.isPending,
    isOverdue: remainingSeconds !== null && remainingSeconds <= 0,
    remainingSeconds,
    result,
    startMutation,
    submitMutation,
    submittedAttemptCount,
    confirmSubmit,
    requestSubmit,
    selectSingleOption,
    setConfirmOpen,
    startAttempt,
    toggleOption,
    updateEssay,
  };
}
