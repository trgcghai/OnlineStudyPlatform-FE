import type { PublicCourse } from "@/services/api/public-courses";
import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

function buildLimitQuery(limit?: number): string {
  if (!limit) return "";

  const params = new URLSearchParams({ limit: String(Math.min(limit, 20)) });
  return `?${params.toString()}`;
}

export async function listMyCourseRecommendations(
  limit?: number,
): Promise<PublicCourse[]> {
  const { data } = await axiosClient.get<ApiSuccessResponse<PublicCourse[]>>(
    `/recommendations/me${buildLimitQuery(limit)}`,
  );

  return data.data;
}
