"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, CalendarDays, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyEnrollments } from "@/hooks/useEnrollments";
import type { Enrollment } from "@/services/api/enrollments";
import { formatDate } from "@/utils/dateTimeUtil";

function formatProgress(progress: string): string {
  const value = Number(progress);
  if (!Number.isFinite(value)) return "0%";

  return `${Math.min(Math.max(value, 0), 100).toLocaleString("vi-VN", {
    maximumFractionDigits: 2,
  })}%`;
}

function getProgressValue(progress: string): number {
  const value = Number(progress);
  if (!Number.isFinite(value)) return 0;

  return Math.min(Math.max(value, 0), 100);
}

function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  const course = enrollment.course;
  const progressValue = getProgressValue(enrollment.progress);
  const progressLabel = formatProgress(enrollment.progress);
  const learnHref = `/learner/courses/${enrollment.courseId}/learn`;

  return (
    <article className="grid gap-5 rounded-3xl border bg-card p-5 shadow-sm md:grid-cols-[220px_1fr]">
      <div className="overflow-hidden rounded-2xl bg-muted">
        {course?.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            className="aspect-video h-full w-full object-cover"
            width={440}
            height={248}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center bg-linear-to-br from-primary/15 via-muted to-secondary/20">
            <BookOpen className="size-10 text-primary" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="space-y-3">
          <Badge variant="secondary" className="w-fit">
            {course?.category ?? "Khóa học"}
          </Badge>
          <div>
            <h2 className="line-clamp-2 text-2xl font-semibold tracking-tight">
              {course?.title ?? "Khóa học đang cập nhật"}
            </h2>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <GraduationCap className="size-4" aria-hidden="true" />
                {course?.instructor?.name ?? "Giảng viên đang cập nhật"}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4" aria-hidden="true" />
                Đăng ký {formatDate(enrollment.enrolledAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Tiến độ</span>
            <span className="text-muted-foreground">{progressLabel}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
        <div>
          <Link href={learnHref} className={buttonVariants()}>
            Tiếp tục học
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function LearnerCoursesPage() {
  const enrollmentsQuery = useMyEnrollments();
  const enrollments = enrollmentsQuery.data ?? [];

  if (enrollmentsQuery.isLoading) {
    return (
      <div className="w-full max-w-6xl space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">Lộ trình học tập</p>
          <h1 className="text-3xl font-bold tracking-tight">
            Khóa học của tôi
          </h1>
        </div>
        <div className="grid gap-4">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (enrollmentsQuery.isError) {
    return (
      <div className="w-full max-w-3xl rounded-3xl border bg-card p-8 text-center shadow-sm">
        <BookOpen
          className="mx-auto size-10 text-muted-foreground"
          aria-hidden="true"
        />
        <h1 className="mt-4 text-2xl font-semibold">Không tải được khóa học</h1>
        <p className="mt-2 text-muted-foreground">
          Vui lòng thử lại sau hoặc đăng nhập lại nếu phiên làm việc đã hết hạn.
        </p>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="w-full max-w-3xl rounded-3xl border bg-card p-8 text-center shadow-sm">
        <BookOpen className="mx-auto size-10 text-primary" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-semibold">
          Bạn chưa đăng ký khóa học nào.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Khám phá danh sách khóa học đã xuất bản và bắt đầu lộ trình đầu tiên
          của bạn.
        </p>
        <Link href="/courses" className={buttonVariants({ className: "mt-6" })}>
          Khám phá khóa học
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Lộ trình học tập</p>
        <h1 className="text-3xl font-bold tracking-tight">Khóa học của tôi</h1>
        <p className="mt-2 text-muted-foreground">
          Theo dõi tiến độ và tiếp tục các khóa học bạn đã đăng ký.
        </p>
      </div>
      <div className="grid gap-4">
        {enrollments.map((enrollment) => (
          <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
        ))}
      </div>
    </div>
  );
}
