"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Copy,
  Landmark,
  Loader2,
  X,
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
      <section className="w-full max-w-2xl rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-8">
        <Alert variant="destructive">
          <AlertTitle>Không thể tải giao dịch</AlertTitle>
          <AlertDescription>
            Giao dịch không tồn tại, đã bị xóa hoặc bạn không có quyền truy cập.
          </AlertDescription>
        </Alert>
        <Link
          href="/learner/courses"
          className={buttonVariants({
            variant: "outline",
            className: "mt-6 block mx-auto",
          })}
        >
          <ArrowLeft className="size-4 mr-1" aria-hidden="true" />
          Quay lại khóa học của tôi
        </Link>
      </section>
    );
  }

  if (isLoading || !transaction) {
    return (
      <section className="grid w-full max-w-7xl gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:gap-8">
        <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <Skeleton className="h-10 w-48 rounded-full" />
          <Skeleton className="mx-auto mt-8 size-72 rounded-3xl" />
          <Skeleton className="mt-8 h-44 rounded-2xl" />
        </div>
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
  const orderItems = transaction.orderItems ?? [];
  const isPending = status === "pending";

  return (
    <section className="grid w-full max-w-7xl gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:gap-8">
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="space-y-7 p-5 sm:p-7">
            <div className="rounded-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Số tiền cần thanh toán
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {formatCoursePrice(amount)}
              </p>
            </div>

            {orderItems.length > 0 && (
              <div className="rounded-xl border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Khóa học trong đơn
                  </p>
                  <span className="text-xs font-medium text-muted-foreground">
                    {orderItems.length} khóa học
                  </span>
                </div>
                <div className="mt-3 divide-y">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-medium">
                          {item.courseTitle}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.instructorName ?? "Giảng viên đang cập nhật"}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold">
                        {formatCoursePrice(item.unitPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Trạng thái
                </p>
                <Badge
                  variant={status === "paid" ? "outline" : "secondary"}
                  className={
                    status === "paid" ? "text-primary" : "text-foreground"
                  }
                >
                  {isPending && (
                    <Loader2
                      className="size-3 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  {STATUS_LABELS[status]}
                </Badge>
              </div>

              {isPending && (
                <div className="rounded-xl border bg-background px-4 py-3 sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Thời gian còn lại
                  </p>
                  <p className="mt-1 inline-flex items-center gap-2 text-lg font-semibold tabular-nums">
                    <CalendarClock
                      className="size-4 text-primary"
                      aria-hidden="true"
                    />
                    {countdown}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {status === "paid" && (
          <Alert className="rounded-2xl border-primary/20 bg-primary/5 p-5">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            <AlertTitle>Thanh toán thành công</AlertTitle>
            <AlertDescription>
              Khóa học đã được mở cho tài khoản của bạn.
            </AlertDescription>
            <Link
              href={
                orderItems.length > 1
                  ? "/learner/courses"
                  : `/learner/courses/${transaction.courseId}/learn`
              }
              className={buttonVariants({ className: "mt-4" })}
            >
              Vào khóa học
            </Link>
          </Alert>
        )}

        {status === "expired" && (
          <Alert className="rounded-2xl p-5">
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

      <div className="h-fit overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        {isPending ? (
          <>
            <div className="p-5 sm:p-7">
              <div className="flex justify-center">
                <div className="rounded-[1.75rem] bg-white p-4 ring-1 ring-border sm:p-5">
                  <Image
                    src={qrImageUrl}
                    alt="Mã QR chuyển khoản"
                    width={320}
                    height={320}
                    className="aspect-square w-60 rounded-xl object-cover sm:w-72"
                    unoptimized
                  />
                </div>
              </div>

              <dl className="mt-7 overflow-hidden rounded-xl border bg-background text-sm">
                <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
                  <dt className="text-muted-foreground">Ngân hàng</dt>
                  <dd className="text-right font-semibold">{bankCode}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
                  <dt className="text-muted-foreground">Số tài khoản</dt>
                  <dd className="text-right font-semibold tracking-wide">
                    {bankAccount}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
                  <dt className="text-muted-foreground">Chủ tài khoản</dt>
                  <dd className="text-right font-semibold">{bankHolder}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
                  <dt className="text-muted-foreground">Số tiền</dt>
                  <dd className="text-right text-base font-bold">
                    {formatCoursePrice(amount)}
                  </dd>
                </div>
                <div className="grid gap-2 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <dt className="text-muted-foreground">
                    Nội dung chuyển khoản
                  </dt>
                  <dd className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2 font-mono text-sm font-bold sm:justify-end">
                    <span>{`SEVQR ${paymentCode}`}</span>
                    <button
                      type="button"
                      onClick={handleCopyPaymentCode}
                      aria-label="Sao chép mã thanh toán"
                      className="inline-flex size-8 items-center justify-center rounded-full bg-background text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Copy className="size-4" aria-hidden="true" />
                    </button>
                  </dd>
                </div>
              </dl>

              <p className="mt-4 rounded-xl border border-primary/10 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
                Hãy chuyển khoản đúng số tiền{" "}
                <span className="font-semibold text-foreground">
                  {formatCoursePrice(amount)}
                </span>{" "}
                và ghi đúng nội dung (bắt buộc bắt đầu bằng{" "}
                <span className="font-semibold text-foreground">
                  &quot;SEVQR&quot;
                </span>
                ). Hệ thống tự động xác nhận khi nhận được giao dịch.
              </p>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="mt-4 w-full"
                onClick={handleCancel}
                disabled={cancelTransaction.isPending}
              >
                {confirmingCancel ? (
                  <>Chắc chắn hủy thanh toán?</>
                ) : (
                  <>
                    <X className="size-4" aria-hidden="true" />
                    Hủy thanh toán
                  </>
                )}
              </Button>

              {confirmingCancel && (
                <Button
                  type="button"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => setConfirmingCancel(false)}
                  disabled={cancelTransaction.isPending}
                >
                  Không
                </Button>
              )}
            </div>
          </>
        ) : status === "paid" ? (
          <div className="flex min-h-96 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2
                className="size-8 text-primary"
                aria-hidden="true"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Đã xác nhận thanh toán</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Đơn thanh toán đã được xác nhận và khóa học đã được mở.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-96 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <BookOpen
                className="size-7 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                Không thể hoàn tất thanh toán
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {status === "cancelled"
                  ? "Đơn thanh toán đã được hủy. Hãy quay lại khóa học để mua lại."
                  : status === "failed"
                    ? "Thanh toán chưa được ghi nhận. Vui lòng kiểm tra lại giao dịch."
                    : status === "expired"
                      ? "Đơn thanh toán đã hết hạn."
                      : "Đã hoàn tiền."}
              </p>
            </div>
            <Link
              href={`/courses/${transaction.courseId}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Landmark className="size-4 mr-1" aria-hidden="true" />
              Xem khóa học
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
