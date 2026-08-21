"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useChangePasswordForm } from "@/hooks/useUsers";
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "@/lib/schemas/profile";

const PASSWORD_CURRENT_ERROR_ID = "password-current-error";
const PASSWORD_NEW_ERROR_ID = "password-new-error";
const PASSWORD_CONFIRM_ERROR_ID = "password-confirm-error";

function PasswordForm() {
  const { changePassword, isPending } = useChangePasswordForm();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
    reset,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ChangePasswordFormValues) {
    setFormError(null);

    const result = await changePassword(values);

    if (result.ok) {
      reset();
      return;
    }

    for (const fieldError of result.failure?.fieldErrors ?? []) {
      setError(fieldError.field, { message: fieldError.message });
    }

    if (result.failure?.formError) {
      setFormError(result.failure.formError);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đổi mật khẩu</CardTitle>
        <CardDescription>
          Sử dụng mật khẩu hiện tại để đặt mật khẩu mới.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {formError && (
            <Alert variant="destructive">
              <AlertTitle>Không thể đổi mật khẩu</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            <Field data-invalid={!!errors.currentPassword}>
              <FieldLabel htmlFor="currentPassword">
                Mật khẩu hiện tại
              </FieldLabel>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.currentPassword}
                aria-describedby={
                  errors.currentPassword ? PASSWORD_CURRENT_ERROR_ID : undefined
                }
                {...register("currentPassword")}
              />
              <FieldError
                id={PASSWORD_CURRENT_ERROR_ID}
                errors={[errors.currentPassword]}
              />
            </Field>

            <Field data-invalid={!!errors.newPassword}>
              <FieldLabel htmlFor="newPassword">Mật khẩu mới</FieldLabel>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.newPassword}
                aria-describedby={
                  errors.newPassword ? PASSWORD_NEW_ERROR_ID : undefined
                }
                {...register("newPassword")}
              />
              <FieldError
                id={PASSWORD_NEW_ERROR_ID}
                errors={[errors.newPassword]}
              />
            </Field>

            <Field data-invalid={!!errors.confirmPassword}>
              <FieldLabel htmlFor="confirmPassword">
                Xác nhận mật khẩu mới
              </FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? PASSWORD_CONFIRM_ERROR_ID : undefined
                }
                {...register("confirmPassword")}
              />
              <FieldError
                id={PASSWORD_CONFIRM_ERROR_ID}
                errors={[errors.confirmPassword]}
              />
            </Field>
          </FieldGroup>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default PasswordForm;
