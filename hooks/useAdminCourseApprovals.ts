import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "@/components/ui/toast";
import {
  COURSE_STATUSES,
  listAdminCourseLessons,
  listCourseApprovals,
  reviewCourseStatus,
  type AdminCourseContentListResult,
  type Course,
  type CourseListFilters,
} from "@/services/api/courses";
import { isApiErrorResponse } from "@/services/axios";
import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from "@/constants/constants";
import {
  adminCourseApprovalKeys,
  adminCourseContentKeys,
} from "@/lib/query-keys";

export interface CourseApprovalMutationResult<T = Course> {
  ok: boolean;
  data?: T;
  message?: string;
}

export function mapCourseApprovalError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return GENERIC_ERROR_MESSAGE;
  }

  if (status === 400) {
    return data.error.message || "Không thể cập nhật trạng thái khóa học.";
  }
  if (status === 403) return "Bạn không có quyền duyệt khóa học.";
  if (status === 404) return "Khóa học không tồn tại hoặc đã được xử lý.";

  return data.error.message || GENERIC_ERROR_MESSAGE;
}

export function useCourseApprovalsList(filters: CourseListFilters) {
  return useQuery({
    queryKey: adminCourseApprovalKeys.list(filters),
    queryFn: () => listCourseApprovals(filters),
  });
}

export function mapAdminCourseContentError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return GENERIC_ERROR_MESSAGE;
  }

  if (status === 403) return "Bạn không có quyền xem nội dung khóa học.";
  if (status === 404) return "Khóa học không tồn tại hoặc đã bị xóa.";

  return data.error.message || GENERIC_ERROR_MESSAGE;
}

export function useAdminCourseLessons(courseId: string) {
  return useQuery<AdminCourseContentListResult>({
    queryKey: adminCourseContentKeys.lessons(courseId),
    queryFn: () => listAdminCourseLessons(courseId),
    enabled: courseId.trim().length > 0,
  });
}

function useInvalidateCourseApprovals() {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({ queryKey: adminCourseApprovalKeys.all });
}

export function useApproveCourse() {
  const invalidate = useInvalidateCourseApprovals();
  const mutation = useMutation<Course, unknown, string>({
    mutationFn: (courseId) =>
      reviewCourseStatus(courseId, { status: COURSE_STATUSES.PUBLISHED }),
    onSuccess: async () => {
      await invalidate();
      toast.add({ title: "Đã duyệt khóa học.", type: "success" });
    },
  });

  async function approveCourse(
    courseId: string,
  ): Promise<CourseApprovalMutationResult> {
    try {
      const course = await mutation.mutateAsync(courseId);
      return { ok: true, data: course };
    } catch (error) {
      return { ok: false, message: mapCourseApprovalError(error) };
    }
  }

  return {
    approveCourse,
    isPending: mutation.isPending,
    pendingCourseId: mutation.variables,
  };
}

export function useRejectCourse() {
  const invalidate = useInvalidateCourseApprovals();
  const mutation = useMutation<
    Course,
    unknown,
    { courseId: string; rejectReason: string }
  >({
    mutationFn: ({ courseId, rejectReason }) =>
      reviewCourseStatus(courseId, {
        status: COURSE_STATUSES.REJECTED,
        rejectReason,
      }),
    onSuccess: async () => {
      await invalidate();
      toast.add({ title: "Đã từ chối khóa học.", type: "success" });
    },
  });

  async function rejectCourse(
    courseId: string,
    rejectReason: string,
  ): Promise<CourseApprovalMutationResult> {
    try {
      const course = await mutation.mutateAsync({ courseId, rejectReason });
      return { ok: true, data: course };
    } catch (error) {
      return { ok: false, message: mapCourseApprovalError(error) };
    }
  }

  return {
    rejectCourse,
    isPending: mutation.isPending,
    pendingCourseId: mutation.variables?.courseId,
  };
}
