import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  enrollmentKeys,
  learnerQuizKeys,
  learningKeys,
} from "@/lib/query-keys";
import {
  getLearnerQuiz,
  listQuizAttempts,
  startQuizAttempt,
  submitQuizAttempt,
  type SubmitQuizAttemptPayload,
} from "@/services/api/learner-quizzes";

export function useLearnerQuiz(courseId: string, lessonId: string | null) {
  return useQuery({
    queryKey: learnerQuizKeys.detail(courseId, lessonId ?? ""),
    queryFn: () => getLearnerQuiz(courseId, lessonId ?? ""),
    enabled: courseId.trim().length > 0 && !!lessonId?.trim(),
  });
}

export function useLearnerQuizAttempts(
  courseId: string,
  lessonId: string | null,
  quizId: string | null,
) {
  return useQuery({
    queryKey: learnerQuizKeys.attempts(courseId, lessonId ?? "", quizId ?? ""),
    queryFn: () => listQuizAttempts(courseId, lessonId ?? "", quizId ?? ""),
    enabled:
      courseId.trim().length > 0 && !!lessonId?.trim() && !!quizId?.trim(),
  });
}

export function useStartQuizAttempt(courseId: string, lessonId: string | null) {
  return useMutation({
    mutationFn: (quizId: string) => {
      if (!lessonId?.trim()) {
        throw new Error("Missing lesson id for quiz attempt");
      }

      return startQuizAttempt(courseId, lessonId, quizId);
    },
  });
}

export function useSubmitQuizAttempt(
  courseId: string,
  lessonId: string | null,
  quizId: string | null,
  attemptId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitQuizAttemptPayload) => {
      if (!lessonId?.trim() || !quizId?.trim() || !attemptId?.trim()) {
        throw new Error("Missing quiz attempt context");
      }

      return submitQuizAttempt(courseId, lessonId, quizId, attemptId, payload);
    },
    onSuccess: async () => {
      if (!lessonId?.trim() || !quizId?.trim()) return;

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: learningKeys.course(courseId),
        }),
        queryClient.invalidateQueries({
          queryKey: learningKeys.lesson(courseId, lessonId),
        }),
        queryClient.invalidateQueries({ queryKey: enrollmentKeys.mine() }),
        queryClient.invalidateQueries({
          queryKey: learnerQuizKeys.detail(courseId, lessonId),
        }),
        queryClient.invalidateQueries({
          queryKey: learnerQuizKeys.attempts(courseId, lessonId, quizId),
        }),
      ]);
    },
  });
}
