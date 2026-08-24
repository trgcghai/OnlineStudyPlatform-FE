import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { isApiErrorResponse } from "@/services/axios";
import {
  createCourse,
  deleteCourse,
  getCourse,
  listMyCourses,
  requestPublishCourse,
  updateCourse,
  uploadCourseThumbnail,
  type Course,
  type CourseListFilters,
} from "@/services/api/courses";
import type { CourseFormValues } from "@/lib/schemas/course";

export const instructorCourseKeys = {
  all: ["instructor-courses"] as const,
  list: (filters: CourseListFilters) =>
    [...instructorCourseKeys.all, "list", filters] as const,
  detail: (courseId: string) =>
    [...instructorCourseKeys.all, "detail", courseId] as const,
};

const NETWORK_ERROR_MESSAGE =
  "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
const GENERIC_ERROR_MESSAGE = "Đã xảy ra lỗi. Vui lòng thử lại sau.";

export interface CourseMutationResult<T = Course> {
  ok: boolean;
  data?: T;
  message?: string;
  thumbnailFailed?: boolean;
}

export function mapCourseError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return GENERIC_ERROR_MESSAGE;
  }

  if (status === 403) return "Bạn không có quyền quản lý khóa học này.";
  if (status === 404) return "Khóa học không tồn tại hoặc đã bị xóa.";
  if (status === 409) return "Không thể xóa khóa học đã có học viên đăng ký.";
  if (status === 400) {
    return data.error.message || "Thông tin khóa học không hợp lệ.";
  }

  return data.error.message || GENERIC_ERROR_MESSAGE;
}

export function mapRequestPublishCourseError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return GENERIC_ERROR_MESSAGE;
  }

  if (status === 400) {
    return data.error.message || "Chỉ khóa học bản nháp mới có thể gửi duyệt.";
  }
  if (status === 403) return "Bạn không có quyền quản lý khóa học này.";
  if (status === 404) return "Khóa học không tồn tại hoặc đã bị xóa.";

  return data.error.message || GENERIC_ERROR_MESSAGE;
}

function useInvalidateCourses() {
  const queryClient = useQueryClient();

  return async (courseId?: string) => {
    await queryClient.invalidateQueries({ queryKey: instructorCourseKeys.all });
    if (courseId) {
      await queryClient.invalidateQueries({
        queryKey: instructorCourseKeys.detail(courseId),
      });
    }
  };
}

export function useInstructorCoursesList(filters: CourseListFilters) {
  return useQuery({
    queryKey: instructorCourseKeys.list(filters),
    queryFn: () => listMyCourses(filters),
  });
}

export function useInstructorCourse(courseId: string) {
  return useQuery({
    queryKey: instructorCourseKeys.detail(courseId),
    queryFn: () => getCourse(courseId),
    enabled: courseId.trim().length > 0,
  });
}

export function useCreateInstructorCourse() {
  const invalidate = useInvalidateCourses();
  const mutation = useMutation<
    CourseMutationResult,
    unknown,
    { values: CourseFormValues; thumbnail?: File | null }
  >({
    mutationFn: async ({ values, thumbnail }) => {
      const course = await createCourse(values);

      if (!thumbnail) {
        return { ok: true, data: course };
      }

      try {
        const courseWithThumbnail = await uploadCourseThumbnail(course.id, thumbnail);
        return { ok: true, data: courseWithThumbnail };
      } catch {
        return { ok: true, data: course, thumbnailFailed: true };
      }
    },
    onSuccess: async (result) => {
      await invalidate();
      toast.add({
        title: result.thumbnailFailed
          ? "Đã tạo khóa học nhưng chưa tải được ảnh."
          : "Đã tạo khóa học.",
        type: result.thumbnailFailed ? "warning" : "success",
      });
    },
  });

  async function createInstructorCourse(
    values: CourseFormValues,
    thumbnail?: File | null,
  ): Promise<CourseMutationResult> {
    try {
      return await mutation.mutateAsync({ values, thumbnail });
    } catch (error) {
      return { ok: false, message: mapCourseError(error) };
    }
  }

  return { createInstructorCourse, isPending: mutation.isPending };
}

export function useUpdateInstructorCourse() {
  const invalidate = useInvalidateCourses();
  const mutation = useMutation<
    Course,
    unknown,
    { courseId: string; values: CourseFormValues; thumbnail?: File | null }
  >({
    mutationFn: async ({ courseId, values, thumbnail }) => {
      const course = await updateCourse(courseId, values);

      if (thumbnail) {
        return uploadCourseThumbnail(course.id, thumbnail);
      }

      return course;
    },
    onSuccess: async (course) => {
      await invalidate(course.id);
      toast.add({ title: "Đã cập nhật khóa học.", type: "success" });
    },
  });

  async function updateInstructorCourse(
    courseId: string,
    values: CourseFormValues,
    thumbnail?: File | null,
  ): Promise<CourseMutationResult> {
    try {
      const course = await mutation.mutateAsync({ courseId, values, thumbnail });
      return { ok: true, data: course };
    } catch (error) {
      return { ok: false, message: mapCourseError(error) };
    }
  }

  return { updateInstructorCourse, isPending: mutation.isPending };
}

export function useRequestPublishCourse() {
  const invalidate = useInvalidateCourses();
  const mutation = useMutation<Course, unknown, string>({
    mutationFn: (courseId) => requestPublishCourse(courseId),
    onSuccess: async (course) => {
      await invalidate(course.id);
      toast.add({
        title: "Đã gửi yêu cầu xuất bản khóa học.",
        type: "success",
      });
    },
  });

  async function requestPublishInstructorCourse(
    courseId: string,
  ): Promise<CourseMutationResult> {
    try {
      const course = await mutation.mutateAsync(courseId);
      return { ok: true, data: course };
    } catch (error) {
      return { ok: false, message: mapRequestPublishCourseError(error) };
    }
  }

  return {
    requestPublishInstructorCourse,
    isPending: mutation.isPending,
    pendingCourseId: mutation.variables,
  };
}

export function useDeleteInstructorCourse() {
  const invalidate = useInvalidateCourses();
  const mutation = useMutation<void, unknown, string>({
    mutationFn: (courseId) => deleteCourse(courseId),
    onSuccess: async () => {
      await invalidate();
      toast.add({ title: "Đã xóa khóa học.", type: "success" });
    },
  });

  async function deleteInstructorCourse(
    courseId: string,
  ): Promise<CourseMutationResult<void>> {
    try {
      await mutation.mutateAsync(courseId);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: mapCourseError(error) };
    }
  }

  return { deleteInstructorCourse, isPending: mutation.isPending };
}
