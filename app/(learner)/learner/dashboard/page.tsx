"use client";

import Link from "next/link";
import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  PlayCircle,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLearnerDashboard } from "@/hooks/useLearnerDashboard";
import type {
  LearnerDashboardCourse,
  LearnerDashboardRecentActivity,
} from "@/services/api/learner-dashboard";
import { formatDate } from "@/utils/dateTimeUtil";

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "Chưa có";

  return `${Math.min(Math.max(value, 0), 100).toLocaleString("vi-VN", {
    maximumFractionDigits: 2,
  })}%`;
}

function getContinueLearningHref(course: LearnerDashboardCourse): string {
  if (!course.continueLearning.lessonId) return course.continueLearning.href;

  const params = new URLSearchParams({
    lessonId: course.continueLearning.lessonId,
  });

  return `${course.continueLearning.href}?${params.toString()}`;
}

function getActivityLabel(eventType: string): string {
  if (eventType === "opened") return "Mở bài học";
  if (eventType === "heartbeat") return "Đang học";
  if (eventType === "paused") return "Tạm dừng";
  if (eventType === "completed") return "Hoàn thành";

  return "Hoạt động học tập";
}

function DashboardSkeleton() {
  return (
    <div className="container w-full max-w-7xl space-y-6 px-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-9 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
      </div>
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string | number;
}) {
  return (
    <article className="rounded-3xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="size-6" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}

function CourseDashboardCard({ course }: { course: LearnerDashboardCourse }) {
  const progress = Math.min(Math.max(course.progressPercent, 0), 100);
  const statusLabel = course.status === "completed" ? "Hoàn thành" : "Đang học";

  return (
    <article className="rounded-3xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{course.category}</Badge>
            <Badge
              variant={course.status === "completed" ? "default" : "outline"}
            >
              {statusLabel}
            </Badge>
          </div>
          <div>
            <h2 className="line-clamp-2 text-2xl font-semibold tracking-tight">
              {course.title}
            </h2>
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="size-4" aria-hidden="true" />
              {course.instructorName ?? "Giảng viên đang cập nhật"}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Tiến độ</span>
              <span className="text-muted-foreground">
                {formatPercent(progress)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:w-80 h-full">
          <div className="rounded-2xl bg-muted/50 p-4">
            <p className="text-muted-foreground">Hoàn thành</p>
            <p className="mt-1 text-lg font-semibold">
              {formatPercent(course.progressPercent)}
            </p>
          </div>
          <div className="rounded-2xl bg-muted/50 p-4">
            <p className="text-muted-foreground">Quiz tốt nhất</p>
            <p className="mt-1 text-lg font-semibold">
              {course.bestQuizScorePercent === null
                ? "Chưa có lượt làm quiz"
                : formatPercent(course.bestQuizScorePercent)}
            </p>
          </div>
          <Link
            href={getContinueLearningHref(course)}
            className={buttonVariants({ className: "sm:col-span-2" })}
          >
            <PlayCircle data-icon="inline-start" aria-hidden="true" />
            Tiếp tục học
          </Link>
        </div>
      </div>
    </article>
  );
}

function RecentActivityList({
  activities,
}: {
  activities: LearnerDashboardRecentActivity[];
}) {
  if (activities.length === 0) {
    return (
      <div className="rounded-3xl border bg-card p-6 text-center text-muted-foreground shadow-sm">
        Chưa có hoạt động học tập gần đây.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border bg-card p-5 shadow-sm">
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex gap-3 rounded-2xl bg-muted/40 p-4"
          >
            <Activity
              className="mt-1 size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="font-medium">
                {getActivityLabel(activity.eventType)}
              </p>
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                {activity.courseTitle} - {activity.lessonTitle ?? "Bài học"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(activity.occurredAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LearnerDashboardPage() {
  const dashboardQuery = useLearnerDashboard();

  if (dashboardQuery.isLoading) return <DashboardSkeleton />;

  if (dashboardQuery.isError) {
    return (
      <div className="w-full max-w-3xl rounded-3xl border bg-card p-8 text-center shadow-sm">
        <BarChart3
          className="mx-auto size-10 text-muted-foreground"
          aria-hidden="true"
        />
        <h1 className="mt-4 text-2xl font-semibold">
          Không tải được bảng điều khiển
        </h1>
        <p className="mt-2 text-muted-foreground">
          Vui lòng thử lại sau hoặc đăng nhập lại nếu phiên làm việc đã hết hạn.
        </p>
      </div>
    );
  }

  const dashboard = dashboardQuery.data;

  if (!dashboard || dashboard.courses.length === 0) {
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
    <div className="container w-full max-w-7xl space-y-6 px-6">
      <div>
        <p className="text-sm font-medium text-primary">Bảng điều khiển</p>
        <h1 className="text-3xl font-bold tracking-tight">Tổng quan học tập</h1>
        <p className="mt-2 text-muted-foreground">
          Theo dõi tiến độ, tỷ lệ hoàn thành và kết quả quiz tốt nhất của bạn.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={BookOpen}
          label="Khóa học đã đăng ký"
          value={dashboard.summary.enrolledCourseCount}
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Đã hoàn thành"
          value={dashboard.summary.completedCourseCount}
        />
        <SummaryCard
          icon={BarChart3}
          label="Tiến độ trung bình"
          value={formatPercent(dashboard.summary.averageProgressPercent)}
        />
        <SummaryCard
          icon={Trophy}
          label="Điểm quiz tốt nhất TB"
          value={formatPercent(dashboard.summary.averageQuizScorePercent)}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Khóa học của bạn
        </h2>
        {dashboard.courses.map((course) => (
          <CourseDashboardCard key={course.enrollmentId} course={course} />
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Hoạt động gần đây
        </h2>
        <RecentActivityList activities={dashboard.recentActivities} />
      </section>
    </div>
  );
}
