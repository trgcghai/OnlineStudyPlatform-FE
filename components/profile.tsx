"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Spinner } from "@/components/ui/spinner";
import {
  useChangePasswordForm,
  useMyProfile,
  useUpdateProfileForm,
  useUploadAvatarForm,
} from "@/hooks/useUsers";
import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordFormValues,
  type ProfileFormValues,
} from "@/lib/schemas/profile";

const PROFILE_NAME_ERROR_ID = "profile-name-error";
const PASSWORD_CURRENT_ERROR_ID = "password-current-error";
const PASSWORD_NEW_ERROR_ID = "password-new-error";
const PASSWORD_CONFIRM_ERROR_ID = "password-confirm-error";

function ProfileAvatar() {
  const { data: profile } = useMyProfile();
  const { uploadAvatar, isPending } = useUploadAvatarForm();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = (profile?.name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  async function onFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setError(null);
    const result = await uploadAvatar(file);

    if (!result.ok) {
      setError(result.message ?? null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ảnh đại diện</CardTitle>
        <CardDescription>
          Chọn ảnh JPEG, PNG, WebP hoặc GIF, tối đa 5MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage src={profile?.avatar ?? undefined} alt={profile?.name} />
          <AvatarFallback>{initials || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={onFileSelected}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {isPending ? (
              <>
                <Spinner /> Đang tải lên...
              </>
            ) : (
              "Chọn ảnh"
            )}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileInfoForm() {
  const { data: profile, isLoading } = useMyProfile();
  const { updateProfile, isPending } = useUpdateProfileForm();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (profile) {
      reset({ name: profile.name });
    }
  }, [profile, reset]);

  async function onSubmit(values: ProfileFormValues) {
    setFormError(null);
    setSuccessMessage(null);

    const result = await updateProfile(values);

    if (result.ok) {
      setSuccessMessage(result.message ?? null);
      return;
    }

    for (const fieldError of result.failure?.fieldErrors ?? []) {
      setError(fieldError.field, { message: fieldError.message });
    }

    if (result.failure?.formError) {
      setFormError(result.failure.formError);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin cá nhân</CardTitle>
        <CardDescription>Cập nhật thông tin hồ sơ của bạn.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {formError ? (
            <Alert variant="destructive">
              <AlertTitle>Không thể lưu</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          {successMessage ? (
            <p className="text-sm font-medium text-green-600">
              {successMessage}
            </p>
          ) : null}

          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Họ và tên</FieldLabel>
              <Input
                id="name"
                autoComplete="name"
                aria-invalid={!!errors.name}
                aria-describedby={
                  errors.name ? PROFILE_NAME_ERROR_ID : undefined
                }
                {...register("name")}
              />
              <FieldError id={PROFILE_NAME_ERROR_ID} errors={[errors.name]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={profile?.email ?? ""}
                disabled
                readOnly
              />
              <p className="text-muted-foreground text-sm">
                Email không thể thay đổi.
              </p>
            </Field>
          </FieldGroup>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordForm() {
  const { changePassword, isPending } = useChangePasswordForm();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
    reset,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: ChangePasswordFormValues) {
    setFormError(null);
    setSuccessMessage(null);

    const result = await changePassword(values);

    if (result.ok) {
      reset();
      setSuccessMessage(result.message ?? null);
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
          {formError ? (
            <Alert variant="destructive">
              <AlertTitle>Không thể đổi mật khẩu</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          {successMessage ? (
            <p className="text-sm font-medium text-green-600">
              {successMessage}
            </p>
          ) : null}

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
                  errors.currentPassword
                    ? PASSWORD_CURRENT_ERROR_ID
                    : undefined
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
                  errors.confirmPassword
                    ? PASSWORD_CONFIRM_ERROR_ID
                    : undefined
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

export default function Profile() {
  return (
    <section className="flex w-full max-w-xl flex-col gap-6">
      <ProfileAvatar />
      <ProfileInfoForm />
      <PasswordForm />
    </section>
  );
}
