"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  GraduationCap,
} from "lucide-react";
import Image from "next/image";
import { useSelector } from "react-redux";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { useEnrollInCourse } from "@/hooks/useEnrollments";
import { useCreatePaymentCheckout } from "@/hooks/usePayment";
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
  const createCheckout = useCreatePaymentCheckout();
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

  async function handleBuy() {
    if (!course) return;

    try {
      const checkout = await createCheckout.mutateAsync(course.id);
      router.push(`/learner/payment/checkout/${checkout.id}`);
    } catch {
      // The mutation already surfaced the error toast.
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
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <Link
        href="/courses"
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Quay lại danh sách khóa học
      </Link>

      <section className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl bg-muted ring-1 ring-border">
            {course.thumbnail ? (
              <Image
                src={course.thumbnail}
                alt={course.title}
                className="aspect-video w-full object-cover"
                width={800}
                height={450}
              />
            ) : (
              <div className="flex aspect-video items-center justify-center bg-linear-to-br from-primary/15 via-muted to-secondary/20">
                <BookOpen className="size-16 text-primary" aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Badge variant="secondary" className="w-fit">
              {course.category}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              {course.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <GraduationCap className="size-4" aria-hidden="true" />
                {course.instructor?.name ?? "Giảng viên đang cập nhật"}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4" aria-hidden="true" />
                Cập nhật {formatDate(course.updatedAt)}
              </span>
            </div>
          </div>

          <section className="rounded-3xl border bg-card p-6">
            <h2 className="text-2xl font-semibold">Mô tả khóa học</h2>
            <p className="mt-4 whitespace-pre-line leading-7 text-muted-foreground">
              {course.description}
            </p>
          </section>
        </div>

        <aside className="h-fit rounded-3xl border bg-card p-6 shadow-sm lg:sticky lg:top-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold">Sẵn sàng bắt đầu?</h2>
            <span
              className={
                course.price === 0
                  ? "text-sm font-medium text-primary"
                  : "text-xl font-bold text-foreground"
              }
            >
              {formatCoursePrice(course.price)}
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {course.price === 0
              ? "Ghi danh để lưu khóa học vào lộ trình học tập và theo dõi tiến độ của bạn."
              : "Khóa học trả phí. Bạn phải hoàn tất thanh toán trước khi truy cập nội dung."}
          </p>
          <div className="mt-5 grid gap-3">
            {!isAuthenticated ? (
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
            ) : isLearner && course.isEnrolled ? (
              <Link href={learnHref} className={buttonVariants({ size: "lg" })}>
                Tiếp tục học
              </Link>
            ) : paymentRequired ? (
              <Alert>
                <AlertTitle>Khóa học trả phí</AlertTitle>
                <AlertDescription>
                  {formatCoursePrice(course.price)}. Vui lòng hoàn tất thanh
                  toán để mở khóa nội dung. Liên hệ quản trị viên nếu bạn cần hỗ
                  trợ.
                </AlertDescription>
              </Alert>
            ) : isLearner ? (
              isPaid ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={handleBuy}
                  disabled={createCheckout.isPending}
                >
                  {createCheckout.isPending
                    ? "Đang tạo đơn thanh toán..."
                    : "Mua khóa học"}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  onClick={handleEnroll}
                  disabled={isPending}
                >
                  {isPending ? "Đang đăng ký..." : "Đăng ký khóa học"}
                </Button>
              )
            ) : (
              <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                Chỉ tài khoản học viên mới có thể đăng ký khóa học này.
              </div>
            )}
          </div>
          <div className="mt-6 rounded-2xl bg-muted p-4">
            <h3 className="font-medium">Danh sách bài học</h3>
            {lessons.length > 0 ? (
              <ol className="mt-3 space-y-2">
                {lessons.map((lesson, index) => (
                  <li
                    key={lesson.id}
                    className="flex gap-3 rounded-xl bg-background/70 px-3 py-2 text-sm"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span className="font-medium text-foreground">
                      {lesson.title}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Danh sách bài học sẽ được cập nhật sau.
              </p>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
