"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  forgotPasswordEmailSchema,
  forgotPasswordResetSchema,
  type ForgotPasswordEmailValues,
  type ForgotPasswordResetValues,
} from "@/lib/schemas/forgot-password";
import {
  requestPasswordResetOtp,
  resetPassword,
  verifyPasswordResetOtp,
} from "@/services/api/auth";
import { isApiErrorResponse } from "@/services/axios";
import { Lock, Mail, MailCheck, RotateCcw, ShieldCheck } from "lucide-react";

type ResetStep = "email" | "otp" | "reset" | "done";

const GENERIC_REQUEST_MESSAGE =
  "Nếu email thuộc tài khoản hợp lệ, mã OTP đặt lại mật khẩu đã được gửi.";

function getResetError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
  }

  const { status, data } = error.response;

  if (status === 400) {
    return "Mã OTP hoặc phiên đặt lại mật khẩu không hợp lệ, đã hết hạn hoặc đã được sử dụng.";
  }

  if (status === 429 && isApiErrorResponse(data)) {
    return data.error.message;
  }

  return "Đã có lỗi xảy ra. Vui lòng thử lại sau.";
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const emailForm = useForm<ForgotPasswordEmailValues>({
    resolver: zodResolver(forgotPasswordEmailSchema),
    defaultValues: { email: "" },
  });
  const passwordForm = useForm<ForgotPasswordResetValues>({
    resolver: zodResolver(forgotPasswordResetSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const requestMutation = useMutation({
    mutationFn: (value: string) => requestPasswordResetOtp({ email: value }),
    onSuccess: (result, value) => {
      setEmail(value);
      setCooldown(result.resendCooldownSeconds);
      setSuccessMessage(GENERIC_REQUEST_MESSAGE);
      setStep("otp");
    },
  });
  const verifyMutation = useMutation({
    mutationFn: () => verifyPasswordResetOtp({ email, otp }),
    onSuccess: (result) => {
      setResetToken(result.resetToken);
      setSuccessMessage("OTP hợp lệ. Vui lòng tạo mật khẩu mới.");
      setStep("reset");
    },
  });
  const resetMutation = useMutation({
    mutationFn: (values: ForgotPasswordResetValues) =>
      resetPassword({ resetToken, newPassword: values.newPassword }),
    onSuccess: () => {
      setSuccessMessage(
        "Mật khẩu đã được đặt lại. Đang chuyển đến đăng nhập...",
      );
      setStep("done");
      window.setTimeout(() => router.push("/signin"), 1000);
    },
  });

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setTimeout(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function onRequest(values: ForgotPasswordEmailValues) {
    setFormError(null);
    setSuccessMessage(null);

    try {
      await requestMutation.mutateAsync(values.email);
    } catch (error) {
      setFormError(getResetError(error));
    }
  }

  async function onVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!/^\d{6}$/.test(otp)) {
      setFormError("Vui lòng nhập mã OTP gồm 6 chữ số.");
      return;
    }

    try {
      await verifyMutation.mutateAsync();
    } catch (error) {
      setFormError(getResetError(error));
    }
  }

  async function onResend() {
    setFormError(null);
    setSuccessMessage(null);

    try {
      await requestMutation.mutateAsync(email);
      setSuccessMessage(GENERIC_REQUEST_MESSAGE);
    } catch (error) {
      setFormError(getResetError(error));
    }
  }

  async function onReset(values: ForgotPasswordResetValues) {
    setFormError(null);
    setSuccessMessage(null);

    try {
      await resetMutation.mutateAsync(values);
    } catch (error) {
      setFormError(getResetError(error));
    }
  }

  return (
    <section className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" />
            Đặt lại mật khẩu
          </CardTitle>
          <CardDescription>
            Xác thực email bằng OTP trước khi tạo mật khẩu mới.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            {formError && (
              <Alert variant="destructive">
                <AlertTitle>Không thể đặt lại mật khẩu</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert>
                <AlertTitle>Thông báo</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            {step === "email" && (
              <form
                onSubmit={emailForm.handleSubmit(onRequest)}
                className="flex flex-col gap-6"
              >
                <FieldGroup>
                  <Field data-invalid={!!emailForm.formState.errors.email}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <Mail aria-hidden="true" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="Nhập email tài khoản..."
                        aria-invalid={!!emailForm.formState.errors.email}
                        {...emailForm.register("email")}
                      />
                    </InputGroup>
                    <FieldError errors={[emailForm.formState.errors.email]} />
                  </Field>
                </FieldGroup>
                <Button type="submit" disabled={requestMutation.isPending}>
                  {requestMutation.isPending ? "Đang gửi..." : "Gửi mã OTP"}
                </Button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={onVerify} className="flex flex-col gap-6">
                <FieldGroup>
                  <Field data-invalid={Boolean(formError)}>
                    <FieldLabel htmlFor="otp">Mã OTP</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <MailCheck aria-hidden="true" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="otp"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="Nhập 6 chữ số"
                        value={otp}
                        onChange={(event) =>
                          setOtp(
                            event.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                      />
                    </InputGroup>
                    <FieldError />
                  </Field>
                </FieldGroup>
                <Button type="submit" disabled={verifyMutation.isPending}>
                  {verifyMutation.isPending
                    ? "Đang xác thực..."
                    : "Xác thực OTP"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={cooldown > 0 || requestMutation.isPending}
                  onClick={onResend}
                >
                  <RotateCcw aria-hidden="true" />
                  {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại mã OTP"}
                </Button>
              </form>
            )}

            {step === "reset" && (
              <form
                onSubmit={passwordForm.handleSubmit(onReset)}
                className="flex flex-col gap-6"
              >
                <FieldGroup>
                  <Field
                    data-invalid={!!passwordForm.formState.errors.newPassword}
                  >
                    <FieldLabel htmlFor="newPassword">Mật khẩu mới</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <Lock aria-hidden="true" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="newPassword"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Nhập mật khẩu mới..."
                        aria-invalid={
                          !!passwordForm.formState.errors.newPassword
                        }
                        {...passwordForm.register("newPassword")}
                      />
                    </InputGroup>
                    <FieldError
                      errors={[passwordForm.formState.errors.newPassword]}
                    />
                  </Field>
                  <Field
                    data-invalid={
                      !!passwordForm.formState.errors.confirmPassword
                    }
                  >
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
                        placeholder="Nhập lại mật khẩu mới..."
                        aria-invalid={
                          !!passwordForm.formState.errors.confirmPassword
                        }
                        {...passwordForm.register("confirmPassword")}
                      />
                    </InputGroup>
                    <FieldError
                      errors={[passwordForm.formState.errors.confirmPassword]}
                    />
                  </Field>
                </FieldGroup>
                <Button type="submit" disabled={resetMutation.isPending}>
                  {resetMutation.isPending
                    ? "Đang cập nhật..."
                    : "Cập nhật mật khẩu"}
                </Button>
              </form>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Link
            href="/signin"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Quay lại đăng nhập
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
}
