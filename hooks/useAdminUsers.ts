import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import {
  createUserAsAdmin,
  disableUserAsAdmin,
  listAdminUsers,
  updateUserAsAdmin,
  USER_STATUSES,
} from "@/services/api/users";
import type {
  AdminUserFilters,
  UserStatus,
  UserProfile,
} from "@/services/api/users";
import { isApiErrorResponse } from "@/services/axios";
import type {
  CreateAdminUserFormValues,
  EditAdminUserFormValues,
} from "@/lib/schemas/admin-user";
import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from "@/constants/constants";
import { adminUserKeys } from "@/lib/query-keys";

export interface AdminUserFailure {
  formError?: string;
  fieldErrors?: Array<{
    field: keyof CreateAdminUserFormValues | keyof EditAdminUserFormValues;
    message: string;
    shouldFocus?: boolean;
  }>;
}

export interface AdminUserResult {
  ok: boolean;
  failure?: AdminUserFailure;
}

function hasDetail(details: string[], keyword: string): boolean {
  return details.some((detail) => detail.toLowerCase().includes(keyword));
}

function mapAdminUserError(error: unknown): AdminUserFailure {
  if (!isAxiosError(error) || !error.response) {
    return { formError: NETWORK_ERROR_MESSAGE };
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return { formError: GENERIC_ERROR_MESSAGE };
  }

  if (status === 409) {
    return {
      fieldErrors: [
        {
          field: "email",
          message: "Email đã được đăng ký",
          shouldFocus: true,
        },
      ],
    };
  }

  if (status === 404) {
    return { formError: "Tài khoản không tồn tại hoặc đã bị xóa." };
  }

  if (status === 403) {
    return {
      formError: "Bạn không có quyền thực hiện thao tác này.",
    };
  }

  if (status === 400) {
    const { details } = data.error;

    if (hasDetail(details, "password")) {
      return {
        fieldErrors: [
          {
            field: "password",
            message:
              "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ, số và ký tự đặc biệt",
          },
        ],
      };
    }

    if (hasDetail(details, "email")) {
      return {
        fieldErrors: [{ field: "email", message: "Email không hợp lệ" }],
      };
    }

    if (hasDetail(details, "name")) {
      return {
        fieldErrors: [{ field: "name", message: "Họ và tên không hợp lệ" }],
      };
    }

    return { formError: data.error.message || GENERIC_ERROR_MESSAGE };
  }

  return { formError: data.error.message || GENERIC_ERROR_MESSAGE };
}

function useInvalidateAdminUsers() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
}

export function useAdminUsersList(filters: AdminUserFilters) {
  return useQuery({
    queryKey: adminUserKeys.list(filters),
    queryFn: () => listAdminUsers(filters),
  });
}

export function useCreateAdminUser() {
  const invalidate = useInvalidateAdminUsers();

  const mutation = useMutation<UserProfile, unknown, CreateAdminUserFormValues>(
    {
      mutationFn: (values) =>
        createUserAsAdmin({
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
        }),
      onSuccess: () => {
        void invalidate();
        toast.add({ title: "Đã tạo tài khoản.", type: "success" });
      },
    },
  );

  async function createUser(
    values: CreateAdminUserFormValues,
  ): Promise<AdminUserResult> {
    try {
      await mutation.mutateAsync(values);
      return { ok: true };
    } catch (error) {
      return { ok: false, failure: mapAdminUserError(error) };
    }
  }

  return { createUser, isPending: mutation.isPending };
}

export function useUpdateAdminUser() {
  const invalidate = useInvalidateAdminUsers();

  const mutation = useMutation<
    UserProfile,
    unknown,
    { userId: string; status?: UserStatus } & EditAdminUserFormValues
  >({
    mutationFn: ({ userId, ...values }) =>
      updateUserAsAdmin(userId, {
        name: values.name,
        email: values.email,
        role: values.role,
        ...(values.password.length > 0 ? { password: values.password } : {}),
        ...(values.status !== undefined ? { status: values.status } : {}),
      }),
    onSuccess: () => {
      void invalidate();
      toast.add({ title: "Đã cập nhật tài khoản.", type: "success" });
    },
  });

  async function updateUser(
    userId: string,
    values: EditAdminUserFormValues & { status?: UserStatus },
  ): Promise<AdminUserResult> {
    try {
      await mutation.mutateAsync({ userId, ...values });
      return { ok: true };
    } catch (error) {
      return { ok: false, failure: mapAdminUserError(error) };
    }
  }

  return { updateUser, isPending: mutation.isPending };
}

export function useDisableAdminUser() {
  const invalidate = useInvalidateAdminUsers();

  const mutation = useMutation<UserProfile, unknown, string>({
    mutationFn: (userId) => disableUserAsAdmin(userId),
    onSuccess: () => {
      void invalidate();
      toast.add({
        title: "Đã vô hiệu hóa tài khoản.",
        description: "Người dùng sẽ không thể đăng nhập lại.",
        type: "success",
      });
    },
  });

  async function disableUser(userId: string): Promise<AdminUserResult> {
    try {
      await mutation.mutateAsync(userId);
      return { ok: true };
    } catch (error) {
      return { ok: false, failure: mapAdminUserError(error) };
    }
  }

  return { disableUser, isPending: mutation.isPending };
}

export function useEnableAdminUser() {
  const invalidate = useInvalidateAdminUsers();

  const mutation = useMutation<UserProfile, unknown, string>({
    mutationFn: (userId) =>
      updateUserAsAdmin(userId, { status: USER_STATUSES.ACTIVE }),
    onSuccess: () => {
      void invalidate();
      toast.add({
        title: "Đã kích hoạt tài khoản.",
        description: "Người dùng có thể đăng nhập lại vào hệ thống.",
        type: "success",
      });
    },
    onError: (error) => {
      toast.add({
        title:
          mapAdminUserError(error).formError ??
          "Không thể kích hoạt tài khoản.",
        type: "error",
      });
    },
  });

  async function enableUser(userId: string): Promise<AdminUserResult> {
    try {
      await mutation.mutateAsync(userId);
      return { ok: true };
    } catch (error) {
      return { ok: false, failure: mapAdminUserError(error) };
    }
  }

  return { enableUser, isPending: mutation.isPending };
}
