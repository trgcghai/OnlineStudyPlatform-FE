"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { InstructorCourseEnrollmentsTable } from "@/components/instructor/courses/instructor-course-enrollments-table";
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
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { useCourseEnrollments } from "@/hooks/useEnrollments";
import {
  mapCourseError,
  useInstructorCourse,
} from "@/hooks/useInstructorCourses";
import type { CourseEnrollmentListFilters } from "@/services/api/enrollments";

const DEFAULT_PAGE_SIZE = 10;

export default function CourseEnrollmentsPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const debouncedSearch = useDebounce(search.trim(), 500);

  const filters = useMemo<CourseEnrollmentListFilters>(
    () => ({
      page,
      limit: pageSize,
      q: debouncedSearch || undefined,
    }),
    [debouncedSearch, page, pageSize],
  );

  const {
    data: course,
    error: courseError,
    isError: isCourseError,
    isPending: isCoursePending,
    refetch: refetchCourse,
  } = useInstructorCourse(courseId);
  const {
    data: enrollments,
    isError: isEnrollmentsError,
    isPending: isEnrollmentsPending,
    refetch: refetchEnrollments,
  } = useCourseEnrollments(courseId, filters);

  const items = enrollments?.items ?? [];
  const totalItems = enrollments?.total ?? 0;
  const totalPages = enrollments?.totalPages ?? 0;
  const hasSearch = Boolean(debouncedSearch);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-4">
      <Button variant="ghost" size="sm" className="w-fit">
        <Link href="/instructor/courses" className="flex items-center gap-2">
          <ArrowLeft /> Quay lại danh sách khóa học
        </Link>
      </Button>

      {isCoursePending && <Skeleton className="h-96 w-full" />}

      {isCourseError && (
        <Alert variant="destructive">
          <AlertTitle>Không thể tải khóa học</AlertTitle>
          <AlertDescription>{mapCourseError(courseError)}</AlertDescription>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => refetchCourse()}
          >
            Thử lại
          </Button>
        </Alert>
      )}

      {course && (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <p className="text-sm text-muted-foreground">
              Theo dõi học viên đã đăng ký và tiến độ học tập trong khóa học
              này.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Học viên đăng ký</CardTitle>
              <CardDescription>
                Tìm kiếm học viên, xem tiến độ và kết quả bài kiểm tra gần đây.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="relative max-w-md">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Tìm theo tên hoặc email học viên..."
                  className="pl-9"
                />
              </div>

              <InstructorCourseEnrollmentsTable
                items={items}
                isError={isEnrollmentsError}
                isPending={isEnrollmentsPending}
                hasSearch={hasSearch}
                onRefetch={() => refetchEnrollments()}
              />

              {!isEnrollmentsError &&
                !isEnrollmentsPending &&
                totalItems > 0 && (
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={handlePageSizeChange}
                  />
                )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
