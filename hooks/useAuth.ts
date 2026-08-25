"use client";

import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import {
  clearAuth,
  setCredentials,
  type AuthUser,
} from "@/lib/features/authSlice";
import type { AppDispatch } from "@/lib/store";
import type { LoginFormValues } from "@/lib/schemas/login";
import { isApiErrorResponse } from "@/services/axios";
import {
  getMe,
  login as loginApi,
  logout as logoutApi,
} from "@/services/api/auth";
import type { UserRole } from "@/services/api/users";
import { GENERIC_ERROR_MESSAGE, NETWORK_ERROR_MESSAGE } from "@/constants/constants";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

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

  return { ok: false, formError: GENERIC_ERROR_MESSAGE };
}

export function getLoginFormError(error: unknown): string {
  const result = mapLoginError(error);

  return result.ok ? GENERIC_ERROR_MESSAGE : result.formError;
}

export function useLogin() {
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (values: LoginFormValues) => loginApi(values),
    onSuccess: (result) => {
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
