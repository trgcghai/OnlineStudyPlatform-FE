import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from "@/constants/constants";
import {
  certificateKeys,
  enrollmentKeys,
  learnerDashboardKeys,
  learningKeys,
  recommendationKeys,
} from "@/lib/query-keys";
import {
  completeLearningLesson,
  getCourseChatSession,
  getLearningCourse,
  getLearningLesson,
  getLearningLessonSummary,
  sendCourseChatMessage,
  sendLessonWatchEvent,
  type CreateWatchEventPayload,
  type LearningCourse,
  type LearningLesson,
} from "@/services/api/learning";
import { isApiErrorResponse } from "@/services/axios";

export function getLearningErrorStatus(error: unknown): number | null {
  return isAxiosError(error) ? (error.response?.status ?? null) : null;
}

export function mapLearningError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return GENERIC_ERROR_MESSAGE;
  }

  if (status === 403) {
    return data.error.message || "Bạn chưa có quyền học khóa học này.";
  }

  if (status === 404) {
    return "Không tìm thấy nội dung học tập.";
  }

  return data.error.message || GENERIC_ERROR_MESSAGE;
}

export function useLearningCourse(courseId: string) {
  return useQuery({
    queryKey: learningKeys.course(courseId),
    queryFn: () => getLearningCourse(courseId),
    enabled: courseId.trim().length > 0,
  });
}

export function useLearningLesson(courseId: string, lessonId: string | null) {
  return useQuery({
    queryKey: learningKeys.lesson(courseId, lessonId ?? ""),
    queryFn: () => getLearningLesson(courseId, lessonId ?? ""),
    enabled: courseId.trim().length > 0 && !!lessonId?.trim(),
  });
}

export function useLearningLessonSummary(
  courseId: string,
  lessonId: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: learningKeys.lessonSummary(courseId, lessonId),
    queryFn: () => getLearningLessonSummary(courseId, lessonId),
    enabled:
      enabled && courseId.trim().length > 0 && lessonId.trim().length > 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "processing" ? 5_000 : false;
    },
    refetchIntervalInBackground: false,
  });
}

export function useSendLessonWatchEvent(
  courseId: string,
  lessonId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWatchEventPayload) => {
      if (!lessonId?.trim()) {
        throw new Error("Missing lesson id for watch event");
      }

      return sendLessonWatchEvent(courseId, lessonId, payload);
    },
    onSuccess: async () => {
      if (!lessonId?.trim()) return;

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: learningKeys.course(courseId),
        }),
        queryClient.invalidateQueries({
          queryKey: learningKeys.lesson(courseId, lessonId),
        }),
        queryClient.invalidateQueries({ queryKey: enrollmentKeys.mine() }),
        queryClient.invalidateQueries({
          queryKey: learnerDashboardKeys.detail(),
        }),
        queryClient.invalidateQueries({ queryKey: recommendationKeys.all }),
      ]);
    },
    onError: async (error) => {
      if (getLearningErrorStatus(error) !== 403 || !lessonId?.trim()) return;

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: learningKeys.course(courseId),
        }),
        queryClient.invalidateQueries({
          queryKey: learningKeys.lesson(courseId, lessonId),
        }),
      ]);
    },
  });
}

export function useCompleteLearningLesson(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId: string) =>
      completeLearningLesson(courseId, lessonId),
    onSuccess: async (data, lessonId) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: learningKeys.course(courseId) }),
        queryClient.cancelQueries({
          queryKey: learningKeys.lesson(courseId, lessonId),
        }),
      ]);

      queryClient.setQueryData<LearningCourse>(
        learningKeys.course(courseId),
        (current) =>
          current
            ? {
                ...current,
                enrollment: data.enrollment,
                lessons: current.lessons.map((lesson) =>
                  lesson.id === lessonId
                    ? {
                        ...lesson,
                        isCompleted: data.lessonProgress.isLessonComplete,
                      }
                    : lesson,
                ),
              }
            : current,
      );
      queryClient.setQueryData<LearningLesson>(
        learningKeys.lesson(courseId, lessonId),
        (current) =>
          current
            ? { ...current, isCompleted: data.lessonProgress.isLessonComplete }
            : current,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: learningKeys.course(courseId),
        }),
        queryClient.invalidateQueries({
          queryKey: learningKeys.lesson(courseId, lessonId),
        }),
        queryClient.invalidateQueries({ queryKey: enrollmentKeys.mine() }),
        queryClient.invalidateQueries({
          queryKey: learnerDashboardKeys.detail(),
        }),
        queryClient.invalidateQueries({ queryKey: recommendationKeys.all }),
        queryClient.invalidateQueries({ queryKey: certificateKeys.all }),
      ]);
    },
  });
}

export function useCourseChatSession(courseId: string) {
  return useQuery({
    queryKey: learningKeys.chat(courseId),
    queryFn: () => getCourseChatSession(courseId),
    enabled: courseId.trim().length > 0,
  });
}

export function useSendCourseChatMessage(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (question: string) => sendCourseChatMessage(courseId, question),
    onSuccess: async (data) => {
      queryClient.setQueryData(learningKeys.chat(courseId), data);
      await queryClient.invalidateQueries({
        queryKey: learningKeys.chat(courseId),
      });
    },
  });
}
