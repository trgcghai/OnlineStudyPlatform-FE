"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Activity,
  BookOpen,
  Check,
  CirclePlay,
  Compass,
  GraduationCap,
  Sparkles,
  Trophy,
} from "lucide-react";
import { PublicCourseSection } from "@/components/courses/public-course-section";
import { buttonVariants } from "@/components/ui/button";
import { useLearnerDashboard } from "@/hooks/useLearnerDashboard";
import { useMyCourseRecommendations } from "@/hooks/useRecommendations";
import {
  useLatestPublishedCourses,
  usePublishedCourseSuggestions,
} from "@/hooks/usePublicCourses";
import {
  selectAuthUser,
  selectIsAuthenticated,
} from "@/lib/features/authSlice";
import { USER_ROLES } from "@/services/api/users";
import type {
  LearnerDashboardCourse,
  LearnerDashboardRecentActivity,
} from "@/services/api/learner-dashboard";
import { formatDate } from "@/utils/dateTimeUtil";
import { useSelector } from "react-redux";

const SECTION_LIMIT = 8;

function continueHref(course: LearnerDashboardCourse) {
  if (!course.continueLearning.lessonId) return course.continueLearning.href;

  const params = new URLSearchParams({
    lessonId: course.continueLearning.lessonId,
  });
  return `${course.continueLearning.href}?${params.toString()}`;
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${Math.round(Math.min(Math.max(value, 0), 100))}%`;
}

function getActivityLabel(eventType: string) {
  if (eventType === "opened") return "Mở bài học";
  if (eventType === "heartbeat") return "Đang học";
  if (eventType === "paused") return "Tạm dừng";
  if (eventType === "completed") return "Hoàn thành bài học";
  return "Hoạt động học tập";
}

function LearnerHome({ name }: { name: string }) {
  const dashboardQuery = useLearnerDashboard(true);
  const recommendationsQuery = useMyCourseRecommendations(SECTION_LIMIT, true);
  const latestQuery = useLatestPublishedCourses(SECTION_LIMIT);
  const dashboard = dashboardQuery.data;
  const featuredCourse =
    dashboard?.courses.find((course) => course.status === "in_progress") ??
    dashboard?.courses[0];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-5 py-8 sm:px-8 sm:py-10">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#171641] text-white shadow-xl shadow-indigo-950/10">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-28 -z-10 size-[26rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -right-4 -top-16 -z-10 size-[20rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 -z-10 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl"
        />
        <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_0.82fr] lg:items-center lg:p-12">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-medium text-indigo-200">
              <Sparkles className="size-4" aria-hidden="true" />
              Góc học tập của bạn
            </p>
            <h1 className="mt-5 text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Chào {name || "bạn"},<br />
              <span className="text-indigo-200">học tiếp nhé.</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-indigo-100/75 sm:text-base">
              Mỗi bài học nhỏ đưa bạn gần hơn đến mục tiêu. Tiếp tục từ nơi bạn
              đã dừng lại.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {featuredCourse ? (
                <Link
                  href={continueHref(featuredCourse)}
                  className={buttonVariants({
                    size: "lg",
                    variant: "default",
                  })}
                >
                  <CirclePlay data-icon="inline-start" aria-hidden="true" />{" "}
                  Tiếp tục học
                </Link>
              ) : (
                <Link
                  href="/courses"
                  className={buttonVariants({
                    size: "lg",
                    variant: "default",
                  })}
                >
                  <Compass data-icon="inline-start" aria-hidden="true" /> Tìm
                  khóa học đầu tiên
                </Link>
              )}
              <Link
                href="/learner/dashboard"
                className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Bảng điều khiển{" "}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="relative">
            {dashboardQuery.isLoading ? (
              <div className="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/10" />
            ) : dashboardQuery.isError ? (
              <div className="flex min-h-64 flex-col justify-between rounded-3xl border border-white/15 bg-white/8 p-6 backdrop-blur-sm">
                <div className="grid size-12 place-items-center rounded-2xl bg-white/10">
                  <Activity
                    className="size-6 text-indigo-200"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="text-sm text-indigo-200">Tiến độ học tập</p>
                  <p className="mt-2 max-w-sm text-2xl leading-snug">
                    Chưa thể tải thông tin khóa học lúc này.
                  </p>
                  <Link
                    href="/learner/dashboard"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-indigo-300 underline-offset-4"
                  >
                    Mở bảng điều khiển{" "}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ) : featuredCourse ? (
              <article className="overflow-hidden rounded-3xl border border-white/15 bg-white/8 p-3 backdrop-blur-sm">
                <div className="relative aspect-video overflow-hidden rounded-2xl bg-indigo-950/60">
                  {featuredCourse.thumbnail ? (
                    <Image
                      src={featuredCourse.thumbnail}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 90vw, 38vw"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center bg-linear-to-br from-indigo-500/35 via-violet-500/20 to-cyan-400/15">
                      <BookOpen
                        className="size-12 text-white/80"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-[#171641]/90 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-200">
                      {featuredCourse.status === "completed"
                        ? "Đã hoàn thành"
                        : "Đang học"}
                    </p>
                    <h2 className="mt-2 line-clamp-2 text-xl font-semibold">
                      {featuredCourse.title}
                    </h2>
                  </div>
                </div>
                <div className="px-3 pb-2 pt-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-indigo-100/75">Lộ trình của bạn</span>
                    <span className="font-semibold text-white">
                      {formatPercent(featuredCourse.progressPercent)}
                    </span>
                  </div>
                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"
                    role="progressbar"
                    aria-label={`Tiến độ khóa học ${featuredCourse.title}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(
                      Math.max(featuredCourse.progressPercent, 0),
                      100,
                    )}
                  >
                    <div
                      className="h-full rounded-full bg-linear-to-r from-cyan-300 to-indigo-300 transition-[width] duration-500 motion-reduce:transition-none"
                      style={{
                        width: `${Math.min(Math.max(featuredCourse.progressPercent, 0), 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-xs text-indigo-100/70">
                    <GraduationCap className="size-4" aria-hidden="true" />
                    {featuredCourse.instructorName ??
                      "Giảng viên đang cập nhật"}
                  </p>
                </div>
              </article>
            ) : (
              <div className="flex min-h-64 flex-col justify-between rounded-3xl border border-white/15 bg-white/8 p-6 backdrop-blur-sm">
                <div className="grid size-12 place-items-center rounded-2xl bg-white/10">
                  <BookOpen
                    className="size-6 text-indigo-200"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="text-sm text-indigo-200">Bắt đầu hành trình</p>
                  <p className="mt-2 max-w-sm text-2xl leading-snug">
                    Chọn một chủ đề khiến bạn tò mò hôm nay.
                  </p>
                  <Link
                    href="/courses"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-indigo-300 underline-offset-4"
                  >
                    Xem khóa học{" "}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {dashboard && dashboard.courses.length > 0 ? (
        <>
          <section
            aria-label="Tổng quan học tập"
            className="grid gap-3 sm:grid-cols-3"
          >
            <SummaryTile
              icon={BookOpen}
              label="Khóa học của bạn"
              value={dashboard.summary.enrolledCourseCount}
              detail="đang đồng hành"
            />
            <SummaryTile
              icon={Check}
              label="Đã hoàn thành"
              value={dashboard.summary.completedCourseCount}
              detail="khóa học"
            />
            <SummaryTile
              icon={Trophy}
              label="Tiến độ trung bình"
              value={formatPercent(dashboard.summary.averageProgressPercent)}
              detail={
                dashboard.summary.averageQuizScorePercent === null
                  ? "tiếp tục duy trì nhé"
                  : `điểm quiz TB ${formatPercent(dashboard.summary.averageQuizScorePercent)}`
              }
            />
          </section>

          <section className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Lộ trình
                  </p>
                  <h2 className="mt-2 text-3xl tracking-tight">
                    Các khóa học của bạn
                  </h2>
                </div>
                <Link
                  href="/learner/courses"
                  className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex"
                >
                  Tất cả khóa học{" "}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="space-y-3">
                {dashboard.courses.slice(0, 3).map((course) => (
                  <LearnerCourseRow key={course.enrollmentId} course={course} />
                ))}
              </div>
              <Link
                href="/learner/courses"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline sm:hidden"
              >
                Tất cả khóa học{" "}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <RecentActivity activities={dashboard.recentActivities} />
          </section>
        </>
      ) : null}

      <PublicCourseSection
        title="Gợi ý dành cho bạn"
        description="Những khóa học được chọn theo hành trình học tập của bạn."
        courses={recommendationsQuery.data}
        isLoading={recommendationsQuery.isLoading}
      />
      <PublicCourseSection
        title="Mới trên LMS AI"
        description="Khám phá những khóa học vừa được cập nhật."
        courses={latestQuery.data}
        isLoading={latestQuery.isLoading}
      />
    </main>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border bg-card p-5 transition-colors hover:bg-muted/30">
      <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-200">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
          <span className="text-xs text-muted-foreground">{detail}</span>
        </p>
      </div>
    </article>
  );
}

function LearnerCourseRow({ course }: { course: LearnerDashboardCourse }) {
  const progress = Math.min(Math.max(course.progressPercent, 0), 100);
  return (
    <Link
      href={continueHref(course)}
      className="group grid gap-4 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:grid-cols-[auto_1fr_auto] sm:items-center"
    >
      <div className="relative size-16 overflow-hidden rounded-xl bg-indigo-50 dark:bg-indigo-400/10">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt=""
            fill
            sizes="64px"
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-indigo-700 dark:text-indigo-200">
            <BookOpen className="size-6" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">
          {course.category} · {course.instructorName ?? "Giảng viên"}
        </p>
        <h3 className="mt-1 line-clamp-1 font-semibold group-hover:text-primary">
          {course.title}
        </h3>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {formatPercent(progress)}
          </span>
        </div>
      </div>
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
        {course.status === "completed" ? "Xem lại" : "Tiếp tục"}{" "}
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

function RecentActivity({
  activities,
}: {
  activities: LearnerDashboardRecentActivity[];
}) {
  return (
    <aside className="rounded-3xl bg-[#f4f3fb] p-6 dark:bg-white/4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Nhịp học tập
          </p>
          <h2 className="mt-2 text-2xl">Hoạt động gần đây</h2>
        </div>
        <Activity className="size-5 text-primary" aria-hidden="true" />
      </div>
      {activities.length ? (
        <ol className="mt-6 space-y-0">
          {activities.slice(0, 5).map((activity, index) => (
            <li
              key={activity.id}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              <div className="flex w-4 shrink-0 flex-col items-center">
                <span
                  className={`mt-1.5 size-2.5 rounded-full ${index === 0 ? "bg-primary ring-4 ring-primary/10" : "bg-indigo-300 dark:bg-indigo-500/60"}`}
                />
                {index < Math.min(activities.length, 5) - 1 ? (
                  <span className="mt-1 w-px flex-1 bg-indigo-200 dark:bg-white/10" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {getActivityLabel(activity.eventType)}
                </p>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {activity.lessonTitle ?? activity.courseTitle}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(activity.occurredAt)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-indigo-200 p-5 text-sm text-muted-foreground dark:border-white/15">
          Hoạt động học tập của bạn sẽ xuất hiện tại đây.
        </p>
      )}
    </aside>
  );
}

function VisitorHome() {
  const suggestionsQuery = usePublishedCourseSuggestions(SECTION_LIMIT, true);
  const latestQuery = useLatestPublishedCourses(SECTION_LIMIT);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-14 px-5 py-8 sm:px-8 sm:py-12">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#171641] text-white shadow-xl shadow-indigo-950/10">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-24 -z-10 size-[28rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 -z-10 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl"
        />
        <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:p-14">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-medium text-indigo-200">
              <Sparkles className="size-4" aria-hidden="true" />
              Học tập theo cách của bạn
            </p>
            <h1 className="mt-5 max-w-2xl text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Một bài học mới,
              <br />
              <span className="text-indigo-200">một cánh cửa mới.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-indigo-100/75">
              Tìm khóa học phù hợp, học theo nhịp riêng và biến điều bạn tò mò
              thành kỹ năng thực tế.
            </p>
            <Link
              href="/courses"
              className={buttonVariants({
                size: "lg",
                className: "mt-7 bg-white text-indigo-950 hover:bg-indigo-50",
              })}
            >
              Khám phá khóa học{" "}
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </div>
          <div className="relative grid min-h-64 place-items-center">
            <div className="absolute h-52 w-52 rounded-full border border-white/15" />
            <div className="absolute h-40 w-40 rounded-full border border-white/20" />
            <div className="relative grid size-28 rotate-[-8deg] place-items-center rounded-[2rem] bg-linear-to-br from-indigo-300 to-cyan-200 text-indigo-950 shadow-2xl shadow-cyan-300/20">
              <BookOpen className="size-12" aria-hidden="true" />
            </div>
            <span className="absolute left-[14%] top-[18%] rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm backdrop-blur">
              Ý tưởng mới ✦
            </span>
            <span className="absolute bottom-[16%] right-[8%] rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm backdrop-blur">
              Học mọi lúc
            </span>
          </div>
        </div>
      </section>
      <PublicCourseSection
        title="Gợi ý khóa học"
        description="Một vài chủ đề hay để bạn bắt đầu khám phá."
        courses={suggestionsQuery.data}
        isLoading={suggestionsQuery.isLoading}
      />
      <PublicCourseSection
        title="Mới trên LMS AI"
        description="Những khóa học vừa được cập nhật gần đây."
        courses={latestQuery.data}
        isLoading={latestQuery.isLoading}
      />
    </main>
  );
}

export default function Home() {
  const authUser = useSelector(selectAuthUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLearner = isAuthenticated && authUser?.role === USER_ROLES.LEARNER;

  return isLearner ? (
    <LearnerHome name={authUser?.name ?? ""} />
  ) : (
    <VisitorHome />
  );
}
