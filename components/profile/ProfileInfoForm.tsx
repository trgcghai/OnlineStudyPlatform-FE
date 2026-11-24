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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { useMyProfile, useUpdateProfileForm } from "@/hooks/useUsers";
import { profileSchema, type ProfileFormValues } from "@/lib/schemas/profile";
import { Mail, Save, User } from "lucide-react";

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
        <CardTitle className="flex items-center gap-2">
          <User className="size-5 text-muted-foreground" aria-hidden="true" />
          Thông tin cá nhân
        </CardTitle>
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
              <InputGroup>
                <InputGroupAddon>
                  <User aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  id="name"
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                  aria-describedby={
                    errors.name ? PROFILE_NAME_ERROR_ID : undefined
                  }
                  {...register("name")}
                />
              </InputGroup>
              <FieldError id={PROFILE_NAME_ERROR_ID} errors={[errors.name]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Mail aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  id="email"
                  type="email"
                  value={profile?.email ?? ""}
                  disabled
                  readOnly
                />
              </InputGroup>
              <p className="text-muted-foreground text-sm">
                Email không thể thay đổi.
              </p>
            </Field>
          </FieldGroup>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-fit"
          >
            {isPending ? (
              <>
                <Spinner /> Đang lưu...
              </>
            ) : (
              <>
                <Save aria-hidden="true" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default ProfileInfoForm;
