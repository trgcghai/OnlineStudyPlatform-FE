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
import { getLoginFormError, useLogin } from "@/hooks/useAuth";
import { loginSchema, type LoginFormValues } from "@/lib/schemas/login";
import { getRoleHomePath } from "@/utils/authUtil";
import { LockKeyhole, LogIn, Mail } from "lucide-react";

const EMAIL_ERROR_ID = "signin-email-error";
const PASSWORD_ERROR_ID = "signin-password-error";

export default function SignInPage() {
  const router = useRouter();
  const loginMutation = useLogin();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);

    try {
      const result = await loginMutation.mutateAsync(values);
      router.push(getRoleHomePath(result.user.role));
    } catch (error) {
      setFormError(getLoginFormError(error));
    }
  }

  return (
    <section className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Đăng nhập</CardTitle>
          <CardDescription>Đăng nhập để tiếp tục học tập.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            {formError && (
              <Alert variant="destructive">
                <AlertTitle>Không thể đăng nhập</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <FieldGroup>
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
                    aria-describedby={errors.email ? EMAIL_ERROR_ID : undefined}
                    {...register("email")}
                  />
                </InputGroup>
                <FieldError id={EMAIL_ERROR_ID} errors={[errors.email]} />
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <LockKeyhole aria-hidden="true" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? PASSWORD_ERROR_ID : undefined
                    }
                    {...register("password")}
                  />
                </InputGroup>
                <FieldError id={PASSWORD_ERROR_ID} errors={[errors.password]} />
              </Field>
            </FieldGroup>

            <Button type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? (
                "Đang đăng nhập..."
              ) : (
                <>
                  <LogIn aria-hidden="true" />
                  Đăng nhập
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link
              href="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Đăng ký
            </Link>
          </p>
        </CardFooter>
      </Card>
    </section>
  );
}
