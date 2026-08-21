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

export type UserStatus = (typeof USER_STATUSES)[keyof typeof USER_STATUSES];

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
  payload: RegisterUserPayload,
): Promise<RegisterUserResponse> {
  const { data } = await axiosClient.post<
    ApiSuccessResponse<RegisterUserResponse>
  >("/users", payload);

  return data.data;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  name?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export async function getMyProfile(): Promise<UserProfile> {
  const { data } = await axiosClient.get<ApiSuccessResponse<UserProfile>>(
    "/users/me",
  );

  return data.data;
}

export async function updateMyProfile(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  const { data } = await axiosClient.patch<
    ApiSuccessResponse<UserProfile>
  >("/users/me", payload);

  return data.data;
}

export async function changeMyPassword(
  payload: ChangePasswordPayload,
): Promise<void> {
  await axiosClient.patch<ApiSuccessResponse<{ passwordChanged: boolean }>>(
    "/users/me/password",
    payload,
  );
}

export async function uploadMyAvatar(file: File): Promise<UserProfile> {
  const formData = new FormData();
  formData.append("avatar", file);

  const { data } = await axiosClient.post<ApiSuccessResponse<UserProfile>>(
    "/users/me/avatar",
    formData,
  );

  return data.data;
}
