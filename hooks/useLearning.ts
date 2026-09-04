import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from "@/constants/constants";
import {
  enrollmentKeys,
  learnerDashboardKeys,
  learningKeys,
} from "@/lib/query-keys";
import {
  getLearningCourse,
  getLearningLesson,
  sendLessonWatchEvent,
  type CreateWatchEventPayload,
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
