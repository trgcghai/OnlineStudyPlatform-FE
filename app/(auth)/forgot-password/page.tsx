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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  getPasswordResetError,
  useRequestPasswordResetOtp,
  useResetPassword,
  useVerifyPasswordResetOtp,
} from "@/hooks/useAuth";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/schemas/forgot-password";
import { Lock, Mail, MailCheck, RotateCcw, ShieldCheck } from "lucide-react";

type ResetStep = "email" | "otp" | "reset" | "done";

const GENERIC_REQUEST_MESSAGE =
  "Nếu email thuộc tài khoản hợp lệ, mã OTP đặt lại mật khẩu đã được gửi.";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<ResetStep>("email");
  const [resetToken, setResetToken] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    formState: { errors },
    getValues,
    register,
    setValue,
    trigger,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const requestMutation = useRequestPasswordResetOtp();
  const verifyMutation = useVerifyPasswordResetOtp();
  const resetMutation = useResetPassword();

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setTimeout(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function onRequest() {
    setFormError(null);
    setSuccessMessage(null);

    if (!(await trigger("email", { shouldFocus: true }))) return;

    const email = getValues("email").trim().toLowerCase();

    try {
      const result = await requestMutation.mutateAsync({ email });
      setValue("email", email);
      setCooldown(result.resendCooldownSeconds);
      setSuccessMessage(GENERIC_REQUEST_MESSAGE);
      setStep("otp");
    } catch (error) {
      setFormError(getPasswordResetError(error));
    }
  }

  async function onVerify() {
    setFormError(null);
    setSuccessMessage(null);

    if (!(await trigger("otp", { shouldFocus: true }))) return;

    try {
      const result = await verifyMutation.mutateAsync({
        email: getValues("email"),
        otp: getValues("otp"),
      });
      setResetToken(result.resetToken);
      setSuccessMessage("OTP hợp lệ. Vui lòng tạo mật khẩu mới.");
      setStep("reset");
    } catch (error) {
      setFormError(getPasswordResetError(error));
    }
  }

  async function onResend() {
    setFormError(null);
    setSuccessMessage(null);

    try {
      const result = await requestMutation.mutateAsync({
        email: getValues("email"),
      });
      setCooldown(result.resendCooldownSeconds);
      setSuccessMessage(GENERIC_REQUEST_MESSAGE);
    } catch (error) {
      setFormError(getPasswordResetError(error));
    }
  }

  async function onReset() {
    setFormError(null);
    setSuccessMessage(null);

    if (
      !(await trigger(["newPassword", "confirmPassword"], {
        shouldFocus: true,
      }))
    ) {
      return;
    }

    try {
      await resetMutation.mutateAsync({
        resetToken,
        newPassword: getValues("newPassword"),
      });
      setSuccessMessage(
        "Mật khẩu đã được đặt lại. Đang chuyển đến đăng nhập...",
      );
      setStep("done");
      window.setTimeout(() => router.push("/signin"), 1000);
    } catch (error) {
      setFormError(getPasswordResetError(error));
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step === "email") await onRequest();
    if (step === "otp") await onVerify();
    if (step === "reset") await onReset();
  }

  const { onChange: onOtpChange, ...otpField } = register("otp");

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
          <form onSubmit={onSubmit} className="flex flex-col gap-6">
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
              <>
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
                        placeholder="Nhập email tài khoản..."
                        aria-invalid={!!errors.email}
                        {...register("email")}
                      />
                    </InputGroup>
                    <FieldError errors={[errors.email]} />
                  </Field>
                </FieldGroup>
                <Button type="submit" disabled={requestMutation.isPending}>
                  {requestMutation.isPending ? "Đang gửi..." : "Gửi mã OTP"}
                </Button>
              </>
            )}

            {step === "otp" && (
              <>
                <FieldGroup>
                  <Field data-invalid={!!errors.otp}>
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
                        aria-invalid={!!errors.otp}
                        {...otpField}
                        onChange={(event) => {
                          event.target.value = event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6);
                          void onOtpChange(event);
                        }}
                      />
                    </InputGroup>
                    <FieldError errors={[errors.otp]} />
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
              </>
            )}

            {step === "reset" && (
              <>
                <FieldGroup>
                  <Field data-invalid={!!errors.newPassword}>
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
                        aria-invalid={!!errors.newPassword}
                        {...register("newPassword")}
                      />
                    </InputGroup>
                    <FieldError errors={[errors.newPassword]} />
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
                        placeholder="Nhập lại mật khẩu mới..."
                        aria-invalid={!!errors.confirmPassword}
                        {...register("confirmPassword")}
                      />
                    </InputGroup>
                    <FieldError errors={[errors.confirmPassword]} />
                  </Field>
                </FieldGroup>
                <Button type="submit" disabled={resetMutation.isPending}>
                  {resetMutation.isPending
                    ? "Đang cập nhật..."
                    : "Cập nhật mật khẩu"}
                </Button>
              </>
            )}
          </form>
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
