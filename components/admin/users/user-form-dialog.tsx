"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, type UseFormSetError } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ADMIN_USER_STATUSES,
  ASSIGNABLE_ROLES,
  ROLE_LABELS,
  STATUS_LABELS,
  createAdminUserSchema,
  editAdminUserSchema,
  type AssignableRole,
} from "@/lib/schemas/admin-user";
import type { UserProfile, UserStatus } from "@/services/api/users";
import {
  useCreateAdminUser,
  useUpdateAdminUser,
  type AdminUserFailure,
} from "@/hooks/useAdminUsers";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserProfile | null;
}

interface FormValues {
  name: string;
  email: string;
  password: string;
  role: AssignableRole;
}

type FormSetError = UseFormSetError<FormValues>;

function applyFailure(
  failure: AdminUserFailure,
  setError: FormSetError,
  setFormError: (message: string | null) => void,
): void {
  if (failure.fieldErrors) {
    for (const { field, message, shouldFocus } of failure.fieldErrors) {
      setError(
        field,
        { message, type: "server" },
        { shouldFocus: Boolean(shouldFocus) },
      );
    }
    return;
  }

  setFormError(failure.formError ?? null);
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: UserFormDialogProps) {
  const isEdit = Boolean(user);
  const { createUser, isPending: isCreating } = useCreateAdminUser();
  const { updateUser, isPending: isUpdating } = useUpdateAdminUser();
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<UserStatus>(user?.status ?? "Active");

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? editAdminUserSchema : createAdminUserSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      role: (user?.role === "Instructor"
        ? "Instructor"
        : "Learner") as AssignableRole,
    },
  });

  const isPending = isCreating || isUpdating;

  async function onSubmit(values: FormValues) {
    setFormError(null);

    if (!user) {
      const result = await createUser(values);

      if (!result.ok) {
        if (result.failure) {
          applyFailure(result.failure, setError, setFormError);
        }
        return;
      }

      onOpenChange(false);
      return;
    }

    const result = await updateUser(user.id, {
      ...values,
      // Re-enabling happens here; disabling must use the row action
      // with its explicit confirmation dialog.
      status: status === "Active" && status !== user.status ? status : undefined,
    });

    if (!result.ok) {
      if (result.failure) {
        applyFailure(result.failure, setError, setFormError);
      }
      return;
    }

    // Re-enabling from the edit dialog is allowed; disabling must use
    // the row action with its explicit confirmation dialog.
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin tài khoản Giảng viên / Học viên."
              : "Tạo tài khoản Giảng viên hoặc Học viên cho hệ thống."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          {formError ? (
            <Alert variant="destructive">
              <AlertTitle>Không thể lưu</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="admin-user-name">Họ và tên</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="admin-user-name"
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
              </InputGroup>
              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="admin-user-email">Email</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="admin-user-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
              </InputGroup>
              <FieldError errors={[errors.email]} />
            </Field>

            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="admin-user-password">
                {isEdit ? "Mật khẩu mới (tùy chọn)" : "Mật khẩu"}
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="admin-user-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={
                    isEdit ? "Bỏ trống nếu không đổi mật khẩu" : undefined
                  }
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
              </InputGroup>
              <FieldError errors={[errors.password]} />
            </Field>

            <div className={cn("grid gap-4", isEdit ? "sm:grid-cols-2" : "sm:grid-cols-1")}>
              <Field data-invalid={!!errors.role}>
                <FieldLabel>Vai trò</FieldLabel>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as AssignableRole)
                      }
                      items={{
                        Instructor: ROLE_LABELS.Instructor,
                        Learner: ROLE_LABELS.Learner,
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.role]} />
              </Field>

              {isEdit ? (
                <Field>
                  <FieldLabel>Trạng thái</FieldLabel>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as UserStatus)}
                    items={STATUS_LABELS}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ADMIN_USER_STATUSES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {STATUS_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                  Đang lưu...
                </>
              ) : isEdit ? (
                "Lưu thay đổi"
              ) : (
                "Tạo tài khoản"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
