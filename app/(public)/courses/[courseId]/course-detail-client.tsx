"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  GraduationCap,
} from "lucide-react";
import Image from "next/image";
import { useSelector } from "react-redux";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { useAddCartItem } from "@/hooks/useCart";
import { useEnrollInCourse } from "@/hooks/useEnrollments";
import { usePublishedCourse } from "@/hooks/usePublicCourses";
import { formatCoursePrice } from "@/lib/schemas/course";
import {
  selectIsAuthenticated,
  selectUserRole,
} from "@/lib/features/authSlice";
import { USER_ROLES } from "@/services/api/users";
import { formatDate } from "@/utils/dateTimeUtil";
import { useState } from "react";

interface CourseDetailClientProps {
  courseId: string;
}

export function CourseDetailClient({ courseId }: CourseDetailClientProps) {
  const router = useRouter();
  const [paymentRequired, setPaymentRequired] = useState(false);
  const courseQuery = usePublishedCourse(courseId);
  const course = courseQuery.data;
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);
  const { enroll, isPending } = useEnrollInCourse();
  const addCartItem = useAddCartItem();
  const isLearner = userRole === USER_ROLES.LEARNER;
  const isPaid = course && course.price > 0;
  const learnHref = course
    ? `/learner/courses/${course.id}/learn`
    : "/learner/courses";
  const lessons = course
    ? [...(course.lessons ?? [])].sort((a, b) => a.position - b.position)
    : [];

  async function handleEnroll() {
    if (!course) return;

    const result = await enroll(course.id);

    if (result.requiresPayment) {
      setPaymentRequired(true);
      toast.add({
        title:
          result.message ??
          "Khóa học trả phí. Vui lòng hoàn tất thanh toán trước khi truy cập nội dung.",
        type: "info",
      });
      return;
    }

    if (result.ok || result.alreadyEnrolled) {
      if (result.alreadyEnrolled && result.message) {
        toast.add({ title: result.message, type: "info" });
      }
      router.push(`/learner/courses/${course.id}/learn`);
      return;
    }

    toast.add({
      title: result.message ?? "Không thể đăng ký khóa học.",
      type: "error",
    });
  }

  async function handleAddToCart() {
    if (!course) return;

    try {
      await addCartItem.mutateAsync(course.id);
    } catch {
      console.error("Failed to add item to cart");
    }
  }

  if (courseQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <Skeleton className="h-96 rounded-3xl" />
      </main>
    );
  }

  if (courseQuery.isError || !course) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <BookOpen
          className="size-10 text-muted-foreground"
          aria-hidden="true"
        />
        <h1 className="mt-4 text-2xl font-semibold">Không tìm thấy khóa học</h1>
        <p className="mt-2 text-muted-foreground">
          Khóa học không tồn tại hoặc chưa được xuất bản.
        </p>
        <Link href="/courses" className={buttonVariants({ className: "mt-6" })}>
          Quay lại danh sách khóa học
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href="/courses"
        className="mb-6 inline-flex w-fit items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Quay lại danh sách khóa học
      </Link>

      <section className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
        <div className="order-1 overflow-hidden rounded-3xl border bg-muted shadow-sm lg:col-start-1 lg:row-start-1">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              unoptimized
              alt={course.title}
              className="aspect-video w-full object-cover md:aspect-16/8"
              width={800}
              height={450}
              loading="eager"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-linear-to-br from-primary/15 via-muted to-secondary/20 md:aspect-16/8">
              <BookOpen className="size-16 text-primary" aria-hidden="true" />
            </div>
          )}
        </div>

        <header className="order-2 space-y-4 lg:col-start-1 lg:row-start-2">
          <Badge variant="secondary" className="w-fit">
            {course.category}
          </Badge>
          <h1 className="max-w-4xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {course.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <GraduationCap
                className="size-4 text-primary"
                aria-hidden="true"
              />
              {course.instructor?.name ?? "Giảng viên đang cập nhật"}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays
                className="size-4 text-primary"
                aria-hidden="true"
              />
              Cập nhật {formatDate(course.updatedAt)}
            </span>
          </div>
        </header>

        <aside className="relative order-3 flex h-full flex-col justify-between gap-5 overflow-hidden rounded-3xl border bg-card p-5 shadow sm:p-6 lg:col-start-2 lg:row-start-1">
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">
                Sẵn sàng bắt đầu?
              </h2>
              <span
                className={
                  course.price === 0
                    ? "text-sm font-semibold text-primary"
                    : "text-xl font-bold tracking-tight text-foreground"
                }
              >
                {formatCoursePrice(course.price)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {course.price === 0
                ? "Ghi danh để lưu khóa học vào lộ trình học tập và theo dõi tiến độ của bạn."
                : "Khóa học trả phí. Bạn phải hoàn tất thanh toán trước khi truy cập nội dung."}
            </p>
          </div>
          <div className="grid gap-3">
            {!isAuthenticated && (
              <>
                <Link
                  href="/register"
                  className={buttonVariants({ size: "lg" })}
                >
                  Tạo tài khoản
                </Link>
                <Link
                  href="/signin"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  Đăng nhập
                </Link>
              </>
            )}

            {isAuthenticated && isLearner && course.isEnrolled && (
              <Link href={learnHref} className={buttonVariants({ size: "lg" })}>
                Tiếp tục học
              </Link>
            )}

            {isAuthenticated &&
              !(isLearner && course.isEnrolled) &&
              paymentRequired && (
                <Alert>
                  <AlertTitle>Khóa học trả phí</AlertTitle>
                  <AlertDescription>
                    {formatCoursePrice(course.price)}. Vui lòng hoàn tất thanh
                    toán để mở khóa nội dung. Liên hệ quản trị viên nếu bạn cần
                    hỗ trợ.
                  </AlertDescription>
                </Alert>
              )}

            {isAuthenticated &&
              !(isLearner && course.isEnrolled) &&
              !paymentRequired &&
              isLearner &&
              isPaid && (
                <Button
                  type="button"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={addCartItem.isPending}
                >
                  {addCartItem.isPending
                    ? "Đang thêm vào giỏ hàng..."
                    : "Thêm vào giỏ hàng"}
                </Button>
              )}

            {isAuthenticated &&
              !(isLearner && course.isEnrolled) &&
              !paymentRequired &&
              isLearner &&
              !isPaid && (
                <Button
                  type="button"
                  size="lg"
                  onClick={handleEnroll}
                  disabled={isPending}
                >
                  {isPending ? "Đang đăng ký..." : "Đăng ký khóa học"}
                </Button>
              )}

            {isAuthenticated &&
              !(isLearner && course.isEnrolled) &&
              !paymentRequired &&
              !isLearner && (
                <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                  Chỉ tài khoản học viên mới có thể đăng ký khóa học này.
                </div>
              )}
          </div>
        </aside>
      </section>

      <section className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
        <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
          <h2 className="mb-5 text-xl font-semibold tracking-tight sm:text-2xl">
            Mô tả khóa học
          </h2>
          <p className="whitespace-pre-line leading-7 text-muted-foreground">
            {course.description}
          </p>
        </section>

        <details
          open
          className="group overflow-hidden rounded-3xl border bg-card shadow-sm"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-7 [&::-webkit-details-marker]:hidden">
            <span className="flex-col min-w-0 items-center gap-3">
              <span className="block text-lg font-semibold tracking-tight">
                Danh sách bài học
              </span>
              {lessons.length > 0 ? (
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {lessons.length} bài học
                </span>
              ) : null}
            </span>
            <ChevronDown
              className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </summary>
          <div className="border-t px-5 pb-5 sm:px-7 sm:pb-6">
            {lessons.length > 0 ? (
              <ol className="mt-4">
                {lessons.map((lesson, index) => (
                  <li
                    key={lesson.id}
                    className="group relative grid grid-cols-[2rem_minmax(0,1fr)] gap-3 py-3.5 first:pt-1 last:pb-1"
                  >
                    <span className="relative z-10 flex size-8 items-center justify-center rounded-xl border border-primary/15 bg-primary/5 text-xs font-semibold text-primary transition-colors group-hover:border-primary/30 group-hover:bg-primary/10">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 self-center wrap-break-word text-sm font-medium leading-6 text-foreground">
                      {lesson.title}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Danh sách bài học sẽ được cập nhật sau.
              </p>
            )}
          </div>
        </details>
      </section>
    </main>
  );
}
