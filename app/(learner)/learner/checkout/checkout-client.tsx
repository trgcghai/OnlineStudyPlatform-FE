"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, CheckCircle2, LockKeyhole } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelector } from "react-redux";
import { selectAuthUser } from "@/lib/features/authSlice";
import { useCart, useCheckoutCart } from "@/hooks/useCart";
import { formatCoursePrice } from "@/lib/schemas/course";

export default function CheckoutReviewClient() {
  const router = useRouter();
  const user = useSelector(selectAuthUser);
  const cartQuery = useCart({ page: 1, limit: 100 });
  const checkoutCart = useCheckoutCart();
  const cart = cartQuery.data;
  const items = cart?.items ?? [];

  async function handleCheckout() {
    try {
      const checkout = await checkoutCart.mutateAsync();
      router.replace(`/learner/payment/checkout/${checkout.id}`);
    } catch {
      return;
    }
  }

  if (cartQuery.isLoading) {
    return (
      <section className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_0.72fr]">
        <div className="space-y-4 rounded-2xl border bg-card p-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="space-y-4 rounded-2xl border bg-card p-6">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
        </div>
      </section>
    );
  }

  if (cartQuery.isError) {
    return (
      <section className="w-full max-w-2xl">
        <Alert variant="destructive">
          <AlertTitle>Không thể tải đơn hàng</AlertTitle>
          <AlertDescription>
            Vui lòng quay lại giỏ hàng và thử lại.
          </AlertDescription>
        </Alert>
        <Link
          href="/learner/cart"
          className={buttonVariants({ variant: "outline", className: "mt-6" })}
        >
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          Quay lại giỏ hàng
        </Link>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="flex w-full max-w-2xl flex-col items-center rounded-2xl border bg-card px-6 py-16 text-center">
        <BookOpen
          className="size-12 text-muted-foreground"
          aria-hidden="true"
        />
        <h1 className="mt-4 text-2xl font-bold">Giỏ hàng đang trống</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hãy thêm khóa học trả phí trước khi tiếp tục thanh toán.
        </p>
        <Link href="/courses" className={buttonVariants({ className: "mt-6" })}>
          Khám phá khóa học
        </Link>
      </section>
    );
  }

  return (
    <section className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_0.72fr] lg:gap-8">
      <div className="space-y-5">
        <div>
          <Link
            href="/learner/cart"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Giỏ hàng
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Xác nhận trước khi thanh toán
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Kiểm tra đơn hàng
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Kiểm tra khóa học và thông tin tài khoản. Bạn sẽ chuyển sang màn
            hình QR sau khi xác nhận.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex gap-4 border-b p-4 last:border-b-0 sm:p-5"
            >
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24">
                {item.course.thumbnail ? (
                  <Image
                    src={item.course.thumbnail}
                    unoptimized
                    alt={item.course.title}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <BookOpen
                    className="absolute inset-0 m-auto size-8 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-2 font-semibold">
                  {item.course.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.course.instructor?.name ?? "Giảng viên đang cập nhật"}
                </p>
                <p className="mt-2 font-semibold">
                  {formatCoursePrice(item.course.price)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="h-fit rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <LockKeyhole className="size-4 text-primary" aria-hidden="true" />
          Thông tin thanh toán
        </div>
        <div className="mt-5 rounded-xl bg-muted/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Tài khoản học viên
          </p>
          <p className="mt-2 font-semibold">{user?.name ?? "Học viên"}</p>
          <p className="mt-1 break-all text-sm text-muted-foreground">
            {user?.email ?? "Tài khoản hiện tại"}
          </p>
        </div>
        <div className="mt-5 flex items-end justify-between gap-4 border-t pt-5">
          <span className="text-sm text-muted-foreground">Tổng thanh toán</span>
          <span className="text-2xl font-bold tracking-tight">
            {formatCoursePrice(cart?.summary.totalPrice ?? 0)}
          </span>
        </div>
        <Button
          type="button"
          className="mt-6 w-full"
          onClick={handleCheckout}
          disabled={checkoutCart.isPending}
        >
          {checkoutCart.isPending ? "Đang tạo đơn..." : "Tiếp tục thanh toán"}
        </Button>
        <p className="mt-4 flex gap-2 text-xs leading-5 text-muted-foreground">
          <CheckCircle2
            className="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          Giá và trạng thái khóa học sẽ được kiểm tra lại trên hệ thống trước
          khi tạo đơn.
        </p>
      </aside>
    </section>
  );
}
