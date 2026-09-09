import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from "@/constants/constants";
import {
  courseEnrollmentKeys,
  enrollmentKeys,
  publicCourseKeys,
} from "@/lib/query-keys";
import {
  enrollInCourse,
  listCourseEnrollments,
  listMyEnrollments,
  type CourseEnrollmentListFilters,
  type Enrollment,
} from "@/services/api/enrollments";
import { isApiErrorResponse } from "@/services/axios";

export interface EnrollmentMutationResult {
  ok: boolean;
  data?: Enrollment;
  message?: string;
  alreadyEnrolled?: boolean;
}

export function mapEnrollmentError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return GENERIC_ERROR_MESSAGE;
  }

  if (status === 400) return data.error.message || "Khóa học chưa thể đăng ký.";
  if (status === 401) return "Vui lòng đăng nhập để đăng ký khóa học.";
  if (status === 403)
    return "Chỉ tài khoản học viên mới có thể đăng ký khóa học.";
  if (status === 404) return "Khóa học không tồn tại hoặc chưa được xuất bản.";
  if (status === 409) return "Bạn đã đăng ký khóa học này.";

  return data.error.message || GENERIC_ERROR_MESSAGE;
}

function isAlreadyEnrolledError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 409;
}

export function useMyEnrollments() {
  return useQuery({
    queryKey: enrollmentKeys.mine(),
    queryFn: listMyEnrollments,
  });
}

export function useCourseEnrollments(
  courseId: string,
  filters: CourseEnrollmentListFilters,
) {
  return useQuery({
    queryKey: courseEnrollmentKeys.list(courseId, filters),
    queryFn: () => listCourseEnrollments(courseId, filters),
    enabled: courseId.trim().length > 0,
  });
}

export function useEnrollInCourse() {
  const queryClient = useQueryClient();
  const mutation = useMutation<Enrollment, unknown, string>({
    mutationFn: enrollInCourse,
    onSuccess: async (enrollment) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: enrollmentKeys.mine() }),
        queryClient.invalidateQueries({
          queryKey: publicCourseKeys.detail(enrollment.courseId),
        }),
      ]);
      toast.add({ title: "Đã đăng ký khóa học.", type: "success" });
    },
  });

  async function enroll(courseId: string): Promise<EnrollmentMutationResult> {
    try {
      const enrollment = await mutation.mutateAsync(courseId);
      return { ok: true, data: enrollment };
    } catch (error) {
      return {
        ok: false,
        message: mapEnrollmentError(error),
        alreadyEnrolled: isAlreadyEnrolledError(error),
      };
    }
  }

  return {
    enroll,
    isPending: mutation.isPending,
    pendingCourseId: mutation.variables,
  };
}
