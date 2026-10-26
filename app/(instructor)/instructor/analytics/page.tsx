"use client";

import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { addDays, subDays, subMonths, subYears } from "date-fns";
import {
  AlertTriangle,
  CalendarDays,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useInstructorCoursesList } from "@/hooks/useInstructorCourses";
import { useCourseAnalytics } from "@/hooks/useCourseAnalytics";
import type { AnalyticsRange } from "@/services/api/analytics";

type Preset = "7-days" | "1-month" | "1-year" | "custom";

function localDateRange(
  preset: Exclude<Preset, "custom">,
  now: Date,
): AnalyticsRange {
  const end = new Date(now);
  let start: Date;
  if (preset === "7-days") start = subDays(end, 6);
  else if (preset === "1-month") start = subMonths(end, 1);
  else start = subYears(end, 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

function customDateRange(
  fromDate: string,
  toDate: string,
): AnalyticsRange | null {
  if (!fromDate || !toDate) return null;
  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T00:00:00`);
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    start > end
  )
    return null;
  return { from: start.toISOString(), to: addDays(end, 1).toISOString() };
}

function MetricCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-3xl tabular-nums tracking-tight">
            {value}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {detail}
      </CardContent>
    </Card>
  );
}

export default function InstructorAnalyticsPage() {
  const coursesQuery = useInstructorCoursesList({
    page: 1,
    limit: 100,
    sortBy: "updatedAt",
    sortOrder: "DESC",
  });
  const courses = useMemo(
    () => coursesQuery.data?.items ?? [],
    [coursesQuery.data?.items],
  );
  const [courseId, setCourseId] = useState("");
  const [preset, setPreset] = useState<Preset>("7-days");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [presetRange, setPresetRange] = useState(() =>
    localDateRange("7-days", new Date()),
  );

  useEffect(() => {
    if (courses.length && !courses.some((course) => course.id === courseId))
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCourseId(courses[0].id);
    if (!courses.length && courseId) setCourseId("");
  }, [courses, courseId]);

  const selectedRange = useMemo(
    () =>
      preset === "custom" ? customDateRange(customFrom, customTo) : presetRange,
    [customFrom, customTo, preset, presetRange],
  );
  const analyticsQuery = useCourseAnalytics(courseId, selectedRange);
  const customInvalid =
    preset === "custom" &&
    (!customFrom || !customTo || !customDateRange(customFrom, customTo));
  const analytics = analyticsQuery.isFetching ? undefined : analyticsQuery.data;
  const errorStatus = isAxiosError(analyticsQuery.error)
    ? analyticsQuery.error.response?.status
    : undefined;

  function choosePreset(value: string | null) {
    if (!value) return;
    const nextPreset = value as Preset;
    setPreset(nextPreset);
    if (nextPreset !== "custom")
      setPresetRange(localDateRange(nextPreset, new Date()));
  }

  return (
    <main className="mx-auto flex w-full flex-col gap-7">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Learning Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi mức độ tham gia, tiến độ học tập và kết quả quiz của từng
          khóa học.
        </p>
      </header>

      {coursesQuery.isPending && <Skeleton className="h-48 w-full" />}
      {coursesQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Không thể tải danh sách khóa học</AlertTitle>
          <AlertDescription>
            Vui lòng kiểm tra kết nối và thử tải lại.
          </AlertDescription>
          <Button
            className="mt-2 w-fit"
            size="sm"
            variant="outline"
            onClick={() => void coursesQuery.refetch()}
          >
            <RefreshCw aria-hidden="true" />
            Thử lại
          </Button>
        </Alert>
      )}
      {!coursesQuery.isPending &&
        !coursesQuery.isError &&
        courses.length === 0 && (
          <div className="rounded-3xl border border-dashed px-6 py-14 text-center">
            <GraduationCap
              aria-hidden="true"
              className="mx-auto size-9 text-muted-foreground"
            />
            <h2 className="mt-4 text-lg font-semibold">
              Chưa có khóa học để phân tích
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Khi bạn tạo khóa học, các chỉ số học tập sẽ được tổng hợp tại đây.
            </p>
          </div>
        )}

      {courses.length > 0 && !coursesQuery.isError && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Phạm vi báo cáo</CardTitle>
              <CardDescription>
                Chọn khóa học và thời gian cho chỉ số tương tác và quiz.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-[minmax(260px,1fr)_minmax(0,2fr)]">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Khóa học
                <Select
                  value={courseId}
                  onValueChange={(value) => value && setCourseId(value)}
                  items={Object.fromEntries(
                    courses.map((course) => [course.id, course.title]),
                  )}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn khóa học" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Khoảng thời gian
                  <Select
                    value={preset}
                    onValueChange={choosePreset}
                    items={{
                      "7-days": "7 ngày gần nhất",
                      "1-month": "1 tháng gần nhất",
                      "1-year": "1 năm gần nhất",
                      custom: "Tùy chỉnh",
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <CalendarDays
                        aria-hidden="true"
                        className="size-4 text-muted-foreground"
                      />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7-days">7 ngày gần nhất</SelectItem>
                      <SelectItem value="1-month">1 tháng gần nhất</SelectItem>
                      <SelectItem value="1-year">1 năm gần nhất</SelectItem>
                      <SelectItem value="custom">Tùy chỉnh</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
                {preset === "custom" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm font-medium">
                      Từ ngày
                      <Input
                        aria-invalid={customInvalid && !customFrom}
                        type="date"
                        value={customFrom}
                        onChange={(event) => setCustomFrom(event.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium">
                      Đến ngày
                      <Input
                        aria-invalid={customInvalid && !customTo}
                        type="date"
                        value={customTo}
                        onChange={(event) => setCustomTo(event.target.value)}
                      />
                    </label>
                    {customInvalid && (
                      <p
                        className="text-sm text-destructive sm:col-span-2"
                        role="status"
                      >
                        {!customFrom || !customTo
                          ? "Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc."
                          : "Ngày bắt đầu không được sau ngày kết thúc."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {(analyticsQuery.isPending || analyticsQuery.isFetching) &&
            selectedRange &&
            !customInvalid && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-36" />
                ))}
              </div>
            )}
          {analyticsQuery.isError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>
                {errorStatus === 403
                  ? "Không có quyền truy cập"
                  : "Không thể tải dữ liệu phân tích"}
              </AlertTitle>
              <AlertDescription>
                {errorStatus === 403
                  ? "Bạn không có quyền xem số liệu của khóa học này."
                  : "Vui lòng thử lại để tải báo cáo."}
              </AlertDescription>
              <Button
                className="mt-2 w-fit"
                size="sm"
                variant="outline"
                onClick={() => void analyticsQuery.refetch()}
              >
                <RefreshCw aria-hidden="true" />
                Thử lại
              </Button>
            </Alert>
          )}
          {!customInvalid &&
            !analyticsQuery.isPending &&
            !analyticsQuery.isError &&
            analytics && (
              <>
                <section
                  aria-label="Chỉ số học tập"
                  className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                  <MetricCard
                    title="Learning Engagement"
                    value={`${analytics.engagement.engagementScorePercent.toFixed(1)}%`}
                    detail={`${analytics.engagement.activeLearnerCount} học viên hoạt động / ${analytics.progress.enrollmentCount} ghi danh · ${analytics.engagement.eventCount} lượt tương tác`}
                  />
                  <MetricCard
                    title="Course Progress"
                    value={`${analytics.progress.averageProgressPercent.toFixed(1)}%`}
                    detail={`Tiến độ trung bình hiện tại · ${analytics.progress.enrollmentCount} học viên`}
                  />
                  <MetricCard
                    title="Completion Rate"
                    value={`${analytics.progress.completionRatePercent.toFixed(1)}%`}
                    detail={`${analytics.progress.completedEnrollmentCount} / ${analytics.progress.enrollmentCount} học viên hoàn thành`}
                  />
                  <MetricCard
                    title="Quiz Performance"
                    value={
                      analytics.quizPerformance.averageScorePercent === null
                        ? "Chưa có dữ liệu"
                        : `${analytics.quizPerformance.averageScorePercent.toFixed(1)}%`
                    }
                    detail={
                      analytics.quizPerformance.averageScorePercent === null
                        ? "Chưa có bài quiz đã chấm trong khoảng này."
                        : `${analytics.quizPerformance.gradedAttemptCount} lượt đã chấm · Tỷ lệ đạt ${analytics.quizPerformance.passRatePercent?.toFixed(1)}%`
                    }
                  />
                </section>
                {analytics.progress.enrollmentCount === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Khóa học chưa có học viên ghi danh; các chỉ số tiến độ và
                    tương tác đang bằng 0.
                  </p>
                )}
              </>
            )}
        </>
      )}
    </main>
  );
}
