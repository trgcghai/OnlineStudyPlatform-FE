"use client";

import { AlertCircle, Inbox } from "lucide-react";
import { useState } from "react";
import { parseAsString, useQueryStates } from "nuqs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { EssayGradingPanel } from "@/components/instructor/essay-grading/essay-grading-panel";
import { EssayGradingSelectors } from "@/components/instructor/essay-grading/essay-grading-selectors";
import { EssaySubmissionList } from "@/components/instructor/essay-grading/essay-submission-list";
import { useEssayGradingSubmissions } from "@/hooks/useEssayGrading";
import { useClampUrlPage } from "@/hooks/useClampUrlPage";
import {
  mapCourseError,
  useInstructorCoursesList,
} from "@/hooks/useInstructorCourses";
import {
  mapLessonError,
  useInstructorLessonsList,
} from "@/hooks/useInstructorLessons";
import {
  mapQuizError,
  useInstructorLessonQuiz,
} from "@/hooks/useInstructorQuizzes";
import { COURSE_LIST_PAGE_SIZE } from "@/lib/schemas/course";
import {
  essayGradingStatusParser,
  limitParser,
  pageParser,
  URL_FILTER_HISTORY,
} from "@/lib/search-params/filter-parsers";
import {
  ESSAY_GRADING_STATUS_FILTERS,
  type EssayGradingSubmission,
  type EssayGradingStatusFilter,
} from "@/services/api/essay-grading";

const EMPTY_SUBMISSIONS: EssayGradingSubmission[] = [];
const ESSAY_GRADING_PAGE_SIZE = 10;

export function EssayGradingWorkbench() {
  const [filtersState, setFiltersState] = useQueryStates(
    {
      courseId: parseAsString.withDefault(""),
      lessonId: parseAsString.withDefault(""),
      quizId: parseAsString.withDefault(""),
      status: essayGradingStatusParser,
      page: pageParser,
      limit: limitParser(ESSAY_GRADING_PAGE_SIZE),
    },
    { history: URL_FILTER_HISTORY },
  );
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(
    null,
  );

  const courseQuery = useInstructorCoursesList({
    page: 1,
    limit: COURSE_LIST_PAGE_SIZE,
    sortBy: "updatedAt",
    sortOrder: "DESC",
  });
  const lessonQuery = useInstructorLessonsList(filtersState.courseId);
  const quizQuery = useInstructorLessonQuiz(
    filtersState.courseId,
    filtersState.lessonId,
  );
  const queueQuery = useEssayGradingSubmissions(
    filtersState.courseId,
    filtersState.quizId,
    filtersState.status,
    filtersState.page,
    filtersState.limit,
  );

  const courses = courseQuery.data?.items ?? [];
  const lessons = lessonQuery.data?.items ?? [];
  const quizzes = quizQuery.data ? [quizQuery.data] : [];
  const submissions = queueQuery.data?.items ?? EMPTY_SUBMISSIONS;
  const totalPages = queueQuery.data?.totalPages ?? 0;
  const totalItems = queueQuery.data?.total ?? 0;
  const selectedSubmission =
    submissions.find((item) => item.attemptId === selectedAttemptId) ?? null;
  const emptyQueueMessage =
    filtersState.status === ESSAY_GRADING_STATUS_FILTERS.PENDING
      ? "Không có bài tự luận đang chờ chấm."
      : filtersState.status === ESSAY_GRADING_STATUS_FILTERS.GRADED
        ? "Chưa có bài tự luận đã chấm."
        : "Chưa có bài tự luận nào được nộp.";

  useClampUrlPage({
    page: filtersState.page,
    totalPages,
    enabled:
      Boolean(filtersState.quizId) &&
      !queueQuery.isPending &&
      !queueQuery.isError,
    onPageChange: (nextPage) => {
      void setFiltersState({ page: nextPage });
    },
  });

  function handleCourseChange(value: string) {
    setSelectedAttemptId(null);
    void setFiltersState({
      courseId: value,
      lessonId: "",
      quizId: "",
      page: 1,
    });
  }

  function handleLessonChange(value: string) {
    setSelectedAttemptId(null);
    void setFiltersState({ lessonId: value, quizId: "", page: 1 });
  }

  function handleQuizChange(value: string) {
    setSelectedAttemptId(null);
    void setFiltersState({ quizId: value, page: 1 });
  }

  function handleStatusChange(value: EssayGradingStatusFilter) {
    setSelectedAttemptId(null);
    void setFiltersState({ status: value, page: 1 });
  }

  function handlePageSizeChange(value: number) {
    setSelectedAttemptId(null);
    void setFiltersState({ limit: value, page: 1 });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Hàng chờ chấm bài</CardTitle>
            <CardDescription>
              Lọc theo khóa học, bài học và bài kiểm tra để xem lượt nộp tự
              luận.
            </CardDescription>
          </div>
          {filtersState.quizId && (
            <Badge variant="secondary" className="w-fit">
              {queueQuery.isPending ? "Đang tải" : `${submissions.length} lượt`}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <EssayGradingSelectors
          courses={courses}
          lessons={lessons}
          quizzes={quizzes}
          courseId={filtersState.courseId}
          lessonId={filtersState.lessonId}
          quizId={filtersState.quizId}
          status={filtersState.status}
          coursesLoading={courseQuery.isPending}
          lessonsLoading={lessonQuery.isPending}
          quizzesLoading={quizQuery.isPending}
          onCourseChange={handleCourseChange}
          onLessonChange={handleLessonChange}
          onQuizChange={handleQuizChange}
          onStatusChange={handleStatusChange}
        />

        {courseQuery.isError && (
          <ErrorAlert
            title="Không thể tải khóa học"
            message={mapCourseError(courseQuery.error)}
            onRetry={() => courseQuery.refetch()}
          />
        )}

        {lessonQuery.isError && (
          <ErrorAlert
            title="Không thể tải bài học"
            message={mapLessonError(lessonQuery.error)}
            onRetry={() => lessonQuery.refetch()}
          />
        )}

        {quizQuery.isError && (
          <ErrorAlert
            title="Không thể tải bài kiểm tra"
            message={mapQuizError(quizQuery.error)}
            onRetry={() => quizQuery.refetch()}
          />
        )}

        {queueQuery.isError && (
          <ErrorAlert
            title="Không thể tải hàng chờ chấm"
            message="Đã xảy ra lỗi khi truy vấn lượt nộp tự luận. Vui lòng thử lại."
            onRetry={() => queueQuery.refetch()}
          />
        )}

        {!courseQuery.isPending &&
          !courseQuery.isError &&
          courses.length === 0 && (
            <EmptyState message="Bạn chưa có khóa học để chấm tự luận." />
          )}

        {filtersState.courseId &&
          !lessonQuery.isPending &&
          !lessonQuery.isError &&
          lessons.length === 0 && (
            <EmptyState message="Khóa học này chưa có bài học." />
          )}

        {filtersState.lessonId &&
          !quizQuery.isPending &&
          !quizQuery.isError &&
          quizzes.length === 0 && (
            <EmptyState message="Bài học này chưa có bài kiểm tra." />
          )}

        {!filtersState.lessonId &&
          !filtersState.quizId &&
          courses.length > 0 && (
            <EmptyState message="Chọn đủ khóa học, bài học và bài kiểm tra để bắt đầu chấm tự luận." />
          )}

        {filtersState.quizId && queueQuery.isPending && (
          <Skeleton className="h-48 rounded-3xl" />
        )}

        {filtersState.quizId &&
          !queueQuery.isPending &&
          !queueQuery.isError &&
          (submissions.length > 0 ? (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(280px,380px)_1fr]">
                <EssaySubmissionList
                  submissions={submissions}
                  selectedAttemptId={selectedAttemptId}
                  onSelect={(submission) =>
                    setSelectedAttemptId(submission.attemptId)
                  }
                />
                <EssayGradingPanel
                  courseId={filtersState.courseId}
                  lessonId={filtersState.lessonId}
                  quizId={filtersState.quizId}
                  status={filtersState.status}
                  submission={selectedSubmission}
                />
              </div>
              <Pagination
                page={filtersState.page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={filtersState.limit}
                onPageChange={(nextPage) => {
                  void setFiltersState({ page: nextPage });
                }}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          ) : (
            <EmptyState message={emptyQueueMessage} />
          ))}
      </CardContent>
    </Card>
  );
}

function ErrorAlert({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 w-fit"
        onClick={onRetry}
      >
        Thử lại
      </Button>
    </Alert>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed p-8 text-center">
      <Inbox className="size-10 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
