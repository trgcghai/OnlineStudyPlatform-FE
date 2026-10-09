"use client";

import { useEffect, useMemo, useState } from "react";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { AlertTriangle } from "lucide-react";
import { RiskFilters } from "@/components/instructor/risk/risk-filters";
import { RiskLearnerSheet } from "@/components/instructor/risk/risk-learner-sheet";
import { RiskLearnersTable } from "@/components/instructor/risk/risk-learners-table";
import { RiskSummaryCards } from "@/components/instructor/risk/risk-summary-cards";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { useInstructorCoursesList } from "@/hooks/useInstructorCourses";
import {
  useRecomputeCourseRisk,
  useRiskLearners,
  useRiskSummary,
} from "@/hooks/useRisk";
import { URL_FILTER_HISTORY } from "@/lib/search-params/filter-parsers";
import type { Course } from "@/services/api/courses";
import type {
  RiskBand,
  RiskLearnerFilters,
  RiskScore,
} from "@/services/api/risk";

const DEFAULT_THRESHOLD = 70;
const ALL_COURSES_LIMIT = 100;
const RISK_BAND_FILTER_VALUES = ["", "high", "medium", "low"] as const;

export default function InstructorRiskPage() {
  const [selectedLearner, setSelectedLearner] = useState<RiskScore | null>(
    null,
  );
  const [filtersState, setFiltersState] = useQueryStates(
    {
      courseId: parseAsString.withDefault(""),
      threshold: parseAsInteger.withDefault(DEFAULT_THRESHOLD),
      band: parseAsStringLiteral(RISK_BAND_FILTER_VALUES).withDefault(""),
    },
    { history: URL_FILTER_HISTORY },
  );

  const coursesQuery = useInstructorCoursesList({
    page: 1,
    limit: ALL_COURSES_LIMIT,
    sortBy: "updatedAt",
    sortOrder: "DESC",
  });
  const courses = useMemo(
    () => coursesQuery.data?.items ?? [],
    [coursesQuery.data?.items],
  );
  const selectedCourse = useMemo<Course | undefined>(
    () => courses.find((course) => course.id === filtersState.courseId),
    [courses, filtersState.courseId],
  );

  useEffect(() => {
    if (courses.length === 0) return;
    if (!selectedCourse) {
      void setFiltersState({ courseId: courses[0].id });
    }
  }, [courses, selectedCourse, setFiltersState]);

  const selectedCourseId = selectedCourse?.id ?? "";
  const riskFilters = useMemo<RiskLearnerFilters>(
    () => ({
      threshold: Math.min(Math.max(filtersState.threshold, 0), 100),
      band: filtersState.band ? (filtersState.band as RiskBand) : undefined,
    }),
    [filtersState.band, filtersState.threshold],
  );

  const summaryQuery = useRiskSummary(selectedCourseId);
  const learnersQuery = useRiskLearners(selectedCourseId, riskFilters);
  const recomputeMutation = useRecomputeCourseRisk();

  async function handleRecompute() {
    if (!selectedCourseId) return;

    const result = await recomputeMutation.recompute(selectedCourseId);
    if (!result.ok) {
      toast.add({
        title:
          result.message ?? "Không thể tính lại điểm rủi ro. Vui lòng thử lại.",
        type: "error",
      });
    }
  }

  function clearFilters() {
    void setFiltersState({ threshold: DEFAULT_THRESHOLD, band: "" });
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Phân tích Learning Risk</h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi điểm rủi ro học tập hằng ngày để ưu tiên hỗ trợ học viên có
          dấu hiệu chậm tiến độ.
        </p>
      </div>

      {coursesQuery.isPending && <Skeleton className="h-80 w-full" />}

      {coursesQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Không thể tải khóa học</AlertTitle>
          <AlertDescription>
            Vui lòng thử lại trước khi xem phân tích rủi ro.
          </AlertDescription>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => coursesQuery.refetch()}
          >
            Thử lại
          </Button>
        </Alert>
      )}

      {!coursesQuery.isPending &&
        !coursesQuery.isError &&
        courses.length === 0 && (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <p className="font-medium">Bạn chưa có khóa học để phân tích</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Khi bạn tạo khóa học và có học viên tham gia, dữ liệu Learning
              Risk sẽ hiển thị tại đây.
            </p>
          </div>
        )}

      {courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Không gian phân tích rủi ro</CardTitle>
            <CardDescription>
              Chọn một khóa học để xem danh sách học viên có rủi ro.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <label className="flex max-w-xl flex-1 flex-col gap-1 text-sm font-medium">
                Khóa học
                <Select
                  value={filtersState.courseId}
                  onValueChange={(courseId) => {
                    void setFiltersState({ courseId });
                  }}
                >
                  <SelectTrigger className="w-full" aria-label="Chọn khóa học">
                    <SelectValue />
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
              <Button
                onClick={handleRecompute}
                disabled={!selectedCourseId || recomputeMutation.isPending}
              >
                {recomputeMutation.isPending
                  ? "Đang tính lại..."
                  : "Tính lại rủi ro"}
              </Button>
            </div>

            {summaryQuery.data && (
              <RiskSummaryCards summary={summaryQuery.data} />
            )}
            {summaryQuery.isPending && <Skeleton className="h-28 w-full" />}

            <RiskFilters
              threshold={riskFilters.threshold ?? DEFAULT_THRESHOLD}
              band={(filtersState.band as RiskBand | "") || ""}
              onThresholdChange={(threshold) => {
                void setFiltersState({ threshold });
              }}
              onBandChange={(band) => {
                void setFiltersState({ band });
              }}
              onClear={clearFilters}
            />

            {selectedCourse && (
              <RiskLearnersTable
                course={selectedCourse}
                items={learnersQuery.data?.learners ?? []}
                isError={learnersQuery.isError}
                isPending={learnersQuery.isPending}
                onOpenLearner={setSelectedLearner}
                onRefetch={() => learnersQuery.refetch()}
              />
            )}
          </CardContent>
        </Card>
      )}

      <RiskLearnerSheet
        learner={selectedLearner}
        open={Boolean(selectedLearner)}
        onOpenChange={(open) => {
          if (!open) setSelectedLearner(null);
        }}
      />
    </div>
  );
}
