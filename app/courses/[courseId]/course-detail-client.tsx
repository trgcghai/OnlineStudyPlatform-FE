"use client";

import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublishedCourse } from "@/hooks/usePublicCourses";
import { formatDate } from "@/utils/dateTimeUtil";
import Image from "next/image";

interface CourseDetailClientProps {
  courseId: string;
}

export function CourseDetailClient({ courseId }: CourseDetailClientProps) {
  const courseQuery = usePublishedCourse(courseId);
  const course = courseQuery.data;

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
          <h2 className="text-xl font-semibold">Sẵn sàng bắt đầu?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Đăng ký hoặc đăng nhập để tiếp tục với khóa học này khi chức năng
            ghi danh được mở.
          </p>
          <div className="mt-5 grid gap-3">
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Tạo tài khoản
            </Link>
            <Link
              href="/signin"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Đăng nhập
            </Link>
          </div>
          <div className="mt-6 rounded-2xl bg-muted p-4">
            <h3 className="font-medium">Danh sách bài học</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Danh sách bài học sẽ được cập nhật sau.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
