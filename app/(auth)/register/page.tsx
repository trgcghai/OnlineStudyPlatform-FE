"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  registerSchema,
  type RegisterFormValues,
} from "@/lib/schemas/register";
import { getRegisterFailure, useRegisterUserMutation } from "@/hooks/useUsers";
import { Lock, Mail, User, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegisterUserMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);

    try {
      await registerMutation.mutateAsync(values);
      router.push("/signin");
      return;
    } catch (error) {
      const result = getRegisterFailure(error);

      if (result.fieldErrors) {
        for (const { field, message, shouldFocus } of result.fieldErrors) {
          setError(
            field,
            { message, type: "server" },
            { shouldFocus: Boolean(shouldFocus) },
          );
        }
        return;
      }

      setFormError(
        result.formError ?? "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
      );
    }
  }

  return (
    <section className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Đăng ký tài khoản
          </CardTitle>
          <CardDescription>
            Tạo tài khoản học viên để tham gia các khóa học.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            {formError && (
              <Alert variant="destructive">
                <AlertTitle>Không thể đăng ký</AlertTitle>
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
                    {...register("name")}
                  />
                </InputGroup>
                <FieldError errors={[errors.name]} />
              </Field>

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <Mail aria-hidden="true" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                </InputGroup>
                <FieldError errors={[errors.email]} />
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <Lock aria-hidden="true" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    {...register("password")}
                  />
                </InputGroup>
                <FieldError errors={[errors.password]} />
              </Field>

              <Field data-invalid={!!errors.confirmPassword}>
                <FieldLabel htmlFor="confirmPassword">
                  Xác nhận mật khẩu
                </FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <Lock aria-hidden="true" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                    {...register("confirmPassword")}
                  />
                </InputGroup>
                <FieldError errors={[errors.confirmPassword]} />
              </Field>
            </FieldGroup>

            <Button type="submit" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? (
                "Đang đăng ký..."
              ) : (
                <>
                  <UserPlus aria-hidden="true" />
                  Đăng ký
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link
              href="/signin"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </CardFooter>
      </Card>
    </section>
  );
}
