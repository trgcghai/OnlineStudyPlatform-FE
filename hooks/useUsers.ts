import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { setUser } from "@/lib/features/authSlice";
import type { AppDispatch } from "@/lib/store";
import type {
  ChangePasswordFormValues,
  ProfileFormValues,
} from "@/lib/schemas/profile";
import type { InstructorAccountFormValues } from "@/lib/schemas/instructor-account";
import { isApiErrorResponse } from "@/services/axios";
import {
  changeMyPassword,
  getInstructorAccountForAdmin,
  getMyInstructorAccount,
  getMyProfile,
  registerUser as registerUserApi,
  updateMyProfile,
  upsertMyInstructorAccount,
  uploadMyAvatar,
} from "@/services/api/users";
import type {
  InstructorAccount,
  RegisterUserResponse,
  UserProfile,
} from "@/services/api/users";
import type { RegisterFormValues } from "@/lib/schemas/register";
import { toast } from "@/components/ui/toast";
import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from "@/constants/constants";
import { instructorAccountKeys, userKeys } from "@/lib/query-keys";

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
        fieldErrors: [
          {
            field: "password",
            message:
              "Mật khẩu không đáp ứng yêu cầu (tối thiểu 8 ký tự, gồm chữ, số và ký tự đặc biệt)",
          },
        ],
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

export interface ProfileFailure {
  formError?: string;
  fieldErrors?: Array<{ field: keyof ProfileFormValues; message: string }>;
}

export interface InstructorAccountFailure {
  formError?: string;
  fieldErrors?: Array<{
    field: keyof InstructorAccountFormValues;
    message: string;
  }>;
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

function mapInstructorAccountError(error: unknown): InstructorAccountFailure {
  if (!isAxiosError(error) || !error.response) {
    return { formError: NETWORK_ERROR_MESSAGE };
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return { formError: GENERIC_ERROR_MESSAGE };
  }

  if (status === 400) {
    const { details } = data.error;
    const fieldErrors: InstructorAccountFailure["fieldErrors"] = [];

    for (const field of [
      "bankName",
      "bankAccountNumber",
      "accountHolderName",
      "bankCode",
      "branchName",
      "phoneNumber",
      "note",
    ] as const) {
      if (hasDetail(details, field)) {
        fieldErrors.push({ field, message: "Thông tin không hợp lệ." });
      }
    }

    return fieldErrors.length > 0
      ? { fieldErrors }
      : { formError: "Thông tin tài khoản không hợp lệ." };
  }

  if (status === 403) {
    return { formError: "Chỉ giảng viên mới có thể cập nhật tài khoản." };
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
        {
          field: "currentPassword",
          message: "Mật khẩu hiện tại không chính xác.",
        },
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
        title: "Hồ sơ đã được cập nhật.",
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

export interface InstructorAccountResult {
  ok: boolean;
  failure?: InstructorAccountFailure;
}

export function useUpdateProfileForm() {
  const mutation = useUpdateProfile();

  async function updateProfile(
    values: ProfileFormValues,
  ): Promise<ProfileResult> {
    try {
      await mutation.mutateAsync(values);
      return { ok: true, message: "Hồ sơ đã được cập nhật." };
    } catch (error) {
      return { ok: false, failure: mapProfileError(error) };
    }
  }

  return { updateProfile, isPending: mutation.isPending };
}

export function useMyInstructorAccount() {
  return useQuery({
    queryKey: instructorAccountKeys.me(),
    queryFn: getMyInstructorAccount,
  });
}

export function useAdminInstructorAccount(instructorId: string) {
  return useQuery({
    queryKey: instructorAccountKeys.adminDetail(instructorId),
    queryFn: () => getInstructorAccountForAdmin(instructorId),
    enabled: instructorId.trim().length > 0,
  });
}

export function useUpsertMyInstructorAccount() {
  const queryClient = useQueryClient();
  const mutation = useMutation<
    InstructorAccount,
    unknown,
    InstructorAccountFormValues
  >({
    mutationFn: upsertMyInstructorAccount,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: instructorAccountKeys.me(),
      });
      toast.add({ title: "Đã lưu tài khoản nhận tiền." });
    },
  });

  async function upsertAccount(
    values: InstructorAccountFormValues,
  ): Promise<InstructorAccountResult> {
    try {
      await mutation.mutateAsync(values);
      return { ok: true };
    } catch (error) {
      return { ok: false, failure: mapInstructorAccountError(error) };
    }
  }

  return { upsertAccount, isPending: mutation.isPending };
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
        title: "Đổi mật khẩu thành công.",
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
      return { ok: true, message: "Đổi mật khẩu thành công." };
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
        title: "Ảnh đại diện đã được cập nhật.",
      });
    },
  });
}

export function useUploadAvatarForm() {
  const mutation = useUploadAvatar();

  async function uploadAvatar(file: File): Promise<AvatarResult> {
    try {
      await mutation.mutateAsync(file);
      return { ok: true, message: "Ảnh đại diện đã được cập nhật." };
    } catch {
      return {
        ok: false,
        message: "Không thể tải lên ảnh đại diện. Vui lòng thử lại.",
      };
    }
  }

  return { uploadAvatar, isPending: mutation.isPending };
}
