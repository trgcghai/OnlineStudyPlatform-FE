"use client";

import { isAxiosError } from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { isApiErrorResponse } from "@/services/axios";
import { resendEmailOtp, verifyEmailOtp } from "@/services/api/auth";
import { MailCheck, RotateCcw, ShieldCheck } from "lucide-react";

function getOtpError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
  }

  const { status, data } = error.response;

  if (status === 400) {
    return "Mã OTP không hợp lệ, đã hết hạn hoặc đã được sử dụng.";
  }

  if (status === 429 && isApiErrorResponse(data)) {
    return data.error.message;
  }

  return "Đã có lỗi xảy ra. Vui lòng thử lại sau.";
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const initialDelivery = searchParams.get("delivery");
  const [otp, setOtp] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    initialDelivery === "unavailable"
      ? "Chưa gửi được email OTP do cấu hình SMTP hoặc nhà cung cấp mail. Vui lòng kiểm tra cấu hình và thử gửi lại."
      : null,
  );
  const [cooldown, setCooldown] = useState(60);

  const verifyMutation = useMutation({
    mutationFn: () => verifyEmailOtp({ email, otp }),
  });
  const resendMutation = useMutation({
    mutationFn: () => resendEmailOtp({ email }),
    onSuccess: (result) => {
      setCooldown(result.resendCooldownSeconds);
      setSuccessMessage(
        result.emailDelivery === "sent"
          ? "Mã OTP mới đã được gửi đến email của bạn."
          : "Yêu cầu gửi lại đã được ghi nhận. Vui lòng thử lại nếu chưa nhận được mã.",
      );
    },
  });

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setTimeout(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function onVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!email) {
      setFormError("Thiếu email cần xác thực. Vui lòng đăng ký lại.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setFormError("Vui lòng nhập mã OTP gồm 6 chữ số.");
      return;
    }

    try {
      await verifyMutation.mutateAsync();
      setSuccessMessage(
        "Xác thực email thành công. Đang chuyển đến đăng nhập...",
      );
      window.setTimeout(() => router.push("/signin"), 800);
    } catch (error) {
      setFormError(getOtpError(error));
    }
  }

  async function onResend() {
    setFormError(null);
    setSuccessMessage(null);

    if (!email) {
      setFormError("Thiếu email cần xác thực. Vui lòng đăng ký lại.");
      return;
    }

    try {
      await resendMutation.mutateAsync();
    } catch (error) {
      setFormError(getOtpError(error));
    }
  }

  return (
    <section className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" />
            Xác thực email
          </CardTitle>
          <CardDescription>
            Nhập mã OTP gồm 6 chữ số đã gửi đến {email || "email của bạn"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onVerify} className="flex flex-col gap-6">
            {formError && (
              <Alert variant="destructive">
                <AlertTitle>Không thể xác thực</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert>
                <AlertTitle>Thông báo</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

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
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                  />
                </InputGroup>
                <FieldError />
              </Field>
            </FieldGroup>

            <Button type="submit" disabled={verifyMutation.isPending}>
              {verifyMutation.isPending ? "Đang xác thực..." : "Xác thực"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={cooldown > 0 || resendMutation.isPending}
            onClick={onResend}
            className="w-full"
          >
            <RotateCcw aria-hidden="true" />
            {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại mã OTP"}
          </Button>
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
