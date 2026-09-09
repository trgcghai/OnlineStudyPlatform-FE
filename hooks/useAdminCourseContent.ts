import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from "@/constants/constants";
import {
  listAdminCourseLessons,
  type AdminCourseContentListResult,
} from "@/services/api/admin-course-content";
import { isApiErrorResponse } from "@/services/axios";
import { adminCourseContentKeys } from "@/lib/query-keys";

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
