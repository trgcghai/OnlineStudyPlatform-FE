"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Copy,
  Landmark,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import {
  useCancelPaymentTransaction,
  useCreatePaymentCheckout,
  usePaymentTransaction,
} from "@/hooks/usePayment";
import { usePublishedCourse } from "@/hooks/usePublicCourses";
import { formatCoursePrice } from "@/lib/schemas/course";
import type { PaymentTransaction } from "@/services/api/payment";

interface CheckoutClientProps {
  transactionId: string;
}

const STATUS_LABELS: Record<PaymentTransaction["status"], string> = {
  pending: "Đang chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thanh toán thất bại",
  cancelled: "Đã hủy",
  expired: "Đã hết hạn",
  refunded: "Đã hoàn tiền",
};

function formatCountdown(milliseconds: number): string {
  const total = Math.max(0, milliseconds);
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function useCountdown(expiresAt?: string): string {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;

    const interval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, [expiresAt]);

  const remaining = expiresAt ? new Date(expiresAt).getTime() - now : 0;

  return formatCountdown(remaining);
}

export function CheckoutClient({ transactionId }: CheckoutClientProps) {
  const router = useRouter();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const txQuery = usePaymentTransaction(transactionId);
  const transaction = txQuery.data;
  const courseQuery = usePublishedCourse(transaction?.courseId ?? "");
  const course = courseQuery.data;
  const cancelTransaction = useCancelPaymentTransaction(transactionId);
  const createCheckout = useCreatePaymentCheckout();
  const countdown = useCountdown(transaction?.expiresAt);
  const isLoading = txQuery.isLoading || courseQuery.isLoading;

  async function handleCopyPaymentCode() {
    if (!transaction) return;

    try {
      await navigator.clipboard.writeText(`SEVQR ${transaction.paymentCode}`);
      toast.add({ title: "Đã sao chép mã thanh toán.", type: "success" });
    } catch {
      toast.add({ title: "Không thể sao chép mã thanh toán.", type: "error" });
    }
  }

  function handleCancel() {
    if (!transaction) return;

    if (!confirmingCancel) {
      setConfirmingCancel(true);
      return;
    }

    cancelTransaction.mutate(transaction.id);
  }

  async function handleRetry() {
    if (!transaction) return;

    try {
      const checkout = await createCheckout.mutateAsync(transaction.courseId);
      setConfirmingCancel(false);
      router.replace(`/learner/payment/checkout/${checkout.id}`);
    } catch {
      console.error("Failed to create new checkout");
    }
  }

  if (txQuery.isError) {
    return (
      <section className="w-full max-w-2xl">
        <Alert variant="destructive">
          <AlertTitle>Không thể tải giao dịch</AlertTitle>
          <AlertDescription>
            Giao dịch không tồn tại, đã bị xóa hoặc bạn không có quyền truy cập.
          </AlertDescription>
        </Alert>
        <Link
          href="/learner/courses"
          className={buttonVariants({ variant: "outline", className: "mt-6" })}
        >
          Quay lại khóa học của tôi
        </Link>
      </section>
    );
  }

  if (isLoading || !transaction) {
    return (
      <section className="grid w-full max-w-4xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </section>
    );
  }

  const {
    status,
    amount,
    paymentCode,
    bankAccount,
    bankHolder,
    bankCode,
    qrImageUrl,
  } = transaction;
  const isPending = status === "pending";

  return (
    <section className="grid w-full max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <Badge variant="secondary">Đơn thanh toán</Badge>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">
            {course?.title ?? "Khóa học"}
          </h1>
          <div className="mt-4 flex items-baseline justify-between gap-3 border-t pt-4">
            <span className="text-sm text-muted-foreground">Số tiền</span>
            <span className="text-2xl font-bold text-foreground">
              {formatCoursePrice(amount)}
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <span className="text-sm text-muted-foreground">Trạng thái</span>
            <Badge
              variant={status === "paid" ? "outline" : "secondary"}
              className={status === "paid" ? "text-primary" : "text-foreground"}
            >
              {isPending && (
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              )}
              {STATUS_LABELS[status]}
            </Badge>
          </div>
          {isPending && (
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <span className="text-sm text-muted-foreground">Còn lại</span>
              <span className="inline-flex items-center gap-2 font-medium">
                <CalendarClock className="size-4" aria-hidden="true" />
                {countdown}
              </span>
            </div>
          )}
        </div>

        {status === "paid" && (
          <Alert>
            <CheckCircle2 className="size-4" aria-hidden="true" />
            <AlertTitle>Thanh toán thành công</AlertTitle>
            <AlertDescription>
              Khóa học đã được mở cho tài khoản của bạn.
            </AlertDescription>
            <Link
              href={`/learner/courses/${transaction.courseId}/learn`}
              className={buttonVariants({ className: "mt-4" })}
            >
              Vào khóa học
            </Link>
          </Alert>
        )}

        {status === "expired" && (
          <Alert>
            <AlertTitle>Đơn thanh toán đã hết hạn</AlertTitle>
            <AlertDescription>
              Số tiền chưa được ghi nhận. Bạn có thể tạo một đơn thanh toán mới.
            </AlertDescription>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={handleRetry}
              disabled={createCheckout.isPending}
            >
              {createCheckout.isPending
                ? "Đang tạo..."
                : "Tạo đơn thanh toán mới"}
            </Button>
          </Alert>
        )}
      </div>

      <div className="h-fit rounded-3xl border bg-card p-6 shadow-sm">
        {isPending ? (
          <>
            <div className="flex justify-center">
              <div className="overflow-hidden rounded-2xl ring-1 ring-border">
                <Image
                  src={qrImageUrl}
                  alt="Mã QR chuyển khoản"
                  width={280}
                  height={280}
                  className="aspect-square w-56 object-cover sm:w-72"
                  unoptimized
                />
              </div>
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Ngân hàng</dt>
                <dd className="text-right font-medium">{bankCode}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Số tài khoản</dt>
                <dd className="text-right font-medium">{bankAccount}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Chủ tài khoản</dt>
                <dd className="text-right font-medium">{bankHolder}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Số tiền</dt>
                <dd className="text-right font-semibold">
                  {formatCoursePrice(amount)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <dt className="text-muted-foreground">Nội dung chuyển khoản</dt>
                <dd className="flex items-center gap-2 text-right font-semibold">
                  {`SEVQR ${paymentCode}`}
                  <button
                    type="button"
                    onClick={handleCopyPaymentCode}
                    aria-label="Sao chép mã thanh toán"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Copy className="size-4" aria-hidden="true" />
                  </button>
                </dd>
              </div>
            </dl>

            <p className="mt-4 rounded-2xl bg-muted p-3 text-xs leading-5 text-muted-foreground">
              Hãy chuyển khoản đúng số tiền{" "}
              <span className="font-semibold">{formatCoursePrice(amount)}</span>{" "}
              và ghi đúng nội dung (bắt buộc bắt đầu bằng{" "}
              <span className="font-semibold">&quot;SEVQR&quot;</span>). Hệ
              thống tự động xác nhận khi nhận được giao dịch.
            </p>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="mt-4 w-full"
              onClick={handleCancel}
              disabled={cancelTransaction.isPending}
            >
              {confirmingCancel
                ? "Chắc chắn hủy đơn thanh toán này?"
                : "Hủy đơn thanh toán"}
            </Button>
          </>
        ) : status === "paid" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="size-12 text-primary" aria-hidden="true" />
            <p className="font-medium">Đơn thanh toán đã được xác nhận.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <BookOpen
                className="size-6 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {status === "cancelled"
                ? "Đơn thanh toán đã được hủy. Hãy quay lại khóa học để mua lại."
                : status === "failed"
                  ? "Thanh toán chưa được ghi nhận. Vui lòng kiểm tra lại giao dịch."
                  : status === "expired"
                    ? "Đơn thanh toán đã hết hạn."
                    : "Đã hoàn tiền."}
            </p>
            {status === "cancelled" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={createCheckout.isPending}
              >
                Mua lại khóa học
              </Button>
            )}
            <Link
              href={`/courses/${transaction.courseId}`}
              className={buttonVariants({ variant: "link", size: "sm" })}
            >
              <Landmark className="size-4" aria-hidden="true" />
              Xem khóa học
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
