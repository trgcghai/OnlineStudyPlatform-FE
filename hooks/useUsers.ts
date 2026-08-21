import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { setUser } from "@/lib/features/authSlice";
import type { AppDispatch } from "@/lib/store";
import type {
  ChangePasswordFormValues,
  ProfileFormValues,
} from "@/lib/schemas/profile";
import { isApiErrorResponse } from "@/services/axios";
import {
  changeMyPassword,
  getMyProfile,
  registerUser as registerUserApi,
  updateMyProfile,
  uploadMyAvatar,
} from "@/services/api/users";
import type { RegisterUserResponse, UserProfile } from "@/services/api/users";
import type { RegisterFormValues } from "@/lib/schemas/register";
import { toast } from "@/components/ui/toast";

export const userKeys = {
  all: ["users"] as const,
  me: () => [...userKeys.all, "me"] as const,
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

const NETWORK_ERROR_MESSAGE =
  "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
const GENERIC_ERROR_MESSAGE = "Đã xảy ra lỗi. Vui lòng thử lại sau.";
const WRONG_CURRENT_PASSWORD_MESSAGE = "Mật khẩu hiện tại không chính xác.";
const PROFILE_SAVED_MESSAGE = "Hồ sơ đã được cập nhật.";
const PASSWORD_CHANGED_MESSAGE = "Đổi mật khẩu thành công.";
const AVATAR_UPDATED_MESSAGE = "Ảnh đại diện đã được cập nhật.";

export interface ProfileFailure {
  formError?: string;
  fieldErrors?: Array<{ field: keyof ProfileFormValues; message: string }>;
}

function mapProfileError(error: unknown): ProfileFailure {
  if (!isAxiosError(error) || !error.response) {
    return { formError: NETWORK_ERROR_MESSAGE };
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return { formError: GENERIC_ERROR_MESSAGE };
  }

  if (status === 400) {
    const { details } = data.error;

    if (hasDetail(details, "name")) {
      return {
        fieldErrors: [{ field: "name", message: "Họ và tên không hợp lệ" }],
      };
    }
  }

  return { formError: data.error.message || GENERIC_ERROR_MESSAGE };
}

export interface PasswordFailure {
  formError?: string;
  fieldErrors?: Array<{
    field: keyof ChangePasswordFormValues;
    message: string;
  }>;
}

function mapChangePasswordError(error: unknown): PasswordFailure {
  if (!isAxiosError(error) || !error.response) {
    return { formError: NETWORK_ERROR_MESSAGE };
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return { formError: GENERIC_ERROR_MESSAGE };
  }

  if (
    status === 400 &&
    data.error.message === "Current password is incorrect"
  ) {
    return {
      fieldErrors: [
        { field: "currentPassword", message: WRONG_CURRENT_PASSWORD_MESSAGE },
      ],
    };
  }

  if (status === 400 && hasDetail(data.error.details, "Password")) {
    return {
      fieldErrors: [
        {
          field: "newPassword",
          message:
            "Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ, số và ký tự đặc biệt",
        },
      ],
    };
  }

  return { formError: data.error.message || GENERIC_ERROR_MESSAGE };
}

function toAuthUser(profile: UserProfile) {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    avatar: profile.avatar,
    status: profile.status,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function useMyProfile() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: getMyProfile,
  });
}

export function useUpdateProfile() {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  return useMutation<UserProfile, unknown, ProfileFormValues, ProfileResult>({
    mutationFn: (values) => updateMyProfile(values),
    onSuccess: (profile) => {
      queryClient.setQueryData(userKeys.me(), profile);
      toast.add({
        title: PROFILE_SAVED_MESSAGE,
      });
      dispatch(setUser(toAuthUser(profile)));
    },
  });
}

export interface ProfileResult {
  ok: boolean;
  message?: string;
  failure?: ProfileFailure;
}

export interface PasswordResult {
  ok: boolean;
  message?: string;
  failure?: PasswordFailure;
}

export interface AvatarResult {
  ok: boolean;
  message?: string;
}

export function useUpdateProfileForm() {
  const mutation = useUpdateProfile();

  async function updateProfile(
    values: ProfileFormValues,
  ): Promise<ProfileResult> {
    try {
      await mutation.mutateAsync(values);
      return { ok: true, message: PROFILE_SAVED_MESSAGE };
    } catch (error) {
      return { ok: false, failure: mapProfileError(error) };
    }
  }

  return { updateProfile, isPending: mutation.isPending };
}

export function useChangePassword() {
  return useMutation<void, unknown, ChangePasswordFormValues>({
    mutationFn: (values) =>
      changeMyPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      toast.add({
        title: PASSWORD_CHANGED_MESSAGE,
      });
    },
  });
}

export function useChangePasswordForm() {
  const mutation = useChangePassword();

  async function changePassword(
    values: ChangePasswordFormValues,
  ): Promise<PasswordResult> {
    try {
      await mutation.mutateAsync(values);
      return { ok: true, message: PASSWORD_CHANGED_MESSAGE };
    } catch (error) {
      return { ok: false, failure: mapChangePasswordError(error) };
    }
  }

  return { changePassword, isPending: mutation.isPending };
}

export function useUploadAvatar() {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  return useMutation<UserProfile, unknown, File>({
    mutationFn: (file) => uploadMyAvatar(file),
    onSuccess: (profile) => {
      queryClient.setQueryData(userKeys.me(), profile);
      dispatch(setUser(toAuthUser(profile)));
      toast.add({
        title: AVATAR_UPDATED_MESSAGE,
      });
    },
  });
}

export function useUploadAvatarForm() {
  const mutation = useUploadAvatar();

  async function uploadAvatar(file: File): Promise<AvatarResult> {
    try {
      await mutation.mutateAsync(file);
      return { ok: true, message: AVATAR_UPDATED_MESSAGE };
    } catch {
      return {
        ok: false,
        message: "Không thể tải lên ảnh đại diện. Vui lòng thử lại.",
      };
    }
  }

  return { uploadAvatar, isPending: mutation.isPending };
}
