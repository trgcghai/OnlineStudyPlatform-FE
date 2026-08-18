"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/lib/schemas/register";
import { useRegisterUser } from "@/hooks/useUsers";

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser } = useRegisterUser();
  const [formError, setFormError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!registered) {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.push("/signin?registered=1");
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [registered, router]);

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);

    const result = await registerUser(values);

    if (result.ok) {
      setRegistered(true);
      return;
    }

    if (result.fieldErrors) {
      for (const { field, message, shouldFocus } of result.fieldErrors) {
        setError(
          field,
          { message, type: "server" },
          { shouldFocus: Boolean(shouldFocus) }
        );
      }
      return;
    }

    setFormError(result.formError ?? "Đã có lỗi xảy ra. Vui lòng thử lại sau.");
  }

  const submitDisabled = isSubmitting || registered;

  return (
    <section className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Đăng ký tài khoản</CardTitle>
          <CardDescription>
            Tạo tài khoản học viên để tham gia các khóa học.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            {registered ? (
              <Alert>
                <AlertTitle>Đăng ký thành công</AlertTitle>
                <AlertDescription>
                  Bạn sẽ được chuyển đến trang đăng nhập…
                </AlertDescription>
              </Alert>
            ) : null}

            {formError ? (
              <Alert variant="destructive">
                <AlertTitle>Không thể đăng ký</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}

            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Họ và tên</FieldLabel>
                <Input
                  id="name"
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                  disabled={registered}
                  {...register("name")}
                />
                <FieldError errors={[errors.name]} />
              </Field>

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  disabled={registered}
                  {...register("email")}
                />
                <FieldError errors={[errors.email]} />
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  disabled={registered}
                  {...register("password")}
                />
                <FieldError errors={[errors.password]} />
              </Field>
            </FieldGroup>

            <Button type="submit" disabled={submitDisabled}>
              {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link href="/signin" className="font-medium text-primary underline-offset-4 hover:underline">
              Đăng nhập
            </Link>
          </p>
        </CardFooter>
      </Card>
    </section>
  );
}
