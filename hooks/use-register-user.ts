import { isAxiosError } from "axios";
import { registerUser as registerUserApi } from "@/services/api/users";
import type { RegisterFormValues } from "@/lib/schemas/register";

const INVALID_PASSWORD_MESSAGE =
  "Mật khẩu không đáp ứng yêu cầu (tối thiểu 8 ký tự, gồm chữ, số và ký tự đặc biệt)";

interface RegisterFailure {
  ok: false;
  formError?: string;
  fieldErrors?: Partial<Record<keyof RegisterFormValues, string>>;
  shouldFocusEmail?: boolean;
}

interface RegisterSuccess {
  ok: true;
}

type RegisterResult = RegisterSuccess | RegisterFailure;

function getErrorText(data: unknown): string {
  if (typeof data === "string") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(getErrorText).join(" ");
  }

  if (data && typeof data === "object") {
    return Object.values(data).map(getErrorText).join(" ");
  }

  return "";
}

function mapRegisterError(error: unknown): RegisterFailure {
  if (!isAxiosError(error) || !error.response) {
    return {
      ok: false,
      formError: "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
    };
  }

  const { status, data } = error.response;

  if (status === 409) {
    return {
      ok: false,
      fieldErrors: { email: "Email đã được đăng ký" },
      shouldFocusEmail: true,
    };
  }

  if (status === 400) {
    const errorText = getErrorText(data).toLowerCase();

    if (errorText.includes("password")) {
      return {
        ok: false,
        fieldErrors: { password: INVALID_PASSWORD_MESSAGE },
      };
    }

    if (errorText.includes("email")) {
      return {
        ok: false,
        fieldErrors: { email: "Email không hợp lệ" },
      };
    }

    if (errorText.includes("name")) {
      return {
        ok: false,
        fieldErrors: { name: "Họ và tên không hợp lệ" },
      };
    }

    return {
      ok: false,
      formError: "Thông tin không hợp lệ. Vui lòng kiểm tra lại.",
    };
  }

  return {
    ok: false,
    formError: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
  };
}

export function useRegisterUser() {
  async function registerUser(
    values: RegisterFormValues
  ): Promise<RegisterResult> {
    try {
      await registerUserApi(values);
      return { ok: true };
    } catch (error) {
      return mapRegisterError(error);
    }
  }

  return { registerUser };
}
