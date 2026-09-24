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
  PENDING_VERIFICATION: "PendingVerification",
} as const;

export type UserStatus = (typeof USER_STATUSES)[keyof typeof USER_STATUSES];

export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
}

export interface RegisterUserResponse {
  user: UserProfile;
  email: string;
  expiresInSeconds: number;
  resendCooldownSeconds: number;
  emailDelivery: "sent" | "unavailable";
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

export async function registerUser(
  payload: RegisterUserPayload,
): Promise<RegisterUserResponse> {
  const { data } = await axiosClient.post<
    ApiSuccessResponse<RegisterUserResponse>
  >("/auth/register", payload);

  return data.data;
}

export interface InstructorAccount {
  id: string;
  instructorId: string;
  bankName: string;
  bankAccountNumber: string;
  accountHolderName: string;
  bankCode: string | null;
  branchName: string | null;
  phoneNumber: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BankOption {
  name: string;
  code: string;
  bin: string;
  shortName: string;
}

export interface UpsertInstructorAccountPayload {
  bankAccountNumber: string;
  accountHolderName: string;
  bankCode: string;
  branchName?: string | null;
  phoneNumber?: string | null;
  note?: string | null;
}

export interface UpdateProfilePayload {
  name?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export async function getMyProfile(): Promise<UserProfile> {
  const { data } =
    await axiosClient.get<ApiSuccessResponse<UserProfile>>("/users/me");

  return data.data;
}

export async function updateMyProfile(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  const { data } = await axiosClient.patch<ApiSuccessResponse<UserProfile>>(
    "/users/me",
    payload,
  );

  return data.data;
}

export async function getMyInstructorAccount(): Promise<InstructorAccount | null> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<InstructorAccount | null>
  >("/users/me/instructor-account");

  return data.data;
}

export async function listBanks(): Promise<BankOption[]> {
  const { data } =
    await axiosClient.get<ApiSuccessResponse<BankOption[]>>("/users/banks");

  return data.data;
}

export async function upsertMyInstructorAccount(
  payload: UpsertInstructorAccountPayload,
): Promise<InstructorAccount> {
  const { data } = await axiosClient.put<ApiSuccessResponse<InstructorAccount>>(
    "/users/me/instructor-account",
    payload,
  );

  return data.data;
}

export async function getInstructorAccountForAdmin(
  instructorId: string,
): Promise<InstructorAccount | null> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<InstructorAccount | null>
  >(`/users/admin/instructors/${instructorId}/account`);

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

export interface AdminUserFilters {
  role?: UserRole;
  status?: UserStatus;
  q?: string;
  page?: number;
  limit?: number;
}

export interface AdminUserList {
  items: UserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateAdminUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateAdminUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
}

function buildAdminUsersQuery(filters: AdminUserFilters): string {
  const params = new URLSearchParams();

  if (filters.role) params.set("role", filters.role);
  if (filters.status) params.set("status", filters.status);
  if (filters.q && filters.q.trim().length > 0)
    params.set("q", filters.q.trim());
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();

  return query.length > 0 ? `?${query}` : "";
}

export async function listAdminUsers(
  filters: AdminUserFilters = {},
): Promise<AdminUserList> {
  const { data } = await axiosClient.get<ApiSuccessResponse<AdminUserList>>(
    `/users/admin${buildAdminUsersQuery(filters)}`,
  );

  return data.data;
}

export async function createUserAsAdmin(
  payload: CreateAdminUserPayload,
): Promise<UserProfile> {
  const { data } = await axiosClient.post<ApiSuccessResponse<UserProfile>>(
    "/users/admin",
    payload,
  );

  return data.data;
}

export async function updateUserAsAdmin(
  userId: string,
  payload: UpdateAdminUserPayload,
): Promise<UserProfile> {
  const { data } = await axiosClient.patch<ApiSuccessResponse<UserProfile>>(
    `/users/admin/${userId}`,
    payload,
  );

  return data.data;
}

export async function disableUserAsAdmin(userId: string): Promise<UserProfile> {
  const { data } = await axiosClient.patch<ApiSuccessResponse<UserProfile>>(
    `/users/admin/${userId}/disable`,
  );

  return data.data;
}
