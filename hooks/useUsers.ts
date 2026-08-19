import { isAxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { isApiErrorResponse } from "@/services/axios";
import { registerUser as registerUserApi } from "@/services/api/users";
import type { RegisterUserResponse } from "@/services/api/users";
import type { RegisterFormValues } from "@/lib/schemas/register";

export const userKeys = {
  all: ["users"] as const,
};

const INVALID_PASSWORD_MESSAGE =
  "Mật khẩu không đáp ứng yêu cầu (tối thiểu 8 ký tự, gồm chữ, số và ký tự đặc biệt)";

interface RegisterFailure {
  ok: false;
  formError?: string;
  fieldErrors?: RegisterFieldError[];
}

interface RegisterFieldError {
  field: keyof RegisterFormValues;
  message: string;
  shouldFocus?: boolean;
}

export type RegisterResult = { ok: true } | RegisterFailure;

function hasDetail(details: string[], keyword: string): boolean {
  return details.some((detail) => detail.toLowerCase().includes(keyword));
}

function mapRegisterError(error: unknown): RegisterFailure {
  if (!isAxiosError(error) || !error.response) {
    return {
      ok: false,
      formError: "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
    };
  }

  const { status, data } = error.response;
  if (!isApiErrorResponse(data)) {
    return {
      ok: false,
      formError: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
    };
  }

  if (status === 409) {
    return {
      ok: false,
      fieldErrors: [
        {
          field: "email",
          message: "Email đã được đăng ký",
          shouldFocus: true,
        },
      ],
    };
  }

  if (status === 400) {
    const { details } = data.error;

    if (hasDetail(details, "password")) {
      return {
        ok: false,
        fieldErrors: [{ field: "password", message: INVALID_PASSWORD_MESSAGE }],
      };
    }

    if (hasDetail(details, "email")) {
      return {
        ok: false,
        fieldErrors: [{ field: "email", message: "Email không hợp lệ" }],
      };
    }

    if (hasDetail(details, "name")) {
      return {
        ok: false,
        fieldErrors: [{ field: "name", message: "Họ và tên không hợp lệ" }],
      };
    }

    return {
      ok: false,
      formError: "Thông tin không hợp lệ. Vui lòng kiểm tra lại.",
    };
  }

  return {
    ok: false,
    formError: data.error.message,
  };
}

export function getRegisterFailure(error: unknown): RegisterFailure {
  return mapRegisterError(error);
}

export function useRegisterUserMutation() {
  return useMutation<RegisterUserResponse, unknown, RegisterFormValues>({
    mutationFn: (values) =>
      registerUserApi({
        name: values.name,
        email: values.email,
        password: values.password,
      }),
  });
}

export function useRegisterUser() {
  const registerMutation = useRegisterUserMutation();

  async function registerUser(
    values: RegisterFormValues,
  ): Promise<RegisterResult> {
    try {
      await registerMutation.mutateAsync(values);
      return { ok: true };
    } catch (error) {
      return mapRegisterError(error);
    }
  }

  return { registerUser, registerMutation };
}
