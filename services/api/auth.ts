import type { AuthUser } from "@/lib/features/authSlice";
import axiosClient, { type ApiSuccessResponse } from "@/services/axios";
import type { UserRole, UserStatus } from "@/services/api/users";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export interface ResendEmailOtpPayload {
  email: string;
}

export interface EmailOtpDispatchResponse {
  email: string;
  expiresInSeconds: number;
  resendCooldownSeconds: number;
  emailDelivery: "sent" | "unavailable";
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await axiosClient.post<ApiSuccessResponse<LoginResponse>>(
    "/auth/login",
    payload,
  );

  return data.data;
}

export async function refresh(): Promise<LoginResponse> {
  const { data } =
    await axiosClient.post<ApiSuccessResponse<LoginResponse>>("/auth/refresh");

  return data.data;
}

export async function logout(): Promise<void> {
  await axiosClient.post("/auth/logout");
}

export async function getMe(): Promise<CurrentUserResponse> {
  const { data } =
    await axiosClient.get<ApiSuccessResponse<CurrentUserResponse>>("/auth/me");

  return data.data;
}

export async function verifyEmailOtp(
  payload: VerifyEmailPayload,
): Promise<CurrentUserResponse> {
  const { data } = await axiosClient.post<
    ApiSuccessResponse<CurrentUserResponse>
  >("/auth/email/verify", payload);

  return data.data;
}

export async function resendEmailOtp(
  payload: ResendEmailOtpPayload,
): Promise<EmailOtpDispatchResponse> {
  const { data } = await axiosClient.post<
    ApiSuccessResponse<EmailOtpDispatchResponse>
  >("/auth/email/resend-otp", payload);

  return data.data;
}
