"use client";

import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import {
  clearAuth,
  setCredentials,
  type AuthUser,
} from "@/lib/features/authSlice";
import { resetActiveLessons } from "@/lib/features/activeLearningLessonSlice";
import type { AppDispatch } from "@/lib/store";
import type { LoginFormValues } from "@/lib/schemas/login";
import { isApiErrorResponse } from "@/services/axios";
import {
  getMe,
  login as loginApi,
  logout as logoutApi,
  resendEmailOtp,
  requestPasswordResetOtp,
  resetPassword,
  verifyEmailOtp,
  verifyPasswordResetOtp,
} from "@/services/api/auth";
import type { UserRole } from "@/services/api/users";
import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from "@/constants/constants";
import { authKeys } from "@/lib/query-keys";

export type LoginResult =
  | { ok: true; role: UserRole; user: AuthUser }
  | { ok: false; formError: string };

function hasAccountDisabledMessage(data: unknown): boolean {
  if (!isApiErrorResponse(data)) {
    return false;
  }

  const message = data.error.message.toLowerCase();
  const details = data.error.details
    .filter((detail) => typeof detail === "string")
    .map((detail) => detail.toLowerCase());

  return (
    message.includes("account disabled") ||
    details.some((detail) => detail.includes("account disabled"))
  );
}

function hasEmailVerificationMessage(data: unknown): boolean {
  if (!isApiErrorResponse(data)) {
    return false;
  }

  const message = data.error.message.toLowerCase();
  const details = data.error.details
    .filter((detail) => typeof detail === "string")
    .map((detail) => detail.toLowerCase());

  return (
    message.includes("email verification required") ||
    details.some((detail) => detail.includes("email verification required"))
  );
}

function mapLoginError(error: unknown): LoginResult {
  if (!isAxiosError(error) || !error.response) {
    return { ok: false, formError: NETWORK_ERROR_MESSAGE };
  }

  const { status, data } = error.response;

  if (status === 401) {
    return { ok: false, formError: "Email hoặc mật khẩu không chính xác." };
  }

  if (status === 403 && hasAccountDisabledMessage(data)) {
    return { ok: false, formError: "Tài khoản của bạn đã bị vô hiệu hóa." };
  }

  if (status === 403 && hasEmailVerificationMessage(data)) {
    return {
      ok: false,
      formError: "Vui lòng xác thực email trước khi đăng nhập.",
    };
  }

  return { ok: false, formError: GENERIC_ERROR_MESSAGE };
}

export function getLoginFormError(error: unknown): string {
  const result = mapLoginError(error);

  return result.ok ? GENERIC_ERROR_MESSAGE : result.formError;
}

export function getEmailVerificationError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const { status, data } = error.response;

  if (status === 400) {
    return "Mã OTP không hợp lệ, đã hết hạn hoặc đã được sử dụng.";
  }

  if (status === 429 && isApiErrorResponse(data)) {
    return data.error.message;
  }

  return GENERIC_ERROR_MESSAGE;
}

export function getPasswordResetError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const { status, data } = error.response;

  if (status === 400) {
    return "Mã OTP hoặc phiên đặt lại mật khẩu không hợp lệ, đã hết hạn hoặc đã được sử dụng.";
  }

  if (status === 429 && isApiErrorResponse(data)) {
    return data.error.message;
  }

  return GENERIC_ERROR_MESSAGE;
}

export function useLogin() {
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (values: LoginFormValues) => loginApi(values),
    onSuccess: (result) => {
      dispatch(resetActiveLessons());
      dispatch(setCredentials(result));
    },
  });
}

export function useLogout() {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logoutApi(),
    onSettled: () => {
      dispatch(clearAuth());
      queryClient.clear();
    },
  });
}

export function useVerifyEmailOtp() {
  return useMutation({
    mutationFn: verifyEmailOtp,
  });
}

export function useResendEmailOtp() {
  return useMutation({
    mutationFn: resendEmailOtp,
  });
}

export function useRequestPasswordResetOtp() {
  return useMutation({
    mutationFn: requestPasswordResetOtp,
  });
}

export function useVerifyPasswordResetOtp() {
  return useMutation({
    mutationFn: verifyPasswordResetOtp,
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => getMe(),
  });
}

export function useAuth() {
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  async function login(values: LoginFormValues): Promise<LoginResult> {
    let result: Awaited<ReturnType<typeof loginApi>>;

    try {
      result = await loginMutation.mutateAsync(values);
    } catch (error) {
      return mapLoginError(error);
    }

    const role: UserRole = result.user.role;

    return { ok: true, role, user: result.user };
  }

  async function logout(): Promise<void> {
    await logoutMutation.mutateAsync();
  }

  return { login, logout, loginMutation, logoutMutation };
}
