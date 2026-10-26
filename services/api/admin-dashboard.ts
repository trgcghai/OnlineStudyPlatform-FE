import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export interface AdminDashboard {
  users: {
    total: number;
    learners: number;
    instructors: number;
    admins: number;
  };
  courses: { total: number; published: number; pending: number };
  enrollments: { total: number; completed: number; completionRate: number };
  learningRisk: {
    scoredEnrollments: number;
    low: number;
    medium: number;
    high: number;
  };
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const { data } =
    await axiosClient.get<ApiSuccessResponse<AdminDashboard>>(
      "/admin/dashboard",
    );
  return data.data;
}
