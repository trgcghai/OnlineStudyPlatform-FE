"use client";

import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
import { PublicCourseSection } from "@/components/courses/public-course-section";
import { buttonVariants } from "@/components/ui/button";
import {
  useLatestPublishedCourses,
  usePublishedCourseSuggestions,
} from "@/hooks/usePublicCourses";

const SECTION_LIMIT = 8;

export default function Home() {
  const suggestionsQuery = usePublishedCourseSuggestions(SECTION_LIMIT);
  const latestQuery = useLatestPublishedCourses(SECTION_LIMIT);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-6 py-10">
      <section className="overflow-hidden rounded-3xl border bg-card">
        <div className="grid gap-8 p-8 md:grid-cols-[1.1fr_0.9fr] md:p-10">
          <div className="flex flex-col justify-center">
            <p className="flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="size-4" aria-hidden="true" />
              Học trực tuyến cùng AI
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
              Tìm khóa học phù hợp và bắt đầu lộ trình học thông minh
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Khám phá các khóa học đã xuất bản, xem thông tin giảng viên và
              chuẩn bị cho hành trình học tập được cá nhân hóa.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/courses" className={buttonVariants({ size: "lg" })}>
                <BookOpen aria-hidden="true" />
                Khám phá khóa học
              </Link>
            </div>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-primary/15 via-muted to-secondary/20 p-6 ring-1 ring-border">
            <div className="grid h-full min-h-64 place-items-center rounded-2xl border border-dashed bg-background/60 p-6 text-center">
              <div>
                <p className="text-5xl font-bold text-primary">24/7</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Không gian học tập mở cho khách và người học đã đăng nhập.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicCourseSection
        title="Gợi ý khóa học"
        description="Một số khóa học đã xuất bản để bạn bắt đầu khám phá."
        courses={suggestionsQuery.data}
        isLoading={suggestionsQuery.isLoading}
      />
      <PublicCourseSection
        title="Khóa học mới cập nhật"
        description="Các khóa học có nội dung được cập nhật gần đây."
        courses={latestQuery.data}
        isLoading={latestQuery.isLoading}
      />
    </main>
  );
}
