"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import { useMyProfile, useUpdateProfileForm } from "@/hooks/useUsers";
import { profileSchema, type ProfileFormValues } from "@/lib/schemas/profile";

const PROFILE_NAME_ERROR_ID = "profile-name-error";

function ProfileInfoForm() {
  const { data: profile, isLoading } = useMyProfile();
  const { updateProfile, isPending } = useUpdateProfileForm();
  const [formError, setFormError] = useState<string | null>(null);

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

    const result = await updateProfile(values);

    if (result.ok) {
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
          {formError && (
            <Alert variant="destructive">
              <AlertTitle>Không thể lưu</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

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

export default ProfileInfoForm;
