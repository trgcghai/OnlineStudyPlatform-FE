import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { isApiErrorResponse } from "@/services/axios";
import {
  createLesson,
  deleteLesson,
  getLesson,
  listLessons,
  reorderLessons,
  updateLesson,
  type Lesson,
} from "@/services/api/lessons";
import type { LessonFormValues } from "@/lib/schemas/lesson";
import { GENERIC_ERROR_MESSAGE, NETWORK_ERROR_MESSAGE } from "@/constants/constants";
import { instructorLessonKeys } from "@/lib/query-keys";

export interface LessonMutationResult {
  ok: boolean;
  data?: Lesson;
  message?: string;
}

export function mapLessonError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return GENERIC_ERROR_MESSAGE;
  }

  if (status === 403) return "Bạn không có quyền quản lý bài học này.";
  if (status === 404) return "Bài học không tồn tại hoặc đã bị xóa.";
  if (status === 400) {
    return data.error.message || "Thông tin bài học không hợp lệ.";
  }

  return data.error.message || GENERIC_ERROR_MESSAGE;
}

function useInvalidateLessons() {
  const queryClient = useQueryClient();

  return async (courseId: string) => {
    await queryClient.invalidateQueries({
      queryKey: instructorLessonKeys.list(courseId),
    });
  };
}

export function useInstructorLessonsList(courseId: string) {
  return useQuery({
    queryKey: instructorLessonKeys.list(courseId),
    queryFn: () => listLessons(courseId),
    enabled: courseId.trim().length > 0,
  });
}

export function useInstructorLesson(lessonId: string) {
  return useQuery({
    queryKey: instructorLessonKeys.detail(lessonId),
    queryFn: () => getLesson(lessonId),
    enabled: lessonId.trim().length > 0,
  });
}

export function useCreateInstructorLesson() {
  const invalidate = useInvalidateLessons();
  const mutation = useMutation<
    Lesson,
    unknown,
    {
      courseId: string;
      values: LessonFormValues;
      video?: File | null;
      material?: File | null;
      duration?: number;
    }
  >({
    mutationFn: ({ courseId, values, video, material, duration }) =>
      createLesson(courseId, { ...values, duration }, video, material),
    onSuccess: async (lesson) => {
      await invalidate(lesson.courseId);
      toast.add({ title: "Đã tạo bài học thành công.", type: "success" });
    },
  });

  async function createInstructorLesson(
    courseId: string,
    values: LessonFormValues,
    video?: File | null,
    material?: File | null,
    duration?: number,
  ): Promise<LessonMutationResult> {
    try {
      const lesson = await mutation.mutateAsync({
        courseId,
        values,
        video,
        material,
        duration,
      });
      return { ok: true, data: lesson };
    } catch (error) {
      return { ok: false, message: mapLessonError(error) };
    }
  }

  return {
    createInstructorLesson,
    isPending: mutation.isPending,
  };
}

export function useUpdateInstructorLesson() {
  const invalidate = useInvalidateLessons();
  const mutation = useMutation<
    Lesson,
    unknown,
    {
      lessonId: string;
      courseId: string;
      values: LessonFormValues;
      video?: File | null;
      material?: File | null;
      duration?: number;
    }
  >({
    mutationFn: ({ lessonId, values, video, material, duration }) =>
      updateLesson(lessonId, { ...values, duration }, video, material),
    onSuccess: async (lesson) => {
      await invalidate(lesson.courseId);
      toast.add({ title: "Đã cập nhật bài học.", type: "success" });
    },
  });

  async function updateInstructorLesson(
    lessonId: string,
    courseId: string,
    values: LessonFormValues,
    video?: File | null,
    material?: File | null,
    duration?: number,
  ): Promise<LessonMutationResult> {
    try {
      const lesson = await mutation.mutateAsync({
        lessonId,
        courseId,
        values,
        video,
        material,
        duration,
      });
      return { ok: true, data: lesson };
    } catch (error) {
      return { ok: false, message: mapLessonError(error) };
    }
  }

  return {
    updateInstructorLesson,
    isPending: mutation.isPending,
  };
}

export function useDeleteInstructorLesson() {
  const queryClient = useQueryClient();
  const mutation = useMutation<
    void,
    unknown,
    { lessonId: string; courseId: string }
  >({
    mutationFn: async ({ lessonId }) => {
      await deleteLesson(lessonId);
    },
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: instructorLessonKeys.list(variables.courseId),
      });
      toast.add({ title: "Đã xóa bài học.", type: "success" });
    },
  });

  async function deleteInstructorLesson(
    lessonId: string,
    courseId: string,
  ): Promise<LessonMutationResult> {
    try {
      await mutation.mutateAsync({ lessonId, courseId });
      return { ok: true };
    } catch (error) {
      return { ok: false, message: mapLessonError(error) };
    }
  }

  return {
    deleteInstructorLesson,
    isPending: mutation.isPending,
  };
}

export function useReorderInstructorLessons() {
  const invalidate = useInvalidateLessons();
  const mutation = useMutation<
    Lesson[],
    unknown,
    { courseId: string; orderedIds: string[] }
  >({
    mutationFn: ({ courseId, orderedIds }) => reorderLessons(courseId, orderedIds),
    onSuccess: async (_result, variables) => {
      await invalidate(variables.courseId);
    },
  });

  async function reorderInstructorLessons(
    courseId: string,
    orderedIds: string[],
  ): Promise<LessonMutationResult> {
    try {
      await mutation.mutateAsync({ courseId, orderedIds });
      return { ok: true };
    } catch (error) {
      return { ok: false, message: mapLessonError(error) };
    }
  }

  return {
    reorderInstructorLessons,
    isPending: mutation.isPending,
  };
}
