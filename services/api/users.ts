import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export const USER_ROLES = {
  ADMIN: "Admin",
  INSTRUCTOR: "Instructor",
  LEARNER: "Learner",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_STATUSES = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
} as const;

export type UserStatus =
  (typeof USER_STATUSES)[keyof typeof USER_STATUSES];

export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
}

export interface RegisterUserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export async function registerUser(
  payload: RegisterUserPayload
): Promise<RegisterUserResponse> {
  const { data } = await axiosClient.post<
    ApiSuccessResponse<RegisterUserResponse>
  >("/users", payload);

  return data.data;
}
